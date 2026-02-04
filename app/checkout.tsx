// app/checkout.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Animated,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  X, 
  MapPin, 
  Package, 
  CreditCard, 
  CheckCircle, 
  Check, 
  Plus, 
  Sparkles,
  Clock,
  Shield,
  Tag,
  Home,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { CheckoutColors } from '@/constants/checkoutColors';
import Colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { authService, Address } from '@/services/auth';
import { couponService } from '@/services/CouponService';
import { formatPrice } from '@/utils/currency';

const CheckoutScreen = () => {
  const {
    step,
    resetCheckout,
    setStep,
    useBillingForShipping,
    setUseBillingForShipping,
    saveAddresses,
    shippingMethods,
    selectedShippingMethod,
    selectShippingMethod,
    paymentMethods,
    selectedPaymentMethod,
    selectPaymentMethod,
    billingAddress,
    shippingAddress,
    placeOrder,
    isLoading,
    orderResult,
  } = useCheckout();

  const { items, cartDetails, loadCart, clearCart } = useCart();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Section collapse state
  const [expandedSections, setExpandedSections] = useState({
    address: true,
    shipping: false,
    payment: false,
    review: false,
  });

  // Completion tracking
  const [completedSections, setCompletedSections] = useState({
    address: false,
    shipping: false,
    payment: false,
  });

  const defaultCurrency = 'ILS';

  // Animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load addresses
  useEffect(() => {
    let mounted = true;
    const loadAddresses = async () => {
      try {
        const result = await authService.getAddresses();
        if (!mounted) return;
        setAddresses(result);
        const defaultAddress = result.find((a) => a.isDefault) || result[0];
        setSelectedAddressId(defaultAddress?.id || null);
      } catch (error) {
        console.error('Failed to load addresses:', error);
      } finally {
        setLoadingAddresses(false);
      }
    };
    loadAddresses();
    return () => { mounted = false; };
  }, []);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle address save and continue
  const handleSaveAddress = async () => {
    try {
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddress) {
        Alert.alert('Error', 'Please select an address');
        return;
      }

      const mappedAddress = {
        firstName: selectedAddress.firstName,
        lastName: selectedAddress.lastName,
        email: selectedAddress.email || '',
        address: [selectedAddress.address1],
        country: selectedAddress.country,
        state: selectedAddress.province || '',
        city: selectedAddress.city,
        postcode: selectedAddress.zip,
        phone: selectedAddress.phone || '',
        companyName: selectedAddress.companyName || '',
        useForShipping: true,
      };

      await saveAddresses(mappedAddress, mappedAddress);
      setCompletedSections(prev => ({ ...prev, address: true }));
      setExpandedSections(prev => ({ ...prev, address: false, shipping: true }));
    } catch (error) {
      console.error('Error saving addresses:', error);
      Alert.alert('Error', 'Failed to save address.');
    }
  };

  // Handle shipping method selection
  const handleSelectShipping = async (methodCode: string) => {
    try {
      await selectShippingMethod(methodCode);
    } catch (error) {
      console.error('Failed to select shipping method:', error);
    }
  };

  const handleContinueToPayment = () => {
    if (selectedShippingMethod) {
      setStep(3);
      setCompletedSections(prev => ({ ...prev, shipping: true }));
      setExpandedSections(prev => ({ ...prev, shipping: false, payment: true }));
    }
  };

  // Handle payment method selection
  const handleSelectPayment = async (method: string) => {
    try {
      await selectPaymentMethod(method);
    } catch (error) {
      console.error('Failed to select payment method:', error);
    }
  };

  const handleContinueToReview = () => {
    if (selectedPaymentMethod) {
      setStep(4);
      setCompletedSections(prev => ({ ...prev, payment: true }));
      setExpandedSections(prev => ({ ...prev, payment: false, review: true }));
    }
  };

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const result = await couponService.applyCoupon(couponCode.trim());
      if (result.success && result.cart) {
        Alert.alert('Success', result.message || 'Coupon applied successfully');
        setAppliedCoupon(couponCode.trim());
        setCouponCode('');
        await loadCart(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to apply coupon');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const result = await couponService.removeCoupon();
      if (result.success) {
        setAppliedCoupon(null);
        await loadCart(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to remove coupon');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove coupon');
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    Alert.alert('Confirm Order', 'Are you sure you want to place this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Place Order',
        style: 'default',
        onPress: async () => {
          try {
            await placeOrder();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to place order');
          }
        },
      },
    ]);
  };

  // Success handlers
  const handleContinueShopping = () => {
    clearCart();
    resetCheckout();
    router.replace('/(tabs)');
  };

  const handleViewOrders = () => {
    clearCart();
    resetCheckout();
    if (router.canDismiss()) {
      router.dismiss();
      setTimeout(() => router.push('/order-history'), 200);
    } else {
      router.push('/order-history');
    }
  };

  const handleBack = () => {
    if (step === 5) {
      resetCheckout();
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  };

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
    if (discount <= 0) return '';
    const currency = cartDetails?.currencyCode || defaultCurrency;
    return formatPrice(discount, currency);
  };

  const selectedShipping = shippingMethods.find((m) => m.code === selectedShippingMethod);
  const selectedPayment = paymentMethods.find((m) => m.method === selectedPaymentMethod);

  // Section Header Component
  const SectionHeader = ({ 
    icon: Icon, 
    iconColor, 
    title, 
    stepNumber, 
    isExpanded, 
    isCompleted,
    onPress,
    disabled = false,
  }: {
    icon: any;
    iconColor: string;
    title: string;
    stepNumber: number;
    isExpanded: boolean;
    isCompleted: boolean;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <Pressable 
      style={[styles.sectionHeader, disabled && styles.sectionHeaderDisabled]} 
      onPress={disabled ? undefined : onPress}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.stepBadge, isCompleted && styles.stepBadgeCompleted]}>
          {isCompleted ? (
            <Check size={14} color="#ffffff" />
          ) : (
            <Text style={[styles.stepBadgeText, isCompleted && styles.stepBadgeTextCompleted]}>
              {stepNumber}
            </Text>
          )}
        </View>
        <View style={[styles.sectionIcon, { backgroundColor: iconColor }]}>
          <Icon size={18} color="#ffffff" />
        </View>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
      </View>
      {!disabled && (
        isExpanded ? (
          <ChevronUp size={20} color="#64748b" />
        ) : (
          <ChevronDown size={20} color="#64748b" />
        )
      )}
    </Pressable>
  );

  // If order is successful, show success screen
  if (step === 5) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <CheckCircle size={80} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successMessage}>
            Thank you for your purchase. Your order has been received and is being processed.
          </Text>

          {orderResult?.order && (
            <View style={styles.orderInfoCard}>
              <Text style={styles.orderInfoText}>Order #: {orderResult.order.incrementId}</Text>
              <Text style={styles.orderInfoText}>Status: {orderResult.order.status}</Text>
              <Text style={styles.orderInfoText}>Total: {formatPrice(orderResult.order.grandTotal)}</Text>
            </View>
          )}

          <View style={styles.successButtons}>
            <Pressable style={styles.primaryButton} onPress={handleContinueShopping}>
              <Home size={20} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Continue Shopping</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleViewOrders}>
              <ShoppingBag size={20} color="#10b981" />
              <Text style={styles.secondaryButtonText}>View My Orders</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background Gradient */}
      <Animated.View style={[{ opacity: fadeAnim }]}>
        <LinearGradient
          colors={CheckoutColors.primaryGradient as unknown as readonly [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color="#1e293b" />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={24} color="#1e293b" />
        </Pressable>
      </View>

      {/* Progress Summary */}
      {/* <View style={styles.progressSummary}>
        <View style={styles.progressSteps}>
          {[1, 2, 3, 4].map((num, index) => (
            <React.Fragment key={num}>
              <View style={[
                styles.progressDot,
                (completedSections.address && num <= 1) && styles.progressDotCompleted,
                (completedSections.shipping && num <= 2) && styles.progressDotCompleted,
                (completedSections.payment && num <= 3) && styles.progressDotCompleted,
              ]}>
                {((completedSections.address && num === 1) ||
                  (completedSections.shipping && num === 2) ||
                  (completedSections.payment && num === 3)) ? (
                  <Check size={10} color="#ffffff" />
                ) : (
                  <Text style={styles.progressDotText}>{num}</Text>
                )}
              </View>
              {index < 3 && (
                <View style={[
                  styles.progressLine,
                  ((completedSections.address && num === 1) ||
                   (completedSections.shipping && num === 2) ||
                   (completedSections.payment && num === 3)) && styles.progressLineCompleted,
                ]} />
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Address</Text>
          <Text style={styles.progressLabel}>Shipping</Text>
          <Text style={styles.progressLabel}>Payment</Text>
          <Text style={styles.progressLabel}>Review</Text>
        </View>
      </View> */}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== SECTION 1: DELIVERY ADDRESS ========== */}
        <View style={styles.section}>
          <SectionHeader
            icon={MapPin}
            iconColor="#10b981"
            title="Delivery Address"
            stepNumber={1}
            isExpanded={expandedSections.address}
            isCompleted={completedSections.address}
            onPress={() => toggleSection('address')}
          />

          {expandedSections.address && (
            <Animated.View style={styles.sectionContent}>
              <Text style={styles.sectionSubtitle}>Where should we deliver your order?</Text>

              {loadingAddresses ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingPulse}>
                    <MapPin size={32} color="#10b981" />
                  </View>
                  <Text style={styles.loadingText}>Finding your addresses...</Text>
                </View>
              ) : addresses.length === 0 ? (
                <Pressable
                  style={styles.emptyState}
                  onPress={() => {
                    if (router.canDismiss()) {
                      router.dismiss();
                      setTimeout(() => router.push('/checkout-addresses'), 100);
                    } else {
                      router.push('/checkout-addresses');
                    }
                  }}
                >
                  <View style={styles.emptyIcon}>
                    <Plus size={24} color="#10b981" />
                  </View>
                  <Text style={styles.emptyTitle}>No addresses found</Text>
                  <Text style={styles.emptySubtitle}>Add your first address to continue</Text>
                </Pressable>
              ) : (
                <>
                  {addresses.map((address) => {
                    const isSelected = selectedAddressId === address.id;
                    return (
                      <Pressable
                        key={address.id}
                        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                        onPress={() => setSelectedAddressId(address.id)}
                      >
                        {address.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Sparkles size={10} color="#ffffff" />
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                        <View style={styles.addressContent}>
                          <View style={styles.addressHeader}>
                            <Text style={styles.addressName}>
                              {address.firstName} {address.lastName}
                            </Text>
                            <View style={[styles.checkmark, isSelected && styles.checkmarkSelected]}>
                              {isSelected && <Check size={12} color="#ffffff" />}
                            </View>
                          </View>
                          <Text style={styles.addressLine}>{address.address1}</Text>
                          <Text style={styles.addressDetails}>
                            {address.city}, {address.country} - {address.zip}
                          </Text>
                          {address.phone && <Text style={styles.addressPhone}>{address.phone}</Text>}
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={styles.addNewButton}
                    onPress={() => {
                      if (router.canDismiss()) {
                        router.dismiss();
                        setTimeout(() => router.push('/addresses'), 100);
                      } else {
                        router.push('/addresses');
                      }
                    }}
                  >
                    <View style={styles.addNewIcon}>
                      <Plus size={16} color="#10b981" />
                    </View>
                    <Text style={styles.addNewText}>Add a new address</Text>
                  </Pressable>
                </>
              )}

              <Pressable
                style={styles.checkboxRow}
                onPress={() => setUseBillingForShipping(!useBillingForShipping)}
              >
                <View style={[styles.checkbox, useBillingForShipping && styles.checkboxChecked]}>
                  {useBillingForShipping && <Check size={10} color="#ffffff" />}
                </View>
                <Text style={styles.checkboxLabel}>Use same address for billing</Text>
              </Pressable>

              <Pressable
                style={[styles.continueButton, isLoading && styles.buttonDisabled]}
                onPress={handleSaveAddress}
                disabled={isLoading || !selectedAddressId}
              >
                <Text style={styles.continueButtonText}>
                  {isLoading ? 'Saving...' : 'Continue to Shipping'}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Collapsed summary */}
          {!expandedSections.address && completedSections.address && shippingAddress && (
            <View style={styles.collapsedSummary}>
              <Text style={styles.collapsedText}>
                {shippingAddress.firstName} {shippingAddress.lastName}
              </Text>
              <Text style={styles.collapsedSubtext}>
                {shippingAddress.address[0]}, {shippingAddress.city}
              </Text>
            </View>
          )}
        </View>

        {/* ========== SECTION 2: SHIPPING METHOD ========== */}
        <View style={[styles.section, !completedSections.address && styles.sectionDisabled]}>
          <SectionHeader
            icon={Package}
            iconColor="#34d399"
            title="Shipping Method"
            stepNumber={2}
            isExpanded={expandedSections.shipping}
            isCompleted={completedSections.shipping}
            onPress={() => completedSections.address && toggleSection('shipping')}
            disabled={!completedSections.address}
          />

          {expandedSections.shipping && completedSections.address && (
            <Animated.View style={styles.sectionContent}>
              <Text style={styles.sectionSubtitle}>Choose how you want your order delivered</Text>

              {shippingMethods.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingPulse}>
                    <Package size={32} color="#34d399" />
                  </View>
                  <Text style={styles.loadingText}>Finding shipping options...</Text>
                </View>
              ) : (
                <>
                  {shippingMethods.map((method) => {
                    const isSelected = selectedShippingMethod === method.code;
                    return (
                      <Pressable
                        key={method.code}
                        style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                        onPress={() => handleSelectShipping(method.code)}
                        disabled={isLoading}
                      >
                        <View style={styles.methodHeader}>
                          <View style={styles.methodIconBox}>
                            {method.code.includes('express') ? (
                              <Clock size={18} color="#ec4899" />
                            ) : (
                              <Package size={18} color="#3b82f6" />
                            )}
                          </View>
                          <View style={styles.methodInfo}>
                            <Text style={styles.methodLabel}>{method.label}</Text>
                            <Text style={styles.methodDescription}>
                              {method.code.includes('express') ? 'Fastest delivery option' : 'Standard delivery'}
                            </Text>
                          </View>
                          <Text style={styles.methodPrice}>{method.formattedPrice}</Text>
                        </View>
                        <View style={styles.methodDetails}>
                          <View style={styles.detailItem}>
                            <Clock size={12} color="#64748b" />
                            <Text style={styles.detailText}>
                              {method.code.includes('express') ? '1-2 business days' : '3-5 business days'}
                            </Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Shield size={12} color="#64748b" />
                            <Text style={styles.detailText}>Fully insured</Text>
                          </View>
                        </View>
                        <View style={styles.radioContainer}>
                          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={[styles.continueButton, (!selectedShippingMethod || isLoading) && styles.buttonDisabled]}
                    onPress={handleContinueToPayment}
                    disabled={!selectedShippingMethod || isLoading}
                  >
                    <Text style={styles.continueButtonText}>
                      {isLoading ? 'Processing...' : 'Continue to Payment'}
                    </Text>
                  </Pressable>
                </>
              )}
            </Animated.View>
          )}

          {/* Collapsed summary */}
          {!expandedSections.shipping && completedSections.shipping && selectedShipping && (
            <View style={styles.collapsedSummary}>
              <Text style={styles.collapsedText}>{selectedShipping.label}</Text>
              <Text style={styles.collapsedSubtext}>{selectedShipping.formattedPrice}</Text>
            </View>
          )}
        </View>

        {/* ========== SECTION 3: PAYMENT METHOD ========== */}
        <View style={[styles.section, !completedSections.shipping && styles.sectionDisabled]}>
          <SectionHeader
            icon={CreditCard}
            iconColor="#059669"
            title="Payment Method"
            stepNumber={3}
            isExpanded={expandedSections.payment}
            isCompleted={completedSections.payment}
            onPress={() => completedSections.shipping && toggleSection('payment')}
            disabled={!completedSections.shipping}
          />

          {expandedSections.payment && completedSections.shipping && (
            <Animated.View style={styles.sectionContent}>
              <Text style={styles.sectionSubtitle}>Choose your preferred payment method</Text>

              {paymentMethods.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingPulse}>
                    <CreditCard size={32} color="#059669" />
                  </View>
                  <Text style={styles.loadingText}>Loading payment methods...</Text>
                </View>
              ) : (
                <>
                  {paymentMethods.map((method) => {
                    const isSelected = selectedPaymentMethod === method.method;
                    return (
                      <Pressable
                        key={method.method}
                        style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                        onPress={() => handleSelectPayment(method.method)}
                        disabled={isLoading}
                      >
                        <View style={styles.methodContent}>
                          <View style={styles.methodIconBox}>
                            <CreditCard size={18} color={method.method === 'cashondelivery' ? '#f59e0b' : '#3b82f6'} />
                          </View>
                          <View style={styles.methodInfo}>
                            <Text style={styles.methodLabel}>{method.methodTitle}</Text>
                            {method.description && (
                              <Text style={styles.methodDescription}>{method.description}</Text>
                            )}
                            <View style={styles.securityBadge}>
                              <Shield size={12} color="#10b981" />
                              <Text style={styles.securityText}>Secure payment</Text>
                            </View>
                          </View>
                          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={[styles.continueButton, (!selectedPaymentMethod || isLoading) && styles.buttonDisabled]}
                    onPress={handleContinueToReview}
                    disabled={!selectedPaymentMethod || isLoading}
                  >
                    <Text style={styles.continueButtonText}>
                      {isLoading ? 'Processing...' : 'Review Order'}
                    </Text>
                  </Pressable>
                </>
              )}
            </Animated.View>
          )}

          {/* Collapsed summary */}
          {!expandedSections.payment && completedSections.payment && selectedPayment && (
            <View style={styles.collapsedSummary}>
              <Text style={styles.collapsedText}>{selectedPayment.methodTitle}</Text>
            </View>
          )}
        </View>

        {/* ========== SECTION 4: ORDER REVIEW ========== */}
        <View style={[styles.section, !completedSections.payment && styles.sectionDisabled]}>
          <SectionHeader
            icon={CheckCircle}
            iconColor="#10b981"
            title="Review & Place Order"
            stepNumber={4}
            isExpanded={expandedSections.review}
            isCompleted={false}
            onPress={() => completedSections.payment && toggleSection('review')}
            disabled={!completedSections.payment}
          />

          {expandedSections.review && completedSections.payment && (
            <Animated.View style={styles.sectionContent}>
              <Text style={styles.sectionSubtitle}>Please review your order before placing it</Text>

              {/* Order Items */}
              <View style={styles.reviewCard}>
                <Text style={styles.reviewCardTitle}>Order Summary</Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.orderItem}>
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName}>{item.product.name}</Text>
                      <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.orderItemPrice}>{getItemPrice(item)}</Text>
                  </View>
                ))}

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
                      <Text style={[styles.totalValue, styles.discountValue]}>-{getDiscountAmount()}</Text>
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
              <View style={styles.reviewCard}>
                <Text style={styles.reviewCardTitle}>Coupon Code</Text>
                {appliedCoupon ? (
                  <View style={styles.appliedCouponContainer}>
                    <View style={styles.appliedCouponBadge}>
                      <View style={styles.couponIconContainer}>
                        <Tag size={14} color="#ffffff" />
                      </View>
                      <Text style={styles.appliedCouponText}>{appliedCoupon}</Text>
                      <Pressable onPress={handleRemoveCoupon} style={styles.removeCouponButton}>
                        <X size={14} color="#ef4444" />
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
                      style={[styles.couponButton, (!couponCode.trim() || isApplyingCoupon) && styles.couponButtonDisabled]}
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

              {/* Delivery Info Summary */}
              {shippingAddress && (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <MapPin size={16} color="#10b981" />
                    <Text style={styles.reviewCardTitle}>Delivery Address</Text>
                  </View>
                  <Text style={styles.reviewText}>
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </Text>
                  <Text style={styles.reviewTextLight}>{shippingAddress.address[0]}</Text>
                  <Text style={styles.reviewTextLight}>
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postcode}
                  </Text>
                </View>
              )}

              {/* Shipping Method Summary */}
              {selectedShipping && (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <Package size={16} color="#34d399" />
                    <Text style={styles.reviewCardTitle}>Shipping Method</Text>
                  </View>
                  <Text style={styles.reviewText}>{selectedShipping.label}</Text>
                  <Text style={styles.reviewTextHighlight}>{selectedShipping.formattedPrice}</Text>
                </View>
              )}

              {/* Payment Method Summary */}
              {selectedPayment && (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <CreditCard size={16} color="#059669" />
                    <Text style={styles.reviewCardTitle}>Payment Method</Text>
                  </View>
                  <Text style={styles.reviewText}>{selectedPayment.methodTitle}</Text>
                </View>
              )}

              {/* Terms */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By placing your order, you agree to our Terms of Service and Privacy Policy. All transactions are secure and encrypted.
                </Text>
              </View>

              {/* Place Order Button */}
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
            </Animated.View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  progressSummary: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotCompleted: {
    backgroundColor: '#10b981',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  progressLineCompleted: {
    backgroundColor: '#10b981',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  progressLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionDisabled: {
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  sectionHeaderDisabled: {
    backgroundColor: '#f8fafc',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeCompleted: {
    backgroundColor: '#10b981',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stepBadgeTextCompleted: {
    color: '#ffffff',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  collapsedSummary: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  collapsedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  collapsedSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  // Address cards
  addressCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  addressCardSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  defaultBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  addressLine: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 13,
    color: '#64748b',
  },
  addressPhone: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#d1fae5',
    gap: 8,
  },
  addNewIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Method cards
  methodCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  methodCardSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  methodPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  methodDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  radioContainer: {
    alignItems: 'flex-end',
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
  radioOuterSelected: {
    borderColor: '#10b981',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  // Review section
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reviewCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  reviewTextLight: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  reviewTextHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
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
    marginTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
    borderTopColor: '#e2e8f0',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  // Coupon
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
  },
  couponButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  appliedCouponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  placeOrderButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
  // Success screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  successIconWrapper: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  orderInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderInfoText: {
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 8,
    fontWeight: '500',
  },
  successButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
