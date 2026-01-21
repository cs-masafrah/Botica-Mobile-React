// app/checkout.tsx
import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CreditCard, ShoppingBag, Package, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/utils/currency';

export default function CheckoutScreen() {
  const {
    items,
    subtotal,
    cartDetails,
    isLoading,
    placeOrder,
    clearCart,
  } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Calculate totals based on Bagisto cart data if available
  const calculatedTotals = useMemo(() => {
    if (!cartDetails?.formattedPrice) {
      // Fallback to local calculations
      const shippingCost = shippingMethod === 'express' ? 15 : shippingMethod === 'standard' ? 8 : 0;
      const taxRate = 0.1; // 10% tax
      const taxAmount = subtotal * taxRate;
      const total = subtotal + shippingCost + taxAmount;

      return {
        subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        discount: 0,
        total,
      };
    }

    // Use Bagisto's calculated prices
    const bagistoPrices = cartDetails.formattedPrice;
    return {
      subtotal: bagistoPrices.subTotal,
      shipping: bagistoPrices.shippingTotal || 0,
      tax: bagistoPrices.taxTotal,
      discount: bagistoPrices.discountAmount,
      total: bagistoPrices.grandTotal,
    };
  }, [cartDetails, subtotal, shippingMethod]);

  // Get display currency
  const displayCurrency = cartDetails?.currencyCode || 'USD';

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some items before checkout.');
      return;
    }

    setIsProcessing(true);
    try {
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.product.productId,
          quantity: item.quantity,
          configurableParams: item.product.configurableParams,
          selectedConfigurableOption: item.product.selectedConfigurableOption,
        })),
        shippingMethod,
        paymentMethod,
        totals: calculatedTotals,
      };

      // Place order via Bagisto API
      const orderResult = await placeOrder(orderData);

      if (orderResult.success) {
        Alert.alert(
          'Order Placed!',
          `Your order #${orderResult.orderId} has been placed successfully.`,
          [
            {
              text: 'View Orders',
              onPress: () => router.push('/orders'),
            },
            {
              text: 'Continue Shopping',
              onPress: () => {
                clearCart();
                router.push('/');
              },
            },
          ]
        );
      } else {
        throw new Error(orderResult.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert(
        'Order Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ShoppingBag size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add some items to your cart before checking out
        </Text>
        <Pressable
          style={styles.continueButton}
          onPress={() => router.back()}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => {
            const itemPrice = item.product.price || 0;
            const itemTotal = itemPrice * item.quantity;
            
            return (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  {item.product.selectedOptions && Object.keys(item.product.selectedOptions).length > 0 && (
                    <Text style={styles.orderItemVariant}>
                      {Object.values(item.product.selectedOptions).join(', ')}
                    </Text>
                  )}
                  <View style={styles.orderItemPriceRow}>
                    <Text style={styles.orderItemQuantity}>
                      {item.quantity} × {formatPrice(itemPrice, displayCurrency)}
                    </Text>
                    <Text style={styles.orderItemTotal}>
                      {formatPrice(itemTotal, displayCurrency)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Shipping Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Method</Text>
          <Pressable
            style={[
              styles.optionCard,
              shippingMethod === 'standard' && styles.optionCardSelected,
            ]}
            onPress={() => setShippingMethod('standard')}
          >
            <View style={styles.optionCardContent}>
              <Package size={20} color={Colors.primary} />
              <View style={styles.optionCardText}>
                <Text style={styles.optionCardTitle}>Standard Shipping</Text>
                <Text style={styles.optionCardSubtitle}>
                  5-7 business days
                </Text>
              </View>
              <Text style={styles.optionCardPrice}>
                {formatPrice(calculatedTotals.shipping, displayCurrency)}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.optionCard,
              shippingMethod === 'express' && styles.optionCardSelected,
            ]}
            onPress={() => setShippingMethod('express')}
          >
            <View style={styles.optionCardContent}>
              <Package size={20} color={Colors.primary} />
              <View style={styles.optionCardText}>
                <Text style={styles.optionCardTitle}>Express Shipping</Text>
                <Text style={styles.optionCardSubtitle}>
                  2-3 business days
                </Text>
              </View>
              <Text style={styles.optionCardPrice}>
                {formatPrice(calculatedTotals.shipping + 7, displayCurrency)}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Pressable
            style={[
              styles.optionCard,
              paymentMethod === 'card' && styles.optionCardSelected,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.optionCardContent}>
              <CreditCard size={20} color={Colors.primary} />
              <View style={styles.optionCardText}>
                <Text style={styles.optionCardTitle}>Credit/Debit Card</Text>
                <Text style={styles.optionCardSubtitle}>
                  Pay securely with your card
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.optionCard,
              paymentMethod === 'cod' && styles.optionCardSelected,
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.optionCardContent}>
              <ShoppingBag size={20} color={Colors.primary} />
              <View style={styles.optionCardText}>
                <Text style={styles.optionCardTitle}>Cash on Delivery</Text>
                <Text style={styles.optionCardSubtitle}>
                  Pay when you receive your order
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Order Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatPrice(calculatedTotals.subtotal, displayCurrency)}
            </Text>
          </View>

          {calculatedTotals.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, styles.discountValue]}>
                -{formatPrice(calculatedTotals.discount, displayCurrency)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={styles.totalValue}>
              {formatPrice(calculatedTotals.shipping, displayCurrency)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>
              {formatPrice(calculatedTotals.tax, displayCurrency)}
            </Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatPrice(calculatedTotals.total, displayCurrency)}
            </Text>
          </View>
        </View>

        {/* Bagisto Price Comparison (for debugging) */}
        {cartDetails?.formattedPrice && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Bagisto Totals</Text>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Subtotal:</Text>
              <Text style={styles.debugValue}>
                {formatPrice(cartDetails.formattedPrice.subTotal, displayCurrency)}
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Tax:</Text>
              <Text style={styles.debugValue}>
                {formatPrice(cartDetails.formattedPrice.taxTotal, displayCurrency)}
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Discount:</Text>
              <Text style={styles.debugValue}>
                {formatPrice(cartDetails.formattedPrice.discountAmount, displayCurrency)}
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Shipping:</Text>
              <Text style={styles.debugValue}>
                {formatPrice(cartDetails.formattedPrice.shippingTotal || 0, displayCurrency)}
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Grand Total:</Text>
              <Text style={[styles.debugValue, styles.debugGrandTotal]}>
                {formatPrice(cartDetails.formattedPrice.grandTotal, displayCurrency)}
              </Text>
            </View>
          </View>
        )}

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By placing your order, you agree to our Terms of Service and Privacy Policy.
            All transactions are secure and encrypted.
          </Text>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.checkoutButtonText}>
              Place Order • {formatPrice(calculatedTotals.total, displayCurrency)}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Text style={styles.backButtonText}>Back to Cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  orderItemVariant: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  orderItemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemQuantity: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  optionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F9FF',
  },
  optionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardText: {
    flex: 1,
    marginLeft: 12,
  },
  optionCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  optionCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  optionCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  totalsSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  discountValue: {
    color: Colors.success,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  debugSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C757D',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  debugLabel: {
    fontSize: 13,
    color: '#6C757D',
  },
  debugValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  debugGrandTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  termsSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: Colors.white,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
  checkoutButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});