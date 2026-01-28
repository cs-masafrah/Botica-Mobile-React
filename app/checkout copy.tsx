// app/checkout.tsx - REDESIGNED WITH RADIO BUTTONS
import React, { useState, useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  CreditCard,
  ShoppingBag,
  Truck,
  CheckCircle,
  ChevronRight,
  MapPin,
  Tag,
  ShoppingCart,
  Circle,
  CircleCheck,
  Clock,
  Package,
  Shield,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/utils/currency";
import { authService, Address } from "@/services/auth";
import { shippingService } from "@/services/ShippingService";
import { couponService } from "@/services/CouponService";
import { checkoutService } from "@/services/CheckoutService";
import { paymentService } from "@/services/PaymentService";

type CheckoutStep = "address" | "shipping" | "payment" | "review";

export default function CheckoutScreen() {
  const { items, cartDetails, isLoading } = useCart();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address");
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Address state
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<
    ShippingMethod["methods"][number] | null
  >(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // Payment state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  type ShippingMethod = {
    title: string;
    methods: {
      code: string;
      label: string;
      price: number;
      formattedPrice: string;
      [key: string]: any;
    }[];
  };

  // Load addresses on mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const addressesData = await authService.getAddresses();
      setAddresses(addressesData);

      // Set default address
      const defaultAddress = addressesData.find((addr) => addr.isDefault);
      setSelectedAddress(defaultAddress || addressesData[0] || null);
    } catch (error) {
      console.error("Failed to load addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Step validation functions
  const canProceedFromAddress = () => {
    return !!selectedAddress;
  };

  const canProceedFromShipping = () => {
    return !!selectedShipping;
  };

  const canProceedFromPayment = () => {
    return !!selectedPayment;
  };

  // Address selection handler
  const handleAddressSelect = async (address: Address) => {
    try {
      // 1️⃣ Set selected address
      setSelectedAddress(address);

      // 2️⃣ Show loading for shipping methods
      setIsLoadingShipping(true);

      // 3️⃣ Prepare address data with CORRECT camelCase
      const addressData = {
        firstName: address.firstName,
        lastName: address.lastName,
        email: address.email || "customer@example.com",
        address: address.address1, // From API response
        city: address.city,
        country: address.country,
        state: address.province || "", // From API response
        postcode: address.zip,
        phone: address.phone || "",
        companyName: address.companyName || "",
      };

      console.log("📝 Preparing address with camelCase for GraphQL...");

      try {
        // Use same data for billing and shipping
        await checkoutService.saveCheckoutAddresses(addressData, addressData);
        console.log("✅ Address save attempted (errors ignored for now)");
      } catch (saveError: any) {
        console.log(
          "⚠️ Address save may have failed, continuing anyway:",
          saveError.message,
        );
        // Continue - shipping methods load independently
      }

      // 4️⃣ ALWAYS fetch shipping methods directly (this works!)
      console.log("🚚 Fetching shipping methods...");
      const shippingResult = await shippingService.getShippingMethods();

      if (
        !shippingResult.shippingMethods ||
        shippingResult.shippingMethods.length === 0
      ) {
        Alert.alert(
          "No Shipping Available",
          "No shipping methods are available for this address.",
          [{ text: "OK" }],
        );
        return;
      }

      // Process shipping methods
      const formattedMethods = shippingResult.shippingMethods
        .map((group: any) => {
          let methodsArray: any[] = [];

          if (Array.isArray(group.methods)) {
            methodsArray = group.methods;
          } else if (group.methods && typeof group.methods === "object") {
            methodsArray = [group.methods];
          }

          return {
            title: group.title || "Shipping",
            methods: methodsArray,
          };
        })
        .filter((group) => group.methods.length > 0);

      console.log(`✅ Found ${formattedMethods.length} shipping groups`);
      setShippingMethods(formattedMethods);

      // Auto-select first shipping method
      if (
        formattedMethods.length > 0 &&
        formattedMethods[0].methods &&
        formattedMethods[0].methods.length > 0
      ) {
        const firstMethod = formattedMethods[0].methods[0];
        setSelectedShipping(firstMethod);
        console.log("✅ Auto-selected:", firstMethod.label);
      }
    } catch (error: any) {
      console.error("❌ Failed in address selection:", error.message);
      Alert.alert(
        "Error",
        `Failed to load shipping options: ${error.message}`,
        [{ text: "OK" }],
      );
    } finally {
      setIsLoadingShipping(false);
    }
  };
  // Shipping selection handler
  const handleShippingSelect = async (method: any) => {
    console.log("📦 Selecting shipping method:", {
      code: method.code,
      label: method.label,
      price: method.formattedPrice,
    });

    setSelectedShipping(method);

    try {
      // Apply shipping method to cart
      const shippingResult = await shippingService.applyShippingMethod(
        method.code,
      );

      console.log("📦 Shipping apply result:", {
        success: shippingResult.success,
        message: shippingResult.message,
        hasCart: !!shippingResult.cart,
      });

      // FIXED: Check for success OR positive message
      const isSuccess =
        shippingResult.success ||
        (shippingResult.message &&
          shippingResult.message.toLowerCase().includes("success"));

      if (isSuccess) {
        console.log("✅ Shipping method applied successfully");

        // If there's a jumpToSection, update the step
        if (shippingResult.jumpToSection === "payment") {
          console.log("🔄 Jumping to payment section");
          setCurrentStep("payment");
        }

        // Refresh cart to get updated totals
        await refreshCart();

        // Now load payment methods
        setIsLoadingPayment(true);
        const paymentResult = await paymentService.getPaymentMethods(
          method.code,
        );

        console.log("💳 Payment methods loaded:", {
          count: paymentResult.paymentMethods.length,
          methods: paymentResult.paymentMethods.map((p) => p.methodTitle),
        });

        if (paymentResult.paymentMethods.length > 0) {
          setPaymentMethods(paymentResult.paymentMethods);

          // Auto-select first payment method if none selected
          if (!selectedPayment) {
            setSelectedPayment(paymentResult.paymentMethods[0]);
            console.log(
              "✅ Auto-selected payment:",
              paymentResult.paymentMethods[0].methodTitle,
            );
          }
        } else {
          setPaymentMethods([]);
          setSelectedPayment(null);
          console.log(
            "⚠️ No payment methods available for this shipping method",
          );
        }
      } else {
        console.error("❌ Failed to apply shipping:", shippingResult.message);
        Alert.alert(
          "Shipping Error",
          shippingResult.message ||
            "Failed to apply shipping method. Please try again.",
        );
        // Revert selection if failed
        setSelectedShipping(null);
      }
    } catch (error: any) {
      console.error("❌ Error applying shipping method:", error.message);
      Alert.alert(
        "Error",
        error.message || "Failed to apply shipping method. Please try again.",
      );
      // Revert selection on error
      setSelectedShipping(null);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handlePaymentSelect = (method: any) => {
    console.log("💳 Selecting payment method:", {
      method: method.method,
      title: method.methodTitle,
      description: method.description,
    });
    setSelectedPayment(method);
  };

  // Step navigation handlers
  const handleNextStep = () => {
    const steps: CheckoutStep[] = ["address", "shipping", "payment", "review"];
    const currentIndex = steps.indexOf(currentStep);

    // Validate current step
    if (currentStep === "address" && !canProceedFromAddress()) {
      Alert.alert(
        "Address Required",
        "Please select a delivery address to continue",
      );
      return;
    }

    if (currentStep === "shipping" && !canProceedFromShipping()) {
      Alert.alert(
        "Shipping Required",
        "Please select a shipping method to continue",
      );
      return;
    }

    if (currentStep === "payment" && !canProceedFromPayment()) {
      Alert.alert(
        "Payment Required",
        "Please select a payment method to continue",
      );
      return;
    }

    // Proceed to next step
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      handlePlaceOrder();
    }
  };

  const handleBackStep = () => {
    const steps: CheckoutStep[] = ["address", "shipping", "payment", "review"];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      router.back();
    }
  };

  // Step progress component
  const StepProgress = () => {
    const steps = [
      { key: "address", label: "Address", icon: MapPin },
      { key: "shipping", label: "Shipping", icon: Truck },
      { key: "payment", label: "Payment", icon: CreditCard },
      { key: "review", label: "Review", icon: CheckCircle },
    ];

    const currentStepIndex = steps.findIndex(
      (step) => step.key === currentStep,
    );

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.key === currentStep;
          const isCompleted = index < currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.progressStep}>
                <View style={styles.progressStepInner}>
                  <View
                    style={[
                      styles.progressIconContainer,
                      isActive && styles.progressIconContainerActive,
                      isCompleted && styles.progressIconContainerCompleted,
                      isFuture && styles.progressIconContainerFuture,
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircle size={16} color={Colors.white} />
                    ) : (
                      <StepIcon
                        size={16}
                        color={
                          isActive
                            ? Colors.white
                            : isFuture
                              ? Colors.textSecondary
                              : Colors.white
                        }
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.progressLabel,
                      isActive && styles.progressLabelActive,
                      isCompleted && styles.progressLabelCompleted,
                      isFuture && styles.progressLabelFuture,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              </View>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.progressConnector,
                    index < currentStepIndex &&
                      styles.progressConnectorCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // Radio button component
  const RadioButton = ({
    selected,
    onSelect,
    disabled = false,
  }: {
    selected: boolean;
    onSelect: () => void;
    disabled?: boolean;
  }) => {
    return (
      <Pressable
        onPress={onSelect}
        disabled={disabled}
        style={styles.radioContainer}
      >
        <View
          style={[
            styles.radioOuter,
            selected && styles.radioOuterSelected,
            disabled && styles.radioOuterDisabled,
          ]}
        >
          {selected && <View style={styles.radioInner} />}
        </View>
      </Pressable>
    );
  };

  // Address step component
  const renderAddressStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <MapPin size={24} color={Colors.primary} />
        <Text style={styles.stepTitle}>Select Delivery Address</Text>
      </View>

      <Text style={styles.stepDescription}>
        Choose where you want your order delivered
      </Text>

      {isLoadingAddresses ? (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.emptySection}>
          <MapPin size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No addresses found</Text>
          <Text style={styles.emptySubtitle}>
            Add an address to continue with checkout
          </Text>
          <Pressable
            style={styles.addAddressButton}
            onPress={() => router.push("/addresses")}
          >
            <Text style={styles.addAddressButtonText}>+ Add New Address</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {addresses.map((address) => (
            <Pressable
              key={address.id}
              style={[
                styles.optionCard,
                selectedAddress?.id === address.id && styles.optionCardSelected,
              ]}
              onPress={() => handleAddressSelect(address)}
            >
              <RadioButton
                selected={selectedAddress?.id === address.id}
                onSelect={() => handleAddressSelect(address)}
              />

              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>
                    {address.firstName} {address.lastName}
                    {address.isDefault && (
                      <Text style={styles.defaultBadge}> • Default</Text>
                    )}
                  </Text>
                </View>

                <Text style={styles.optionDetail}>
                  {address.address1}
                  {address.address2 && `, ${address.address2}`}
                </Text>
                <Text style={styles.optionDetail}>
                  {address.city}, {address.province} {address.zip}
                </Text>
                <Text style={styles.optionDetail}>{address.country}</Text>

                {address.phone && (
                  <View style={styles.phoneContainer}>
                    <Text style={styles.phoneLabel}>Phone:</Text>
                    <Text style={styles.phoneValue}>{address.phone}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}

          <Pressable
            style={styles.addNewOptionCard}
            onPress={() => router.push("/addresses")}
          >
            <View style={styles.addNewIcon}>
              <Text style={styles.addNewIconText}>+</Text>
            </View>
            <Text style={styles.addNewText}>Add New Address</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );

  // Shipping step component
  const renderShippingStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Truck size={24} color={Colors.primary} />
        <Text style={styles.stepTitle}>Select Shipping Method</Text>
      </View>

      <Text style={styles.stepDescription}>
        Choose how you want your order delivered
      </Text>

      {isLoadingShipping ? (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading shipping options...</Text>
        </View>
      ) : shippingMethods.length === 0 ? (
        <View style={styles.emptySection}>
          <Truck size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No shipping methods available</Text>
          <Text style={styles.emptySubtitle}>
            Please go back and select a different address
          </Text>
          <Pressable
            style={styles.backButtonSmall}
            onPress={() => setCurrentStep("address")}
          >
            <Text style={styles.backButtonSmallText}>← Back to Address</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {shippingMethods.map((group) => (
            <View key={group.title} style={styles.shippingGroup}>
              <Text style={styles.shippingGroupTitle}>{group.title}</Text>

              {group.methods.map((method: any) => (
                <Pressable
                  key={method.code}
                  style={[
                    styles.optionCard,
                    selectedShipping?.code === method.code &&
                      styles.optionCardSelected,
                  ]}
                  onPress={() => handleShippingSelect(method)}
                >
                  <RadioButton
                    selected={selectedShipping?.code === method.code}
                    onSelect={() => handleShippingSelect(method)}
                  />

                  <View style={styles.optionContent}>
                    <View style={styles.optionHeader}>
                      <Text style={styles.optionTitle}>{method.label}</Text>
                      <Text style={styles.shippingPrice}>
                        {method.formattedPrice}
                      </Text>
                    </View>

                    <View style={styles.shippingDetails}>
                      <View style={styles.shippingDetail}>
                        <Package size={14} color={Colors.textSecondary} />
                        <Text style={styles.shippingDetailText}>
                          {method.code.includes("free")
                            ? "Free shipping"
                            : "Standard delivery"}
                        </Text>
                      </View>

                      <View style={styles.shippingDetail}>
                        <Clock size={14} color={Colors.textSecondary} />
                        <Text style={styles.shippingDetailText}>
                          {method.code.includes("free")
                            ? "5-7 business days"
                            : "3-5 business days"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Payment step component
  const renderPaymentStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <CreditCard size={24} color={Colors.primary} />
        <Text style={styles.stepTitle}>Select Payment Method</Text>
      </View>

      <Text style={styles.stepDescription}>
        Choose how you want to pay for your order
      </Text>

      {isLoadingPayment ? (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment options...</Text>
        </View>
      ) : paymentMethods.length === 0 ? (
        <View style={styles.emptySection}>
          <CreditCard size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No payment methods available</Text>
          <Text style={styles.emptySubtitle}>
            Please go back and select a different shipping method
          </Text>
          <Pressable
            style={styles.backButtonSmall}
            onPress={() => setCurrentStep("shipping")}
          >
            <Text style={styles.backButtonSmallText}>← Back to Shipping</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {paymentMethods.map((method) => (
            <Pressable
              key={method.method}
              style={[
                styles.optionCard,
                selectedPayment?.method === method.method &&
                  styles.optionCardSelected,
              ]}
              onPress={() => handlePaymentSelect(method)}
            >
              <RadioButton
                selected={selectedPayment?.method === method.method}
                onSelect={() => handlePaymentSelect(method)}
              />

              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  {method.method === "cashondelivery" ? (
                    <ShoppingBag size={20} color={Colors.primary} />
                  ) : (
                    <CreditCard size={20} color={Colors.primary} />
                  )}
                  <Text style={styles.optionTitle}>{method.methodTitle}</Text>
                </View>

                <Text style={styles.optionDetail}>
                  {method.description ||
                    (method.method === "cashondelivery"
                      ? "Pay when you receive your order"
                      : "Pay securely with your card")}
                </Text>

                <View style={styles.paymentSecurity}>
                  <Shield size={14} color={Colors.success} />
                  <Text style={styles.paymentSecurityText}>
                    Secure payment • Encrypted transaction
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Review step component
  const renderReviewStep = () => (
    <ScrollView
      style={styles.reviewContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <CheckCircle size={24} color={Colors.primary} />
          <Text style={styles.stepTitle}>Review Your Order</Text>
        </View>

        <Text style={styles.stepDescription}>
          Please review your order details before placing it
        </Text>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.orderItemsContainer}>
            {items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Image
                  source={{
                    uri:
                      item.product.images?.[0]?.url ||
                      "https://via.placeholder.com/100",
                  }}
                  style={styles.orderItemImage}
                  resizeMode="cover"
                />
                <View style={styles.orderItemDetails}>
                  <Text style={styles.orderItemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View style={styles.orderItemPriceRow}>
                    <Text style={styles.orderItemQuantity}>
                      Qty: {item.quantity}
                    </Text>
                    <Text style={styles.orderItemTotal}>
                      {formatPrice(
                        item.product.price * item.quantity,
                        displayCurrency,
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.appliedCouponBadge}>
                <Tag size={16} color={Colors.success} />
                <Text style={styles.appliedCouponText}>{appliedCoupon}</Text>
                <Pressable onPress={handleRemoveCoupon}>
                  <Text style={styles.removeCouponText}>Remove</Text>
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
                placeholderTextColor={Colors.textSecondary}
              />
              <Pressable
                style={[
                  styles.couponButton,
                  (!couponCode.trim() || isApplyingCoupon) &&
                    styles.couponButtonDisabled,
                ]}
                onPress={handleApplyCoupon}
                disabled={!couponCode.trim() || isApplyingCoupon}
              >
                {isApplyingCoupon ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.couponButtonText}>Apply</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Address</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>
                {selectedAddress?.address1}, {selectedAddress?.city}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping Method</Text>
              <Text style={styles.summaryValue}>
                {selectedShipping?.label} ({selectedShipping?.formattedPrice})
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method</Text>
              <Text style={styles.summaryValue}>
                {selectedPayment?.methodTitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Total</Text>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatPrice(calculateTotals.subTotal, displayCurrency)}
              </Text>
            </View>

            {calculateTotals.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, styles.discountValue]}>
                  -{formatPrice(calculateTotals.discount, displayCurrency)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>
                {formatPrice(calculateTotals.shipping, displayCurrency)}
              </Text>
            </View>

            {calculateTotals.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(calculateTotals.tax, displayCurrency)}
                </Text>
              </View>
            )}

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatPrice(calculateTotals.grandTotal, displayCurrency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By placing your order, you agree to our Terms of Service and Privacy
            Policy. All transactions are secure and encrypted.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // Main render
  const renderStepContent = () => {
    switch (currentStep) {
      case "address":
        return renderAddressStep();
      case "shipping":
        return renderShippingStep();
      case "payment":
        return renderPaymentStep();
      case "review":
        return renderReviewStep();
    }
  };

  const calculateTotals = useMemo(() => {
    if (!cartDetails) {
      return {
        subTotal: 0,
        tax: 0,
        discount: 0,
        shipping: selectedShipping?.price || 0,
        grandTotal: 0,
      };
    }

    const shippingCost = selectedShipping?.price || 0;
    const subTotal = cartDetails.subTotal || 0;
    const tax = cartDetails.taxTotal || 0;
    const discount = cartDetails.discountAmount || 0;

    return {
      subTotal,
      tax,
      discount,
      shipping: shippingCost,
      grandTotal: subTotal + tax + shippingCost - discount,
    };
  }, [cartDetails, selectedShipping]);

  const displayCurrency = cartDetails?.currencyCode || "USD";

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert("Error", "Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const result = await couponService.applyCoupon(couponCode);

      if (result.success) {
        Alert.alert("Success", result.message || "Coupon applied successfully");
        setAppliedCoupon(couponCode);
        setCouponCode("");
        await refreshCart();
      } else {
        Alert.alert("Error", result.message || "Failed to apply coupon");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Remove coupon handler
  const handleRemoveCoupon = async () => {
    try {
      const result = await couponService.removeCoupon();

      if (result.success) {
        setAppliedCoupon(null);
        await refreshCart();
      }
    } catch (error) {
      console.error("Failed to remove coupon:", error);
    }
  };

  // Place order handler
  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedShipping || !selectedPayment) {
      Alert.alert("Error", "Please complete all checkout steps");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Save payment method
      const paymentResult = await paymentService.savePayment(
        selectedPayment.method,
      );

      if (!paymentResult.success) {
        throw new Error("Failed to save payment method");
      }

      // 2. Place order
      const orderResult = await checkoutService.placeOrder();

      if (orderResult.success && orderResult.order) {
        Alert.alert(
          "🎉 Order Placed Successfully!",
          `Your order #${orderResult.order.incrementId} has been placed.`,
          [
            {
              text: "Continue Shopping",
              onPress: () => {
                // Clear cart and go home
                router.replace("/");
              },
            },
          ],
        );
      } else {
        throw new Error(orderResult.message || "Failed to place order");
      }
    } catch (error: any) {
      console.error("❌ Order placement error:", error);
      Alert.alert(
        "Order Failed",
        error.message || "Something went wrong. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ShoppingCart size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add some items to your cart before checking out
        </Text>
        <Pressable style={styles.continueButton} onPress={() => router.back()}>
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronRight size={24} color={Colors.text} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Step Progress */}
      <StepProgress />

      {/* Current Step Content */}
      <View style={styles.content}>{renderStepContent()}</View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>
            {formatPrice(calculateTotals.grandTotal, displayCurrency)}
          </Text>
        </View>

        <View style={styles.footerActions}>
          <Pressable
            style={styles.backActionButton}
            onPress={handleBackStep}
            disabled={isProcessing}
          >
            <Text style={styles.backActionButtonText}>
              {currentStep === "address" ? "Cart" : "Back"}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.nextActionButton,
              isProcessing && styles.nextActionButtonDisabled,
              (currentStep === "address" && !canProceedFromAddress()) ||
              (currentStep === "shipping" && !canProceedFromShipping()) ||
              (currentStep === "payment" && !canProceedFromPayment())
                ? styles.nextActionButtonDisabled
                : null,
            ]}
            onPress={handleNextStep}
            disabled={
              isProcessing ||
              (currentStep === "address" && !canProceedFromAddress()) ||
              (currentStep === "shipping" && !canProceedFromShipping()) ||
              (currentStep === "payment" && !canProceedFromPayment())
            }
          >
            {isProcessing ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.nextActionButtonText}>
                {currentStep === "review" ? "Place Order" : "Continue"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    transform: [{ rotate: "180deg" }],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  headerRight: {
    width: 32,
  },
  // Progress
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressStep: {
    alignItems: "center",
    zIndex: 1,
  },
  progressStepInner: {
    alignItems: "center",
  },
  progressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  progressIconContainerActive: {
    backgroundColor: Colors.primary,
  },
  progressIconContainerCompleted: {
    backgroundColor: Colors.success,
  },
  progressIconContainerFuture: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  progressLabelActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  progressLabelCompleted: {
    color: Colors.success,
  },
  progressLabelFuture: {
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  progressConnector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: -15,
    marginTop: -25,
    zIndex: 0,
  },
  progressConnectorCompleted: {
    backgroundColor: Colors.success,
  },
  // Content
  content: {
    flex: 1,
  },
  reviewContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  // Options Container
  optionsContainer: {
    flex: 1,
  },
  // Option Cards
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F9FF",
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  optionDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  // Radio Button
  radioContainer: {
    padding: 4,
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
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioOuterDisabled: {
    borderColor: Colors.textSecondary,
    opacity: 0.5,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  // Address Specific
  phoneContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  phoneLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  phoneValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  defaultBadge: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: "500",
  },
  addNewOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  addNewIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addNewIconText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  addNewText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 12,
  },
  // Shipping Specific
  shippingGroup: {
    marginBottom: 20,
  },
  shippingGroupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  shippingPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: 8,
  },
  shippingDetails: {
    marginTop: 8,
  },
  shippingDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  shippingDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  // Payment Specific
  paymentSecurity: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  paymentSecurityText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 6,
  },
  // Review Specific
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  orderItemsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
  },
  orderItem: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItem: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItem: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  orderItemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderItemQuantity: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "right",
    flex: 1,
  },
  totalsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  discountValue: {
    color: Colors.success,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  // Coupon
  couponContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    marginRight: 8,
  },
  couponButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: "center",
  },
  couponButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
  couponButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  appliedCouponContainer: {
    backgroundColor: Colors.success + "15",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.success + "30",
  },
  appliedCouponBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appliedCouponText: {
    flex: 1,
    marginLeft: 8,
    color: Colors.success,
    fontWeight: "600",
    fontSize: 14,
  },
  removeCouponText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  termsContainer: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  // Loading & Empty States
  loadingSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptySection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  // Buttons
  addAddressButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  addAddressButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonSmall: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonSmallText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  // Footer
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  footerTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  footerTotalLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  footerTotalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
  },
  backActionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  backActionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  nextActionButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextActionButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
  nextActionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
});
