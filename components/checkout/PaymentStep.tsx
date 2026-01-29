// components/checkout/PaymentStep.tsx - STYLES ONLY UPDATE
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
import { Check, CreditCard, Shield } from "lucide-react-native";

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
        <View style={styles.loadingPulse}>
          <CreditCard size={48} color="#8b5cf6" />
        </View>
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  // Check if we have a shipping method selected
  if (!selectedShippingMethod) {
    return (
      <View style={styles.centered}>
        <View style={styles.iconWrapper}>
          <CreditCard size={48} color="#64748b" />
        </View>
        <Text style={styles.errorText}>
          Please select a shipping method first
        </Text>
        <Pressable
          style={[styles.button, styles.backButton]}
          onPress={() => setStep(2)}
        >
          <Text style={styles.backButtonText}>Back to Shipping</Text>
        </Pressable>
      </View>
    );
  }

  // Check if we have payment methods
  if (paymentMethods.length === 0 && selectedShippingMethod) {
    return (
      <View style={styles.centered}>
        <View style={styles.iconWrapper}>
          <CreditCard size={48} color="#64748b" />
        </View>
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
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <CreditCard size={24} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.title}>Payment Method</Text>
          <Text style={styles.subtitle}>
            Choose your preferred payment method
          </Text>
        </View>
      </View>

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
            <View style={styles.methodIconContainer}>
              {method.method === "cashondelivery" ? (
                <View style={[styles.methodIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <CreditCard size={20} color="#f59e0b" />
                </View>
              ) : (
                <View style={[styles.methodIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <CreditCard size={20} color="#3b82f6" />
                </View>
              )}
            </View>

            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{method.methodTitle}</Text>
              {method.description && (
                <Text style={styles.methodDescription}>
                  {method.description}
                </Text>
              )}
              <View style={styles.securityBadge}>
                <Shield size={12} color="#10b981" />
                <Text style={styles.securityText}>
                  Secure payment • Encrypted
                </Text>
              </View>
            </View>

            <View style={styles.radioContainer}>
              <View style={styles.radioOuter}>
                {selectedPaymentMethod === method.method && (
                  <View style={styles.radioInner}>
                    <Check size={10} color="#ffffff" />
                  </View>
                )}
              </View>
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
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  loadingPulse: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
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
    backgroundColor: '#059669', // Dark green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
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
  methodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#d1fae5',
  },
  methodCardSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  radioContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
  },
  noMethodsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  noMethodsSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  retryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1fae5',
  },
  backButtonText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentStep;