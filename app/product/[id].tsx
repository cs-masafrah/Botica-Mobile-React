// app/product/[id].tsx
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Minus,
  Plus,
  Star,
} from "lucide-react-native";
import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShippingStrip } from "@/components/ShippingStrip";
import { useBagistoProductById } from "../hooks/useBagistoProductById";
import { useBagistoProductsByCategory } from "../hooks/useBagistoProductsByCategory";
import { CustomizableOptions } from "@/components/CustomizableOptions";
import { 
  CustomizableOption, 
  SelectedCustomizableOption,
  ProductWithCustomizableOptions 
} from "@/app/types/customizable-options";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
};

// Helper to get brand from product
const getBrand = (product: any): string => {
  return (
    product?.brand ||
    product?.additionalData?.find(
      (item: any) => item.label === "Brand" || item.code === "brand",
    )?.value ||
    ""
  );
};

// Helper to get category ID from product
const getCategoryId = (product: any): string => {
  return product?.categories?.[0]?.id || "";
};

export default function ProductDetailScreen() {
  const { id, fromCard } = useLocalSearchParams<{ id: string; fromCard?: string }>();
  const { data: product, isLoading, error } = useBagistoProductById(id);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const { t, isRTL } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedCustomizableOptions, setSelectedCustomizableOptions] = useState<SelectedCustomizableOption[]>([]);
  const [customizableTotalPrice, setCustomizableTotalPrice] = useState<number>(0);
  const [showCustomizableOptions, setShowCustomizableOptions] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get category ID for related products
  const categoryId = product ? getCategoryId(product) : "";

  // Fetch related products by category
  const { data: categoryProductsData } = useBagistoProductsByCategory(categoryId);

  // Extract brand
  const brand = getBrand(product);

  // Check if product has customizable options
  const productWithOptions = product as ProductWithCustomizableOptions;
  const hasCustomizableOptions = product?.customizableOptions?.length > 0;

  // Extract price information
  const basePrice = parseFloat(product?.priceHtml?.finalPrice || "0");
  const price = customizableTotalPrice || basePrice;
  const comparePrice = parseFloat(product?.priceHtml?.regularPrice || "0");
  const hasDiscount = comparePrice > basePrice;
  const discountPercentage = hasDiscount
    ? Math.round(((comparePrice - basePrice) / comparePrice) * 100)
    : 0;

  // Handle images
  const images = product?.images?.map((img: any) => img.url) || [];

  // Handle variants if available
  const hasVariants = product?.configutableData?.attributes?.length > 0;

  // If coming from product card with options, auto-scroll to options
  useEffect(() => {
    if (fromCard === "true" && hasCustomizableOptions) {
      setShowCustomizableOptions(true);
      // Scroll to options section
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 300, animated: true });
      }, 500);
    }
  }, [fromCard, hasCustomizableOptions]);

  // Get related products from multiple sources
  const allRelatedProducts = useMemo(() => {
    if (!product) return [];

    const relatedProductsFromAPI = product.relatedProducts || [];
    const categoryRelatedProducts = categoryProductsData?.allProducts?.data || [];

    // Combine both sources, remove current product and duplicates
    const combined = [...relatedProductsFromAPI, ...categoryRelatedProducts]
      .filter(
        (product: any, index: number, self: any[]) =>
          product?.id && // Make sure product has ID
          product.id !== id && // Remove current product
          index === self.findIndex((p: any) => p?.id === product.id), // Remove duplicates
      )
      .slice(0, 8); // Limit to 8 products

    return combined;
  }, [product, categoryProductsData, id]);

  // Initialize selected options for variants
  useEffect(() => {
    if (hasVariants && product?.configutableData?.attributes) {
      const initialOptions: Record<string, string> = {};
      product.configutableData.attributes.forEach((attr: any) => {
        if (attr.options?.length > 0) {
          initialOptions[attr.code] = attr.options[0].id;
        }
      });
      setSelectedOptions(initialOptions);
    }
  }, [product, hasVariants]);

  // Get selected variant based on selected options
  const getSelectedVariant = useMemo(() => {
    if (!product?.variants || !hasVariants) return null;

    return product.variants.find((variant: any) => {
      return product.configutableData.attributes.every((attr: any) => {
        const selectedOptionId = selectedOptions[attr.code];
        const selectedOption = attr.options.find(
          (opt: any) => opt.id === selectedOptionId,
        );
        const variantAttribute = variant.selectedOptions?.find(
          (opt: any) => opt.name === attr.code,
        );
        return variantAttribute?.value === selectedOption?.label;
      });
    });
  }, [product, selectedOptions, hasVariants]);

  const handleAddToCart = async () => {
    if (!product) return;

    // If product has customizable options and none are selected, show them
    if (hasCustomizableOptions && selectedCustomizableOptions.length === 0) {
      setShowCustomizableOptions(true);
      Alert.alert(
        t("selectOptions"),
        t("pleaseSelectOptions"),
        [{ text: t("ok") }]
      );
      
      // Scroll to options section
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 300, animated: true });
      }, 500);
      
      return;
    }

    // Use selected variant if available, otherwise use main product
    const selectedVariant = getSelectedVariant;
    const productToAdd = selectedVariant || product;

    // Prepare product for Bagisto GraphQL API with customizable options
    const bagistoProduct: any = {
      // Basic required fields
      id: product.id,
      productId: product.id,
      name: product.name,
      price: customizableTotalPrice || parseFloat(
        productToAdd.price || product.priceHtml?.finalPrice || "0"
      ),

      // Bagisto specific fields
      selectedConfigurableOption: selectedVariant?.id,
      variantId: selectedVariant?.id,
      
      // Customizable options
      customizableOptions: selectedCustomizableOptions.map(opt => ({
        optionId: opt.optionId,
        value: opt.optionValue,
      })),
    };

    console.log("🛒 [PRODUCT PAGE] Adding to cart with options:", bagistoProduct);

    try {
      const result = await addToCart(
        bagistoProduct, 
        quantity, 
        selectedOptions, 
        selectedCustomizableOptions
      );

      // Check if result has success property
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          setAddedToCart(true);
          setTimeout(() => setAddedToCart(false), 2000);
          console.log("✅ Added to cart:", result.message);
        } else {
          Alert.alert(t("error"), result.message || t("failedToAddToCart"));
        }
      } else {
        // If no success property, assume it worked
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
      }
    } catch (error: any) {
      console.error("❌ Error adding to cart:", error);
      Alert.alert(t("error"), t("failedToAddToCart"));
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveImageIndex(index);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
          {t("loadingProduct")}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, isRTL && styles.errorContainerRTL]}>
        <Text style={[styles.errorTitle, isRTL && styles.errorTitleRTL]}>
          {t("errorLoadingProduct")}
        </Text>
        <Text style={[styles.errorText, isRTL && styles.errorTextRTL]}>
          {error instanceof Error ? error.message : t("failedToLoadProduct")}
        </Text>
        <Pressable
          style={[styles.retryButton, isRTL && styles.retryButtonRTL]}
          onPress={() => router.back()}
        >
          <Text style={[styles.retryButtonText, isRTL && styles.retryButtonTextRTL]}>
            {t("goBack")}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.errorContainer, isRTL && styles.errorContainerRTL]}>
        <Text style={[styles.errorTitle, isRTL && styles.errorTitleRTL]}>
          {t("productNotFound")}
        </Text>
        <Text style={[styles.errorText, isRTL && styles.errorTextRTL]}>
          {t("productNotFoundMessage")}
        </Text>
        <Pressable
          style={[styles.retryButton, isRTL && styles.retryButtonRTL]}
          onPress={() => router.back()}
        >
          <Text style={[styles.retryButtonText, isRTL && styles.retryButtonTextRTL]}>
            {t("goBack")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const isProductAvailable = getSelectedVariant
    ? getSelectedVariant.availableForSale
    : product.isSaleable;

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.imageScrollView}
          >
            {images.length > 0 ? (
              images.map((imageUrl: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  priority="high"
                />
              ))
            ) : (
              <View style={[styles.image, styles.placeholderImage]} />
            )}
          </ScrollView>

          {images.length > 1 && (
            <View style={[styles.pagination, isRTL && styles.paginationRTL]}>
              {images.map((_: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Header Actions */}
          <SafeAreaView
            style={[styles.headerActions, isRTL && styles.headerActionsRTL]}
            edges={["top"]}
          >
            <Pressable
              style={styles.actionButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft
                size={24}
                color={Colors.black}
                style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
              />
            </Pressable>
            <View style={[styles.headerRightActions, isRTL && styles.headerRightActionsRTL]}>
              <Pressable
                style={styles.actionButton}
                onPress={() => toggleWishlist(product)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={26}
                  color={isInWishlist(product.id) ? Colors.error : Colors.text}
                  fill={isInWishlist(product.id) ? Colors.error : "transparent"}
                />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Discount Badge */}
          {hasDiscount && (
            <View style={[styles.discountBadge, isRTL && styles.discountBadgeRTL]}>
              <Text style={[styles.discountBadgeText, isRTL && styles.discountBadgeTextRTL]}>
                -{discountPercentage}%
              </Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={[styles.detailsContainer, isRTL && styles.detailsContainerRTL]}>
          {/* Brand and Name */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <View style={[styles.headerLeft, isRTL && styles.headerLeftRTL]}>
              {brand && (
                <Text style={[styles.brand, isRTL && styles.brandRTL]}>
                  {brand}
                </Text>
              )}
              <Text style={[styles.name, isRTL && styles.nameRTL]}>
                {product.name}
              </Text>
            </View>
            <View style={[styles.priceContainer, isRTL && styles.priceContainerRTL]}>
              {hasDiscount && (
                <Text style={[styles.compareAtPrice, isRTL && styles.compareAtPriceRTL]}>
                  {formatPrice(comparePrice)}
                </Text>
              )}
              <Text style={[styles.price, isRTL && styles.priceRTL]}>
                {formatPrice(price)}
              </Text>
            </View>
          </View>

          {/* Rating */}
          <View style={[styles.ratingSection, isRTL && styles.ratingSectionRTL]}>
            <View style={[styles.ratingContainer, isRTL && styles.ratingContainerRTL]}>
              <Star size={16} color={Colors.primary} fill={Colors.primary} />
              <Text style={[styles.ratingText, isRTL && styles.ratingTextRTL]}>
                {(() => {
                  const rating = product?.averageRating;
                  if (rating === null || rating === undefined) return "0.0";
                  const numericRating = typeof rating === "string" ? parseFloat(rating) : rating;
                  if (typeof numericRating === "number" && !isNaN(numericRating)) {
                    return numericRating.toFixed(1);
                  }
                  return "0.0";
                })()}
              </Text>
            </View>
            <Text style={[styles.reviewCount, isRTL && styles.reviewCountRTL]}>
              ({product.reviewCount || 0} {t("reviews")})
            </Text>
          </View>

          {/* SKU */}
          {product.sku && (
            <View style={[styles.skuContainer, isRTL && styles.skuContainerRTL]}>
              <Text style={[styles.skuLabel, isRTL && styles.skuLabelRTL]}>
                {t("sku")}:
              </Text>
              <Text style={[styles.skuValue, isRTL && styles.skuValueRTL]}>
                {product.sku}
              </Text>
            </View>
          )}

          {/* Availability */}
          <View style={[styles.availabilityContainer, isRTL && styles.availabilityContainerRTL]}>
            <View
              style={[
                styles.availabilityDot,
                {
                  backgroundColor: isProductAvailable
                    ? Colors.success
                    : Colors.error,
                },
              ]}
            />
            <Text style={[styles.availabilityText, isRTL && styles.availabilityTextRTL]}>
              {isProductAvailable ? t("inStock") : t("outOfStock")}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
              {t("description")}
            </Text>
            <Text style={[styles.description, isRTL && styles.descriptionRTL]}>
              {stripHtmlTags(
                product.shortDescription ||
                  product.description ||
                  t("noDescription"),
              )}
            </Text>
          </View>

          {/* Variants */}
          {hasVariants &&
            product.configutableData.attributes.map((attribute: any) => (
              <View key={attribute.id} style={styles.section}>
                <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                  {attribute.label}
                </Text>
                <View style={[styles.optionValues, isRTL && styles.optionValuesRTL]}>
                  {attribute.options?.map((option: any) => {
                    const isSelected = selectedOptions[attribute.code] === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        style={[
                          styles.optionValue,
                          isSelected && styles.optionValueSelected,
                        ]}
                        onPress={() => {
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [attribute.code]: option.id,
                          }));
                        }}
                      >
                        <Text
                          style={[
                            styles.optionValueText,
                            isSelected && styles.optionValueTextSelected,
                            isRTL && styles.optionValueTextRTL,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

          {/* Customizable Options */}
          {hasCustomizableOptions && (
            <View style={styles.section}>
              <CustomizableOptions
                options={productWithOptions.customizableOptions || []}
                onOptionsChange={(selected, totalPrice) => {
                  setSelectedCustomizableOptions(selected);
                  setCustomizableTotalPrice(totalPrice);
                }}
                basePrice={basePrice}
              />
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
              {t("quantity")}
            </Text>
            <View style={[styles.quantitySelector, isRTL && styles.quantitySelectorRTL]}>
              <Pressable
                style={[
                  styles.quantityButton,
                  quantity <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus
                  size={20}
                  color={quantity <= 1 ? Colors.textSecondary : Colors.text}
                />
              </Pressable>
              <Text style={[styles.quantityText, isRTL && styles.quantityTextRTL]}>
                {quantity}
              </Text>
              <Pressable
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus size={20} color={Colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Additional Information */}
          {product.additionalData?.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                {t("additionalInfo")}
              </Text>
              <View style={[styles.additionalDataContainer, isRTL && styles.additionalDataContainerRTL]}>
                {product.additionalData.map((item: any) => (
                  <View
                    key={item.id}
                    style={[styles.additionalDataItem, isRTL && styles.additionalDataItemRTL]}
                  >
                    <Text style={[styles.additionalDataLabel, isRTL && styles.additionalDataLabelRTL]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.additionalDataValue, isRTL && styles.additionalDataValueRTL]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reviews */}
          {product.reviews?.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                {t("customerReviews")}
              </Text>
              {product.reviews.slice(0, 3).map((review: any) => (
                <View key={review.id} style={[styles.reviewItem, isRTL && styles.reviewItemRTL]}>
                  <View style={[styles.reviewHeader, isRTL && styles.reviewHeaderRTL]}>
                    <Text style={[styles.reviewAuthor, isRTL && styles.reviewAuthorRTL]}>
                      {review.name || t("anonymous")}
                    </Text>
                    <View style={[styles.reviewRating, isRTL && styles.reviewRatingRTL]}>
                      <Star size={14} color={Colors.primary} fill={Colors.primary} />
                      <Text style={[styles.reviewRatingText, isRTL && styles.reviewRatingTextRTL]}>
                        {review.rating}
                      </Text>
                    </View>
                  </View>
                  {review.title && (
                    <Text style={[styles.reviewTitle, isRTL && styles.reviewTitleRTL]}>
                      {review.title}
                    </Text>
                  )}
                  <Text style={[styles.reviewComment, isRTL && styles.reviewCommentRTL]}>
                    {review.comment}
                  </Text>
                  <Text style={[styles.reviewDate, isRTL && styles.reviewDateRTL]}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Related Products */}
          {allRelatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                {t("relatedProducts")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.relatedScrollContent, isRTL && styles.relatedScrollContentRTL]}
              >
                {allRelatedProducts.map((relatedProduct: any) => {
                  const relatedPrice = parseFloat(
                    relatedProduct.priceHtml?.finalPrice || "0",
                  );
                  const relatedComparePrice = parseFloat(
                    relatedProduct.priceHtml?.regularPrice || "0",
                  );
                  const relatedHasDiscount = relatedComparePrice > relatedPrice;
                  const relatedImage = relatedProduct.images?.[0]?.url || "";
                  const relatedBrand = getBrand(relatedProduct);

                  return (
                    <Pressable
                      key={relatedProduct.id}
                      style={[styles.relatedProductCard, isRTL && styles.relatedProductCardRTL]}
                      onPress={() => {
                        router.push(`/product/${encodeURIComponent(relatedProduct.id)}`);
                      }}
                    >
                      {relatedImage ? (
                        <Image
                          source={{ uri: relatedImage }}
                          style={styles.relatedProductImage}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View style={[styles.relatedProductImage, styles.placeholderImage]} />
                      )}

                      {relatedHasDiscount && (
                        <View style={[styles.relatedDiscountBadge, isRTL && styles.relatedDiscountBadgeRTL]}>
                          <Text style={[styles.relatedDiscountBadgeText, isRTL && styles.relatedDiscountBadgeTextRTL]}>
                            -
                            {Math.round(
                              ((relatedComparePrice - relatedPrice) /
                                relatedComparePrice) *
                                100,
                            )}
                            %
                          </Text>
                        </View>
                      )}

                      <View style={[styles.relatedProductInfo, isRTL && styles.relatedProductInfoRTL]}>
                        {relatedBrand && (
                          <Text
                            style={[styles.relatedProductBrand, isRTL && styles.relatedProductBrandRTL]}
                            numberOfLines={1}
                          >
                            {relatedBrand}
                          </Text>
                        )}
                        <Text
                          style={[styles.relatedProductName, isRTL && styles.relatedProductNameRTL]}
                          numberOfLines={2}
                        >
                          {relatedProduct.name}
                        </Text>
                        <View style={[styles.relatedPriceContainer, isRTL && styles.relatedPriceContainerRTL]}>
                          {relatedHasDiscount && (
                            <Text style={[styles.relatedCompareAtPrice, isRTL && styles.relatedCompareAtPriceRTL]}>
                              {formatPrice(relatedComparePrice)}
                            </Text>
                          )}
                          <Text style={[styles.relatedProductPrice, isRTL && styles.relatedProductPriceRTL]}>
                            {formatPrice(relatedPrice)}
                          </Text>
                        </View>
                        <View style={[styles.relatedAvailability, isRTL && styles.relatedAvailabilityRTL]}>
                          <View
                            style={[
                              styles.relatedAvailabilityDot,
                              {
                                backgroundColor: relatedProduct.isSaleable
                                  ? Colors.success
                                  : Colors.error,
                              },
                            ]}
                          />
                          <Text style={[styles.relatedAvailabilityText, isRTL && styles.relatedAvailabilityTextRTL]}>
                            {relatedProduct.isSaleable ? t("inStock") : t("outOfStock")}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Add to Cart Button */}
      <SafeAreaView style={[styles.footer, isRTL && styles.footerRTL]} edges={["bottom"]}>
        <Pressable
          style={[
            styles.addToCartButton,
            addedToCart && styles.addedToCartButton,
            !isProductAvailable && styles.addToCartButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={!isProductAvailable}
        >
          <Text style={[styles.addToCartButtonText, isRTL && styles.addToCartButtonTextRTL]}>
            {!isProductAvailable
              ? t("outOfStock")
              : addedToCart
                ? t("addedToCart")
                : t("addToCart")}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

// Styles with RTL support
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerRTL: {
    direction: "rtl",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingContainerRTL: {},
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingTextRTL: {
    textAlign: "right",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  errorContainerRTL: {},
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.error,
    marginBottom: 12,
  },
  errorTitleRTL: {
    textAlign: "right",
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  errorTextRTL: {
    textAlign: "right",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonRTL: {},
  retryButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  retryButtonTextRTL: {
    textAlign: "left",
    // backgroundColor: Colors.lightGray,
  },
  imageContainer: {
    width: "100%",
    height: 380,
    backgroundColor: Colors.cardBackground,
    position: "relative",
    overflow: "visible", // Make sure this is not 'hidden'
  },
  imageScrollView: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: SCREEN_WIDTH,
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  pagination: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  paginationRTL: {
    // flexDirection: "row-reverse",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    opacity: 0.5,
  },
  paginationDotActive: {
    width: 24,
    opacity: 1,
  },
  headerActions: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 1000, // High zIndex to ensure it's above everything
  },
  headerActionsRTL: {
    // flexDirection: "row-reverse",
  },
  headerRightActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerRightActionsRTL: {
    // flexDirection: "row-reverse",
    // alignSelf: "flex-end",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  discountBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountBadgeRTL: {
    left: undefined,
    right: 20,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  discountBadgeTextRTL: {
    textAlign: "left",
  },
  detailsContainer: {
    padding: 20,
  },
  detailsContainerRTL: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerRTL: {
    // flexDirection: "row-reverse",
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerLeftRTL: {
    marginRight: 0,
    marginLeft: 16,
  },
  brand: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  brandRTL: {
    textAlign: "left",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 32,
  },
  nameRTL: {
    textAlign: "left",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceContainerRTL: {
    alignItems: "flex-start",
  },
  compareAtPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  compareAtPriceRTL: {
    textAlign: "left",
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
  },
  priceRTL: {
    textAlign: "left",
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingSectionRTL: {
    // flexDirection: "row-reverse",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  ratingContainerRTL: {
    marginRight: 0,
    marginLeft: 8,
    // flexDirection: "row-reverse",
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 6,
  },
  ratingTextRTL: {
    marginLeft: 0,
    marginRight: 6,
    textAlign: "left",
  },
  reviewCount: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  reviewCountRTL: {
    textAlign: "left",
  },
  skuContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  skuContainerRTL: {
    // flexDirection: "row-reverse",
  },
  skuLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginRight: 8,
  },
  skuLabelRTL: {
    marginRight: 0,
    marginLeft: 8,
    textAlign: "left",
  },
  skuValue: {
    fontSize: 14,
    color: Colors.text,
  },
  skuValueRTL: {
    textAlign: "left",
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  availabilityContainerRTL: {
    // flexDirection: "row-reverse",
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: Colors.text,
  },
  availabilityTextRTL: {
    textAlign: "left",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  sectionTitleRTL: {
    textAlign: "left",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
  },
  descriptionRTL: {
    textAlign: "left",
  },
  optionValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionValuesRTL: {
    // flexDirection: "row-reverse",
  },
  optionValue: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionValueSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  optionValueTextSelected: {
    color: Colors.white,
  },
  optionValueTextRTL: {
    textAlign: "right",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  quantitySelectorRTL: {
    alignSelf: "flex-start",
    // flexDirection: "row-reverse",
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginHorizontal: 24,
    minWidth: 32,
    textAlign: "center",
  },
  quantityTextRTL: {},
  additionalDataContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  additionalDataContainerRTL: {},
  additionalDataItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  additionalDataItemRTL: {
    // flexDirection: "row-reverse",
  },
  additionalDataLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    width: 100,
    marginRight: 12,
  },
  additionalDataLabelRTL: {
    marginRight: 0,
    marginLeft: 12,
    textAlign: "left",
  },
  additionalDataValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  additionalDataValueRTL: {
    textAlign: "left",
  },
  reviewItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewItemRTL: {},
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  reviewAuthorRTL: {
    textAlign: "right",
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewRatingRTL: {
    flexDirection: "row-reverse",
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 4,
  },
  reviewRatingTextRTL: {
    marginLeft: 0,
    marginRight: 4,
    textAlign: "left",
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  reviewTitleRTL: {
    textAlign: "left",
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewCommentRTL: {
    textAlign: "left",
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewDateRTL: {
    textAlign: "left",
  },
  relatedScrollContent: {
    gap: 12,
  },
  relatedScrollContentRTL: {
    // flexDirection: "row-reverse",
  },
  relatedProductCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  relatedProductCardRTL: {},
  relatedProductImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  relatedDiscountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  relatedDiscountBadgeRTL: {
    left: undefined,
    right: 8,
  },
  relatedDiscountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  relatedDiscountBadgeTextRTL: {
    textAlign: "left",
  },
  relatedProductInfo: {
    padding: 10,
  },
  relatedProductInfoRTL: {
    alignItems: "flex-start",
  },
  relatedProductBrand: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  relatedProductBrandRTL: {
    textAlign: "left",
  },
  relatedProductName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
    height: 32,
  },
  relatedProductNameRTL: {
    textAlign: "left",
  },
  relatedPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  relatedPriceContainerRTL: {
    // flexDirection: "row-reverse",
  },
  relatedCompareAtPrice: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  relatedCompareAtPriceRTL: {
    textAlign: "left",
  },
  relatedProductPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  relatedProductPriceRTL: {
    textAlign: "left",
  },
  relatedAvailability: {
    flexDirection: "row",
    alignItems: "center",
  },
  relatedAvailabilityRTL: {
    // flexDirection: "row-reverse",
  },
  relatedAvailabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  relatedAvailabilityText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  relatedAvailabilityTextRTL: {
    textAlign: "left",
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Platform.select({
      web: {},
      default: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
      },
    }),
  },
  footerRTL: {},
  addToCartButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  addedToCartButton: {
    backgroundColor: Colors.success,
  },
  addToCartButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  addToCartButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
  addToCartButtonTextRTL: {
    textAlign: "left",
  },
});
