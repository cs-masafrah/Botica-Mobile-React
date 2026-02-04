// app/product/[id].tsx
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart, Minus, Plus, Star } from 'lucide-react-native';
import React, { useRef, useState, useMemo } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';
import { useBagistoProductById } from '../hooks/useBagistoProductById';
import { useBagistoProductsByCategory } from '../hooks/useBagistoProductsByCategory';
import { Alert } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

// Helper to get brand from product
const getBrand = (product: any): string => {
  return product?.brand || 
    product?.additionalData?.find((item: any) => 
      item.label === 'Brand' || item.code === 'brand'
    )?.value || '';
};

// Helper to get category ID from product
const getCategoryId = (product: any): string => {
  return product?.categories?.[0]?.id || '';
};

// Helper to get tags from product
const getTags = (product: any): string[] => {
  const tagsData = product?.additionalData?.find(
    (data: any) => data.label.toLowerCase() === 'tags' || data.type === 'tags'
  );
  if (tagsData?.value) {
    return tagsData.value.split(',').map((tag: string) => tag.trim());
  }
  return product?.tags || [];
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, error } = useBagistoProductById(id);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get category ID for related products
  const categoryId = getCategoryId(product);
  
  // Fetch related products by category
  const { data: categoryProductsData } = useBagistoProductsByCategory(categoryId);
  
  // Extract brand
  const brand = getBrand(product);

  // Extract price information
  const price = parseFloat(product?.priceHtml?.finalPrice || '0');
  const comparePrice = parseFloat(product?.priceHtml?.regularPrice || '0');
  const hasDiscount = comparePrice > price;
  const discountPercentage = hasDiscount 
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  // Handle images
  const images = product?.images?.map((img: any) => img.url) || [];

  // Handle variants if available
  const hasVariants = product?.configutableData?.attributes?.length > 0;

  // Get related products from multiple sources
  const allRelatedProducts = useMemo(() => {
    if (!product) return [];
    
    const relatedProductsFromAPI = product.relatedProducts || [];
    const categoryRelatedProducts = categoryProductsData?.allProducts?.data || [];
    
    // Combine both sources, remove current product and duplicates
    const combined = [...relatedProductsFromAPI, ...categoryRelatedProducts]
      .filter((product: any, index: number, self: any[]) => 
        product?.id && // Make sure product has ID
        product.id !== id && // Remove current product
        index === self.findIndex((p: any) => p?.id === product.id) // Remove duplicates
      )
      .slice(0, 8); // Limit to 8 products
    
    return combined;
  }, [product, categoryProductsData, id]);

  // Initialize selected options for variants
  React.useEffect(() => {
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
        const selectedOption = attr.options.find((opt: any) => opt.id === selectedOptionId);
        const variantAttribute = variant.selectedOptions.find(
          (opt: any) => opt.name === attr.code
        );
        return variantAttribute?.value === selectedOption?.label;
      });
    });
  }, [product, selectedOptions, hasVariants]);

  // const handleAddToCart = () => {
  //   if (!product) return;

  //   // Use selected variant if available, otherwise use main product
  //   const selectedVariant = getSelectedVariant;
  //   const productToAdd = selectedVariant || product;

  //   const cartProduct: any = {
  //     id: productToAdd.id,
  //     name: product.name,
  //     description: stripHtmlTags(product.shortDescription || product.description || ''),
  //     price: parseFloat(productToAdd.price || product.priceHtml?.finalPrice || '0'),
  //     compareAtPrice: parseFloat(productToAdd.compareAtPrice || product.priceHtml?.regularPrice || '0'),
  //     currencyCode: 'USD',
  //     image: selectedVariant?.image || images[0] || '',
  //     images: images,
  //     brand: brand,
  //     rating: product.averageRating || 0,
  //     reviewCount: product.reviewCount || 0,
  //     inStock: productToAdd.availableForSale ?? product.isSaleable,
  //     category: product.category || '',
  //     tags: getTags(product),
  //     options: product.configutableData?.attributes?.map((attr: any) => ({
  //       id: attr.id,
  //       name: attr.label,
  //       values: attr.options.map((opt: any) => opt.label)
  //     })) || [],
  //     variants: product.variants || [],
  //     selectedOptions: selectedOptions,
  //     // Bagisto specific fields for GraphQL API
  //     productId: product.id,
  //     selectedConfigurableOption: selectedVariant?.id,
  //     configurableParams: hasVariants ? Object.entries(selectedOptions).map(([code, optionId]) => {
  //       const attr = product.configutableData.attributes.find((a: any) => a.code === code);
  //       const option = attr?.options.find((opt: any) => opt.id === optionId);
  //       return { [code]: option?.label };
  //     }) : undefined,
  //   };

  //   addToCart(cartProduct, quantity);
  //   setAddedToCart(true);
  //   setTimeout(() => setAddedToCart(false), 2000);
  // };

  const handleAddToCart = async () => {
  if (!product) return;

  // Use selected variant if available, otherwise use main product
  const selectedVariant = getSelectedVariant;
  const productToAdd = selectedVariant || product;

  // Prepare product for Bagisto GraphQL API
  const bagistoProduct: any = {
    // Basic required fields
    id: product.id,
    productId: product.id,
    name: product.name,
    price: parseFloat(productToAdd.price || product.priceHtml?.finalPrice || '0'),
    
    // Bagisto specific fields
    selectedConfigurableOption: selectedVariant?.id,
    variantId: selectedVariant?.id,
  };

  console.log('🛒 [PRODUCT PAGE] Adding to cart:', bagistoProduct);
  
  try {
    const result = await addToCart(bagistoProduct, quantity, selectedOptions);
    
    if (result.success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      
      // Show success message if needed
      console.log('✅ Added to cart:', result.message);
    } else {
      // Show error message
      Alert.alert('Error', result.message || 'Failed to add to cart');
    }
  } catch (error: any) {
    console.error('❌ Error adding to cart:', error);
    Alert.alert('Error', 'Failed to add to cart');
  }
};

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveImageIndex(index);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error Loading Product</Text>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load product'}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorText}>The product you&apos;re looking for doesn&apos;t exist.</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isProductAvailable = getSelectedVariant 
    ? getSelectedVariant.availableForSale 
    : product.isSaleable;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollViewRef}
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
            <View style={styles.pagination}>
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
          <SafeAreaView style={styles.headerActions} edges={['top']}>
            <Pressable style={styles.actionButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <View style={styles.headerRightActions}>
              <Pressable 
                style={styles.actionButton} 
                onPress={() => toggleWishlist(product)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart 
                  size={26} 
                  color={isInWishlist(product.id) ? Colors.error : Colors.text}
                  fill={isInWishlist(product.id) ? Colors.error : 'transparent'}
                />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Discount Badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
            </View>
          )}
        </View>

