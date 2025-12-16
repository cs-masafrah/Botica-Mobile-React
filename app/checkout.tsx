import { ArrowLeft, Check, CheckCircle, MapPin, Package } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useAddress } from '@/contexts/AddressContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { APP_CURRENCY, convertCurrency, formatPrice } from '@/utils/currency';
import { ShippingStrip } from '@/components/ShippingStrip';
import { ShippingZone } from '@/types/product';
import { shopifyService } from '@/services/shopify';

interface ShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
}

export default function CheckoutScreen() {
  const {
    total,
    subtotal,
    completeCheckout,
    selectedShippingRate,
    setSelectedShippingRate,
    shippingCost,
    applicableShippingDiscount,
    shippingDiscounts,
    currencyCode,
    getDiscountThreshold,
  } = useCart();
  const displayCurrency = currencyCode || APP_CURRENCY;
  const selectedShippingDisplayPrice = selectedShippingRate
    ? convertCurrency(selectedShippingRate.price, selectedShippingRate.currencyCode, displayCurrency)
    : 0;
  
  console.log('[Checkout] 🛒 CHECKOUT PAGE RENDER:', {
    subtotal,
    shippingCost,
    total,
    '---': '---',
    selectedShippingRate: selectedShippingRate?.title,
    selectedShippingRateBasePrice: selectedShippingRate?.price,
    '---2': '---',
    applicableShippingDiscount: applicableShippingDiscount?.title,
    discountCode: applicableShippingDiscount?.code,
    discountMinimum: applicableShippingDiscount?.minimumOrderAmount,
    '---3': '---',
    numShippingDiscounts: shippingDiscounts.length,
    shippingDiscounts: shippingDiscounts.map(d => ({ title: d.title, min: d.minimumOrderAmount })),
    currencyCode: displayCurrency,
  });
  const { isAuthenticated, customer } = useAuth();
  const { addresses } = useAddress();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string; orderName: string } | null>(null);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    phone: '',
    email: customer?.email || '',
    city: '',
    address: '',
  });

  useEffect(() => {
    if (customer?.email) {
      setShippingInfo((prev) => ({ ...prev, email: customer.email }));
    }
  }, [customer]);

  useEffect(() => {
    const loadShippingRates = async () => {
      setIsLoadingShipping(true);
      try {
        const zones = await shopifyService.getShippingZones();
        console.log('✅ Loaded shipping zones:', zones.length);
        setShippingZones(zones);
        
        if (zones.length > 0 && zones[0].shippingRates.length > 0 && !selectedShippingRate) {
          setSelectedShippingRate(zones[0].shippingRates[0]);
        }
      } catch {
        console.log('ℹ️  No shipping zones configured. Continuing without shipping options.');
        setShippingZones([]);
      } finally {
        setIsLoadingShipping(false);
      }
    };
    
    loadShippingRates();
  }, [selectedShippingRate, setSelectedShippingRate]);

  const populateFromAddress = useCallback((address: any) => {
    setShippingInfo({
      fullName: `${address.firstName} ${address.lastName}`,
      phone: address.phone || '',
      email: customer?.email || '',
      city: address.city,
      address: `${address.address1}${address.address2 ? ', ' + address.address2 : ''}`,
    });
  }, [customer]);

  useEffect(() => {
    if (isAuthenticated && addresses.length > 0 && !useNewAddress) {
      const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        populateFromAddress(defaultAddress);
      }
    }
  }, [isAuthenticated, addresses, useNewAddress, populateFromAddress]);

  const updateField = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof ShippingInfo)[] = [
      'fullName',
      'phone',
      'email',
      'city',
      'address',
    ];

    for (const field of requiredFields) {
      if (!shippingInfo[field].trim()) {
        Alert.alert('Missing Information', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const result = await completeCheckout(shippingInfo);
      
      console.log('Order created:', result);
      setOrderSuccess(result);
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Order Failed',
        error instanceof Error ? error.message : 'Failed to process your order. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSuccess = () => {
    setOrderSuccess(null);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>
      <ShippingStrip />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isAuthenticated && addresses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Address</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addressScroll}>
              {addresses.map((address: any) => (
                <Pressable
                  key={address.id}
                  style={[
                    styles.addressOption,
                    selectedAddressId === address.id && styles.addressOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedAddressId(address.id);
                    setUseNewAddress(false);
                    populateFromAddress(address);
                  }}
                >
                  <MapPin size={16} color={selectedAddressId === address.id ? Colors.white : Colors.primary} />
                  <Text style={[
                    styles.addressOptionText,
                    selectedAddressId === address.id && styles.addressOptionTextSelected,
                  ]}>
                    {address.firstName} {address.lastName}
                  </Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadgeSmall}>
                      <Text style={styles.defaultBadgeSmallText}>Default</Text>
                    </View>
                  )}
                </Pressable>
              ))}
              <Pressable
                style={[
                  styles.addressOption,
                  useNewAddress && styles.addressOptionSelected,
                ]}
                onPress={() => {
                  setUseNewAddress(true);
                  setSelectedAddressId(null);
                  setShippingInfo({
                    fullName: '',
                    phone: '',
                    email: customer?.email || '',
                    city: '',
                    address: '',
                  });
                }}
              >
                <Text style={[
                  styles.addressOptionText,
                  useNewAddress && styles.addressOptionTextSelected,
                ]}>
                  + New Address
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              placeholder="John Doe"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, isAuthenticated && styles.inputDisabled]}
              value={shippingInfo.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="john.doe@example.com"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isAuthenticated}
            />
            {isAuthenticated && (
              <Text style={styles.note}>Email is from your profile</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.city}
              onChangeText={(value) => updateField('city', value)}
              placeholder="New York"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.address}
              onChangeText={(value) => updateField('address', value)}
              placeholder="123 Main St, Apt 4B"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {shippingZones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Method</Text>
            
            {isLoadingShipping ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading shipping rates...</Text>
              </View>
            ) : (
              <View style={styles.shippingOptions}>
                {shippingZones.map((zone) => (
                  <View key={zone.id}>
                    {zone.shippingRates.map((rate) => {
                      const rateDisplayPrice = convertCurrency(rate.price, rate.currencyCode, displayCurrency);
                      return (
                        <Pressable
                          key={rate.id}
                          style={[
                            styles.shippingOption,
                            selectedShippingRate?.id === rate.id && styles.shippingOptionSelected,
                          ]}
                          onPress={() => setSelectedShippingRate(rate)}
                        >
                          <View style={styles.shippingOptionLeft}>
                            <View style={[
                              styles.radioButton,
                              selectedShippingRate?.id === rate.id && styles.radioButtonSelected,
                            ]}>
                              {selectedShippingRate?.id === rate.id && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            <View>
                              <Text style={styles.shippingOptionTitle}>{rate.title}</Text>
                              <Text style={styles.shippingOptionZone}>{zone.name}</Text>
                            </View>
                          </View>
                          <View style={styles.shippingOptionRight}>
                            <Package size={16} color={Colors.textSecondary} />
                            <Text style={styles.shippingOptionPrice}>
                              {rate.price === 0 ? 'Free' : formatPrice(rateDisplayPrice, displayCurrency)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal, displayCurrency)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <View style={styles.shippingValueContainer}>
              {selectedShippingRate && applicableShippingDiscount && selectedShippingRate.price > 0 ? (
                <View style={styles.discountedShipping}>
                  <Text style={styles.strikethroughPrice}>
                    {formatPrice(selectedShippingDisplayPrice, displayCurrency)}
                  </Text>
                  <Text style={styles.freeShippingValue}>Free</Text>
                </View>
              ) : (
                <Text style={styles.summaryValue}>
                  {selectedShippingRate 
                    ? (shippingCost === 0 ? 'Free' : formatPrice(shippingCost, displayCurrency))
                    : 'Select shipping method'
                  }
                </Text>
              )}
            </View>
          </View>
          
          {applicableShippingDiscount && selectedShippingRate && selectedShippingRate.price > 0 && (
            <View style={styles.freeShippingBadge}>
              <Text style={styles.freeShippingText}>
                🎉 {applicableShippingDiscount.title} Applied! You saved {formatPrice(selectedShippingDisplayPrice, displayCurrency)}
              </Text>
            </View>
          )}
          
          {!applicableShippingDiscount && shippingDiscounts.length > 0 && (
            <View style={styles.shippingProgressContainer}>
              {(() => {
                const nextDiscountEntry = shippingDiscounts
                  .map(discount => ({
                    discount,
                    threshold: getDiscountThreshold(discount),
                  }))
                  .filter(entry => subtotal < entry.threshold)
                  .sort((a, b) => a.threshold - b.threshold)[0];
                
                if (nextDiscountEntry) {
                  const remaining = Math.max(0, nextDiscountEntry.threshold - subtotal);
                  return (
                    <Text style={styles.shippingProgressText}>
                      Add {formatPrice(remaining, displayCurrency)} more for free shipping!
                    </Text>
                  );
                }
                return null;
              })()}
            </View>
          )}
          
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total, displayCurrency)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Check size={20} color={Colors.white} />
              <Text style={styles.checkoutButtonText}>Place Order (Cash on Delivery)</Text>
            </>
          )}
        </Pressable>
      </View>

      <Modal
        visible={!!orderSuccess}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSuccess}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color={Colors.primary} />
            </View>
            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successMessage}>
              Your order {orderSuccess?.orderName} has been received.
            </Text>
            <Text style={styles.successNote}>
              {`We'll prepare your order for delivery. Payment will be collected upon delivery.`}
            </Text>
            <Pressable
              style={styles.successButton}
              onPress={handleCloseSuccess}
            >
              <Text style={styles.successButtonText}>Continue Shopping</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    backgroundColor: Colors.white,
    marginTop: 12,
  },
  addressScroll: {
    marginTop: 12,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent' as const,
  },
  addressOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  addressOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  addressOptionTextSelected: {
    color: Colors.white,
  },
  defaultBadgeSmall: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeSmallText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  summarySection: {
    padding: 20,
    backgroundColor: Colors.white,
    marginTop: 12,
    marginBottom: 100,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  note: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  shippingOptions: {
    gap: 12,
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: 'transparent' as const,
  },
  shippingOptionSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  shippingOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shippingOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  shippingOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  shippingOptionZone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shippingOptionPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 48,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  freeShippingBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  freeShippingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#059669',
    textAlign: 'center' as const,
  },
  shippingValueContainer: {
    alignItems: 'flex-end' as const,
  },
  discountedShipping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strikethroughPrice: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  freeShippingValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#059669',
  },
  shippingProgressContainer: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  shippingProgressText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#D97706',
    textAlign: 'center' as const,
  },
});
