// app/products/index.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Search, Grid, ChevronLeft, X, Sliders, Check } from "lucide-react-native";
import { useAllProducts } from "../hooks/useAllProducts";
import { useBagistoProductFilters } from "../hooks/useBagistoProductFilters";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 32) / 2;

interface FilterState {
  gender: string | null;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
}

const GENDER_OPTIONS = [
  { label: "All", value: null },
  { label: "Men", value: "Men" },
  { label: "Women", value: "Women" },
  { label: "Unisex", value: "Unisex" },
  { label: "Kids", value: "Kids" },
];

export default function AllProductsScreen() {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">(
    "newest",
  );
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    gender: null,
    minPrice: "",
    maxPrice: "",
    inStock: false,
  });
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.gender) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.inStock) count++;
    return count;
  }, [filters]);

  // Convert sortBy to API format
  const getSortParams = () => {
    switch (sortBy) {
      case "price-low":
        return { sortBy: "price", sortOrder: "asc" };
      case "price-high":
        return { sortBy: "price", sortOrder: "desc" };
      case "newest":
      default:
        return { sortBy: "createdAt", sortOrder: "desc" };
    }
  };

  const { sortBy: apiSortBy, sortOrder: apiSortOrder } = getSortParams();

  // Use the filter hook ONLY when a gender filter is applied
  // The API expects one attribute at a time, so we use gender as the main filter
  const hasGenderFilter = !!filters.gender;
  
  const {
    data: filteredProductsData,
    isLoading: isFilterLoading,
    error: filterError,
    refetch: refetchFilters,
  } = useBagistoProductFilters({
    attribute: "gender",
    value: filters.gender || "",
    ...(filters.minPrice && { minPrice: parseFloat(filters.minPrice) }),
    ...(filters.maxPrice && { maxPrice: parseFloat(filters.maxPrice) }),
    inStock: filters.inStock || undefined,
    sortBy: apiSortBy,
    sortOrder: apiSortOrder,
    page: 1,
    perPage: 50,
    enabled: hasGenderFilter, // Only enable when gender is selected
  });

  // Always fetch all products as fallback
  const {
    data: allProductsData,
    isLoading: isAllLoading,
    error: allError,
    refetch: refetchAll,
  } = useAllProducts([{ key: "status", value: "1" }]);

  const isLoading = isAllLoading || (hasGenderFilter && isFilterLoading);
  const error = allError || filterError;

  // Get products based on filter state
  const products = useMemo(() => {
    if (hasGenderFilter && filteredProductsData?.data) {
      return filteredProductsData.data;
    }
    return allProductsData?.allProducts?.data || [];
  }, [hasGenderFilter, filteredProductsData, allProductsData]);

  // Apply client-side filters for price and stock (since API might not support multiple attributes)
  const filteredByPriceAndStock = useMemo(() => {
    let result = products;

    // Apply price filters client-side if API doesn't support them
    if (filters.minPrice || filters.maxPrice) {
      result = result.filter(product => {
        const price = parseFloat(product.priceHtml?.finalPrice || "0");
        const minOk = !filters.minPrice || price >= parseFloat(filters.minPrice);
        const maxOk = !filters.maxPrice || price <= parseFloat(filters.maxPrice);
        return minOk && maxOk;
      });
    }

    // Apply in-stock filter client-side
    if (filters.inStock) {
      result = result.filter(product => product.isSaleable === true);
    }

    return result;
  }, [products, filters]);

  // Apply client-side search
  const filteredProducts = filteredByPriceAndStock.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setFiltersVisible(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      gender: null,
      minPrice: "",
      maxPrice: "",
      inStock: false,
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setFiltersVisible(false);
  };

  const openFilters = () => {
    setTempFilters(filters);
    setFiltersVisible(true);
  };

  const handleRefresh = () => {
    if (hasGenderFilter) {
      refetchFilters();
    } else {
      refetchAll();
    }
  };

  if (isLoading) {
    return (
      <View
        style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
          {t("loading")}...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, isRTL && styles.errorContainerRTL]}>
        <Text style={[styles.errorTitle, isRTL && styles.errorTitleRTL]}>
          {t("error")}
        </Text>
        <Text style={[styles.errorText, isRTL && styles.errorTextRTL]}>
          {error.message}
        </Text>
        <Pressable
          style={[styles.retryButton, isRTL && styles.retryButtonRTL]}
          onPress={handleRefresh}
        >
          <Text
            style={[styles.retryButtonText, isRTL && styles.retryButtonTextRTL]}
          >
            {t("retry")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header with Back Button, Title, and Filter Button */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <View style={[styles.headerContent, isRTL && styles.headerContentRTL]}>
          <Pressable 
            style={[styles.backButton, isRTL && styles.backButtonRTL]} 
            onPress={() => router.back()}
          >
            <ChevronLeft 
              size={24} 
              color={Colors.text} 
              style={isRTL && { transform: [{ scaleX: -1 }] }} 
            />
          </Pressable>
          <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
            {t('allProducts')}
          </Text>
          
          {/* Filter Button */}
          <Pressable 
            style={[styles.filterButton, isRTL && styles.filterButtonRTL]} 
            onPress={openFilters}
          >
            <Sliders size={20} color={Colors.text} />
            {activeFiltersCount > 0 && (
              <View style={[styles.badge, isRTL && styles.badgeRTL]}>
                <Text style={styles.badgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isRTL && styles.searchContainerRTL]}>
        <View style={[styles.searchInputContainer, isRTL && styles.searchInputContainerRTL]}>
          <Search 
            size={20} 
            color={Colors.textSecondary} 
            style={[styles.searchIcon, isRTL && styles.searchIconRTL]} 
          />
          <TextInput
            style={[styles.searchInput, isRTL && styles.searchInputRTL]}
            placeholder={t('searchProducts')}
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable 
              style={[styles.clearButton, isRTL && styles.clearButtonRTL]}
              onPress={() => setSearchQuery('')}
            >
              <X size={18} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results Count and Sort */}
      <View style={[styles.resultsHeader, isRTL && styles.resultsHeaderRTL]}>
        <Text style={[styles.resultsText, isRTL && styles.resultsTextRTL]}>
          {filteredProducts.length} {t("products")}
        </Text>

        <View style={[styles.sortContainer, isRTL && styles.sortContainerRTL]}>
          {(["newest", "price-low", "price-high"] as const).map((item) => (
            <Pressable
              key={item}
              style={[
                styles.sortButton,
                sortBy === item && styles.sortButtonActive,
                isRTL && styles.sortButtonRTL,
              ]}
              onPress={() => setSortBy(item)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === item && styles.sortButtonTextActive,
                  isRTL && styles.sortButtonTextRTL,
                ]}
              >
                {t(item)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <View
          style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}
        >
          <Text style={[styles.emptyTitle, isRTL && styles.emptyTitleRTL]}>
            {searchQuery
              ? t("noProductsFoundForSearch")
              : t("noProductsAvailable")}
          </Text>
          <Text
            style={[styles.emptySubtitle, isRTL && styles.emptySubtitleRTL]}
          >
            {searchQuery ? t("tryDifferentKeywords") : t("checkBackLater")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.gridItemContainer,
                isRTL
                  ? index % 2 === 0
                    ? styles.gridItemRight
                    : styles.gridItemLeft
                  : index % 2 === 0
                    ? styles.gridItemLeft
                    : styles.gridItemRight,
              ]}
            >
              <ProductCard product={item} variant="vertical" />
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.gridListContent,
            isRTL && styles.gridListContentRTL,
          ]}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={[
            styles.gridColumnWrapper,
            isRTL && styles.gridColumnWrapperRTL,
          ]}
          ListFooterComponent={<View style={styles.listFooterSpacer} />}
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFiltersVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
              <Text style={[styles.modalTitle, isRTL && styles.modalTitleRTL]}>
                {t("filters")}
              </Text>
              <Pressable onPress={() => setFiltersVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Gender Section - Primary Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, isRTL && styles.filterSectionTitleRTL]}>
                  {t("gender")}
                </Text>
                <Text style={[styles.filterHint, isRTL && styles.filterHintRTL]}>
                  Select gender to filter products
                </Text>
                <View style={styles.genderOptions}>
                  {GENDER_OPTIONS.map((option) => (
                    <Pressable
                      key={option.label}
                      style={[
                        styles.genderOption,
                        tempFilters.gender === option.value && styles.genderOptionSelected,
                      ]}
                      onPress={() => setTempFilters({ ...tempFilters, gender: option.value })}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          tempFilters.gender === option.value && styles.genderOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Price Range Section - Applied client-side */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, isRTL && styles.filterSectionTitleRTL]}>
                  {t("priceRange")}
                </Text>
                <Text style={[styles.filterHint, isRTL && styles.filterHintRTL]}>
                  Filter by price range
                </Text>
                <View style={[styles.priceContainer, isRTL && styles.priceContainerRTL]}>
                  <View style={styles.priceInputContainer}>
                    <Text style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}>
                      {t("min")}
                    </Text>
                    <TextInput
                      style={[styles.priceInput, isRTL && styles.priceInputRTL]}
                      placeholder="0"
                      keyboardType="numeric"
                      value={tempFilters.minPrice}
                      onChangeText={(text) =>
                        setTempFilters({ ...tempFilters, minPrice: text })
                      }
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                  <View style={styles.priceSeparator} />
                  <View style={styles.priceInputContainer}>
                    <Text style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}>
                      {t("max")}
                    </Text>
                    <TextInput
                      style={[styles.priceInput, isRTL && styles.priceInputRTL]}
                      placeholder="1000"
                      keyboardType="numeric"
                      value={tempFilters.maxPrice}
                      onChangeText={(text) =>
                        setTempFilters({ ...tempFilters, maxPrice: text })
                      }
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                </View>
              </View>

              {/* In Stock Section - Applied client-side */}
              <View style={styles.filterSection}>
                <Pressable
                  style={[styles.stockOption, isRTL && styles.stockOptionRTL]}
                  onPress={() => setTempFilters({ ...tempFilters, inStock: !tempFilters.inStock })}
                >
                  <View
                    style={[
                      styles.checkbox,
                      tempFilters.inStock && styles.checkboxChecked,
                    ]}
                  >
                    {tempFilters.inStock && <Check size={14} color={Colors.white} />}
                  </View>
                  <Text style={[styles.stockText, isRTL && styles.stockTextRTL]}>
                    {t("inStockOnly")}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, isRTL && styles.modalFooterRTL]}>
              <Pressable 
                style={[styles.modalButton, styles.resetModalButton]} 
                onPress={handleResetFilters}
              >
                <Text style={[styles.modalButtonText, styles.resetModalButtonText]}>
                  {t("reset")}
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.applyModalButton]} 
                onPress={handleApplyFilters}
              >
                <Text style={[styles.modalButtonText, styles.applyModalButtonText]}>
                  {t("applyFilters")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SPACING = 16;
const RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerRTL: {
    direction: "rtl",
  },

  /* ================= HEADER ================= */
  header: {
    backgroundColor: Colors.background,
  },
  headerRTL: {},
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING,
    paddingVertical: 12,
  },
  headerContentRTL: {
    // flexDirection: "row-reverse",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
  },
  backButtonRTL: {
    marginLeft: 0,
    marginRight: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  headerTitleRTL: {
    textAlign: "center",
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterButtonRTL: {},
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeRTL: {
    right: undefined,
    left: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },

  /* ================= SEARCH ================= */
  searchContainer: {
    paddingHorizontal: SPACING,
    paddingBottom: 12,
  },
  searchContainerRTL: {},
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: RADIUS,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInputContainerRTL: {
    // flexDirection: "row-reverse",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchIconRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  searchInputRTL: {
    textAlign: "left",
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  clearButtonRTL: {},

  /* ================= RESULTS + SORT ================= */
  resultsHeader: {
    paddingHorizontal: SPACING,
    paddingBottom: 8,
  },
  resultsHeaderRTL: {},
  resultsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resultsTextRTL: {
    textAlign: "left",
  },

  sortContainer: {
    flexDirection: "row",
    gap: 8,
  },
  sortContainerRTL: {
    // flexDirection: "row-reverse",
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
  },
  sortButtonRTL: {},
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sortButtonTextRTL: {
    textAlign: "left",
  },
  sortButtonTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },

  /* ================= GRID ================= */
  gridListContent: {
    paddingHorizontal: SPACING,
    paddingTop: 8,
    paddingBottom: 24,
  },
  gridListContentRTL: {},
  gridColumnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gridColumnWrapperRTL: {
    // flexDirection: "row-reverse",
    // alignSelf: "flex-start",
  },
  gridItemContainer: {
    width: GRID_ITEM_WIDTH,
  },
  gridItemLeft: {
    marginRight: 8,
  },
  gridItemRight: {
    marginLeft: 8,
  },

  listFooterSpacer: {
    height: 24,
  },

  /* ================= STATES ================= */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainerRTL: {},
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingTextRTL: {
    textAlign: "right",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorContainerRTL: {},
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.error,
    marginBottom: 8,
  },
  errorTitleRTL: {
    textAlign: "left",
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  errorTextRTL: {
    textAlign: "left",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS,
  },
  retryButtonRTL: {},
  retryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  retryButtonTextRTL: {
    textAlign: "left",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyContainerRTL: {},
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyTitleRTL: {
    textAlign: "left",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptySubtitleRTL: {
    textAlign: "left",
  },

  /* ================= MODAL STYLES ================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalContentRTL: {
    direction: "rtl",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderRTL: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  modalTitleRTL: {
    textAlign: "right",
  },
  modalScroll: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  filterSectionTitleRTL: {
    textAlign: "right",
  },
  filterHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  filterHintRTL: {
    textAlign: "right",
  },
  genderOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  genderOptionTextSelected: {
    color: Colors.white,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceContainerRTL: {
    flexDirection: "row-reverse",
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceLabelRTL: {
    textAlign: "right",
  },
  priceInput: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  priceInputRTL: {
    textAlign: "right",
  },
  priceSeparator: {
    width: 10,
    height: 2,
    backgroundColor: Colors.textSecondary,
    marginTop: 20,
  },
  stockOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stockOptionRTL: {
    flexDirection: "row-reverse",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  stockText: {
    fontSize: 16,
    color: Colors.text,
  },
  stockTextRTL: {
    textAlign: "right",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalFooterRTL: {
    flexDirection: "row-reverse",
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resetModalButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  applyModalButton: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resetModalButtonText: {
    color: Colors.text,
  },
  applyModalButtonText: {
    color: Colors.white,
  },
});