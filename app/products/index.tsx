// app/products/index.tsx
import React, { useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { Search, Grid, ChevronLeft, X } from "lucide-react-native";
import { useAllProducts } from "../hooks/useAllProducts";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 32) / 2;

export default function AllProductsScreen() {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">(
    "newest",
  );

  const {
    data: productsData,
    isLoading,
    error,
  } = useAllProducts([{ key: "status", value: "1" }]);

  const allProducts = productsData?.allProducts?.data || [];

  const filteredProducts = allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.priceHtml?.finalPrice || 0) - (b.priceHtml?.finalPrice || 0);
      case "price-high":
        return (b.priceHtml?.finalPrice || 0) - (a.priceHtml?.finalPrice || 0);
      case "newest":
      default:
        return 0;
    }
  });

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
          onPress={() => router.back()}
        >
          <Text
            style={[styles.retryButtonText, isRTL && styles.retryButtonTextRTL]}
          >
            {t("goBack")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header - Uncomment if needed */}
      {/* <View style={[styles.header, isRTL && styles.headerRTL]}>
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
          <View style={styles.headerRight} />
        </View>
      </View> */}

      {/* Search Bar */}
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

      {/* Results Count and Sort */}
      <View style={[styles.resultsHeader, isRTL && styles.resultsHeaderRTL]}>
        <Text style={[styles.resultsText, isRTL && styles.resultsTextRTL]}>
          {sortedProducts.length} {t("products")}
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
      {sortedProducts.length === 0 ? (
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
          data={sortedProducts}
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
  headerRight: {
    width: 40,
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
});
