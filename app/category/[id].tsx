// app/category/[id].tsx
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Heart, Plus, Check } from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import Colors from "@/constants/colors";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShippingStrip } from "@/components/ShippingStrip";
import { useBagistoProductsByCategory } from "../hooks/useBagistoProductsByCategory";

// Helper functions to extract data from BagistoProduct
const getProductBrand = (product: any): string => {
  return (
    product.brand ||
    product.additionalData?.find(
      (data: any) => data.label === "Brand" || data.code === "brand",
    )?.value ||
    ""
  );
};

const getProductTags = (product: any): string[] => {
  const tagsData = product.additionalData?.find(
    (data: any) => data.label.toLowerCase() === "tags" || data.type === "tags",
  );
  if (tagsData?.value) {
    return tagsData.value.split(",").map((tag: string) => tag.trim());
  }
  return product.tags || [];
};

export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { data, isLoading } = useBagistoProductsByCategory(id);
  const products = data?.allProducts?.data || [];

  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice, currentCurrency } = useCurrency();
  const { t, isRTL } = useLanguage();
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Extract tags from Bagisto product data
  const allTags = useMemo(() => {
    if (!products || products.length === 0) return ["All"];
    const tags = new Set<string>();
    products.forEach((product: any) => {
      // Get tags using helper function
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

  const handleAddToCart = (product: any) => {
    // Convert Bagisto product to cart product format
    const cartProduct: any = {
      id: product.id,
      name: product.name,
      description: product.shortDescription || product.description || "",
      price: parseFloat(product.priceHtml?.finalPrice || "0"),
      compareAtPrice: parseFloat(product.priceHtml?.regularPrice || "0"),
      currencyCode: currentCurrency?.code || "USD",
      image: product.images?.[0]?.url || "",
      images: product.images?.map((img: any) => img.url) || [],
      brand: getProductBrand(product),
      rating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0,
      inStock: product.isSaleable,
      category: product.categories?.[0]?.name || "",
      tags: getProductTags(product),
      options:
        product.configutableData?.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.label,
          values: attr.options?.map((opt: any) => opt.label) || [],
        })) || [],
      variants: product.variants || [],
      variantId: product.variants?.[0]?.id,
      productId: product.id,
    };

    addToCart(cartProduct, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 600);
  };

  const toggleProductWishlist = (product: any) => {
    // Create a product object that matches what WishlistContext expects
    const wishlistProduct: any = {
      id: product.id,
      name: product.name,
      description: product.shortDescription || product.description || "",
      price: parseFloat(product.priceHtml?.finalPrice || "0"),
      compareAtPrice: parseFloat(product.priceHtml?.regularPrice || "0"),
      currencyCode: currentCurrency?.code || "USD",
      image: product.images?.[0]?.url || "",
      images: product.images?.map((img: any) => img.url) || [],
      brand: getProductBrand(product),
      rating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0,
      inStock: product.isSaleable,
      category: product.categories?.[0]?.name || "",
      tags: getProductTags(product),
      options:
        product.configutableData?.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.label,
          values: attr.options?.map((opt: any) => opt.label) || [],
        })) || [],
      variants: product.variants || [],
      variantId: product.variants?.[0]?.id,
      // Include Bagisto-specific properties
      type: product.type,
      sku: product.sku,
      priceHtml: product.priceHtml,
      additionalData: product.additionalData,
      configutableData: product.configutableData,
    };

    toggleWishlist(wishlistProduct);
  };

  const renderProduct = (item: any, index: number) => {
    const productPrice = parseFloat(item.priceHtml?.finalPrice || "0");
    const comparePrice = parseFloat(item.priceHtml?.regularPrice || "0");
    const inWishlist = isInWishlist(item.id);
    const hasDiscount = comparePrice > productPrice;
    const discountPercentage = hasDiscount
      ? Math.round(((comparePrice - productPrice) / comparePrice) * 100)
      : 0;
    const isAdded = addedProductId === item.id;
    const mainImage = item.images?.[0]?.url || "";
    const brand = getProductBrand(item);

    return (
      <Pressable
        style={[styles.productCard, isRTL && styles.productCardRTL]}
        onPress={() =>
          router.push({ pathname: "/product/[id]", params: { id: item.id } })
        }
      >
        <View style={styles.imageContainer}>
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]} />
          )}
          {hasDiscount && (
            <View
              style={[styles.discountBadge, isRTL && styles.discountBadgeRTL]}
            >
              <Text
                style={[
                  styles.discountBadgeText,
                  isRTL && styles.discountBadgeTextRTL,
                ]}
              >
                -{discountPercentage}%
              </Text>
            </View>
          )}
          <Pressable
            style={[styles.favoriteButton, isRTL && styles.favoriteButtonRTL]}
            onPress={(e) => {
              e.stopPropagation();
              toggleProductWishlist(item);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={18}
              color={inWishlist ? Colors.error : Colors.text}
              fill={inWishlist ? Colors.error : "transparent"}
            />
          </Pressable>
          <Pressable
            style={[
              styles.addToCartButton,
              isAdded && styles.addToCartButtonSuccess,
              isRTL && styles.addToCartButtonRTL,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isAdded ? (
              <Check size={13} color={Colors.white} strokeWidth={3} />
            ) : (
              <Plus size={13} color={Colors.white} strokeWidth={3} />
            )}
          </Pressable>
        </View>
        <View style={[styles.productInfo, isRTL && styles.productInfoRTL]}>
          {brand && (
            <Text
              style={[styles.brandText, isRTL && styles.brandTextRTL]}
              numberOfLines={1}
            >
              {brand}
            </Text>
          )}
          <Text
            style={[styles.productName, isRTL && styles.productNameRTL]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <View
            style={[styles.ratingContainer, isRTL && styles.ratingContainerRTL]}
          >
            <Text style={[styles.ratingText, isRTL && styles.ratingTextRTL]}>
              ★ {item.averageRating?.toFixed(1) || 0}
            </Text>
            {item.reviewCount > 0 && (
              <Text
                style={[styles.reviewCount, isRTL && styles.reviewCountRTL]}
              >
                ({item.reviewCount})
              </Text>
            )}
          </View>
          <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
            {hasDiscount && (
              <Text
                style={[
                  styles.compareAtPriceText,
                  isRTL && styles.compareAtPriceTextRTL,
                ]}
              >
                {formatPrice(comparePrice)}
              </Text>
            )}
            <Text style={[styles.priceText, isRTL && styles.priceTextRTL]}>
              {formatPrice(productPrice)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <Stack.Screen
        options={{
          title: name || t("category"),
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View
          style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
            {t("loadingProducts")}
          </Text>
        </View>
      ) : (
        <View
          style={[styles.contentContainer, isRTL && styles.contentContainerRTL]}
        >
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
            renderItem={({ item, index }) => renderProduct(item, index)}
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
                  {t("noProductsInCategory")}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const { width: screenWidth } = Dimensions.get("window");
const PADDING = 20;
const GAP = 12;
const CARD_WIDTH = (screenWidth - PADDING * 2 - GAP * 2) / 3;

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
    padding: 20,
  },
  listContentRTL: {},
  row: {
    gap: GAP,
    marginBottom: GAP,
    justifyContent: "flex-end",
    flexWrap: "nowrap",
  },
  rowRTL: {
    // flexDirection: "row-reverse",
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  productCardRTL: {},
  imageContainer: {
    position: "relative" as const,
    width: "100%",
    aspectRatio: 0.75,
    backgroundColor: Colors.cardBackground,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonRTL: {
    right: undefined,
    left: 8,
  },
  addToCartButton: {
    position: "absolute" as const,
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonRTL: {
    right: undefined,
    left: 8,
  },
  addToCartButtonSuccess: {
    backgroundColor: "#10B981",
  },
  productInfo: {
    padding: 12,
  },
  productInfoRTL: {
    alignItems: "flex-start",
  },
  brandText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  brandTextRTL: {
    textAlign: "left",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  productNameRTL: {
    textAlign: "left",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  ratingContainerRTL: {
    // flexDirection: "row-reverse",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  ratingTextRTL: {
    textAlign: "left",
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  reviewCountRTL: {
    textAlign: "left",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  priceRowRTL: {
    // flexDirection: "row-reverse",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  priceTextRTL: {
    textAlign: "left",
  },
  compareAtPriceText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  compareAtPriceTextRTL: {
    textAlign: "left",
  },
  discountBadge: {
    position: "absolute" as const,
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeRTL: {
    left: undefined,
    right: 8,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  discountBadgeTextRTL: {
    textAlign: "left",
  },
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
    paddingHorizontal: 20,
    gap: 8,
  },
  tagsScrollRTL: {
    // flexDirection: "row-reverse",
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
});
