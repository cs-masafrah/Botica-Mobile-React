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
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';
import { useProductById } from '../hooks/useProductById';
import { useProductsByCategory } from '../hooks/useProductsByCategory';
import { Product } from '@/types/product';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, error } = useProductById(id || '');
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get category from additionalData
  const categoryId = product?.additionalData?.find(
    (item: any) => item.label === 'Category'
  )?.value;
  
  // Fetch related products by category
  const { data: categoryProductsData } = useProductsByCategory(categoryId || '');
  
  // Extract brand from additionalData
  const brand = product?.additionalData?.find(
    (item: any) => item.label === 'Brand'
  )?.value || '';

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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

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

  React.useEffect(() => {
    // Initialize selected options if variants exist
    if (hasVariants) {
      const initialOptions: Record<string, string> = {};
      product.configutableData.attributes.forEach((attr: any) => {
        if (attr.options.length > 0) {
          initialOptions[attr.code] = attr.options[0].id;
        }
      });
      setSelectedOptions(initialOptions);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;

    const cartProduct: any = {
      id: product.id,
      name: product.name,
      description: stripHtmlTags(product.shortDescription || product.description || ''),
      price: product.priceHtml?.finalPrice || 0,
      compareAtPrice: product.priceHtml?.regularPrice || 0,
      currencyCode: 'USD',
      image: images[0] || '',
      images: images,
      brand: brand,
      rating: product.averageRating || 0,
      reviewCount: product.reviews?.length || 0,
      inStock: product.isSaleable,
      category: '',
      tags: [],
      options: (product as any).configutableData?.attributes?.map((attr: any) => ({
        id: attr.id,
        name: attr.label,
        values: attr.options.map((opt: any) => opt.label)
      })) || [],
      variants: product.variants || [],
      selectedOptions: selectedOptions,
    };

    addToCart(cartProduct, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveImageIndex(index);
  };

  if (isLoading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loading...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Text style={[styles.errorText, { fontSize: 12, marginTop: 8 }]}>ID: {id}</Text>
        {error && <Text style={[styles.errorText, { fontSize: 12, marginTop: 8 }]}>{String(error)}</Text>}
      </View>
    );
  }

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

        <ShippingStrip />

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
              <Text style={styles.ratingText}>{product.averageRating || '0.0'}</Text>
            </View>
            <Text style={styles.reviewCount}>({product.reviews?.length || 0} reviews)</Text>
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
              { backgroundColor: product.isSaleable ? Colors.success : Colors.error }
            ]} />
            <Text style={styles.availabilityText}>
              {product.isSaleable ? 'In Stock' : 'Out of Stock'}
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
                {attribute.options.map((option: any) => {
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
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={20} color={Colors.text} />
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
                    <Text style={styles.reviewAuthor}>{review.title}</Text>
                    <View style={styles.reviewRating}>
                      <Star size={14} color={Colors.primary} fill={Colors.primary} />
                      <Text style={styles.reviewRatingText}>{review.rating}</Text>
                    </View>
                  </View>
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
                        <Text style={styles.relatedProductName} numberOfLines={1}>
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
            !product.isSaleable && styles.addToCartButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={!product.isSaleable}
        >
          <Text style={styles.addToCartButtonText}>
            {!product.isSaleable ? 'Out of Stock' : addedToCart ? 'Added to Cart!' : 'Add to Cart'}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
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