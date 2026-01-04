// app/vendor/[name].tsx
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Heart, Plus, Check } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';
import { useProductsByBrand } from '../hooks/useProductsByBrand';

export default function VendorScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { data: productsData, isLoading, error } = useProductsByBrand(name || '');
  
  // Extract products from GraphQL response
  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData.productsByAttribute?.data || [];
  }, [productsData]);

  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Extract tags from categories
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tags.add('All');
    products.forEach(product => {
      if (product.categories?.length > 0) {
        product.categories.forEach(cat => tags.add(cat.name));
      }
    });
    return Array.from(tags);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedTag === 'All') return products;
    return products.filter(product => 
      product.categories?.some(cat => cat.name === selectedTag)
    );
  }, [products, selectedTag]);

  // Helper functions to extract data from attribute values
  const getProductPrice = (product) => {
    if (!product.attributeValues) return 0;
    const priceAttr = product.attributeValues.find(
      attr => attr.attribute?.code === 'price'
    );
    return priceAttr?.floatValue || 0;
  };

  const getProductComparePrice = (product) => {
    if (!product.attributeValues) return null;
    const comparePriceAttr = product.attributeValues.find(
      attr => attr.attribute?.code === 'special_price'
    );
    return comparePriceAttr?.floatValue || null;
  };

  const handleAddToCart = (product) => {
    const price = getProductPrice(product);
    const comparePrice = getProductComparePrice(product);
    
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: price,
      compareAtPrice: comparePrice,
      currencyCode: 'USD',
      image: product.images?.[0]?.url || '',
      brand: name || 'Brand',
      sku: product.sku || '',
      rating: 4.5,
      reviewCount: 0,
      inStock: true,
    };
    
    addToCart(cartProduct, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 600);
  };

  const renderProduct = (product, index: number) => {
    const inWishlist = isInWishlist(product.id);
    const price = getProductPrice(product);
    const comparePrice = getProductComparePrice(product);
    const hasDiscount = comparePrice && comparePrice > price;
    const discountPercentage = hasDiscount 
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;
    const isAdded = addedProductId === product.id;
    const firstImage = product.images?.[0]?.url;

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => router.push({ 
          pathname: '/product/[id]', 
          params: { 
            id: product.id, 
            name: product.name,
          } 
        })}
      >
        <View style={styles.imageContainer}>
          {firstImage ? (
            <Image
              source={{ uri: firstImage }}
              style={styles.productImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          {hasDiscount && discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
            </View>
          )}
          <Pressable 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleWishlist({
                id: product.id,
                name: product.name,
                price: price,
                compareAtPrice: comparePrice,
                currencyCode: 'USD',
                image: firstImage || '',
                brand: name || 'Brand',
              });
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
              handleAddToCart(product);
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
            {name || 'Brand'}
          </Text>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ 4.5</Text>
          </View>
          <View style={styles.priceRow}>
            {hasDiscount && comparePrice && (
              <Text style={styles.compareAtPriceText}>
                {formatPrice(comparePrice, 'USD')}
              </Text>
            )}
            <Text style={styles.priceText}>
              {formatPrice(price, 'USD')}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ShippingStrip />
        <Stack.Screen 
          options={{ 
            title: name || 'Brand',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    console.error('Error in VendorScreen:', error);
    return (
      <View style={styles.container}>
        <ShippingStrip />
        <Stack.Screen 
          options={{ 
            title: name || 'Brand',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }} 
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load products</Text>
          <Text style={styles.errorSubText}>Please try again later</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ShippingStrip />
      <Stack.Screen 
        options={{ 
          title: name || 'Brand',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }} 
      />
      
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found for this brand</Text>
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
            key={selectedTag}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found for this category</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
    justifyContent: 'flex-start',
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
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: 12,
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
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
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