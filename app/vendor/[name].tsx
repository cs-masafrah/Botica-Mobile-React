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
import { useShopifyProductsByVendor } from '@/contexts/ShopifyContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';

export default function VendorScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const products = useShopifyProductsByVendor(name || '');
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach(product => {
      product.tags?.forEach(tag => tags.add(tag));
    });
    return ['All', ...Array.from(tags).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedTag === 'All') return products;
    return products.filter(product => product.tags?.includes(selectedTag));
  }, [products, selectedTag]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 600);
  };

  const renderProduct = (item: Product, index: number) => {
    const inWishlist = isInWishlist(item.id);
    const hasDiscount = item.compareAtPrice && item.compareAtPrice > item.price;
    const discountPercentage = hasDiscount 
      ? Math.round(((item.compareAtPrice! - item.price) / item.compareAtPrice!) * 100)
      : 0;
    const isAdded = addedProductId === item.id;

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.productImage} />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
            </View>
          )}
          <Pressable 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleWishlist(item);
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
          <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ {item.rating}</Text>
          </View>
          <View style={styles.priceRow}>
            {hasDiscount && (
              <Text style={styles.compareAtPriceText}>{formatPrice(item.compareAtPrice!, item.currencyCode)}</Text>
            )}
            <Text style={styles.priceText}>{formatPrice(item.price, item.currencyCode)}</Text>
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
          title: name || 'Vendor',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }} 
      />
      
      {products.length === 0 ? (
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
            key={selectedTag}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found</Text>
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
