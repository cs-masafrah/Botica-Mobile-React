// components/ProductCard.tsx (updated with currency and RTL support)
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Heart, Plus, Check, Star } from "lucide-react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product, BagistoProduct } from "@/app/types/product";
import { ProductWithCustomizableOptions } from "@/app/types/customizable-options";


interface ProductCardProps {
  product: Product | BagistoProduct;
  onAddToCart?: (product: Product | BagistoProduct) => void;
  variant?: "vertical" | "horizontal";
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  variant = "vertical",
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice, currentCurrency } = useCurrency();
  const { t, isRTL } = useLanguage();
  const [addedProductId, setAddedProductId] = React.useState<string | null>(
    null,
  );

  const inWishlist = isInWishlist(product.id);
  const hasDiscount =
    product.priceHtml?.regularPrice > product.priceHtml?.finalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.priceHtml.regularPrice - product.priceHtml.finalPrice) /
          product.priceHtml.regularPrice) *
          100,
      )
    : 0;
  const isAdded = addedProductId === product.id;
  const imageUrl = product.images?.[0]?.url || "";
  const brand =
    product.additionalData?.find((data) => data.label === "Brand")?.value || "";

  // Safe rating handling
  const averageRating = product.averageRating || 0;
  const safeAverageRating =
    typeof averageRating === "number" ? averageRating : 0;
  const formattedRating = safeAverageRating.toFixed(1);

  const reviewCount = product.reviews?.length || 0;

  // Format prices using currency context
  const finalPrice = formatPrice(product.priceHtml?.finalPrice || 0);
  const regularPrice = product.priceHtml?.regularPrice
    ? formatPrice(product.priceHtml.regularPrice)
    : "";

  // Cast product to include customizable options
  const productWithOptions = product as ProductWithCustomizableOptions;
  const hasCustomizableOptions = productWithOptions.customizableOptions && 
    productWithOptions.customizableOptions.length > 0;

  const handleAddToCart = async () => {
    // If product has customizable options, navigate to product page
    if (hasCustomizableOptions) {
      router.push({ 
        pathname: "/product/[id]", 
        params: { id: product.id, fromCard: "true" } 
      });
      return;
    }

    if (onAddToCart) {
      onAddToCart(product);
    } else {
      try {
        const bagistoProduct: any = {
          id: product.id,
          productId: product.id,
          name: product.name,
          description: product.shortDescription || product.description || "",
          compareAtPrice: product.priceHtml?.regularPrice || 0,
          currencyCode: currentCurrency?.code || "USD",
          image: imageUrl,
          images: product.images?.map((img) => img.url) || [],
          brand: brand,
          rating: safeAverageRating,
          reviewCount: reviewCount,
          inStock: product.isSaleable,
          category:
            product.additionalData?.find((data) => data.label === "Category")
              ?.value || "",
          options:
            (product as any).configutableData?.attributes?.map((attr: any) => ({
              id: attr.id,
              name: attr.label,
              values: attr.options?.map((opt: any) => opt.label) || [],
            })) || [],
          price: product.priceHtml?.finalPrice || 0,
          ...(product.variants?.[0] && {
            selectedConfigurableOption: product.variants[0].id,
          }),
          variantId: product.variants?.[0]?.id,
        };

        const result = await addToCart(bagistoProduct, 1);

        if (result.success) {
          setAddedProductId(product.id);
          setTimeout(() => setAddedProductId(null), 600);
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
      }
    }
  };

  // Horizontal Layout
  if (variant === "horizontal") {
    return (
      <Pressable
        style={[
          styles.horizontalContainer,
          isRTL && styles.horizontalContainerRTL,
        ]}
        onPress={() =>
          router.push({ pathname: "/product/[id]", params: { id: product.id } })
        }
      >
        <View style={styles.horizontalImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.horizontalImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={300}
            />
          ) : (
            <View
              style={[
                styles.horizontalImage,
                { backgroundColor: Colors.cardBackground },
              ]}
            />
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
        </View>

        <View
          style={[styles.horizontalInfo, isRTL && styles.horizontalInfoRTL]}
        >
          {brand && (
            <Text
              style={[
                styles.horizontalBrandText,
                isRTL && styles.horizontalBrandTextRTL,
              ]}
              numberOfLines={1}
            >
              {brand}
            </Text>
          )}

          <Text
            style={[
              styles.horizontalProductName,
              isRTL && styles.horizontalProductNameRTL,
            ]}
            numberOfLines={2}
          >
            {product.name}
          </Text>

          <View
            style={[styles.ratingContainer, isRTL && styles.ratingContainerRTL]}
          >
            <Star size={12} color="#FFC107" fill="#FFC107" />
            <Text style={[styles.ratingText, isRTL && styles.ratingTextRTL]}>
              {formattedRating}
            </Text>
            {reviewCount > 0 && (
              <Text style={[styles.reviewText, isRTL && styles.reviewTextRTL]}>
                ({reviewCount})
              </Text>
            )}
          </View>

          <View
            style={[
              styles.horizontalPriceRow,
              isRTL && styles.horizontalPriceRowRTL,
            ]}
          >
            <Text
              style={[
                styles.horizontalPriceText,
                isRTL && styles.horizontalPriceTextRTL,
              ]}
            >
              {finalPrice}
            </Text>
            {hasDiscount && (
              <Text
                style={[
                  styles.horizontalCompareAtPriceText,
                  isRTL && styles.horizontalCompareAtPriceTextRTL,
                ]}
              >
                {regularPrice}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.horizontalActions,
              isRTL && styles.horizontalActionsRTL,
            ]}
          >
            <Pressable
              style={[
                styles.horizontalFavoriteButton,
                inWishlist && styles.favoriteButtonActive,
                isRTL && styles.horizontalFavoriteButtonRTL,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart
                size={16}
                color={inWishlist ? Colors.error : Colors.textSecondary}
                fill={inWishlist ? Colors.error : "transparent"}
              />
            </Pressable>

            <Pressable
              style={[
                styles.horizontalAddToCartButton,
                isAdded && styles.addToCartButtonSuccess,
                isRTL && styles.horizontalAddToCartButtonRTL,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isAdded ? (
                <Check size={14} color={Colors.white} strokeWidth={3} />
              ) : (
                <Plus size={14} color={Colors.white} strokeWidth={3} />
              )}
              <Text
                style={[
                  styles.horizontalAddToCartText,
                  isRTL && styles.horizontalAddToCartTextRTL,
                ]}
              >
                {isAdded ? t("added") : t("add")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  // Vertical Layout (Default)
  return (
    <Pressable
      style={[styles.container, isRTL && styles.containerRTL]}
      onPress={() =>
        router.push({ pathname: "/product/[id]", params: { id: product.id } })
      }
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />
        ) : (
          <View
            style={[
              styles.productImage,
              { backgroundColor: Colors.cardBackground },
            ]}
          />
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
          style={[
            styles.favoriteButton,
            inWishlist && styles.favoriteButtonActive,
            isRTL && styles.favoriteButtonRTL,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={18}
            color={inWishlist ? Colors.error : Colors.white}
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
            handleAddToCart();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isAdded ? (
            <Check size={15} color={Colors.white} strokeWidth={3} />
          ) : (
            <Plus size={15} color={Colors.white} strokeWidth={3} />
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
          numberOfLines={1}
        >
          {product.name}
        </Text>

        <View
          style={[styles.ratingContainer, isRTL && styles.ratingContainerRTL]}
        >
          <Star size={11} color="#FFC107" fill="#FFC107" />
          <Text style={[styles.ratingText, isRTL && styles.ratingTextRTL]}>
            {formattedRating}
          </Text>
          {reviewCount > 0 && (
            <Text style={[styles.reviewText, isRTL && styles.reviewTextRTL]}>
              ({reviewCount})
            </Text>
          )}
        </View>

        <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
          <Text style={[styles.priceText, isRTL && styles.priceTextRTL]}>
            {finalPrice}
          </Text>
          {hasDiscount && (
            <Text
              style={[
                styles.compareAtPriceText,
                isRTL && styles.compareAtPriceTextRTL,
              ]}
            >
              {regularPrice}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

// Styles with RTL support
const styles = StyleSheet.create({
  // Vertical Layout Styles
  container: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  containerRTL: {
    direction: "rtl",
  },

  imageContainer: {
    position: "relative",
    width: "100%",
    height: 170,
    backgroundColor: Colors.cardBackground,
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#82828282",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonRTL: {
    right: undefined,
    left: 12,
  },
  favoriteButtonActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.error,
  },

  addToCartButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  addToCartButtonRTL: {
    right: undefined,
    left: 12,
  },
  addToCartButtonSuccess: {
    backgroundColor: "#10B981",
  },

  productInfo: {
    padding: 14,
    paddingTop: 12,
  },
  productInfoRTL: {
    alignItems: "flex-start",
  },

  brandText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandTextRTL: {
    textAlign: "left",
  },

  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  productNameRTL: {
    textAlign: "left",
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  ratingContainerRTL: {
    alignSelf: "flex-start",
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  ratingTextRTL: {
    textAlign: "left",
  },

  reviewText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  reviewTextRTL: {
    textAlign: "left",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceRowRTL: {
    alignSelf: "flex-start",
  },

  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  priceTextRTL: {
    textAlign: "left",
  },

  compareAtPriceText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  compareAtPriceTextRTL: {
    textAlign: "left",
  },

  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  discountBadgeRTL: {
    left: undefined,
    right: 12,
  },

  discountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  discountBadgeTextRTL: {
    textAlign: "left",
  },

  // Horizontal Layout Styles
  horizontalContainer: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    height: 150,
  },
  horizontalContainerRTL: {
    // flexDirection: "row-reverse",
  },

  horizontalImageContainer: {
    position: "relative",
    width: 140,
    height: 150,
    backgroundColor: Colors.cardBackground,
  },

  horizontalImage: {
    width: "100%",
    height: "100%",
  },

  horizontalInfo: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  horizontalInfoRTL: {
    // flexDirection: "column",
    alignItems: "flex-start",
    // alignSelf: "center",
  },

  horizontalBrandText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  horizontalBrandTextRTL: {
    textAlign: "left",
  },

  horizontalProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
    flex: 1,
    marginBottom: 6,
  },
  horizontalProductNameRTL: {
    textAlign: "left",
  },

  horizontalPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  horizontalPriceRowRTL: {
    // flexDirection: "row-reverse",
  },

  horizontalPriceText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  horizontalPriceTextRTL: {
    textAlign: "left",
  },

  horizontalCompareAtPriceText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  horizontalCompareAtPriceTextRTL: {
    textAlign: "left",
  },

  horizontalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  horizontalActionsRTL: {
    // flexDirection: "row-reverse",
  },

  horizontalFavoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  horizontalFavoriteButtonRTL: {},

  horizontalAddToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  horizontalAddToCartButtonRTL: {
    // flexDirection: "row-reverse",
  },

  horizontalAddToCartText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  horizontalAddToCartTextRTL: {
    textAlign: "left",
  },
});

export default ProductCard;
