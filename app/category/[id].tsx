import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Heart, Plus, Check } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import Colors from '@/constants/colors';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';
import { useProductsByCategory } from '../hooks/useProductsByCategory';

export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { data, isLoading } = useProductsByCategory(id);
  const products = data?.allProducts?.data || [];
  
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Extract tags from Bagisto product data
  const allTags = useMemo(() => {
    if (!products || products.length === 0) return ['All'];
    const tags = new Set<string>();
    products.forEach((product: any) => {
      // Bagisto might have tags in additionalData or as a separate field
      // Adjust based on your actual data structure
      if (product.tags) {
        product.tags.forEach((tag: string) => tags.add(tag));
      }
      // You can also extract from additionalData if tags are stored there
      product.additionalData?.forEach((item: any) => {
        if (item.label.toLowerCase() === 'tags' || item.type === 'tags') {
          const productTags = item.value.split(',').map((tag: string) => tag.trim());
          productTags.forEach((tag: string) => tags.add(tag));
        }
      });
    });
    return ['All', ...Array.from(tags).filter(Boolean).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products || selectedTag === 'All') return products;
    
    return products.filter((product: any) => {
      // Check in tags array
      if (product.tags?.includes(selectedTag)) return true;
      
      // Check in additionalData
      const tagData = product.additionalData?.find(
        (item: any) => item.label.toLowerCase() === 'tags' || item.type === 'tags'
      );
      if (tagData) {
        const productTags = tagData.value.split(',').map((tag: string) => tag.trim());
        return productTags.includes(selectedTag);
      }
      
      return false;
    });
  }, [products, selectedTag]);

  const handleAddToCart = (product: any) => {
    // Convert Bagisto product to your Product type
    const cartProduct: Product = {
      id: product.id,
      name: product.name,
      description: product.shortDescription || product.description,
      price: parseFloat(product.priceHtml?.finalPrice) || 0,
      compareAtPrice: parseFloat(product.priceHtml?.regularPrice) || 0,
      currencyCode: 'USD', // Adjust based on your currency
      image: product.images?.[0]?.url || '',
      images: product.images?.map((img: any) => img.url) || [],
      brand: '', // Extract from additionalData if available
      rating: product.averageRating || 0,
      reviewCount: product.reviews?.length || 0,
      inStock: product.isSaleable || true,
      category: '', // You might need to extract this
      tags: product.tags || [],
      options: [], // Bagisto might have variants in a different structure
      variants: [], // Adjust based on your Bagisto product structure
    };
    
    addToCart(cartProduct, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 600);
  };

  const toggleProductWishlist = (product: any) => {
    const wishlistProduct: Product = {
      id: product.id,
      name: product.name,
      description: product.shortDescription || product.description,
      price: parseFloat(product.priceHtml?.finalPrice) || 0,
      compareAtPrice: parseFloat(product.priceHtml?.regularPrice) || 0,
      currencyCode: 'USD',
      image: product.images?.[0]?.url || '',
      images: product.images?.map((img: any) => img.url) || [],
      brand: '',
      rating: product.averageRating || 0,
      reviewCount: product.reviews?.length || 0,
      inStock: product.isSaleable || true,
      category: '',
      tags: product.tags || [],
      options: [],
      variants: [],
    };
    
    toggleWishlist(wishlistProduct);
  };

  const renderProduct = (item: any, index: number) => {
    const productPrice = parseFloat(item.priceHtml?.finalPrice) || 0;
    const comparePrice = parseFloat(item.priceHtml?.regularPrice) || 0;
    const inWishlist = isInWishlist(item.id);
    const hasDiscount = comparePrice > productPrice;
    const discountPercentage = hasDiscount 
      ? Math.round(((comparePrice - productPrice) / comparePrice) * 100)
      : 0;
    const isAdded = addedProductId === item.id;
    const mainImage = item.images?.[0]?.url || '';

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
      >
        <View style={styles.imageContainer}>
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]} />
          )}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
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
              fill={inWishlist ? Colors.error : 'transparent'}
            />
          </Pressable>
          <Pressable 
            style={[styles.addToCartButton, isAdded && styles.addToCartButtonSuccess]}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isAdded ? (
              <Check 
                size={13} 
                color={Colors.white}
                strokeWidth={3}
              />
            ) : (
              <Plus 
                size={13} 
                color={Colors.white}
                strokeWidth={3}
              />
            )}
          </Pressable>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.brandText} numberOfLines={1}>
            {/* Extract brand from additionalData if available */}
            {item.additionalData?.find((data: any) => data.label === 'Brand')?.value || ''}
          </Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ {item.averageRating || 0}</Text>
            {item.reviews?.length > 0 && (
              <Text style={styles.reviewCount}>({item.reviews.length})</Text>
            )}
          </View>
          <View style={styles.priceRow}>
            {hasDiscount && (
              <Text style={styles.compareAtPriceText}>
                {formatPrice(comparePrice, 'USD')}
              </Text>
            )}
            <Text style={styles.priceText}>
              {formatPrice(productPrice, 'USD')}
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
          title: name || 'Category',
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
          <Text style={styles.loadingText}>Loading products...</Text>
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
                <Text style={styles.emptyText}>No products found in this category</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');
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
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative' as const,
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: Colors.cardBackground,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addToCartButton: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonSuccess: {
    backgroundColor: '#10B981',
  },
  productInfo: {
    padding: 12,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  compareAtPriceText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  discountBadge: {
    position: 'absolute' as const,
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
    fontWeight: '700' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderBottomColor: Colors.border || '#E5E5E5',
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
    borderColor: Colors.border || '#E5E5E5',
  },
  tagButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tagTextActive: {
    color: Colors.white,
  },
});