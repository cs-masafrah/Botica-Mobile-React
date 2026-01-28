// components/checkout/ReviewStep.tsx - UPDATED
import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import Colors from "@/constants/colors";
import { formatPrice } from "@/utils/currency";
import { MapPin, Package, CreditCard } from "lucide-react-native";
import { Alert } from "react-native";

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

  const { items, cartDetails, clearCart } = useCart();

  // Default currency (you might want to get this from context or config)
  const defaultCurrency = "ILS"; // Or 'USD' or whatever your default is

  // Helper function to get item price with default currency
  const getItemPrice = (item: any): string => {
    // Try to get the currency from the item, fallback to default
    const currency = item.product?.currencyCode || defaultCurrency;
    const price = item.product?.price || 0;
    return formatPrice(price * item.quantity, currency);
  };

  // Helper function to get cart total with default currency
  const getCartTotal = (): string => {
    const total = cartDetails?.grandTotal || 0;
    // Try to get currency from cartDetails or use default
    const currency = cartDetails?.currencyCode || defaultCurrency;
    return formatPrice(total, currency);
  };

  // Helper function to get discount amount
  const getDiscountAmount = (): string => {
    const discount = cartDetails?.discountAmount || 0;
    if (discount <= 0) return "";
    const currency = cartDetails?.currencyCode || defaultCurrency;
    return formatPrice(discount, currency);
  };

  // Helper function to get shipping price
  const getShippingPrice = (shippingMethod: any): string => {
    if (!shippingMethod?.price) return "";
    // Try to extract currency from formattedPrice or use default
    const formattedPrice = shippingMethod.formattedPrice || "";
    let currency = defaultCurrency;

    // Try to detect currency from formatted price string
    // if (formattedPrice.includes('₪')) currency = 'ILS';
    if (formattedPrice.includes("$")) currency = "USD";
    else if (formattedPrice.includes("€")) currency = "EUR";
    else if (formattedPrice.includes("£")) currency = "GBP";
    else if (formattedPrice.includes("¥")) currency = "JPY";

    return formatPrice(shippingMethod.price, currency);
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Review Order</Text>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <View style={styles.orderItemInfo}>
              <Text style={styles.orderItemName}>{item.product.name}</Text>
              <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.orderItemPrice}>{getItemPrice(item)}</Text>
          </View>
        ))}

        {cartDetails?.discountAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount:</Text>
            <Text style={[styles.totalValue, styles.discountValue]}>
              -{getDiscountAmount()}
            </Text>
          </View>
        )}

        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total:</Text>
          <Text style={styles.grandTotalValue}>{getCartTotal()}</Text>
        </View>
      </View>

      {/* Shipping Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MapPin size={16} color={Colors.text} style={styles.sectionIcon} />
          Shipping Address
        </Text>
        {shippingAddress && (
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>
              {shippingAddress.firstName} {shippingAddress.lastName}
            </Text>
            <Text style={styles.addressText}>{shippingAddress.address[0]}</Text>
            <Text style={styles.addressText}>
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.postcode}
            </Text>
            <Text style={styles.addressText}>{shippingAddress.country}</Text>
            <Text style={styles.addressText}>
              Phone: {shippingAddress.phone}
            </Text>
            <Text style={styles.addressText}>
              Email: {shippingAddress.email}
            </Text>
          </View>
        )}
      </View>

      {/* Billing Address (if different) */}
      {!useBillingForShipping && billingAddress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MapPin size={16} color={Colors.text} style={styles.sectionIcon} />
            Billing Address
          </Text>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>
              {billingAddress.firstName} {billingAddress.lastName}
            </Text>
            <Text style={styles.addressText}>{billingAddress.address[0]}</Text>
            <Text style={styles.addressText}>
              {billingAddress.city}, {billingAddress.state}{" "}
              {billingAddress.postcode}
            </Text>
            <Text style={styles.addressText}>{billingAddress.country}</Text>
            <Text style={styles.addressText}>
              Phone: {billingAddress.phone}
            </Text>
            <Text style={styles.addressText}>
              Email: {billingAddress.email}
            </Text>
          </View>
        </View>
      )}

      {/* Shipping Method */}
      {selectedShipping && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Package size={16} color={Colors.text} style={styles.sectionIcon} />
            Shipping Method
          </Text>
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
      )}

      {/* Payment Method */}
      {selectedPayment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <CreditCard
              size={16}
              color={Colors.text}
              style={styles.sectionIcon}
            />
            Payment Method
          </Text>
          <Text style={styles.methodText}>{selectedPayment.methodTitle}</Text>
          {selectedPayment.description && (
            <Text style={styles.methodDescription}>
              {selectedPayment.description}
            </Text>
          )}
        </View>
      )}

      <Pressable
        style={[styles.placeOrderButton, isLoading && styles.buttonDisabled]}
        onPress={handlePlaceOrder}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
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
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 24,
  },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  discountValue: {
    color: Colors.success,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  addressInfo: {
    gap: 4,
  },
  addressText: {
    fontSize: 14,
    color: Colors.text,
  },
  methodText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  methodPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  placeOrderButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  placeOrderButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
});

export default ReviewStep;
