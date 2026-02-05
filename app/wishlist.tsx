import { router } from 'expo-router';
import { Heart, Plus, Check, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatPrice } from '@/utils/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

export default function WishlistScreen() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 600);
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Heart size={48} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptyText}>
            Start adding products you love to your wishlist
          </Text>
          <Pressable
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {items.map((product: any) => {
            // Handle both priceHtml structure (Bagisto) and flat price structure
            const finalPrice = product.priceHtml?.finalPrice ?? product.price ?? 0;
            const regularPrice = product.priceHtml?.regularPrice ?? product.compareAtPrice ?? finalPrice;
            const hasDiscount = regularPrice > finalPrice;
            const discountPercentage = hasDiscount 
              ? Math.round(((regularPrice - finalPrice) / regularPrice) * 100)
              : 0;
            const isAdded = addedProductId === product.id;
            
            // Extract image URL - handle both images array (Bagisto) and direct image property
            const imageUrl = product.images?.[0]?.url || product.image || '';
            
            // Extract brand from additionalData (Bagisto) or direct brand property
            const brand = product.additionalData?.find((data: any) => data.label === 'Brand')?.value || product.brand || '';

            return (
              <Pressable
                key={product.id}
                style={styles.card}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <View style={styles.imageContainer}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.productImage}
                      contentFit="cover"
                      transition={300}
                    />
                  ) : (
                    <View style={[styles.productImage, { backgroundColor: Colors.cardBackground }]} />
                  )}
                  
                  {hasDiscount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
                    </View>
                  )}
                  
                  <Pressable
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={Colors.white} />
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
                      <Check size={15} color={Colors.white} strokeWidth={3} />
                    ) : (
                      <Plus size={15} color={Colors.white} strokeWidth={3} />
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
                    {product.name}
                  </Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>
                      {product.priceHtml?.formattedFinalPrice || formatPrice(finalPrice, product.currencyCode)}
                    </Text>
                    {hasDiscount && (
                      <Text style={styles.compareAtPriceText}>
                        {product.priceHtml?.formattedRegularPrice || formatPrice(regularPrice, product.currencyCode)}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shopButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  
  // Grid Layout
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  
  // Card Styles (matching ProductCard)
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 170,
    backgroundColor: Colors.cardBackground,
  },
  
  productImage: {
    width: '100%',
    height: '100%',
  },
  
  discountBadge: {
    position: 'absolute',
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
  
  discountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  
  addToCartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  
  addToCartButtonSuccess: {
    backgroundColor: '#10B981',
  },
  
  productInfo: {
    padding: 14,
    paddingTop: 12,
  },
  
  brandText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 10,
  },
  
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  
  compareAtPriceText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});
