// components/checkout/SuccessStep.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import Colors from "@/constants/colors";
import { CheckCircle, Home, ShoppingBag } from "lucide-react-native";
import { formatPrice } from "@/utils/currency";

const SuccessStep: React.FC = () => {
  const { orderResult, resetCheckout } = useCheckout();
  const { clearCart } = useCart();

  const handleContinueShopping = () => {
    clearCart();
    resetCheckout();
    router.replace("/(tabs)");
  };

  const handleViewOrders = () => {
    console.log("handleViewOrders triggered");

    clearCart();
    resetCheckout();

    if (router.canDismiss()) {
      console.log("Router can dismiss");
      router.dismiss();
      setTimeout(() => {
        console.log("Navigating to /order-history");
        router.push("/order-history");
      }, 200);
    } else {
      console.log("Router cannot dismiss, pushing directly");
      router.push("/order-history");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.successIcon}>
        <CheckCircle size={80} color={Colors.success} />
      </View>

      <Text style={styles.title}>Order Placed Successfully!</Text>

      <Text style={styles.message}>
        Thank you for your purchase. Your order has been received and is being
        processed.
      </Text>

      {orderResult?.order && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderInfoText}>
            Order #: {orderResult.order.incrementId}
          </Text>
          <Text style={styles.orderInfoText}>
            Status: {orderResult.order.status}
          </Text>
          <Text style={styles.orderInfoText}>
            Total: {formatPrice(orderResult.order.grandTotal)}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={handleContinueShopping}
        >
          <Home size={20} color={Colors.white} style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Continue Shopping</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={handleViewOrders}
        >
          <ShoppingBag
            size={20}
            color={Colors.primary}
            style={styles.buttonIcon}
          />
          <Text style={styles.secondaryButtonText}>View My Orders</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: Colors.background,
  },
  successIcon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  orderInfo: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: "100%",
  },
  orderInfoText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SuccessStep;
