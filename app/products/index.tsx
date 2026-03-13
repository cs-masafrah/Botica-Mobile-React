// app/products/index.tsx
import React, { useState, useMemo, useEffect } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import {
  Search,
  Grid,
  ChevronLeft,
  X,
  Sliders,
  Check,
} from "lucide-react-native";
import { useAllProducts } from "../hooks/useAllProducts";
import { useBagistoProductFilters, ProductFilterInput } from "../hooks/useBagistoProductFilters";
import { useFilterAttributes, FilterAttribute, SortOrder } from "../hooks/useFilterAttributes";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface SelectedFilters {
  [key: string]: string[]; // attribute code -> selected option ids
}

interface FilterState {
  selectedFilters: SelectedFilters;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sortBy: string; // Will store the sort value like "created_at-desc"
}

export default function AllProductsScreen() {
  const { t, isRTL } = useLanguage();
  const { category } = useLocalSearchParams<{ category: string }>();
  const categorySlug = category || "all";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    selectedFilters: {},
    minPrice: "",
    maxPrice: "",
    inStock: false,
    sortBy: "created_at-desc",
  });
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  // Fetch filter attributes
  const {
    data: filterAttributesData,
    isLoading: attributesLoading,
    error: attributesError,
  } = useFilterAttributes(categorySlug);

  const filterAttributes = filterAttributesData?.getFilterAttribute.filterAttributes || [];
  const minPrice = filterAttributesData?.getFilterAttribute.minPrice || 0;
  const maxPrice = filterAttributesData?.getFilterAttribute.maxPrice || 1000;
  const sortOrders = filterAttributesData?.getFilterAttribute.sortOrders || [];

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    // Count selected filter options
    Object.values(filters.selectedFilters).forEach(values => {
      count += values.length;
    });
    
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.inStock) count++;
    
    return count;
  }, [filters]);

  // Convert filters to API format
  const getApiFilters = useMemo((): ProductFilterInput[] => {
    const apiFilters: ProductFilterInput[] = [];
    
    // Add selected attribute filters
    Object.entries(filters.selectedFilters).forEach(([attribute, values]) => {
      if (values.length > 0) {
        apiFilters.push({
          attribute,
          value: values,
          operator: "eq",
        });
      }
    });
    
    return apiFilters;
  }, [filters.selectedFilters]);

  // Parse sortBy into sort and order
  const getSortParams = () => {
    const [sort, order] = filters.sortBy.split('-');
    return { sortBy: sort, sortOrder: order };
  };

  const { sortBy: apiSortBy, sortOrder: apiSortOrder } = getSortParams();

  // Fetch products with filters
  const {
    data: filteredProductsData,
    isLoading: isFilterLoading,
    error: filterError,
    refetch: refetchFilters,
  } = useBagistoProductFilters({
    filters: getApiFilters,
    search: searchQuery || undefined,
    minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    inStock: filters.inStock || undefined,
    sortBy: apiSortBy,
    sortOrder: apiSortOrder,
    page: 1,
    perPage: 50,
    enabled: true, // Always enabled now since we have the new API
  });

  // Always fetch all products as fallback (keep for now, but we might remove this)
  const {
    data: allProductsData,
    isLoading: isAllLoading,
    error: allError,
    refetch: refetchAll,
  } = useAllProducts([{ key: "status", value: "1" }], {
    enabled: false, // Disable this for now, use the filter API instead
  });

  const isLoading = isFilterLoading || attributesLoading;
  const error = filterError || attributesError;

  // Get products based on filter state
  const products = useMemo(() => {
    return filteredProductsData?.data || [];
  }, [filteredProductsData]);

  // Helper to get option label based on current language
  const getOptionLabel = (option: any) => {
    if (!option.translations) return option.adminName;
    
    const translation = option.translations.find(
      (t: any) => t.locale === (isRTL ? "ar" : "en")
    );
    return translation?.label || option.adminName;
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setFiltersVisible(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      selectedFilters: {},
      minPrice: "",
      maxPrice: "",
      inStock: false,
      sortBy: "created_at-desc",
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
    refetchFilters();
  };

  const toggleFilterOption = (attributeCode: string, optionId: string) => {
    setTempFilters(prev => {
      const currentSelected = prev.selectedFilters[attributeCode] || [];
      const newSelected = currentSelected.includes(optionId)
        ? currentSelected.filter(id => id !== optionId)
        : [...currentSelected, optionId];
      
      return {
        ...prev,
        selectedFilters: {
          ...prev.selectedFilters,
          [attributeCode]: newSelected,
        },
      };
    });
  };

  const isOptionSelected = (attributeCode: string, optionId: string) => {
    return tempFilters.selectedFilters[attributeCode]?.includes(optionId) || false;
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

      {/* Results Count and Filter Button Row */}
      <View style={[styles.resultsHeader, isRTL && styles.resultsHeaderRTL]}>
        <Text style={[styles.resultsText, isRTL && styles.resultsTextRTL]}>
          {products.length} {t("products")}
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
      {products.length === 0 ? (
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
          data={products}
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
              {sortOrders.length > 0 && (
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
                    {sortOrders.map((sort) => (
                      <Pressable
                        key={sort.value}
                        style={[
                          styles.genderOption,
                          tempFilters.sortBy === sort.value &&
                            styles.genderOptionSelected,
                        ]}
                        onPress={() =>
                          setTempFilters({
                            ...tempFilters,
                            sortBy: sort.value,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            tempFilters.sortBy === sort.value &&
                              styles.genderOptionTextSelected,
                          ]}
                        >
                          {sort.title}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Dynamic Filter Attributes */}
              {filterAttributes.map((attribute) => (
                <View key={attribute.id} style={styles.filterSection}>
                  <Text
                    style={[
                      styles.filterSectionTitle,
                      isRTL && styles.filterSectionTitleRTL,
                    ]}
                  >
                    {attribute.adminName}
                  </Text>
                  <View style={styles.genderOptions}>
                    {attribute.options.map((option) => {
                      const isSelected = isOptionSelected(attribute.code, option.id);
                      return (
                        <Pressable
                          key={option.id}
                          style={[
                            styles.genderOption,
                            isSelected && styles.genderOptionSelected,
                          ]}
                          onPress={() => toggleFilterOption(attribute.code, option.id)}
                        >
                          <Text
                            style={[
                              styles.genderOptionText,
                              isSelected && styles.genderOptionTextSelected,
                            ]}
                          >
                            {getOptionLabel(option)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

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
                      placeholder={minPrice.toString()}
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
                      placeholder={maxPrice.toString()}
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