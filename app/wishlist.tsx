import { router } from 'expo-router';
import { Heart, ShoppingCart, Trash2, Plus, Check } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 64) / 3;

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
            <Heart size={64} color={Colors.textSecondary} />
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
          {items.map((product) => {
            const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
            const discountPercentage = hasDiscount 
              ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
              : 0;
            const isAdded = addedProductId === product.id;

            return (
              <View key={product.id} style={styles.card}>
                <Pressable
                  style={styles.cardContent}
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                    />
                    {hasDiscount && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
                      </View>
                    )}
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeFromWishlist(product.id)}
                    >
                      <Trash2 size={15} color={Colors.white} />
                    </Pressable>
                    <Pressable
                      style={[styles.addToCartButtonSmall, isAdded && styles.addToCartButtonSuccess]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      {isAdded ? (
                        <Check size={13} color={Colors.white} strokeWidth={3} />
                      ) : (
                        <Plus size={13} color={Colors.white} strokeWidth={3} />
                      )}
                    </Pressable>
                  </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.brandText} numberOfLines={1}>
                    {product.brand}
                  </Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <Text style={styles.compareAtPrice}>
                        {formatPrice(product.compareAtPrice, product.currencyCode)}
                      </Text>
                    )}
                    <Text style={styles.price}>
                      {formatPrice(product.price, product.currencyCode)}
                    </Text>
                  </View>
                </View>
                </Pressable>
                <Pressable
                  style={styles.addToCartButton}
                  onPress={() => handleAddToCart(product)}
                >
                  <ShoppingCart size={18} color={Colors.white} />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </Pressable>
              </View>
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
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
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: Colors.cardBackground,
    position: 'relative' as const,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover' as const,
  },
  removeButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonSmall: {
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
  cardDetails: {
    padding: 12,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  compareAtPrice: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    gap: 8,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
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
});
