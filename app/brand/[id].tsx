// app/(tabs)/brand/[id].tsx - UPDATED
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
import { formatPrice } from "@/utils/currency";
import { ShippingStrip } from "@/components/ShippingStrip";
import { useProductsByBrand } from "@/app/hooks/useProductsByBrand";

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

  const { data: productsData, isLoading } = useProductsByBrand(id);
  const products = productsData?.data || [];

  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
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
    try {
      // Convert Bagisto product to cart product format
      const cartProduct: any = {
        id: product.id,
        name: product.name,
        description: product.shortDescription || product.description || "",
        price: parseFloat(product.priceHtml?.finalPrice || "0"),
        compareAtPrice: parseFloat(product.priceHtml?.regularPrice || "0"),
        currencyCode: "USD",
        image: product.images?.[0]?.url || "",
        images: product.images?.map((img: any) => img.url) || [],
        brand: getProductBrand(product),
        rating: product.averageRating || 0,
        reviewCount: product.reviews?.length || 0,
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
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const toggleProductWishlist = (product: any) => {
    try {
      // Create a product object that matches what WishlistContext expects
      const wishlistProduct: any = {
        id: product.id,
        name: product.name,
        description: product.shortDescription || product.description || "",
        price: parseFloat(product.priceHtml?.finalPrice || "0"),
        compareAtPrice: parseFloat(product.priceHtml?.regularPrice || "0"),
        currencyCode: "USD",
        image: product.images?.[0]?.url || "",
        images: product.images?.map((img: any) => img.url) || [],
        brand: getProductBrand(product),
        rating: product.averageRating || 0,
        reviewCount: product.reviews?.length || 0,
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
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
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
        style={styles.productCard}
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
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>
                -{discountPercentage}%
              </Text>
            </View>
          )}
          <Pressable
            style={styles.favoriteButton}
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
        <View style={styles.productInfo}>
          {brand && (
            <Text style={styles.brandText} numberOfLines={1}>
              {brand}
            </Text>
          )}
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>
              ★{" "}
              {typeof item.averageRating === "number"
                ? item.averageRating.toFixed(1)
                : "0.0"}
            </Text>
            {(item.reviews?.length || 0) > 0 && (
              <Text style={styles.reviewCount}>
                ({item.reviews?.length || 0})
              </Text>
            )}
          </View>
          <View style={styles.priceRow}>
            {hasDiscount && (
              <Text style={styles.compareAtPriceText}>
                {formatPrice(comparePrice, "USD")}
              </Text>
            )}
            <Text style={styles.priceText}>
              {formatPrice(productPrice, "USD")}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ShippingStrip />
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            Loading {brandName} products...
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {allTags.length > 1 && (
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsScroll}
              >
                {allTags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={[
                      styles.tagButton,
                      selectedTag === tag && styles.tagButtonActive,
                    ]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTag === tag && styles.tagTextActive,
                      ]}
                    >
                      {tag}
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
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            key={selectedTag}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No products found for {brandName}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: 20,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
    justifyContent: "flex-start",
    flexWrap: "nowrap",
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
  addToCartButtonSuccess: {
    backgroundColor: "#10B981",
  },
  productInfo: {
    padding: 12,
  },
  brandText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  compareAtPriceText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textDecorationLine: "line-through" as const,
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
  discountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700" as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  contentContainer: {
    flex: 1,
  },
  filterContainer: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#E5E5E5",
  },
  tagsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border || "#E5E5E5",
  },
  tagButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  tagTextActive: {
    color: Colors.white,
  },
});
