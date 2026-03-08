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
import {
  Search,
  Grid,
  ChevronLeft,
  X,
  Sliders,
  Check,
} from "lucide-react-native";
import { useAllProducts } from "../hooks/useAllProducts";
import { useBagistoProductFilters } from "../hooks/useBagistoProductFilters";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface FilterState {
  gender: string | null;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sortBy: "newest" | "price-low" | "price-high";
}

const GENDER_OPTIONS = [
  { label: "All", value: null },
  { label: "Men", value: "Men" },
  { label: "Women", value: "Women" },
  { label: "Unisex", value: "Unisex" },
  { label: "Kids", value: "Kids" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
];

export default function AllProductsScreen() {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    gender: null,
    minPrice: "",
    maxPrice: "",
    inStock: false,
    sortBy: "newest",
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
    switch (filters.sortBy) {
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
  const hasGenderFilter = !!filters.gender;

  const {
    data: filteredProductsData,
    isLoading: isFilterLoading,
    error: filterError,
    refetch: refetchFilters,
  } = useBagistoProductFilters({
    attribute: "gender",
    value: filters.gender || "",
    // Don't send price filters to API - handle them locally
    inStock: filters.inStock || undefined,
    sortBy: apiSortBy,
    sortOrder: apiSortOrder,
    page: 1,
    perPage: 50,
    enabled: hasGenderFilter,
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

  // Apply client-side filters for price, stock, and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]; // Create a copy to avoid mutating original

    // Apply price filters client-side
    if (filters.minPrice || filters.maxPrice) {
      result = result.filter((product) => {
        // Get price from priceHtml or fallback to price field
        const price = parseFloat(
          product.priceHtml?.finalPrice || product.price || "0",
        );
        const minOk =
          !filters.minPrice || price >= parseFloat(filters.minPrice);
        const maxOk =
          !filters.maxPrice || price <= parseFloat(filters.maxPrice);
        return minOk && maxOk;
      });
    }

    // Apply in-stock filter client-side
    if (filters.inStock) {
      result = result.filter((product) => product.isSaleable === true);
    }

    // Apply sorting client-side
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => {
          const priceA = parseFloat(a.priceHtml?.finalPrice || a.price || "0");
          const priceB = parseFloat(b.priceHtml?.finalPrice || b.price || "0");
          return priceA - priceB;
        });
        break;
      case "price-high":
        result.sort((a, b) => {
          const priceA = parseFloat(a.priceHtml?.finalPrice || a.price || "0");
          const priceB = parseFloat(b.priceHtml?.finalPrice || b.price || "0");
          return priceB - priceA;
        });
        break;
      case "newest":
      default:
        result.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
    }

    return result;
  }, [products, filters]);

  // Apply client-side search
  const filteredProducts = filteredAndSortedProducts.filter(
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
      sortBy: "newest" as const,
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

      {/* Search Bar - Uncommented for better UX */}
      {/* <View style={[styles.searchContainer, isRTL && styles.searchContainerRTL]}>
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
      </View> */}

      {/* Results Count and Filter Button Row */}
      <View style={[styles.resultsHeader, isRTL && styles.resultsHeaderRTL]}>
        <Text style={[styles.resultsText, isRTL && styles.resultsTextRTL]}>
          {filteredProducts.length} {t("products")}
        </Text>

        {/* Filter Button next to count */}
        <Pressable
          style={[styles.filterButton, isRTL && styles.filterButtonRTL]}
          onPress={openFilters}
        >
          <Sliders size={18} color={Colors.text} />
          <Text
            style={[
              styles.filterButtonText,
              isRTL && styles.filterButtonTextRTL,
            ]}
          >
            {t("filters")}
          </Text>
          {activeFiltersCount > 0 && (
            <View style={[styles.badge, isRTL && styles.badgeRTL]}>
              <Text style={styles.badgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </Pressable>
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
                index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight,
                isRTL && index % 2 === 0
                  ? styles.gridItemRightRTL
                  : styles.gridItemLeftRTL,
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
              <Pressable
                onPress={() => setFiltersVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              {/* Sort Section */}
              <View style={styles.filterSection}>
                <Text
                  style={[
                    styles.filterSectionTitle,
                    isRTL && styles.filterSectionTitleRTL,
                  ]}
                >
                  {t("sortBy")}
                </Text>
                <View style={styles.genderOptions}>
                  {SORT_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.genderOption,
                        tempFilters.sortBy === option.value &&
                          styles.genderOptionSelected,
                      ]}
                      onPress={() =>
                        setTempFilters({
                          ...tempFilters,
                          sortBy: option.value as typeof tempFilters.sortBy,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          tempFilters.sortBy === option.value &&
                            styles.genderOptionTextSelected,
                        ]}
                      >
                        {t(option.value)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Gender Section */}
              <View style={styles.filterSection}>
                <Text
                  style={[
                    styles.filterSectionTitle,
                    isRTL && styles.filterSectionTitleRTL,
                  ]}
                >
                  {t("gender")}
                </Text>
                <Text
                  style={[styles.filterHint, isRTL && styles.filterHintRTL]}
                >
                  {t("filterHint")}
                </Text>
                <View style={styles.genderOptions}>
                  {GENDER_OPTIONS.map((option) => (
                    <Pressable
                      key={option.label}
                      style={[
                        styles.genderOption,
                        tempFilters.gender === option.value &&
                          styles.genderOptionSelected,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, gender: option.value })
                      }
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          tempFilters.gender === option.value &&
                            styles.genderOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Price Range Section */}
              <View style={styles.filterSection}>
                <Text
                  style={[
                    styles.filterSectionTitle,
                    isRTL && styles.filterSectionTitleRTL,
                  ]}
                >
                  {t("priceRange")}
                </Text>
                <View
                  style={[
                    styles.priceContainer,
                    isRTL && styles.priceContainerRTL,
                  ]}
                >
                  <View style={styles.priceInputContainer}>
                    <Text
                      style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}
                    >
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
                    <Text
                      style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}
                    >
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

              {/* In Stock Section */}
              <View style={styles.filterSection}>
                <Pressable
                  style={[styles.stockOption, isRTL && styles.stockOptionRTL]}
                  onPress={() =>
                    setTempFilters({
                      ...tempFilters,
                      inStock: !tempFilters.inStock,
                    })
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      tempFilters.inStock && styles.checkboxChecked,
                    ]}
                  >
                    {tempFilters.inStock && (
                      <Check size={14} color={Colors.white} />
                    )}
                  </View>
                  <Text
                    style={[styles.stockText, isRTL && styles.stockTextRTL]}
                  >
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
                <Text
                  style={[styles.modalButtonText, styles.resetModalButtonText]}
                >
                  {t("reset")}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.applyModalButton]}
                onPress={handleApplyFilters}
              >
                <Text
                  style={[styles.modalButtonText, styles.applyModalButtonText]}
                >
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

  /* ================= SEARCH ================= */
  searchContainer: {
    paddingHorizontal: SPACING,
    paddingTop: 12,
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
    borderWidth: 1,
    borderColor: Colors.border,
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

  /* ================= RESULTS HEADER WITH FILTER BUTTON ================= */
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING,
    paddingBottom: 12,
  },
  resultsHeaderRTL: {
    flexDirection: "row-reverse",
  },
  resultsText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  resultsTextRTL: {
    textAlign: "left",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    position: "relative",
  },
  filterButtonRTL: {
    flexDirection: "row-reverse",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  filterButtonTextRTL: {
    textAlign: "right",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
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
    left: -4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },

  /* ================= GRID ================= */
  gridListContent: {
    paddingHorizontal: SPACING,
    paddingTop: 4,
    paddingBottom: 24,
  },
  gridListContentRTL: {},
  gridColumnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
    gap: SPACING,
  },
  gridColumnWrapperRTL: {
    // flexDirection: "row-reverse",
  },
  gridItemContainer: {
    width: GRID_ITEM_WIDTH,
  },
  gridItemLeft: {
    marginRight: 0,
  },
  gridItemRight: {
    marginLeft: 0,
  },
  gridItemLeftRTL: {
    marginLeft: 0,
    marginRight: 0,
  },
  gridItemRightRTL: {
    marginRight: 0,
    marginLeft: 0,
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
    // flexDirection: "row-reverse",
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
    marginBottom: 12,
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
