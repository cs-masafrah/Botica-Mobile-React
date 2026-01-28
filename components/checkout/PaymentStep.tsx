// components/checkout/PaymentStep.tsx - UPDATE WITH useEffect
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useCheckout } from "@/contexts/CheckoutContext";
import Colors from "@/constants/colors";
import { CheckCircle } from "lucide-react-native";

const PaymentStep: React.FC = () => {
  const {
    paymentMethods,
    selectedPaymentMethod,
    selectedShippingMethod,
    selectPaymentMethod,
    isLoading,
    setStep,
  } = useCheckout();

  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    // If we don't have payment methods but have a selected shipping method, try to load them
    if (
      paymentMethods.length === 0 &&
      selectedShippingMethod &&
      !localLoading
    ) {
      loadPaymentMethods();
    }
  }, [paymentMethods, selectedShippingMethod]);

  const loadPaymentMethods = async () => {
    if (!selectedShippingMethod) return;

    try {
      setLocalLoading(true);
      // You might need to add a method to CheckoutContext to load payment methods
      // For now, we'll just show empty state
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSelectMethod = async (method: string) => {
    try {
      await selectPaymentMethod(method);
    } catch (error) {
      console.error("Failed to select payment method:", error);
    }
  };

  const handleContinue = () => {
    if (selectedPaymentMethod) {
      setStep(4);
    }
  };

  // Show loading if we're trying to load payment methods
  if (localLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  // Check if we have a shipping method selected
  if (!selectedShippingMethod) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Please select a shipping method first
        </Text>
      </View>
    );
  }

  // Check if we have payment methods
  if (paymentMethods.length === 0 && selectedShippingMethod) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noMethodsText}>No payment methods available</Text>
        <Text style={styles.noMethodsSubtext}>
          Unable to load payment methods for the selected shipping method.
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => {
            // You can add a retry function here to reload payment methods
            console.log("Retry loading payment methods");
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.backButton]}
          onPress={() => setStep(2)}
        >
          <Text style={styles.backButtonText}>Back to Shipping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Payment Method</Text>

      <Text style={styles.description}>
        Choose your preferred payment method
      </Text>

      {paymentMethods.map((method) => (
        <Pressable
          key={method.method}
          style={[
            styles.methodCard,
            selectedPaymentMethod === method.method &&
              styles.methodCardSelected,
          ]}
          onPress={() => handleSelectMethod(method.method)}
          disabled={isLoading || localLoading}
        >
          <View style={styles.methodContent}>
            {method.image && (
              <Image
                source={{ uri: method.image }}
                style={styles.methodImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{method.methodTitle}</Text>
              {method.description && (
                <Text style={styles.methodDescription}>
                  {method.description}
                </Text>
              )}
            </View>

            <View style={styles.radioContainer}>
              {selectedPaymentMethod === method.method && (
                <CheckCircle size={20} color={Colors.primary} />
              )}
            </View>
          </View>
        </Pressable>
      ))}

      <Pressable
        style={[
          styles.button,
          (!selectedPaymentMethod || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selectedPaymentMethod || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Processing..." : "Review Order"}
        </Text>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  methodCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  methodContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodImage: {
    width: 40,
    height: 40,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  radioContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
  },
  noMethodsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  noMethodsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  // Add to styles:
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default PaymentStep;
