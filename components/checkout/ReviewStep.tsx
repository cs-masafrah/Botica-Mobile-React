// components/checkout/ReviewStep.tsx - CORRECTED VERSION
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import Colors from "@/constants/colors";
import { formatPrice } from "@/utils/currency";
import { MapPin, Package, CreditCard, CheckCircle, Tag, X } from "lucide-react-native";
import { couponService } from "@/services/CouponService";

const ReviewStep: React.FC = () => {
  const {
    billingAddress,
    shippingAddress,
    useBillingForShipping,
    shippingMethods,
    paymentMethods,
    selectedShippingMethod,
    selectedPaymentMethod,
    placeOrder,
    isLoading,
  } = useCheckout();

  const { items, cartDetails, loadCart } = useCart(); // Changed from refreshCart to loadCart

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Default currency
  const defaultCurrency = "ILS";

  // Helper functions
  const getItemPrice = (item: any): string => {
    const currency = item.product?.currencyCode || defaultCurrency;
    const price = item.product?.price || 0;
    return formatPrice(price * item.quantity, currency);
  };

  const getCartTotal = (): string => {
    const total = cartDetails?.grandTotal || 0;
    const currency = cartDetails?.currencyCode || defaultCurrency;
    return formatPrice(total, currency);
  };

  const getDiscountAmount = (): string => {
    const discount = cartDetails?.discountAmount || 0;
    if (discount <= 0) return "";
    const currency = cartDetails?.currencyCode || defaultCurrency;
    return formatPrice(discount, currency);
  };

  const getShippingPrice = (shippingMethod: any): string => {
    if (!shippingMethod?.price) return "";
    const formattedPrice = shippingMethod.formattedPrice || "";
    let currency = defaultCurrency;

    if (formattedPrice.includes("$")) currency = "USD";
    else if (formattedPrice.includes("€")) currency = "EUR";
    else if (formattedPrice.includes("£")) currency = "GBP";
    else if (formattedPrice.includes("¥")) currency = "JPY";

    return formatPrice(shippingMethod.price, currency);
  };

  // Coupon handlers - UPDATED to use loadCart instead of refreshCart
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert("Error", "Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const result = await couponService.applyCoupon(couponCode.trim());
      
      if (result.success && result.cart) {
        Alert.alert("Success", result.message || "Coupon applied successfully");
        setAppliedCoupon(couponCode.trim());
        setCouponCode("");
        await loadCart(true); // Force refresh cart
      } else {
        Alert.alert("Error", result.message || "Failed to apply coupon");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const result = await couponService.removeCoupon();
      
      if (result.success) {
        setAppliedCoupon(null);
        await loadCart(true); // Force refresh cart
      } else {
        Alert.alert("Error", result.message || "Failed to remove coupon");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to remove coupon");
    }
  };

  const handlePlaceOrder = async () => {
    Alert.alert("Confirm Order", `Are you sure you want to place this order?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Place Order",
        style: "default",
        onPress: async () => {
          try {
            await placeOrder();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to place order");
          }
        },
      },
    ]);
  };

  const selectedShipping = shippingMethods.find(
    (m) => m.code === selectedShippingMethod,
  );
  const selectedPayment = paymentMethods.find(
    (m) => m.method === selectedPaymentMethod,
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <CheckCircle size={24} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.title}>Review Order</Text>
          <Text style={styles.subtitle}>
            Please review your order before placing it
          </Text>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.orderItemsContainer}>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName}>{item.product.name}</Text>
                <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.orderItemPrice}>{getItemPrice(item)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatPrice(cartDetails?.subTotal || 0, cartDetails?.currencyCode || defaultCurrency)}
            </Text>
          </View>

          {cartDetails?.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, styles.discountValue]}>
                -{getDiscountAmount()}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={styles.totalValue}>
              {formatPrice(cartDetails?.shippingAmount || 0, cartDetails?.currencyCode || defaultCurrency)}
            </Text>
          </View>

          {cartDetails?.taxTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>
                {formatPrice(cartDetails?.taxTotal || 0, cartDetails?.currencyCode || defaultCurrency)}
              </Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{getCartTotal()}</Text>
          </View>
        </View>
      </View>

      {/* Coupon Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coupon Code</Text>
        {appliedCoupon ? (
          <View style={styles.appliedCouponContainer}>
            <View style={styles.appliedCouponBadge}>
              <View style={styles.couponIconContainer}>
                <Tag size={16} color="#ffffff" />
              </View>
              <Text style={styles.appliedCouponText}>{appliedCoupon}</Text>
              <Pressable onPress={handleRemoveCoupon} style={styles.removeCouponButton}>
                <X size={16} color="#ef4444" />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.couponContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              value={couponCode}
              onChangeText={setCouponCode}
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
            />
            <Pressable
              style={[
                styles.couponButton,
                (!couponCode.trim() || isApplyingCoupon) && styles.couponButtonDisabled
              ]}
              onPress={handleApplyCoupon}
              disabled={!couponCode.trim() || isApplyingCoupon}
            >
              {isApplyingCoupon ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.couponButtonText}>Apply</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Shipping Address */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrapper}>
            <MapPin size={16} color="#ffffff" />
          </View>
          <Text style={styles.sectionTitleText}>Shipping Address</Text>
        </View>
        {shippingAddress && (
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>
              {shippingAddress.firstName} {shippingAddress.lastName}
            </Text>
            <Text style={styles.addressText}>{shippingAddress.address[0]}</Text>
            <Text style={styles.addressDetails}>
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.postcode}
            </Text>
            <Text style={styles.addressDetails}>{shippingAddress.country}</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>
                📱 {shippingAddress.phone}
              </Text>
              <Text style={styles.contactText}>
                ✉️ {shippingAddress.email}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Billing Address (if different) */}
      {!useBillingForShipping && billingAddress && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <MapPin size={16} color="#ffffff" />
            </View>
            <Text style={styles.sectionTitleText}>Billing Address</Text>
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>
              {billingAddress.firstName} {billingAddress.lastName}
            </Text>
            <Text style={styles.addressText}>{billingAddress.address[0]}</Text>
            <Text style={styles.addressDetails}>
              {billingAddress.city}, {billingAddress.state}{" "}
              {billingAddress.postcode}
            </Text>
            <Text style={styles.addressDetails}>{billingAddress.country}</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>
                📱 {billingAddress.phone}
              </Text>
              <Text style={styles.contactText}>
                ✉️ {billingAddress.email}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Shipping Method */}
      {selectedShipping && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: '#34d399' }]}>
              <Package size={16} color="#ffffff" />
            </View>
            <Text style={styles.sectionTitleText}>Shipping Method</Text>
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodText}>{selectedShipping.label}</Text>
            {selectedShipping.formattedPrice && (
              <Text style={styles.methodPrice}>
                {selectedShipping.formattedPrice}
              </Text>
            )}
            {selectedShipping.price && !selectedShipping.formattedPrice && (
              <Text style={styles.methodPrice}>
                {getShippingPrice(selectedShipping)}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Payment Method */}
      {selectedPayment && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: '#059669' }]}>
              <CreditCard size={16} color="#ffffff" />
            </View>
            <Text style={styles.sectionTitleText}>Payment Method</Text>
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodText}>{selectedPayment.methodTitle}</Text>
            {selectedPayment.description && (
              <Text style={styles.methodDescription}>
                {selectedPayment.description}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Terms */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By placing your order, you agree to our Terms of Service and Privacy
          Policy. All transactions are secure and encrypted.
        </Text>
      </View>

      <Pressable
        style={[styles.placeOrderButton, isLoading && styles.buttonDisabled]}
        onPress={handlePlaceOrder}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.placeOrderButtonText}>Place Order</Text>
        )}
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  orderItemsContainer: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  orderItemQuantity: {
    fontSize: 13,
    color: '#64748b',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  totalsContainer: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  discountValue: {
    color: '#10b981',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#d1fae5',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  // Coupon Styles
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
    height: 48,
  },
  couponButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  couponButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  couponButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedCouponContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  appliedCouponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  couponIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedCouponText: {
    flex: 1,
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  removeCouponButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    gap: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  addressDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  contactInfo: {
    marginTop: 8,
    gap: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#059669',
  },
  methodInfo: {
    marginTop: 8,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  methodPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  methodDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  termsContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  termsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  placeOrderButton: {
    backgroundColor: '#10b981',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ReviewStep;