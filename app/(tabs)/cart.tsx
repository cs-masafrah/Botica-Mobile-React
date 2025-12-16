import { Minus, Plus, Trash2, AlertCircle } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';
import { APP_CURRENCY, convertCurrency, formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';

export default function CartScreen() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    shippingDiscounts,
    applicableShippingDiscount,
    currencyCode,
    getDiscountThreshold,
  } = useCart();
  const displayCurrency = currencyCode || APP_CURRENCY;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>🛍️</Text>
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Start shopping to add items to your cart
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ShippingStrip />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsContainer}>
          {items.map((item) => {
            const isUnavailable = !item.product.variantId || !item.product.inStock;
            const convertedUnitPrice = convertCurrency(
              item.product.price,
              item.product.currencyCode,
              displayCurrency,
            );
            
            return (
              <View key={item.product.id} style={styles.cartItem}>
                <Image 
                  source={{ uri: item.product.image }} 
                  style={[styles.itemImage, isUnavailable && styles.itemImageUnavailable]} 
                />
                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.brandText}>{item.product.brand}</Text>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      {isUnavailable && (
                        <View style={styles.unavailableBadge}>
                          <AlertCircle size={12} color={Colors.error} />
                          <Text style={styles.unavailableText}>Not available</Text>
                        </View>
                      )}
                      <Text style={styles.itemPrice}>
                        {formatPrice(convertedUnitPrice, displayCurrency)}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 size={18} color={Colors.error} />
                    </Pressable>
                  </View>
                  {!isUnavailable && (
                    <View style={styles.quantityContainer}>
                      <Pressable
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus size={16} color={Colors.text} />
                      </Pressable>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <Pressable
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus size={16} color={Colors.text} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {applicableShippingDiscount ? (
          <View style={styles.freeShippingBadge}>
            <Text style={styles.freeShippingText}>
              🎉 {applicableShippingDiscount.title}! You qualify for free shipping!
            </Text>
          </View>
        ) : shippingDiscounts.length > 0 ? (
          (() => {
            const nextDiscountEntry = shippingDiscounts
              .map(discount => ({
                discount,
                threshold: getDiscountThreshold(discount),
              }))
              .filter(entry => subtotal < entry.threshold)
              .sort((a, b) => a.threshold - b.threshold)[0];
            
            if (nextDiscountEntry) {
              const remaining = Math.max(0, nextDiscountEntry.threshold - subtotal);
              const progress = Math.min((subtotal / nextDiscountEntry.threshold) * 100, 100);
              
              return (
                <View style={styles.shippingProgressContainer}>
                  <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarBackground}>
                      <View style={[styles.progressBarFill, { width: `${progress}%` }]}>
                        <View style={styles.progressBarShine} />
                      </View>
                    </View>
                    <View style={styles.progressTextContainer}>
                      <Text style={styles.progressText}>
                        Add <Text style={styles.progressTextBold}>{formatPrice(remaining, displayCurrency)}</Text> more for free shipping!
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }
            return <View />;
          })()
        ) : <View />}
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalAmount}>{formatPrice(subtotal, displayCurrency)}</Text>
        </View>
        <Pressable 
          style={styles.checkoutButton}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </Pressable>
      </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.background,
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
  emptyIcon: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  itemsContainer: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 100,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
  },
  itemImageUnavailable: {
    opacity: 0.5,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  unavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start' as const,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center' as const,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.white,
  },
  shippingProgressContainer: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  progressBarWrapper: {
    position: 'relative' as const,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  progressBarBackground: {
    height: 30,
    backgroundColor: '#F0FDF4',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#86EFAC',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    position: 'relative' as const,
    minWidth: 60,
  },
  progressBarShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  progressTextContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },

  progressText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#000000',
    textAlign: 'center' as const,
  },
  progressTextBold: {
    fontWeight: '900' as const,
    fontSize: 13,
    color: '#000000',
  },
  progressTextAchieved: {
    fontSize: 13,
    fontWeight: '900' as const,
    color: '#000000',
    textAlign: 'center' as const,
  },
  progressPercentage: {
    display: 'none' as const,
  },
  progressPercentageText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  checkoutButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  freeShippingBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  freeShippingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#059669',
    textAlign: 'center' as const,
  },
});
