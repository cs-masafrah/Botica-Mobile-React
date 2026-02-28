"use client";

// app/checkout.tsx
import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
} from "lucide-react-native";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import { authService, Address } from "@/services/auth";
import { couponService } from "@/services/CouponService";
import { formatPrice } from "@/utils/currency";
import Colors from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<
    string | null
  >(null);
  const [showBillingSheet, setShowBillingSheet] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const billingSheetAnim = useRef(new Animated.Value(0)).current;

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
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

  const defaultCurrency = "ILS";

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
        // Find default address - property name changed from isDefault to defaultAddress
        const defaultAddress =
          result.find((a) => a.defaultAddress) || result[0];
        setSelectedAddressId(defaultAddress?.id || null);
      } catch (error) {
        console.error("Failed to load addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };
    loadAddresses();
    return () => {
      mounted = false;
    };
  }, []);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Map an address to the format expected by saveAddresses
  const mapAddress = (address: Address, useForShipping: boolean) => ({
    companyName: address.companyName || "",
    firstName: address.firstName,
    lastName: address.lastName,
    email: address.email,
    vatId: address.vatId || "",
    address: [address.address], // Convert to array
    country: address.country,
    state: address.state,
    city: address.city,
    postcode: address.postcode,
    phone: address.phone,
    defaultAddress: address.defaultAddress,
    useForShipping,
  });

  // Open billing address bottom sheet
  const openBillingSheet = () => {
    // Default billing selection to the current shipping address
    if (!selectedBillingAddressId) {
      setSelectedBillingAddressId(selectedAddressId);
    }
    setShowBillingSheet(true);
    Animated.timing(billingSheetAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Close billing address bottom sheet
  const closeBillingSheet = () => {
    Animated.timing(billingSheetAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowBillingSheet(false);
    });
  };

  // Confirm the billing address selection from the sheet
  const confirmBillingAddress = () => {
    closeBillingSheet();
  };

  // Handle toggling the "use same address" checkbox
  const handleToggleBillingForShipping = (newValue: boolean) => {
    setUseBillingForShipping(newValue);
    if (!newValue) {
      // User wants a different billing address - open the sheet
      openBillingSheet();
    } else {
      // Reset billing address to match shipping
      setSelectedBillingAddressId(null);
    }
  };

  // Handle address save and continue
  const handleSaveAddress = async () => {
    try {
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddress) {
        Alert.alert(t("error"), t("pleaseSelectAddress"));
        return;
      }

      // Determine the billing address
      let billingAddr;
      if (useBillingForShipping) {
        // Same address for both
        billingAddr = selectedAddress;
      } else {
        // Separate billing address
        const billingAddrObj = addresses.find(
          (a) => a.id === selectedBillingAddressId,
        );
        if (!billingAddrObj) {
          Alert.alert(t("error"), t("pleaseSelectBillingAddress"));
          return;
        }
        billingAddr = billingAddrObj;
      }

      const mappedShipping = mapAddress(selectedAddress, true);
      const mappedBilling = mapAddress(billingAddr, false);

      console.log("Shipping address:", mappedShipping);
      console.log("Billing address:", mappedBilling);

      await saveAddresses(mappedBilling, mappedShipping);
      setCompletedSections((prev) => ({ ...prev, address: true }));
      setExpandedSections((prev) => ({
        ...prev,
        address: false,
        shipping: true,
      }));

      // Scroll to shipping section
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 200, animated: true });
      }, 100);
    } catch (error) {
      console.error("Error saving addresses:", error);
      Alert.alert(
        t("error"),
        error instanceof Error ? error.message : t("failedToSaveAddress"),
      );
    }
  };

  // Handle shipping method selection
  const handleSelectShipping = async (methodCode: string) => {
    try {
      await selectShippingMethod(methodCode);

      loadCart(true); // Refresh cart to get updated totals based on shipping method
    } catch (error) {
      console.error("Failed to select shipping method:", error);
    }
  };

  const handleContinueToPayment = () => {
    if (selectedShippingMethod) {
      setStep(3);
      setCompletedSections((prev) => ({ ...prev, shipping: true }));
      setExpandedSections((prev) => ({
        ...prev,
        shipping: false,
        payment: true,
      }));
    }
  };

  // Handle payment method selection
  const handleSelectPayment = async (method: string) => {
    try {
      await selectPaymentMethod(method);
    } catch (error) {
      console.error("Failed to select payment method:", error);
    }
  };

  const handleContinueToReview = () => {
    if (selectedPaymentMethod) {
      setStep(4);
      setCompletedSections((prev) => ({ ...prev, payment: true }));
      setExpandedSections((prev) => ({
        ...prev,
        payment: false,
        review: true,
      }));
    }
  };

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert(t("error"), t("pleaseEnterCouponCode"));
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const result = await couponService.applyCoupon(couponCode.trim());
      if (result.success && result.cart) {
        Alert.alert(
          t("success"),
          result.message || t("couponAppliedSuccessfully"),
        );
        setAppliedCoupon(couponCode.trim());
        setCouponCode("");
        await loadCart(true);
      } else {
        Alert.alert(t("error"), result.message || t("failedToApplyCoupon"));
      }
    } catch (error: any) {
      Alert.alert(t("error"), error.message || t("failedToApplyCoupon"));
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
        Alert.alert(t("error"), result.message || t("failedToRemoveCoupon"));
      }
    } catch (error: any) {
      Alert.alert(t("error"), error.message || t("failedToRemoveCoupon"));
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    Alert.alert(t("confirmOrder"), t("areYouSurePlaceOrder"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("placeOrder"),
        style: "default",
        onPress: async () => {
          try {
            await placeOrder();
          } catch (error: any) {
            Alert.alert(t("error"), error.message || t("failedToPlaceOrder"));
          }
        },
      },
    ]);
  };

  // Success handlers
  const handleContinueShopping = () => {
    clearCart();
    resetCheckout();
    router.replace("/(tabs)");
  };

  const handleViewOrders = () => {
    clearCart();
    resetCheckout();
    if (router.canDismiss()) {
      router.dismiss();
      setTimeout(() => router.push("/order-history"), 200);
    } else {
      router.push("/order-history");
    }
  };

  const handleBack = () => {
    if (step === 5) {
      resetCheckout();
      router.replace("/(tabs)");
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
    if (discount <= 0) return "";
    const currency = cartDetails?.currencyCode || defaultCurrency;
    return formatPrice(discount, currency);
  };

  const selectedShipping = shippingMethods.find(
    (m) => m.code === selectedShippingMethod,
  );
  const selectedPayment = paymentMethods.find(
    (m) => m.method === selectedPaymentMethod,
  );

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
      <View
        style={[styles.sectionHeaderLeft, isRTL && styles.sectionHeaderLeftRTL]}
      >
        <View
          style={[styles.stepBadge, isCompleted && styles.stepBadgeCompleted]}
        >
          {isCompleted ? (
            <Check size={14} color={Colors.white} />
          ) : (
            <Text
              style={[
                styles.stepBadgeText,
                isCompleted && styles.stepBadgeTextCompleted,
              ]}
            >
              {stepNumber}
            </Text>
          )}
        </View>
        <View style={[styles.sectionIcon, { backgroundColor: iconColor }]}>
          <Icon size={18} color={Colors.white} />
        </View>
        <Text
          style={[
            styles.sectionHeaderTitle,
            isRTL && styles.sectionHeaderTitleRTL,
          ]}
        >
          {title}
        </Text>
      </View>
      {!disabled &&
        (isExpanded ? (
          <ChevronUp size={20} color={Colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={Colors.textSecondary} />
        ))}
    </Pressable>
  );

  // If order is successful, show success screen
  if (step === 5) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View
          style={[styles.successContainer, isRTL && styles.successContainerRTL]}
        >
          <View style={styles.successIconWrapper}>
            <CheckCircle size={80} color={Colors.primary} />
          </View>
          <Text style={[styles.successTitle, isRTL && styles.successTitleRTL]}>
            {t("orderPlacedSuccessfully")}
          </Text>
          <Text
            style={[styles.successMessage, isRTL && styles.successMessageRTL]}
          >
            {t("thankYouForPurchase")}
          </Text>

          {orderResult?.order && (
            <View
              style={[styles.orderInfoCard, isRTL && styles.orderInfoCardRTL]}
            >
              <Text
                style={[styles.orderInfoText, isRTL && styles.orderInfoTextRTL]}
              >
                {t("orderNumber")}: {orderResult.order.incrementId}
              </Text>
              <Text
                style={[styles.orderInfoText, isRTL && styles.orderInfoTextRTL]}
              >
                {t("status")}: {orderResult.order.status}
              </Text>
              <Text
                style={[styles.orderInfoText, isRTL && styles.orderInfoTextRTL]}
              >
                {t("total")}: {formatPrice(orderResult.order.grandTotal)}
              </Text>
            </View>
          )}

          <View
            style={[styles.successButtons, isRTL && styles.successButtonsRTL]}
          >
            <Pressable
              style={[styles.primaryButton, isRTL && styles.primaryButtonRTL]}
              onPress={handleContinueShopping}
            >
              <Home size={20} color={Colors.white} />
              <Text
                style={[
                  styles.primaryButtonText,
                  isRTL && styles.primaryButtonTextRTL,
                ]}
              >
                {t("continueShopping")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                isRTL && styles.secondaryButtonRTL,
              ]}
              onPress={handleViewOrders}
            >
              <ShoppingBag size={20} color={Colors.primary} />
              <Text
                style={[
                  styles.secondaryButtonText,
                  isRTL && styles.secondaryButtonTextRTL,
                ]}
              >
                {t("viewMyOrders")}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top },
        isRTL && styles.containerRTL,
      ]}
    >
      {/* Background Gradient */}
      <Animated.View style={[{ opacity: fadeAnim }]}>
        <LinearGradient
          colors={[Colors.background, Colors.borderLight]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Pressable
          style={[styles.backButton, isRTL && styles.backButtonRTL]}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </Pressable>
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {t("checkout")}
        </Text>
        <Pressable
          style={[styles.closeButton, isRTL && styles.closeButtonRTL]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={Colors.white} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== SECTION 1: DELIVERY ADDRESS ========== */}
        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <SectionHeader
            icon={MapPin}
            iconColor={Colors.primary}
            title={t("deliveryAddress")}
            stepNumber={1}
            isExpanded={expandedSections.address}
            isCompleted={completedSections.address}
            onPress={() => toggleSection("address")}
          />

          {expandedSections.address && (
            <Animated.View
              style={[styles.sectionContent, isRTL && styles.sectionContentRTL]}
            >
              <Text
                style={[
                  styles.sectionSubtitle,
                  isRTL && styles.sectionSubtitleRTL,
                ]}
              >
                {t("whereShouldWeDeliver")}
              </Text>

              {loadingAddresses ? (
                <View
                  style={[
                    styles.loadingContainer,
                    isRTL && styles.loadingContainerRTL,
                  ]}
                >
                  <View style={styles.loadingPulse}>
                    <MapPin size={32} color={Colors.primary} />
                  </View>
                  <Text
                    style={[styles.loadingText, isRTL && styles.loadingTextRTL]}
                  >
                    {t("findingAddresses")}
                  </Text>
                </View>
              ) : addresses.length === 0 ? (
                <Pressable
                  style={[styles.emptyState, isRTL && styles.emptyStateRTL]}
                  onPress={() => {
                    if (router.canDismiss()) {
                      router.dismiss();
                      setTimeout(() => router.push("/checkout-addresses"), 100);
                    } else {
                      router.push("/checkout-addresses");
                    }
                  }}
                >
                  <View style={styles.emptyIcon}>
                    <Plus size={24} color={Colors.primary} />
                  </View>
                  <Text
                    style={[styles.emptyTitle, isRTL && styles.emptyTitleRTL]}
                  >
                    {t("noAddressesFound")}
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      isRTL && styles.emptySubtitleRTL,
                    ]}
                  >
                    {t("addFirstAddress")}
                  </Text>
                </Pressable>
              ) : (
                <>
                  {addresses.map((address) => {
                    const isSelected = selectedAddressId === address.id;
                    return (
                      <Pressable
                        key={address.id}
                        style={[
                          styles.addressCard,
                          isSelected && styles.addressCardSelected,
                          isRTL && styles.addressCardRTL,
                        ]}
                        onPress={() => setSelectedAddressId(address.id)}
                      >
                        {address.defaultAddress && (
                          <View
                            style={[
                              styles.defaultBadge,
                              isRTL && styles.defaultBadgeRTL,
                            ]}
                          >
                            <Sparkles size={10} color={Colors.white} />
                            <Text style={styles.defaultBadgeText}>
                              {t("default")}
                            </Text>
                          </View>
                        )}
                        <View
                          style={[
                            styles.addressContent,
                            isRTL && styles.addressContentRTL,
                          ]}
                        >
                          <View
                            style={[
                              styles.addressHeader,
                              isRTL && styles.addressHeaderRTL,
                            ]}
                          >
                            <Text
                              style={[
                                styles.addressName,
                                isRTL && styles.addressNameRTL,
                              ]}
                            >
                              {address.firstName} {address.lastName}
                            </Text>
                            <View
                              style={[
                                styles.checkmark,
                                isSelected && styles.checkmarkSelected,
                                isRTL && styles.checkmarkRTL,
                              ]}
                            >
                              {isSelected && (
                                <Check size={12} color={Colors.white} />
                              )}
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.addressLine,
                              isRTL && styles.addressLineRTL,
                            ]}
                          >
                            {address.address}
                          </Text>
                          <Text
                            style={[
                              styles.addressDetails,
                              isRTL && styles.addressDetailsRTL,
                            ]}
                          >
                            {address.city}, {address.country} -{" "}
                            {address.postcode}
                          </Text>
                          {address.phone && (
                            <Text
                              style={[
                                styles.addressPhone,
                                isRTL && styles.addressPhoneRTL,
                              ]}
                            >
                              {address.phone}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={[
                      styles.addNewButton,
                      isRTL && styles.addNewButtonRTL,
                    ]}
                    onPress={() => {
                      if (router.canDismiss()) {
                        router.dismiss();
                        setTimeout(() => router.push("/addresses"), 100);
                      } else {
                        router.push("/addresses");
                      }
                    }}
                  >
                    <View style={styles.addNewIcon}>
                      <Plus size={16} color={Colors.primary} />
                    </View>
                    <Text
                      style={[styles.addNewText, isRTL && styles.addNewTextRTL]}
                    >
                      {t("addNewAddress")}
                    </Text>
                  </Pressable>
                </>
              )}

              <Pressable
                style={[styles.checkboxRow, isRTL && styles.checkboxRowRTL]}
                onPress={() =>
                  handleToggleBillingForShipping(!useBillingForShipping)
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    useBillingForShipping && styles.checkboxChecked,
                    isRTL && styles.checkboxRTL,
                  ]}
                >
                  {useBillingForShipping && (
                    <Check size={10} color={Colors.white} />
                  )}
                </View>
                <Text
                  style={[
                    styles.checkboxLabel,
                    isRTL && styles.checkboxLabelRTL,
                  ]}
                >
                  {t("useSameAddressForBilling")}
                </Text>
              </Pressable>

              {/* Billing address summary when using a different address */}
              {!useBillingForShipping &&
                selectedBillingAddressId &&
                (() => {
                  const billingAddr = addresses.find(
                    (a) => a.id === selectedBillingAddressId,
                  );
                  if (!billingAddr) return null;
                  return (
                    <View
                      style={[
                        styles.billingAddressSummary,
                        isRTL && styles.billingAddressSummaryRTL,
                      ]}
                    >
                      <View
                        style={[
                          styles.billingAddressHeader,
                          isRTL && styles.billingAddressHeaderRTL,
                        ]}
                      >
                        <View
                          style={[
                            styles.billingAddressLabel,
                            isRTL && styles.billingAddressLabelRTL,
                          ]}
                        >
                          <CreditCard size={14} color={Colors.primary} />
                          <Text
                            style={[
                              styles.billingAddressLabelText,
                              isRTL && styles.billingAddressLabelTextRTL,
                            ]}
                          >
                            {t("billingAddress")}
                          </Text>
                        </View>
                        <Pressable onPress={openBillingSheet}>
                          <Text
                            style={[
                              styles.billingChangeText,
                              isRTL && styles.billingChangeTextRTL,
                            ]}
                          >
                            {t("change")}
                          </Text>
                        </Pressable>
                      </View>
                      <Text
                        style={[
                          styles.billingAddressName,
                          isRTL && styles.billingAddressNameRTL,
                        ]}
                      >
                        {billingAddr.firstName} {billingAddr.lastName}
                      </Text>
                      <Text
                        style={[
                          styles.billingAddressLine,
                          isRTL && styles.billingAddressLineRTL,
                        ]}
                      >
                        {billingAddr.address}
                      </Text>
                      <Text
                        style={[
                          styles.billingAddressDetails,
                          isRTL && styles.billingAddressDetailsRTL,
                        ]}
                      >
                        {billingAddr.city}, {billingAddr.country} -{" "}
                        {billingAddr.postcode}
                      </Text>
                    </View>
                  );
                })()}

              <Pressable
                style={[
                  styles.continueButton,
                  (isLoading ||
                    !selectedAddressId ||
                    (!useBillingForShipping && !selectedBillingAddressId)) &&
                    styles.buttonDisabled,
                  isRTL && styles.continueButtonRTL,
                ]}
                onPress={handleSaveAddress}
                disabled={
                  isLoading ||
                  !selectedAddressId ||
                  (!useBillingForShipping && !selectedBillingAddressId)
                }
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    isRTL && styles.continueButtonTextRTL,
                  ]}
                >
                  {isLoading ? t("saving") : t("continueToShipping")}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Collapsed summary */}
          {!expandedSections.address &&
            completedSections.address &&
            shippingAddress && (
              <View
                style={[
                  styles.collapsedSummary,
                  isRTL && styles.collapsedSummaryRTL,
                ]}
              >
                <View
                  style={[
                    styles.collapsedAddressRow,
                    isRTL && styles.collapsedAddressRowRTL,
                  ]}
                >
                  <MapPin size={12} color={Colors.primary} />
                  <Text
                    style={[
                      styles.collapsedAddressLabel,
                      isRTL && styles.collapsedAddressLabelRTL,
                    ]}
                  >
                    {t("shipping")}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.collapsedText,
                    isRTL && styles.collapsedTextRTL,
                  ]}
                >
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </Text>
                <Text
                  style={[
                    styles.collapsedSubtext,
                    isRTL && styles.collapsedSubtextRTL,
                  ]}
                >
                  {shippingAddress.address}, {shippingAddress.city}
                </Text>
                {!useBillingForShipping && billingAddress && (
                  <View
                    style={[
                      styles.collapsedBillingSection,
                      isRTL && styles.collapsedBillingSectionRTL,
                    ]}
                  >
                    <View
                      style={[
                        styles.collapsedAddressRow,
                        isRTL && styles.collapsedAddressRowRTL,
                      ]}
                    >
                      <CreditCard size={12} color={Colors.primary} />
                      <Text
                        style={[
                          styles.collapsedAddressLabel,
                          isRTL && styles.collapsedAddressLabelRTL,
                        ]}
                      >
                        {t("billing")}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.collapsedText,
                        isRTL && styles.collapsedTextRTL,
                      ]}
                    >
                      {billingAddress.firstName} {billingAddress.lastName}
                    </Text>
                    <Text
                      style={[
                        styles.collapsedSubtext,
                        isRTL && styles.collapsedSubtextRTL,
                      ]}
                    >
                      {billingAddress.address}, {billingAddress.city}
                    </Text>
                  </View>
                )}
              </View>
            )}
        </View>

        {/* ========== SECTION 2: SHIPPING METHOD ========== */}
        <View
          style={[
            styles.section,
            !completedSections.address && styles.sectionDisabled,
            isRTL && styles.sectionRTL,
          ]}
        >
          <SectionHeader
            icon={Package}
            iconColor={Colors.primary}
            title={t("shippingMethod")}
            stepNumber={2}
            isExpanded={expandedSections.shipping}
            isCompleted={completedSections.shipping}
            onPress={() =>
              completedSections.address && toggleSection("shipping")
            }
            disabled={!completedSections.address}
          />

          {expandedSections.shipping && completedSections.address && (
            <Animated.View
              style={[styles.sectionContent, isRTL && styles.sectionContentRTL]}
            >
              <Text
                style={[
                  styles.sectionSubtitle,
                  isRTL && styles.sectionSubtitleRTL,
                ]}
              >
                {t("chooseDeliveryMethod")}
              </Text>

              {shippingMethods.length === 0 ? (
                <View
                  style={[
                    styles.loadingContainer,
                    isRTL && styles.loadingContainerRTL,
                  ]}
                >
                  <View style={styles.loadingPulse}>
                    <Package size={32} color={Colors.primary} />
                  </View>
                  <Text
                    style={[styles.loadingText, isRTL && styles.loadingTextRTL]}
                  >
                    {t("findingShippingOptions")}
                  </Text>
                </View>
              ) : (
                <>
                  {shippingMethods.map((method) => {
                    const isSelected = selectedShippingMethod === method.code;
                    return (
                      <Pressable
                        key={method.code}
                        style={[
                          styles.methodCard,
                          isSelected && styles.methodCardSelected,
                          isRTL && styles.methodCardRTL,
                        ]}
                        onPress={() => handleSelectShipping(method.code)}
                        disabled={isLoading}
                      >
                        <View
                          style={[
                            styles.methodHeader,
                            isRTL && styles.methodHeaderRTL,
                          ]}
                        >
                          <View
                            style={[
                              styles.methodIconBox,
                              isRTL && styles.methodIconBoxRTL,
                            ]}
                          >
                            {method.code.includes("express") ? (
                              <Clock size={18} color={Colors.white} />
                            ) : (
                              <Package size={18} color={Colors.white} />
                            )}
                          </View>
                          <View
                            style={[
                              styles.methodInfo,
                              isRTL && styles.methodInfoRTL,
                            ]}
                          >
                            <Text
                              style={[
                                styles.methodLabel,
                                isRTL && styles.methodLabelRTL,
                              ]}
                            >
                              {method.label}
                            </Text>
                            <Text
                              style={[
                                styles.methodDescription,
                                isRTL && styles.methodDescriptionRTL,
                              ]}
                            >
                              {method.code.includes("express")
                                ? t("fastestDelivery")
                                : t("standardDelivery")}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.methodPrice,
                              isRTL && styles.methodPriceRTL,
                            ]}
                          >
                            {method.formattedPrice}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.methodDetails,
                            isRTL && styles.methodDetailsRTL,
                          ]}
                        >
                          <View
                            style={[
                              styles.detailItem,
                              isRTL && styles.detailItemRTL,
                            ]}
                          >
                            <Clock size={12} color={Colors.textSecondary} />
                            <Text
                              style={[
                                styles.detailText,
                                isRTL && styles.detailTextRTL,
                              ]}
                            >
                              {method.code.includes("express")
                                ? t("oneToTwoDays")
                                : t("threeToFiveDays")}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.detailItem,
                              isRTL && styles.detailItemRTL,
                            ]}
                          >
                            <Shield size={12} color={Colors.textSecondary} />
                            <Text
                              style={[
                                styles.detailText,
                                isRTL && styles.detailTextRTL,
                              ]}
                            >
                              {t("fullyInsured")}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.radioContainer,
                            isRTL && styles.radioContainerRTL,
                          ]}
                        >
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected && styles.radioOuterSelected,
                              isRTL && styles.radioOuterRTL,
                            ]}
                          >
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={[
                      styles.continueButton,
                      (!selectedShippingMethod || isLoading) &&
                        styles.buttonDisabled,
                      isRTL && styles.continueButtonRTL,
                    ]}
                    onPress={handleContinueToPayment}
                    disabled={!selectedShippingMethod || isLoading}
                  >
                    <Text
                      style={[
                        styles.continueButtonText,
                        isRTL && styles.continueButtonTextRTL,
                      ]}
                    >
                      {isLoading ? t("processing") : t("continueToPayment")}
                    </Text>
                  </Pressable>
                </>
              )}
            </Animated.View>
          )}

          {/* Collapsed summary */}
          {!expandedSections.shipping &&
            completedSections.shipping &&
            selectedShipping && (
              <View
                style={[
                  styles.collapsedSummary,
                  isRTL && styles.collapsedSummaryRTL,
                ]}
              >
                <Text
                  style={[
                    styles.collapsedText,
                    isRTL && styles.collapsedTextRTL,
                  ]}
                >
                  {selectedShipping.label}
                </Text>
                <Text
                  style={[
                    styles.collapsedSubtext,
                    isRTL && styles.collapsedSubtextRTL,
                  ]}
                >
                  {selectedShipping.formattedPrice}
                </Text>
              </View>
            )}
        </View>

        {/* ========== SECTION 3: PAYMENT METHOD ========== */}
        <View
          style={[
            styles.section,
            !completedSections.shipping && styles.sectionDisabled,
            isRTL && styles.sectionRTL,
          ]}
        >
          <SectionHeader
            icon={CreditCard}
            iconColor={Colors.primary}
            title={t("paymentMethod")}
            stepNumber={3}
            isExpanded={expandedSections.payment}
            isCompleted={completedSections.payment}
            onPress={() =>
              completedSections.shipping && toggleSection("payment")
            }
            disabled={!completedSections.shipping}
          />

          {expandedSections.payment && completedSections.shipping && (
            <Animated.View
              style={[styles.sectionContent, isRTL && styles.sectionContentRTL]}
            >
              <Text
                style={[
                  styles.sectionSubtitle,
                  isRTL && styles.sectionSubtitleRTL,
                ]}
              >
                {t("choosePaymentMethod")}
              </Text>

              {paymentMethods.length === 0 ? (
                <View
                  style={[
                    styles.loadingContainer,
                    isRTL && styles.loadingContainerRTL,
                  ]}
                >
                  <View style={styles.loadingPulse}>
                    <CreditCard size={32} color={Colors.primary} />
                  </View>
                  <Text
                    style={[styles.loadingText, isRTL && styles.loadingTextRTL]}
                  >
                    {t("loadingPaymentMethods")}
                  </Text>
                </View>
              ) : (
                <>
                  {paymentMethods.map((method) => {
                    const isSelected = selectedPaymentMethod === method.method;
                    return (
                      <Pressable
                        key={method.method}
                        style={[
                          styles.methodCard,
                          isSelected && styles.methodCardSelected,
                          isRTL && styles.methodCardRTL,
                        ]}
                        onPress={() => handleSelectPayment(method.method)}
                        disabled={isLoading}
                      >
                        <View
                          style={[
                            styles.methodContent,
                            isRTL && styles.methodContentRTL,
                          ]}
                        >
                          <View
                            style={[
                              styles.methodIconBox,
                              isRTL && styles.methodIconBoxRTL,
                            ]}
                          >
                            <CreditCard size={18} color={Colors.white} />
                          </View>
                          <View
                            style={[
                              styles.methodInfo,
                              isRTL && styles.methodInfoRTL,
                            ]}
                          >
                            <Text
                              style={[
                                styles.methodLabel,
                                isRTL && styles.methodLabelRTL,
                              ]}
                            >
                              {method.methodTitle}
                            </Text>
                            {method.description && (
                              <Text
                                style={[
                                  styles.methodDescription,
                                  isRTL && styles.methodDescriptionRTL,
                                ]}
                              >
                                {method.description}
                              </Text>
                            )}
                            <View
                              style={[
                                styles.securityBadge,
                                isRTL && styles.securityBadgeRTL,
                              ]}
                            >
                              <Shield size={12} color={Colors.primary} />
                              <Text
                                style={[
                                  styles.securityText,
                                  isRTL && styles.securityTextRTL,
                                ]}
                              >
                                {t("securePayment")}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected && styles.radioOuterSelected,
                              isRTL && styles.radioOuterRTL,
                            ]}
                          >
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={[
                      styles.continueButton,
                      (!selectedPaymentMethod || isLoading) &&
                        styles.buttonDisabled,
                      isRTL && styles.continueButtonRTL,
                    ]}
                    onPress={handleContinueToReview}
                    disabled={!selectedPaymentMethod || isLoading}
                  >
                    <Text
                      style={[
                        styles.continueButtonText,
                        isRTL && styles.continueButtonTextRTL,
                      ]}
                    >
                      {isLoading ? t("processing") : t("reviewOrder")}
                    </Text>
                  </Pressable>
                </>
              )}
            </Animated.View>
          )}

          {/* Collapsed summary */}
          {!expandedSections.payment &&
            completedSections.payment &&
            selectedPayment && (
              <View
                style={[
                  styles.collapsedSummary,
                  isRTL && styles.collapsedSummaryRTL,
                ]}
              >
                <Text
                  style={[
                    styles.collapsedText,
                    isRTL && styles.collapsedTextRTL,
                  ]}
                >
                  {selectedPayment.methodTitle}
                </Text>
              </View>
            )}
        </View>

        {/* ========== SECTION 4: ORDER REVIEW ========== */}
        <View
          style={[
            styles.section,
            !completedSections.payment && styles.sectionDisabled,
            isRTL && styles.sectionRTL,
          ]}
        >
          <SectionHeader
            icon={CheckCircle}
            iconColor={Colors.primary}
            title={t("reviewOrder")}
            stepNumber={4}
            isExpanded={expandedSections.review}
            isCompleted={false}
            onPress={() => completedSections.payment && toggleSection("review")}
            disabled={!completedSections.payment}
          />

          {expandedSections.review && completedSections.payment && (
            <Animated.View
              style={[styles.sectionContent, isRTL && styles.sectionContentRTL]}
            >
              <Text
                style={[
                  styles.sectionSubtitle,
                  isRTL && styles.sectionSubtitleRTL,
                ]}
              >
                {t("reviewOrderBeforePlacing")}
              </Text>

              {/* Order Items */}
              <View style={[styles.reviewCard, isRTL && styles.reviewCardRTL]}>
                <Text
                  style={[
                    styles.reviewCardTitle,
                    isRTL && styles.reviewCardTitleRTL,
                  ]}
                >
                  {t("orderSummary")}
                </Text>
                {items.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.orderItem, isRTL && styles.orderItemRTL]}
                  >
                    <View
                      style={[
                        styles.orderItemInfo,
                        isRTL && styles.orderItemInfoRTL,
                      ]}
                    >
                      <Text
                        style={[
                          styles.orderItemName,
                          isRTL && styles.orderItemNameRTL,
                        ]}
                      >
                        {item.product.name}
                      </Text>
                      <Text
                        style={[
                          styles.orderItemQuantity,
                          isRTL && styles.orderItemQuantityRTL,
                        ]}
                      >
                        {t("qty")}: {item.quantity}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.orderItemPrice,
                        isRTL && styles.orderItemPriceRTL,
                      ]}
                    >
                      {getItemPrice(item)}
                    </Text>
                  </View>
                ))}

                <View
                  style={[
                    styles.totalsContainer,
                    isRTL && styles.totalsContainerRTL,
                  ]}
                >
                  <View style={[styles.totalRow, isRTL && styles.totalRowRTL]}>
                    <Text
                      style={[styles.totalLabel, isRTL && styles.totalLabelRTL]}
                    >
                      {t("subtotal")}
                    </Text>
                    <Text
                      style={[styles.totalValue, isRTL && styles.totalValueRTL]}
                    >
                      {formatPrice(
                        cartDetails?.subTotal || 0,
                        cartDetails?.currencyCode || defaultCurrency,
                      )}
                    </Text>
                  </View>
                  {cartDetails?.discountAmount > 0 && (
                    <View
                      style={[styles.totalRow, isRTL && styles.totalRowRTL]}
                    >
                      <Text
                        style={[
                          styles.totalLabel,
                          isRTL && styles.totalLabelRTL,
                        ]}
                      >
                        {t("discount")}
                      </Text>
                      <Text
                        style={[
                          styles.totalValue,
                          styles.discountValue,
                          isRTL && styles.totalValueRTL,
                        ]}
                      >
                        -{getDiscountAmount()}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.totalRow, isRTL && styles.totalRowRTL]}>
                    <Text
                      style={[styles.totalLabel, isRTL && styles.totalLabelRTL]}
                    >
                      {t("shipping")}
                    </Text>
                    <Text
                      style={[styles.totalValue, isRTL && styles.totalValueRTL]}
                    >
                      {formatPrice(
                        cartDetails?.shippingAmount || 0,
                        cartDetails?.currencyCode || defaultCurrency,
                      )}
                    </Text>
                  </View>
                  {cartDetails?.taxTotal > 0 && (
                    <View
                      style={[styles.totalRow, isRTL && styles.totalRowRTL]}
                    >
                      <Text
                        style={[
                          styles.totalLabel,
                          isRTL && styles.totalLabelRTL,
                        ]}
                      >
                        {t("tax")}
                      </Text>
                      <Text
                        style={[
                          styles.totalValue,
                          isRTL && styles.totalValueRTL,
                        ]}
                      >
                        {formatPrice(
                          cartDetails?.taxTotal || 0,
                          cartDetails?.currencyCode || defaultCurrency,
                        )}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.totalRow,
                      styles.grandTotalRow,
                      isRTL && styles.totalRowRTL,
                    ]}
                  >
                    <Text
                      style={[
                        styles.grandTotalLabel,
                        isRTL && styles.grandTotalLabelRTL,
                      ]}
                    >
                      {t("total")}
                    </Text>
                    <Text
                      style={[
                        styles.grandTotalValue,
                        isRTL && styles.grandTotalValueRTL,
                      ]}
                    >
                      {getCartTotal()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Coupon Section */}
              <View style={[styles.reviewCard, isRTL && styles.reviewCardRTL]}>
                <Text
                  style={[
                    styles.reviewCardTitle,
                    isRTL && styles.reviewCardTitleRTL,
                  ]}
                >
                  {t("couponCode")}
                </Text>
                {appliedCoupon ? (
                  <View
                    style={[
                      styles.appliedCouponContainer,
                      isRTL && styles.appliedCouponContainerRTL,
                    ]}
                  >
                    <View
                      style={[
                        styles.appliedCouponBadge,
                        isRTL && styles.appliedCouponBadgeRTL,
                      ]}
                    >
                      <View style={styles.couponIconContainer}>
                        <Tag size={14} color={Colors.white} />
                      </View>
                      <Text
                        style={[
                          styles.appliedCouponText,
                          isRTL && styles.appliedCouponTextRTL,
                        ]}
                      >
                        {appliedCoupon}
                      </Text>
                      <Pressable
                        onPress={handleRemoveCoupon}
                        style={[
                          styles.removeCouponButton,
                          isRTL && styles.removeCouponButtonRTL,
                        ]}
                      >
                        <X size={14} color={Colors.error} />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.couponContainer,
                      isRTL && styles.couponContainerRTL,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.couponInput,
                        isRTL && styles.couponInputRTL,
                      ]}
                      placeholder={t("enterCouponCode")}
                      value={couponCode}
                      onChangeText={setCouponCode}
                      placeholderTextColor={Colors.textSecondary}
                      autoCapitalize="characters"
                    />
                    <Pressable
                      style={[
                        styles.couponButton,
                        (!couponCode.trim() || isApplyingCoupon) &&
                          styles.couponButtonDisabled,
                        isRTL && styles.couponButtonRTL,
                      ]}
                      onPress={handleApplyCoupon}
                      disabled={!couponCode.trim() || isApplyingCoupon}
                    >
                      {isApplyingCoupon ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text
                          style={[
                            styles.couponButtonText,
                            isRTL && styles.couponButtonTextRTL,
                          ]}
                        >
                          {t("apply")}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Delivery Info Summary */}
              {shippingAddress && (
                <View
                  style={[styles.reviewCard, isRTL && styles.reviewCardRTL]}
                >
                  <View
                    style={[
                      styles.reviewCardHeader,
                      isRTL && styles.reviewCardHeaderRTL,
                    ]}
                  >
                    <MapPin size={16} color={Colors.primary} />
                    <Text
                      style={[
                        styles.reviewCardTitle,
                        isRTL && styles.reviewCardTitleRTL,
                      ]}
                    >
                      {t("shippingAddress")}
                    </Text>
                  </View>
                  <Text
                    style={[styles.reviewText, isRTL && styles.reviewTextRTL]}
                  >
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </Text>
                  <Text
                    style={[
                      styles.reviewTextLight,
                      isRTL && styles.reviewTextLightRTL,
                    ]}
                  >
                    {shippingAddress.address}
                  </Text>
                  <Text
                    style={[
                      styles.reviewTextLight,
                      isRTL && styles.reviewTextLightRTL,
                    ]}
                  >
                    {shippingAddress.city}, {shippingAddress.state}{" "}
                    {shippingAddress.postcode}
                  </Text>
                </View>
              )}

              {/* Billing Address Summary (shown when different from shipping) */}
              {!useBillingForShipping && billingAddress && (
                <View
                  style={[styles.reviewCard, isRTL && styles.reviewCardRTL]}
                >
                  <View
                    style={[
                      styles.reviewCardHeader,
                      isRTL && styles.reviewCardHeaderRTL,
                    ]}
                  >
                    <CreditCard size={16} color={Colors.primary} />
                    <Text
                      style={[
                        styles.reviewCardTitle,
                        isRTL && styles.reviewCardTitleRTL,
                      ]}
                    >
                      {t("billingAddress")}
                    </Text>
                  </View>
                  <Text
                    style={[styles.reviewText, isRTL && styles.reviewTextRTL]}
                  >
                    {billingAddress.firstName} {billingAddress.lastName}
                  </Text>
                  <Text
                    style={[
                      styles.reviewTextLight,
                      isRTL && styles.reviewTextLightRTL,
                    ]}
                  >
                    {billingAddress.address}
                  </Text>
                  <Text
                    style={[
                      styles.reviewTextLight,
                      isRTL && styles.reviewTextLightRTL,
                    ]}
                  >
                    {billingAddress.city}, {billingAddress.state}{" "}
                    {billingAddress.postcode}
                  </Text>
                </View>
              )}

              {/* Shipping Method Summary */}
              {selectedShipping && (
                <View
                  style={[styles.reviewCard, isRTL && styles.reviewCardRTL]}
                >
                  <View
                    style={[
                      styles.reviewCardHeader,
                      isRTL && styles.reviewCardHeaderRTL,
                    ]}
                  >
                    <Package size={16} color={Colors.primary} />
                    <Text
                      style={[
                        styles.reviewCardTitle,
                        isRTL && styles.reviewCardTitleRTL,
                      ]}
                    >
                      {t("shippingMethod")}
                    </Text>
                  </View>
                  <Text
                    style={[styles.reviewText, isRTL && styles.reviewTextRTL]}
                  >
                    {selectedShipping.label}
                  </Text>
                  <Text
                    style={[
                      styles.reviewTextHighlight,
                      isRTL && styles.reviewTextHighlightRTL,
                    ]}
                  >
                    {selectedShipping.formattedPrice}
                  </Text>
                </View>
              )}

              {/* Payment Method Summary */}
              {selectedPayment && (
                <View
                  style={[styles.reviewCard, isRTL && styles.reviewCardRTL]}
                >
                  <View
                    style={[
                      styles.reviewCardHeader,
                      isRTL && styles.reviewCardHeaderRTL,
                    ]}
                  >
                    <CreditCard size={16} color={Colors.primary} />
                    <Text
                      style={[
                        styles.reviewCardTitle,
                        isRTL && styles.reviewCardTitleRTL,
                      ]}
                    >
                      {t("paymentMethod")}
                    </Text>
                  </View>
                  <Text
                    style={[styles.reviewText, isRTL && styles.reviewTextRTL]}
                  >
                    {selectedPayment.methodTitle}
                  </Text>
                </View>
              )}

              {/* Terms */}
              <View
                style={[
                  styles.termsContainer,
                  isRTL && styles.termsContainerRTL,
                ]}
              >
                <Text style={[styles.termsText, isRTL && styles.termsTextRTL]}>
                  {t("termsAndPrivacy")}
                </Text>
              </View>

              {/* Place Order Button */}
              <Pressable
                style={[
                  styles.placeOrderButton,
                  isLoading && styles.buttonDisabled,
                  isRTL && styles.placeOrderButtonRTL,
                ]}
                onPress={handlePlaceOrder}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.placeOrderButtonText,
                      isRTL && styles.placeOrderButtonTextRTL,
                    ]}
                  >
                    {t("placeOrder")}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ========== BILLING ADDRESS BOTTOM SHEET ========== */}
      {showBillingSheet && (
        <>
          {/* Backdrop */}
          <Pressable style={styles.sheetBackdrop} onPress={closeBillingSheet}>
            <Animated.View
              style={[styles.sheetBackdropInner, { opacity: billingSheetAnim }]}
            />
          </Pressable>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.billingSheet,
              isRTL && styles.billingSheetRTL,
              {
                transform: [
                  {
                    translateY: billingSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Sheet handle */}
            <View style={[styles.sheetHandle, isRTL && styles.sheetHandleRTL]}>
              <View style={styles.sheetHandleBar} />
            </View>

            {/* Sheet header */}
            <View style={[styles.sheetHeader, isRTL && styles.sheetHeaderRTL]}>
              <View
                style={[
                  styles.sheetHeaderLeft,
                  isRTL && styles.sheetHeaderLeftRTL,
                ]}
              >
                <CreditCard size={20} color={Colors.primary} />
                <Text
                  style={[styles.sheetTitle, isRTL && styles.sheetTitleRTL]}
                >
                  {t("selectBillingAddress")}
                </Text>
              </View>
              <Pressable
                onPress={closeBillingSheet}
                style={[
                  styles.sheetCloseButton,
                  isRTL && styles.sheetCloseButtonRTL,
                ]}
              >
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Text
              style={[styles.sheetSubtitle, isRTL && styles.sheetSubtitleRTL]}
            >
              {t("chooseBillingAddress")}
            </Text>

            {/* Address list */}
            <ScrollView
              style={[
                styles.sheetScrollView,
                isRTL && styles.sheetScrollViewRTL,
              ]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.sheetScrollContent,
                isRTL && styles.sheetScrollContentRTL,
              ]}
            >
              {addresses.map((address) => {
                const isSelected = selectedBillingAddressId === address.id;
                const isShippingAddr = selectedAddressId === address.id;
                return (
                  <Pressable
                    key={address.id}
                    style={[
                      styles.addressCard,
                      isSelected && styles.addressCardSelected,
                      isRTL && styles.addressCardRTL,
                    ]}
                    onPress={() => setSelectedBillingAddressId(address.id)}
                  >
                    {isShippingAddr && (
                      <View
                        style={[
                          styles.shippingBadge,
                          isRTL && styles.shippingBadgeRTL,
                        ]}
                      >
                        <Package size={10} color={Colors.white} />
                        <Text style={styles.defaultBadgeText}>
                          {t("shipping")}
                        </Text>
                      </View>
                    )}
                    {address.defaultAddress && !isShippingAddr && (
                      <View
                        style={[
                          styles.defaultBadge,
                          isRTL && styles.defaultBadgeRTL,
                        ]}
                      >
                        <Sparkles size={10} color={Colors.white} />
                        <Text style={styles.defaultBadgeText}>
                          {t("default")}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.addressContent,
                        isRTL && styles.addressContentRTL,
                      ]}
                    >
                      <View
                        style={[
                          styles.addressHeader,
                          isRTL && styles.addressHeaderRTL,
                        ]}
                      >
                        <Text
                          style={[
                            styles.addressName,
                            isRTL && styles.addressNameRTL,
                          ]}
                        >
                          {address.firstName} {address.lastName}
                        </Text>
                        <View
                          style={[
                            styles.checkmark,
                            isSelected && styles.checkmarkSelected,
                            isRTL && styles.checkmarkRTL,
                          ]}
                        >
                          {isSelected && (
                            <Check size={12} color={Colors.white} />
                          )}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.addressLine,
                          isRTL && styles.addressLineRTL,
                        ]}
                      >
                        {address.address}
                      </Text>
                      <Text
                        style={[
                          styles.addressDetails,
                          isRTL && styles.addressDetailsRTL,
                        ]}
                      >
                        {address.city}, {address.country} - {address.postcode}
                      </Text>
                      {address.phone && (
                        <Text
                          style={[
                            styles.addressPhone,
                            isRTL && styles.addressPhoneRTL,
                          ]}
                        >
                          {address.phone}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Confirm button */}
            <View style={[styles.sheetFooter, isRTL && styles.sheetFooterRTL]}>
              <Pressable
                style={[
                  styles.continueButton,
                  !selectedBillingAddressId && styles.buttonDisabled,
                  isRTL && styles.continueButtonRTL,
                ]}
                onPress={confirmBillingAddress}
                disabled={!selectedBillingAddressId}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    isRTL && styles.continueButtonTextRTL,
                  ]}
                >
                  {t("confirmBillingAddress")}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerRTL: {
    direction: "rtl",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonRTL: {},
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonRTL: {},
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  headerTitleRTL: {
    textAlign: "right",
  },
  progressSummary: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressSteps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotCompleted: {
    backgroundColor: Colors.primary,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  progressLineCompleted: {
    backgroundColor: Colors.primary,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  progressLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionRTL: {
    textAlign: "right",
    direction: "rtl",
  },
  sectionDisabled: {
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: Colors.background,
  },
  sectionHeaderDisabled: {
    backgroundColor: Colors.cardBackground,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionHeaderLeftRTL: {
    // flexDirection: "row-reverse",
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadgeCompleted: {
    backgroundColor: Colors.primary,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  stepBadgeTextCompleted: {
    color: Colors.white,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  sectionHeaderTitleRTL: {
    textAlign: "right",
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  sectionContentRTL: {},
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  sectionSubtitleRTL: {
    textAlign: "left",
  },
  collapsedSummary: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  collapsedSummaryRTL: {},
  collapsedText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  collapsedTextRTL: {
    textAlign: "right",
  },
  collapsedSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  collapsedSubtextRTL: {
    textAlign: "right",
  },
  // Loading
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingContainerRTL: {},
  loadingPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingTextRTL: {
    textAlign: "right",
  },
  // Address cards
  addressCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addressCardRTL: {},
  addressCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.borderLight,
  },
  defaultBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  defaultBadgeRTL: {
    right: undefined,
    left: 8,
    marginEnd: 60,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.white,
  },
  addressContent: {
    flex: 1,
  },
  addressContentRTL: {},
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addressHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  addressName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  addressNameRTL: {
    textAlign: "right",
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkRTL: {},
  checkmarkSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  addressLine: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 4,
  },
  addressLineRTL: {
    textAlign: "right",
  },
  addressDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addressDetailsRTL: {
    textAlign: "right",
  },
  addressPhone: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
    marginTop: 4,
  },
  addressPhoneRTL: {
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptyStateRTL: {},
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  emptyTitleRTL: {
    textAlign: "right",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptySubtitleRTL: {
    textAlign: "right",
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
  },
  addNewButtonRTL: {
    // flexDirection: "row-reverse",
  },
  addNewIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  addNewText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  addNewTextRTL: {
    textAlign: "right",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
  },
  checkboxRowRTL: {
    // flexDirection: "row-reverse",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  checkboxRTL: {},
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  checkboxLabelRTL: {
    textAlign: "left",
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueButtonRTL: {},
  continueButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  continueButtonTextRTL: {
    textAlign: "right",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Method cards
  methodCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  methodCardRTL: {},
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.borderLight,
  },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  methodHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  methodContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodContentRTL: {
    flexDirection: "row-reverse",
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodIconBoxRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodInfoRTL: {},
  methodLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  methodLabelRTL: {
    textAlign: "left",
  },
  methodDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  methodDescriptionRTL: {
    textAlign: "left",
  },
  methodPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  methodPriceRTL: {
    textAlign: "left",
  },
  methodDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  methodDetailsRTL: {
    // flexDirection: "row-reverse",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailItemRTL: {
    flexDirection: "row-reverse",
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailTextRTL: {
    textAlign: "center",
    marginRight: 40,
    // // alignSelf: "flex-start",
    // // alignItems: "flex-start",
    // alignContent: "flex-start",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  securityBadgeRTL: {
    // flexDirection: "row-reverse",
  },
  securityText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
  },
  securityTextRTL: {
    textAlign: "right",
  },
  radioContainer: {
    alignItems: "flex-end",
  },
  radioContainerRTL: {
    alignItems: "flex-start",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterRTL: {},
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  // Review section
  reviewCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewCardRTL: {},
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  reviewCardHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  reviewCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  reviewCardTitleRTL: {
    textAlign: "left",
  },
  reviewText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 2,
  },
  reviewTextRTL: {
    textAlign: "left",
  },
  reviewTextLight: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  reviewTextLightRTL: {
    textAlign: "left",
  },
  reviewTextHighlight: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  reviewTextHighlightRTL: {
    textAlign: "right",
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItemRTL: {
    // flexDirection: "row-reverse",
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemInfoRTL: {},
  orderItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 2,
  },
  orderItemNameRTL: {
    textAlign: "left",
  },
  orderItemQuantity: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderItemQuantityRTL: {
    textAlign: "left",
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  orderItemPriceRTL: {
    textAlign: "right",
  },
  totalsContainer: {
    marginTop: 12,
  },
  totalsContainerRTL: {},
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalRowRTL: {
    // flexDirection: "row-reverse",
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalLabelRTL: {
    textAlign: "right",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  totalValueRTL: {
    textAlign: "right",
  },
  discountValue: {
    color: Colors.primary,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  grandTotalLabelRTL: {
    textAlign: "right",
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  grandTotalValueRTL: {
    textAlign: "right",
  },
  // Coupon
  couponContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  couponContainerRTL: {
    // flexDirection: "row-reverse",
  },
  couponInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  couponInputRTL: {
    textAlign: "right",
  },
  couponButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  couponButtonRTL: {},
  couponButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
  couponButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  couponButtonTextRTL: {
    textAlign: "right",
  },
  appliedCouponContainer: {
    backgroundColor: Colors.borderLight,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  appliedCouponContainerRTL: {},
  appliedCouponBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appliedCouponBadgeRTL: {
    // flexDirection: "row-reverse",
  },
  couponIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  appliedCouponText: {
    flex: 1,
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  appliedCouponTextRTL: {
    textAlign: "right",
  },
  removeCouponButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  removeCouponButtonRTL: {},
  termsContainer: {
    backgroundColor: Colors.borderLight,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  termsContainerRTL: {},
  termsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  termsTextRTL: {
    textAlign: "left",
  },
  placeOrderButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderButtonRTL: {},
  placeOrderButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  placeOrderButtonTextRTL: {
    textAlign: "right",
  },
  bottomSpacer: {
    height: 40,
  },
  // Success screen
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: Colors.background,
  },
  successContainerRTL: {},
  successIconWrapper: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  successTitleRTL: {
    textAlign: "right",
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  successMessageRTL: {
    textAlign: "right",
  },
  orderInfoCard: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 16,
    marginBottom: 32,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderInfoCardRTL: {},
  orderInfoText: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: "500",
  },
  orderInfoTextRTL: {
    textAlign: "right",
  },
  successButtons: {
    width: "100%",
    gap: 12,
  },
  successButtonsRTL: {},
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonRTL: {
    // flexDirection: "row-reverse",
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonTextRTL: {
    textAlign: "right",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonRTL: {
    // flexDirection: "row-reverse",
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonTextRTL: {
    textAlign: "right",
  },
  // Billing address summary (inline in address section)
  billingAddressSummary: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderLeftWidth: 3,
  },
  billingAddressSummaryRTL: {
    borderLeftWidth: 1,
    borderRightWidth: 3,
  },
  billingAddressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billingAddressHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  billingAddressLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  billingAddressLabelRTL: {
    // flexDirection: "row-reverse",
  },
  billingAddressLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  billingAddressLabelTextRTL: {
    textAlign: "right",
  },
  billingChangeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  billingChangeTextRTL: {
    textAlign: "right",
  },
  billingAddressName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  billingAddressNameRTL: {
    textAlign: "right",
  },
  billingAddressLine: {
    fontSize: 13,
    color: Colors.secondary,
    marginBottom: 2,
  },
  billingAddressLineRTL: {
    textAlign: "right",
  },
  billingAddressDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  billingAddressDetailsRTL: {
    textAlign: "right",
  },
  // Collapsed summary additions
  collapsedAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  collapsedAddressRowRTL: {
    // flexDirection: "row-reverse",
  },
  collapsedAddressLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  collapsedAddressLabelRTL: {
    textAlign: "right",
  },
  collapsedBillingSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  collapsedBillingSectionRTL: {},
  // Billing sheet (bottom sheet overlay)
  sheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  sheetBackdropInner: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  billingSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "80%",
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 101,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  billingSheetRTL: {},
  sheetHandle: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandleRTL: {},
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sheetHeaderLeftRTL: {
    // flexDirection: "row-reverse",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  sheetTitleRTL: {
    textAlign: "right",
  },
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetCloseButtonRTL: {},
  sheetSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sheetSubtitleRTL: {
    textAlign: "right",
  },
  sheetScrollView: {
    maxHeight: 400,
  },
  sheetScrollViewRTL: {},
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sheetScrollContentRTL: {},
  sheetFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  sheetFooterRTL: {},
  shippingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.textSecondary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  shippingBadgeRTL: {
    right: undefined,
    left: 8,
  },
});

export default CheckoutScreen;
