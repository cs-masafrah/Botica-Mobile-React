import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart, Minus, Plus, Star } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ProductVariant } from '@/types/product';
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
import { useShopifyProduct, useShopifyProductsByCategory } from '@/contexts/ShopifyContext';
import { formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, error } = useShopifyProduct(id || '');
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  
  const relatedProducts = useShopifyProductsByCategory(product?.category || '');
  const filteredRelatedProducts = relatedProducts.filter(p => p.id !== id).slice(0, 5);

  console.log('ProductDetailScreen - ID:', id);
  console.log('ProductDetailScreen - Loading:', isLoading);
  console.log('ProductDetailScreen - Product:', product);
  console.log('ProductDetailScreen - Error:', error);

  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const firstVariant = product.variants.find((v: any) => v.availableForSale) || product.variants[0];
      setSelectedVariant(firstVariant);
      
      const initialOptions: Record<string, string> = {};
      firstVariant.selectedOptions.forEach((opt: any) => {
        initialOptions[opt.name] = opt.value;
      });
      setSelectedOptions(initialOptions);
    }
  }, [product]);

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

  const handleAddToCart = () => {
    if (selectedVariant) {
      const productWithVariant = {
        ...product,
        price: selectedVariant.price,
        variantId: selectedVariant.id,
      };
      addToCart(productWithVariant, quantity);
    } else {
      addToCart(product, quantity);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleOptionSelect = (optionName: string, value: string) => {
    const newSelectedOptions = {
      ...selectedOptions,
      [optionName]: value,
    };
    setSelectedOptions(newSelectedOptions);

    const variant = product.variants?.find((v: any) => {
      return v.selectedOptions.every((opt: any) => 
        newSelectedOptions[opt.name] === opt.value
      );
    });

    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayCompareAtPrice = selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice;
  const displayCurrency = selectedVariant ? selectedVariant.currencyCode : product.currencyCode;
  const isAvailable = selectedVariant ? selectedVariant.availableForSale : product.inStock;
  const hasDiscount = displayCompareAtPrice && displayCompareAtPrice > displayPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((displayCompareAtPrice! - displayPrice) / displayCompareAtPrice!) * 100)
    : 0;

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveImageIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            {product.images.map((imageUrl: string, index: number) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
              />
            ))}
          </ScrollView>
          {product.images.length > 1 && (
            <View style={styles.pagination}>
              {product.images.map((_: string, index: number) => (
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

          <SafeAreaView style={styles.headerActions} edges={['top']}>
            <Pressable style={styles.actionButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <Pressable 
              style={styles.actionButton} 
              onPress={() => product && toggleWishlist(product)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart 
                size={26} 
                color={product && isInWishlist(product.id) ? Colors.error : Colors.text}
                fill={product && isInWishlist(product.id) ? Colors.error : 'transparent'}
              />
            </Pressable>
          </SafeAreaView>
        </View>

        <ShippingStrip />

        <View style={styles.detailsContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.brand}>{product.brand}</Text>
              <Text style={styles.name}>{product.name}</Text>
            </View>
            <View style={styles.priceContainer}>
              {displayCompareAtPrice && displayCompareAtPrice > displayPrice && (
                <Text style={styles.compareAtPrice}>{formatPrice(displayCompareAtPrice, displayCurrency)}</Text>
              )}
              <Text style={styles.price}>{formatPrice(displayPrice, displayCurrency)}</Text>
              {hasDiscount && (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>-{discountPercentage}% OFF</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.ratingSection}>
            <View style={styles.ratingContainer}>
              <Star size={16} color={Colors.primary} fill={Colors.primary} />
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
            <Text style={styles.reviewCount}>({product.reviewCount} reviews)</Text>
          </View>

          {product.smellslike && (
            <View style={styles.smellslikeContainer}>
              <Text style={styles.smellslikeTitle}>Smells Like</Text>
              <Text style={styles.smellslikeText}>{product.smellslike}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {product.options && product.options.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Options</Text>
              {product.options.map((option: any) => (
                <View key={option.id} style={styles.optionContainer}>
                  <View style={styles.optionValues}>
                    {option.values.map((value: string) => {
                      const isSelected = selectedOptions[option.name] === value;
                      return (
                        <Pressable
                          key={value}
                          style={[
                            styles.optionValue,
                            isSelected && styles.optionValueSelected,
                          ]}
                          onPress={() => handleOptionSelect(option.name, value)}
                        >
                          <Text
                            style={[
                              styles.optionValueText,
                              isSelected && styles.optionValueTextSelected,
                            ]}
                          >
                            {value}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {(product.collectionName || product.category) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Collection</Text>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{product.collectionName || product.category}</Text>
              </View>
            </View>
          )}

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

          {filteredRelatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Related Products</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScrollContent}
              >
                {filteredRelatedProducts.map((relatedProduct) => (
                  <Pressable
                    key={relatedProduct.id}
                    style={styles.relatedProductCard}
                    onPress={() => {
                      router.push(`/product/${encodeURIComponent(relatedProduct.id)}`);
                    }}
                  >
                    <Image
                      source={{ uri: relatedProduct.images[0] }}
                      style={styles.relatedProductImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.relatedProductInfo}>
                      <Text style={styles.relatedProductName} numberOfLines={1}>
                        {relatedProduct.name}
                      </Text>
                      <View style={styles.relatedPriceContainer}>
                        {relatedProduct.compareAtPrice && relatedProduct.compareAtPrice > relatedProduct.price && (
                          <Text style={styles.relatedCompareAtPrice}>
                            {formatPrice(relatedProduct.compareAtPrice, relatedProduct.currencyCode)}
                          </Text>
                        )}
                        <Text style={styles.relatedProductPrice}>
                          {formatPrice(relatedProduct.price, relatedProduct.currencyCode)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <Pressable
          style={[
            styles.addToCartButton,
            addedToCart && styles.addedToCartButton,
            !isAvailable && styles.addToCartButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={!isAvailable}
        >
          <Text style={styles.addToCartButtonText}>
            {!isAvailable ? 'Out of Stock' : addedToCart ? 'Added to Cart!' : 'Add to Cart'}
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    marginLeft: 16,
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
    marginBottom: 24,
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
  categoryTag: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
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
  optionContainer: {
    marginBottom: 16,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
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
  addToCartButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  smellslikeContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start' as const,
  },
  smellslikeTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginRight: 8,
  },
  smellslikeText: {
    fontSize: 13,
    color: Colors.text,
  },
  relatedScrollContent: {
    gap: 12,
  },
  relatedProductCard: {
    width: 140,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  relatedProductImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover' as const,
  },
  relatedProductInfo: {
    padding: 10,
  },
  relatedProductName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  relatedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
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

  priceBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-end' as const,
  },
  priceBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
});