{/* Product Details */}
<View style={styles.detailsContainer}>
  {/* Brand and Name */}
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      {brand && <Text style={styles.brand}>{brand}</Text>}
      <Text style={styles.name}>{product.name}</Text>
    </View>
    <View style={styles.priceContainer}>
      {hasDiscount && (
        <Text style={styles.compareAtPrice}>
          {formatPrice(comparePrice, 'USD')}
        </Text>
      )}
      <Text style={styles.price}>
        {formatPrice(price, 'USD')}
      </Text>
    </View>
  </View>

{/* Rating */}
<View style={styles.ratingSection}>
  <View style={styles.ratingContainer}>
    <Star size={16} color={Colors.primary} fill={Colors.primary} />
    <Text style={styles.ratingText}>
      {(() => {
        // Safely handle averageRating
        const rating = product?.averageRating;
        if (rating === null || rating === undefined) {
          return '0.0';
        }
        // Convert to number if it's a string
        const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
        // Ensure it's a number and has toFixed method
        if (typeof numericRating === 'number' && !isNaN(numericRating)) {
          return numericRating.toFixed(1);
        }
        return '0.0';
      })()}
    </Text>
  </View>
  <Text style={styles.reviewCount}>({product.reviewCount || 0} reviews)</Text>
</View>

          {/* SKU */}
          {product.sku && (
            <View style={styles.skuContainer}>
              <Text style={styles.skuLabel}>SKU:</Text>
              <Text style={styles.skuValue}>{product.sku}</Text>
            </View>
          )}

          {/* Availability */}
          <View style={styles.availabilityContainer}>
            <View style={[
              styles.availabilityDot,
              { backgroundColor: isProductAvailable ? Colors.success : Colors.error }
            ]} />
            <Text style={styles.availabilityText}>
              {isProductAvailable ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {stripHtmlTags(product.shortDescription || product.description || 'No description available.')}
            </Text>
          </View>

          {/* Variants */}
          {hasVariants && product.configutableData.attributes.map((attribute: any) => (
            <View key={attribute.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{attribute.label}</Text>
              <View style={styles.optionValues}>
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
                        setSelectedOptions(prev => ({
                          ...prev,
                          [attribute.code]: option.id
                        }));
                      }}
                    >
                      <Text
                        style={[
                          styles.optionValueText,
                          isSelected && styles.optionValueTextSelected,
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

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <Pressable
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={20} color={quantity <= 1 ? Colors.textSecondary : Colors.text} />
              </Pressable>
              <Text style={styles.quantityText}>{quantity}</Text>
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
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <View style={styles.additionalDataContainer}>
                {product.additionalData.map((item: any) => (
                  <View key={item.id} style={styles.additionalDataItem}>
                    <Text style={styles.additionalDataLabel}>{item.label}:</Text>
                    <Text style={styles.additionalDataValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reviews */}
          {product.reviews?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              {product.reviews.slice(0, 3).map((review: any) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.name || 'Anonymous'}</Text>
                    <View style={styles.reviewRating}>
                      <Star size={14} color={Colors.primary} fill={Colors.primary} />
                      <Text style={styles.reviewRatingText}>{review.rating}</Text>
                    </View>
                  </View>
                  {review.title && (
                    <Text style={styles.reviewTitle}>{review.title}</Text>
                  )}
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Related Products */}
          {allRelatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Related Products</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScrollContent}
              >
                {allRelatedProducts.map((relatedProduct: any) => {
                  const relatedPrice = parseFloat(relatedProduct.priceHtml?.finalPrice || '0');
                  const relatedComparePrice = parseFloat(relatedProduct.priceHtml?.regularPrice || '0');
                  const relatedHasDiscount = relatedComparePrice > relatedPrice;
                  const relatedImage = relatedProduct.images?.[0]?.url || '';
                  const relatedBrand = getBrand(relatedProduct);

                  return (
                    <Pressable
                      key={relatedProduct.id}
                      style={styles.relatedProductCard}
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
                        <View style={styles.relatedDiscountBadge}>
                          <Text style={styles.relatedDiscountBadgeText}>
                            -{Math.round(((relatedComparePrice - relatedPrice) / relatedComparePrice) * 100)}%
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.relatedProductInfo}>
                        {relatedBrand && (
                          <Text style={styles.relatedProductBrand} numberOfLines={1}>
                            {relatedBrand}
                          </Text>
                        )}
                        <Text style={styles.relatedProductName} numberOfLines={2}>
                          {relatedProduct.name}
                        </Text>
                        <View style={styles.relatedPriceContainer}>
                          {relatedHasDiscount && (
                            <Text style={styles.relatedCompareAtPrice}>
                              {formatPrice(relatedComparePrice, 'USD')}
                            </Text>
                          )}
                          <Text style={styles.relatedProductPrice}>
                            {formatPrice(relatedPrice, 'USD')}
                          </Text>
                        </View>
                        <View style={styles.relatedAvailability}>
                          <View style={[
                            styles.relatedAvailabilityDot,
                            { backgroundColor: relatedProduct.isSaleable ? Colors.success : Colors.error }
                          ]} />
                          <Text style={styles.relatedAvailabilityText}>
                            {relatedProduct.isSaleable ? 'In Stock' : 'Out of Stock'}
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
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <Pressable
          style={[
            styles.addToCartButton,
            addedToCart && styles.addedToCartButton,
            !isProductAvailable && styles.addToCartButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={!isProductAvailable}
        >
          <Text style={styles.addToCartButtonText}>
            {!isProductAvailable ? 'Out of Stock' : addedToCart ? 'Added to Cart!' : 'Add to Cart'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.error,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  imageContainer: {
    width: '100%',
    height: 380,
    backgroundColor: Colors.cardBackground,
    position: 'relative' as const,
  },
  imageScrollView: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
    resizeMode: 'cover' as const,
  },
  placeholderImage: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    position: 'absolute' as const,
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  discountBadge: {
    position: 'absolute' as const,
    top: 20,
    left: 20,
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  detailsContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  brand: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 32,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  compareAtPrice: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through' as const,
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  skuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skuLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  skuValue: {
    fontSize: 14,
    color: Colors.text,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
  },
  optionValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionValue: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionValueSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionValueText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  optionValueTextSelected: {
    color: Colors.white,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start' as const,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginHorizontal: 24,
    minWidth: 32,
    textAlign: 'center' as const,
  },
  additionalDataContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  additionalDataItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  additionalDataLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    width: 100,
    marginRight: 12,
  },
  additionalDataValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  reviewItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginLeft: 4,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  relatedScrollContent: {
    gap: 12,
  },
  relatedProductCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative' as const,
  },
  relatedProductImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover' as const,
  },
  relatedDiscountBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  relatedDiscountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  relatedProductInfo: {
    padding: 10,
  },
  relatedProductBrand: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  relatedProductName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
    height: 32,
  },
  relatedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  relatedCompareAtPrice: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  relatedProductPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  relatedAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
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
  addToCartButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700' as const,
    color: Colors.white,
  },
});