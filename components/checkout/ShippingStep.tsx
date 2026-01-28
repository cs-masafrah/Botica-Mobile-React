// components/checkout/ShippingStep.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useCheckout } from '@/contexts/CheckoutContext';
import Colors from '@/constants/colors';
import { CheckCircle } from 'lucide-react-native';

const ShippingStep: React.FC = () => {
  const {
    shippingMethods,
    selectedShippingMethod,
    selectShippingMethod,
    isLoading,
    setStep,
  } = useCheckout();

  const [localLoading, setLocalLoading] = useState(false);

  const handleSelectMethod = async (methodCode: string) => {
    try {
      await selectShippingMethod(methodCode);
    } catch (error) {
      console.error('Failed to select shipping method:', error);
    }
  };

  const handleContinue = () => {
    if (selectedShippingMethod) {
      setStep(3);
    }
  };

  if (shippingMethods.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading shipping methods...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Shipping Method</Text>
      
      <Text style={styles.description}>
        Select how you want your order delivered
      </Text>

      {shippingMethods.map((method) => (
        <Pressable
          key={method.code}
          style={[
            styles.methodCard,
            selectedShippingMethod === method.code && styles.methodCardSelected,
          ]}
          onPress={() => handleSelectMethod(method.code)}
          disabled={isLoading || localLoading}
        >
          <View style={styles.methodContent}>
            <View style={styles.methodInfo}>
              <Text style={styles.methodLabel}>{method.label}</Text>
              {method.formattedPrice && (
                <Text style={styles.methodPrice}>{method.formattedPrice}</Text>
              )}
            </View>
            
            <View style={styles.radioContainer}>
              {selectedShippingMethod === method.code && (
                <CheckCircle size={20} color={Colors.primary} />
              )}
            </View>
          </View>
        </Pressable>
      ))}

      <Pressable
        style={[styles.button, (!selectedShippingMethod || isLoading) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selectedShippingMethod || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Processing...' : 'Continue to Payment'}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
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
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  methodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  methodPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  radioContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShippingStep;