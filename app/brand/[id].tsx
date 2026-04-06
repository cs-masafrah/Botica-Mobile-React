// app/(tabs)/brand/[id].tsx - UPDATED with ProductCard component and Filters
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState, useMemo, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import { Sliders, X, Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProductsByBrand } from "@/app/hooks/useProductsByBrand";
import {
  useBagistoProductFilters,
  ProductFilterInput,
} from "@/app/hooks/useBagistoProductFilters";
import {
  useFilterAttributes,
  FilterAttribute,
  SortOrder,
} from "@/app/hooks/useFilterAttributes";
import ProductCard from "@/components/ProductCard";

// Helper functions to extract data from BagistoProduct
const getProductTags = (product: any): string[] => {
  const tagsData = product.additionalData?.find(
    (data: any) => data.label.toLowerCase() === "tags" || data.type === "tags"
  );
  if (tagsData?.value) {
    return tagsData.value.split(",").map((tag: string) => tag.trim());
  }
  return product.tags || [];
};

interface SelectedFilters {
  [key: string]: string[]; // attribute code -> selected option ids
}

interface FilterState {
  selectedFilters: SelectedFilters;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sortBy: string;
}

export default function BrandProductsScreen() {
  // Use all params and handle undefined values
  const params = useLocalSearchParams();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";
  const name =
    typeof params.name === "string"
      ? params.name
      : Array.isArray(params.name)
        ? params.name[0]
        : "Brand";
  const brandName = name || "Brand";

  const { t, isRTL } = useLanguage();
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isFilterMode, setIsFilterMode] = useState(false);

  // Initialize filters with brand pre-selected
  const getInitialFilters = (): FilterState => ({
    selectedFilters: {
      brand: [id], // Pre-select the current brand
    },
    minPrice: "",
    maxPrice: "",
    inStock: false,
    sortBy: "created_at-desc",
  });

  const [filters, setFilters] = useState<FilterState>(getInitialFilters());
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  // Fetch filter attributes
  const {
    data: filterAttributesData,
    isLoading: attributesLoading,
    error: attributesError,
  } = useFilterAttributes("all");

  const filterAttributes =
    filterAttributesData?.getFilterAttribute.filterAttributes || [];
  const minPrice = filterAttributesData?.getFilterAttribute.minPrice || 0;
  const maxPrice = filterAttributesData?.getFilterAttribute.maxPrice || 1000;
  const sortOrders = filterAttributesData?.getFilterAttribute.sortOrders || [];

  // Find the brand option ID based on brand name
  const brandAttribute = filterAttributes.find(
    (attr: FilterAttribute) => attr.code === "brand"
  );

  // Update filters when brand attribute is loaded and we have the brand name
  useEffect(() => {
    if (brandAttribute && brandName) {
      const brandOption = brandAttribute.options.find(
        (opt: any) =>
          opt.adminName?.toLowerCase() === brandName.toLowerCase() ||
          opt.label?.toLowerCase() === brandName.toLowerCase()
      );
      if (brandOption) {
        setFilters((prev) => ({
          ...prev,
          selectedFilters: {
            ...prev.selectedFilters,
            brand: [brandOption.id],
          },
        }));
        setTempFilters((prev) => ({
          ...prev,
          selectedFilters: {
            ...prev.selectedFilters,
            brand: [brandOption.id],
          },
        }));
      }
    }
  }, [brandAttribute, brandName]);

  // Calculate active filters count (excluding the locked brand filter)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    // Count selected filter options (excluding brand)
    Object.entries(filters.selectedFilters).forEach(([key, values]) => {
      if (key !== "brand") {
        count += values.length;
      }
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
    const [sort, order] = filters.sortBy.split("-");
    return { sortBy: sort, sortOrder: order };
  };

  const { sortBy: apiSortBy, sortOrder: apiSortOrder } = getSortParams();

  // Fetch products with filters (only when in filter mode)
  const {
    data: filteredProductsData,
    isLoading: isFilterLoading,
    error: filterError,
    refetch: refetchFilters,
  } = useBagistoProductFilters({
    filters: getApiFilters,
    search: undefined,
    minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    inStock: filters.inStock || undefined,
    sortBy: apiSortBy,
    sortOrder: apiSortOrder,
    page: 1,
    perPage: 50,
    enabled: isFilterMode, // Only enabled when in filter mode
  });

  // Fetch products by brand (normal mode)
  const {
    data: brandProductsData,
    isLoading: isBrandLoading,
  } = useProductsByBrand(id);

  const isLoading = isFilterMode
    ? isFilterLoading || attributesLoading
    : isBrandLoading;
  const error = isFilterMode ? filterError || attributesError : null;

  // Get products based on filter mode
  const products = useMemo(() => {
    if (isFilterMode) {
      return filteredProductsData?.data || [];
    }
    return brandProductsData?.data || [];
  }, [isFilterMode, filteredProductsData, brandProductsData]);

  // Helper to get option label based on current language
  const getOptionLabel = (option: any) => {
    if (!option.translations) return option.adminName;
    const translation = option.translations.find(
      (t: any) => t.locale === (isRTL ? "ar" : "en")
    );
    return translation?.label || option.adminName;
  };

  // Extract tags from Bagisto product data
  const allTags = useMemo(() => {
    if (!products || products.length === 0) return ["All"];
    const tags = new Set<string>();
    products.forEach((product: any) => {
      const productTags = getProductTags(product);
      productTags.forEach((tag: string) => {
        if (tag) tags.add(tag);
      });
    });
    return ["All", ...Array.from(tags).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products || selectedTag === "All") return products;
    return products.filter((product: any) => {
      const productTags = getProductTags(product);
      return productTags.includes(selectedTag);
    });
  }, [products, selectedTag]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterMode(true);
    setFiltersVisible(false);
  };

  const handleResetFilters = () => {
    const resetFilters = getInitialFilters();
    // Re-apply the brand option ID if available
    if (brandAttribute && brandName) {
      const brandOption = brandAttribute.options.find(
        (opt: any) =>
          opt.adminName?.toLowerCase() === brandName.toLowerCase() ||
          opt.label?.toLowerCase() === brandName.toLowerCase()
      );
      if (brandOption) {
        resetFilters.selectedFilters.brand = [brandOption.id];
      }
    }
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setIsFilterMode(false); // Return to normal mode
    setFiltersVisible(false);
  };

  const openFilters = () => {
    setTempFilters(filters);
    setFiltersVisible(true);
  };

  const toggleFilterOption = (attributeCode: string, optionId: string) => {
    // Prevent toggling the brand filter
    if (attributeCode === "brand") return;

    setTempFilters((prev) => {
      const currentSelected = prev.selectedFilters[attributeCode] || [];
      const newSelected = currentSelected.includes(optionId)
        ? currentSelected.filter((id) => id !== optionId)
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
    return (
      tempFilters.selectedFilters[attributeCode]?.includes(optionId) || false
    );
  };

  const { width: screenWidth } = Dimensions.get("window");
  const PADDING = 20;
  const GAP = 12;
  const CARD_WIDTH = (screenWidth - PADDING * 2 - GAP * 2) / 3;

  if (isLoading) {
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <Stack.Screen
          options={{
            title: brandName,
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />
        <View
          style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
            {t("loadingBrandProducts")}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <Stack.Screen
          options={{
            title: brandName,
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={[styles.errorContainer, isRTL && styles.errorContainerRTL]}>
          <Text style={[styles.errorTitle, isRTL && styles.errorTitleRTL]}>
            {t("error")}
          </Text>
          <Text style={[styles.errorText, isRTL && styles.errorTextRTL]}>
            {error.message}
          </Text>
          <Pressable
            style={[styles.retryButton, isRTL && styles.retryButtonRTL]}
            onPress={() => refetchFilters()}
          >
            <Text
              style={[styles.retryButtonText, isRTL && styles.retryButtonTextRTL]}
            >
              {t("retry")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <Stack.Screen
        options={{
          title: brandName,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <View
        style={[styles.contentContainer, isRTL && styles.contentContainerRTL]}
      >
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

        {allTags.length > 1 && (
          <View
            style={[
              styles.filterContainer,
              isRTL && styles.filterContainerRTL,
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.tagsScroll,
                isRTL && styles.tagsScrollRTL,
              ]}
            >
              {allTags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[
                    styles.tagButton,
                    selectedTag === tag && styles.tagButtonActive,
                    isRTL && styles.tagButtonRTL,
                  ]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTag === tag && styles.tagTextActive,
                      isRTL && styles.tagTextRTL,
                    ]}
                  >
                    {tag === "All" ? t("all") : tag}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={filteredProducts}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.productCardContainer,
                { width: CARD_WIDTH },
                isRTL && styles.productCardContainerRTL,
              ]}
            >
              <ProductCard product={item} variant="vertical" />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={[styles.row, isRTL && styles.rowRTL]}
          contentContainerStyle={[
            styles.listContent,
            isRTL && styles.listContentRTL,
          ]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          key={selectedTag}
          ListEmptyComponent={
            <View
              style={[
                styles.emptyContainer,
                isRTL && styles.emptyContainerRTL,
              ]}
            >
              <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
                {t("noProductsForBrand", { brand: brandName })}
              </Text>
            </View>
          }
        />
      </View>

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
              {filterAttributes.map((attribute) => {
                const isBrandAttribute = attribute.code === "brand";

                return (
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
                        const isSelected = isOptionSelected(
                          attribute.code,
                          option.id
                        );
                        const isBrandLocked =
                          isBrandAttribute && isSelected;

                        return (
                          <Pressable
                            key={option.id}
                            style={[
                              styles.genderOption,
                              isSelected && styles.genderOptionSelected,
                              isBrandLocked && styles.genderOptionLocked,
                            ]}
                            onPress={() =>
                              toggleFilterOption(attribute.code, option.id)
                            }
                            disabled={isBrandLocked}
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
                );
              })}

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

const { width: screenWidth } = Dimensions.get("window");
const PADDING = 20;
const GAP = 12;
const CARD_WIDTH = (screenWidth - PADDING * 2 - GAP * 2) / 3;
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainerRTL: {},
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingTextRTL: {
    textAlign: "left",
  },
  listContent: {
    padding: PADDING,
    paddingTop: 8,
  },
  listContentRTL: {},
  row: {
    gap: GAP,
    marginBottom: GAP,
    justifyContent: "flex-start",
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  productCardContainer: {
    // Width is set dynamically
  },
  productCardContainerRTL: {},
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyContainerRTL: {},
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyTextRTL: {
    textAlign: "left",
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerRTL: {},
  filterContainer: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#E5E5E5",
  },
  filterContainerRTL: {},
  tagsScroll: {
    paddingHorizontal: PADDING,
    gap: 8,
  },
  tagsScrollRTL: {
    flexDirection: "row",
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border || "#E5E5E5",
  },
  tagButtonRTL: {},
  tagButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  tagTextRTL: {
    textAlign: "left",
  },
  tagTextActive: {
    color: Colors.white,
  },
  /* ================= RESULTS HEADER WITH FILTER BUTTON ================= */
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING,
    paddingVertical: 12,
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
  /* ================= ERROR STATES ================= */
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
  modalHeaderRTL: {},
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
    textAlign: "left",
    paddingRight: 12,
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
  genderOptionLocked: {
    opacity: 0.7,
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
