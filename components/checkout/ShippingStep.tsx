// components/checkout/ShippingStep.tsx - STYLES ONLY UPDATE
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
import { Check, Package, Clock, Shield } from 'lucide-react-native';

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
        <View style={styles.loadingPulse}>
          <Package size={48} color="#8b5cf6" />
        </View>
        <Text style={styles.loadingText}>Finding shipping options...</Text>
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
          <Package size={24} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.title}>Shipping Method</Text>
          <Text style={styles.subtitle}>
            Choose how you want your order delivered
          </Text>
        </View>
      </View>

      <View style={styles.methodsContainer}>
        {shippingMethods.map((method) => {
          const isSelected = selectedShippingMethod === method.code;
          
          return (
            <Pressable
              key={method.code}
              style={[
                styles.methodCard,
                isSelected && styles.methodCardSelected,
              ]}
              onPress={() => handleSelectMethod(method.code)}
              disabled={isLoading || localLoading}
            >
              <View style={styles.methodHeader}>
                <View style={styles.methodIcon}>
                  {method.code.includes('express') ? (
                    <Clock size={20} color="#ec4899" />
                  ) : (
                    <Package size={20} color="#3b82f6" />
                  )}
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodDescription}>
                    {method.code.includes('express') 
                      ? 'Fastest delivery option' 
                      : 'Standard delivery'}
                  </Text>
                </View>
                <Text style={styles.methodPrice}>{method.formattedPrice}</Text>
              </View>

              <View style={styles.methodDetails}>
                <View style={styles.detailItem}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.detailText}>
                    {method.code.includes('express') 
                      ? '1-2 business days' 
                      : '3-5 business days'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Shield size={14} color="#64748b" />
                  <Text style={styles.detailText}>
                    Fully insured delivery
                  </Text>
                </View>
              </View>

              <View style={styles.selectionIndicator}>
                <View style={styles.radioOuter}>
                  {isSelected && (
                    <View style={styles.radioInner}>
                      <Check size={10} color="#ffffff" />
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

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
    backgroundColor: '#34d399', // Lighter green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34d399',
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
  methodsContainer: {
    gap: 16,
  },
  methodCardWrapper: {
    marginBottom: 8,
  },
  methodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
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
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  methodPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  methodDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
  selectionIndicator: {
    alignItems: 'flex-end',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ShippingStep;