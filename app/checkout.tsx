// app/checkout.tsx
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
  Package,
  Home,
  Truck,
  Wallet,
  CheckCircle,
  ChevronRight,
  MapPin,
  Tag,
  ShoppingCart,
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
  const { items, cartDetails, isLoading, refreshCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address");
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  
  // Address state
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  
  // Shipping state
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(true);
  
  // Payment state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(true);

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
      const defaultAddress = addressesData.find(addr => addr.isDefault);
      setSelectedAddress(defaultAddress || addressesData[0] || null);
    } catch (error) {
      console.error("Failed to load addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };


  const loadShippingMethods = async () => {
    try {
      setIsLoadingShipping(true);
      const result = await shippingService.getShippingMethods();
      
      if (result.shippingMethods && result.shippingMethods.length > 0) {
        // Flatten shipping methods
        const methods: any[] = [];
        result.shippingMethods.forEach(group => {
          group.methods.forEach((method: any) => {
            methods.push({
              ...method,
              groupTitle: group.title,
            });
          });
        });
        setShippingMethods(methods);
        
        // Set default shipping method
        if (methods.length > 0) {
          setSelectedShipping(methods[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load shipping methods:", error);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      setIsLoadingPayment(true);
      
      // Load payment methods - this will try multiple approaches
      const result = await paymentService.getPaymentMethods();
      
      console.log("💳 Payment methods result:", {
        count: result.paymentMethods.length,
        message: result.message
      });
      
      if (result.paymentMethods.length > 0) {
        setPaymentMethods(result.paymentMethods);
        setSelectedPayment(result.paymentMethods[0]);
      } else {
        console.log("⚠️ No payment methods available initially");
        // Don't show error - they'll load after shipping
      }
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const loadShippingMethodsAfterAddress = async () => {
    if (!selectedAddress) {
      console.log("⚠️ No address selected, skipping shipping methods");
      return;
    }
    
    try {
      setIsLoadingShipping(true);
      console.log("🚚 Loading shipping methods after address selected...");
      
      // Prepare address for Bagisto
      const shippingAddress = {
        firstName: selectedAddress.firstName,
        lastName: selectedAddress.lastName,
        email: selectedAddress.email || "customer@example.com",
        address: selectedAddress.address1,
        city: selectedAddress.city,
        country: selectedAddress.country,
        state: selectedAddress.province || "",
        postcode: selectedAddress.zip,
        phone: selectedAddress.phone || "",
        useForShipping: true,
      };

      // SIMPLIFIED: Just save shipping address (assuming billing is same)
      // This is the most common case in Bagisto
      console.log("📦 Saving shipping address...");
      const addressResult = await checkoutService.saveShippingAddressOnly(shippingAddress);
      
      console.log("✅ Shipping address saved:", {
        message: addressResult.message,
        shippingMethods: addressResult.shippingMethods?.length || 0,
      });
      
      if (addressResult.shippingMethods && addressResult.shippingMethods.length > 0) {
        console.log("✅ Using shipping methods from address save");
        
        // Format methods correctly
        const formattedMethods = addressResult.shippingMethods.map((group: any) => ({
          title: group.title,
          methods: group.methods
        }));
        
        setShippingMethods(formattedMethods);
        
        // Set first shipping method if available
        const firstMethod = formattedMethods[0]?.methods[0];
        if (firstMethod) {
          setSelectedShipping(firstMethod);
          
          // After setting shipping, load payment methods
          handleShippingSelect(firstMethod);
        }
      } else {
        // Try to get shipping methods separately
        console.log("⚠️ No shipping methods from address save, trying separate call");
        const shippingResult = await shippingService.getShippingMethods();
        
        if (shippingResult.shippingMethods.length > 0) {
          setShippingMethods(shippingResult.shippingMethods);
          const firstMethod = shippingResult.shippingMethods[0]?.methods[0];
          if (firstMethod) {
            setSelectedShipping(firstMethod);
            
            // After setting shipping, load payment methods
            handleShippingSelect(firstMethod);
          }
        } else {
          console.log("❌ No shipping methods available");
          Alert.alert(
            "Shipping Unavailable",
            "No shipping methods are available for your address. Please try a different address.",
            [{ text: "OK", onPress: () => setCurrentStep("address") }]
          );
        }
      }
      
    } catch (error: any) {
      console.error("Failed to load shipping methods:", error);
      Alert.alert(
        "Address Error",
        `Could not save your address: ${error.message || "Please try again"}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsLoadingShipping(false);
    }
  };


  const handleAddressSelect = async (address: Address) => {
    setSelectedAddress(address);
    
    // Load shipping methods when address is selected
    if (currentStep === "address") {
      await loadShippingMethodsAfterAddress();
      
      // Auto-advance to shipping step if shipping methods are available
      // This improves UX - user doesn't have to click "Continue" after selecting address
      setTimeout(() => {
        if (shippingMethods.length > 0) {
          // You can either auto-advance or show a message
          console.log("✅ Address selected, shipping methods loaded. Ready for shipping step.");
          // Or auto-advance:
          // setCurrentStep("shipping");
        }
      }, 500);
    }
  };

  const handleShippingSelect = async (method: any) => {
    setSelectedShipping(method);
    
    // After selecting shipping, load payment methods
    try {
      setIsLoadingPayment(true);
      console.log("💳 Loading payment methods for shipping:", method.code);
      const paymentResult = await paymentService.getPaymentMethods(method.code);
      
      if (paymentResult.paymentMethods.length > 0) {
        setPaymentMethods(paymentResult.paymentMethods);
        setSelectedPayment(paymentResult.paymentMethods[0]);
        
        // Auto-advance to payment step after 1 second (good UX)
        setTimeout(() => {
          setCurrentStep("payment");
        }, 1000);
      } else {
        console.log("⚠️ No payment methods available for this shipping method");
        Alert.alert(
          "No Payment Methods",
          `No payment methods are available for "${method.label}". Please try a different shipping method.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    } finally {
      setIsLoadingPayment(false);
    }
  };

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
        
        // Refresh cart data
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

  const handleRemoveCoupon = async () => {
    try {
      const result = await couponService.removeCoupon();
      
      if (result.success) {
        setAppliedCoupon(null);
        // Refresh cart data
        await refreshCart();
      }
    } catch (error) {
      console.error("Failed to remove coupon:", error);
    }
  };

  const testShippingMethods = async () => {
    try {
      Alert.alert("Testing", "Trying to find working shipping methods...");
      const result = await paymentService.testWithDummyShipping();
      
      if (result.success) {
        Alert.alert(
          "Test Successful",
          `Found ${result.count} payment methods with dummy shipping.\n${result.message}`
        );
      } else {
        Alert.alert("Test Failed", result.message);
      }
    } catch (error: any) {
      Alert.alert("Test Error", error.message);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert("Error", "Please select a shipping address");
      return;
    }
    
    if (!selectedShipping) {
      Alert.alert("Error", "Please select a shipping method");
      return;
    }
    
    if (!selectedPayment) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    setIsProcessing(true);
    try {
      // Apply shipping method
      await shippingService.applyShippingMethod(selectedShipping.code);
      
      // Save payment method
      const paymentResult = await checkoutService.savePayment(selectedPayment.method);
      
      // Place order
      const orderResult = await checkoutService.placeOrder(selectedPayment.method);

      if (orderResult.success && orderResult.order) {
        Alert.alert(
          "Order Placed!",
          `Your order #${orderResult.order.incrementId} has been placed successfully.`,
          [
            {
              text: "View Orders",
              onPress: () => router.push("/order-details"),
            },
            {
              text: "Continue Shopping",
              onPress: () => {
                router.push("/");
              },
            },
          ],
        );
      } else {
        throw new Error("Failed to place order");
      }
    } catch (error: any) {
      console.error("Order placement error:", error);
      Alert.alert(
        "Order Failed",
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsProcessing(false);
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

  // Render current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "address":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            
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
              </View>
            ) : (
              <>
                {addresses.map((address) => (
                  <Pressable
                    key={address.id}
                    style={[
                      styles.addressCard,
                      selectedAddress?.id === address.id && styles.addressCardSelected,
                    ]}
                    onPress={() => handleAddressSelect(address)}
                  >
                    <View style={styles.addressHeader}>
                      <MapPin size={20} color={Colors.primary} />
                      <View style={styles.addressTextContainer}>
                        <Text style={styles.addressName}>
                          {address.firstName} {address.lastName}
                          {address.isDefault && (
                            <Text style={styles.defaultBadge}> • Default</Text>
                          )}
                        </Text>
                        <Text style={styles.addressDetail}>
                          {address.address1}
                          {address.address2 && `, ${address.address2}`}
                        </Text>
                        <Text style={styles.addressDetail}>
                          {address.city}, {address.province} {address.zip}
                        </Text>
                        <Text style={styles.addressDetail}>{address.country}</Text>
                        {address.phone && (
                          <Text style={styles.addressPhone}>📱 {address.phone}</Text>
                        )}
                      </View>
                      {selectedAddress?.id === address.id && (
                        <CheckCircle size={20} color={Colors.primary} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </>
            )}
            
            <Pressable
              style={styles.addAddressButton}
              onPress={() => router.push("/addresses")}
            >
              <Text style={styles.addAddressButtonText}>+ Add New Address</Text>
            </Pressable>
          </View>
        );

      case "shipping":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Shipping Method</Text>
            
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
                  {selectedAddress 
                    ? "Please save your address first"
                    : "Please select an address first"
                  }
                </Text>
                {!selectedAddress && (
                  <Pressable
                    style={styles.backButtonSmall}
                    onPress={() => setCurrentStep("address")}
                  >
                    <Text style={styles.backButtonSmallText}>← Select Address</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              shippingMethods.map((group) => (
                <View key={group.title} style={styles.shippingGroup}>
                  <Text style={styles.shippingGroupTitle}>{group.title}</Text>
                  {group.methods.map((method) => (
                    <Pressable
                      key={method.code}
                      style={[
                        styles.shippingCard,
                        selectedShipping?.code === method.code && styles.shippingCardSelected,
                      ]}
                      onPress={() => handleShippingSelect(method)}
                    >
                      <View style={styles.shippingContent}>
                        <Truck size={20} color={Colors.primary} />
                        <View style={styles.shippingTextContainer}>
                          <Text style={styles.shippingTitle}>
                            {method.label}
                          </Text>
                          <Text style={styles.shippingSubtitle}>
                            {method.code.includes("standard") ? "5-7 business days" : 
                            method.code.includes("express") ? "2-3 business days" : 
                            "Standard delivery"}
                          </Text>
                        </View>
                        <Text style={styles.shippingPrice}>
                          {method.formattedPrice}
                        </Text>
                      </View>
                      {selectedShipping?.code === method.code && (
                        <View style={styles.selectedIndicator}>
                          <CheckCircle size={16} color={Colors.white} />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              ))
            )}
          </View>
        );

      case "payment":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {isLoadingPayment ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading payment options...</Text>
              </View>
            ) : !selectedShipping ? (
              <View style={styles.emptySection}>
                <Truck size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>Select Shipping First</Text>
                <Text style={styles.emptySubtitle}>
                  Please select a shipping method to see available payment options
                </Text>
                <Pressable
                  style={styles.backButtonSmall}
                  onPress={() => setCurrentStep("shipping")}
                >
                  <Text style={styles.backButtonSmallText}>← Back to Shipping</Text>
                </Pressable>
              </View>
            ) : paymentMethods.length === 0 ? (
              <View style={styles.emptySection}>
                <CreditCard size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No Payment Methods</Text>
                <Text style={styles.emptySubtitle}>
                  No payment methods available for "{selectedShipping?.label}"
                </Text>
                <Pressable
                  style={styles.backButtonSmall}
                  onPress={() => setCurrentStep("shipping")}
                >
                  <Text style={styles.backButtonSmallText}>← Choose Different Shipping</Text>
                </Pressable>
              </View>
            ) : (
              paymentMethods.map((method) => (
                <Pressable
                  key={method.method}
                  style={[
                    styles.paymentCard,
                    selectedPayment?.method === method.method && styles.paymentCardSelected,
                  ]}
                  onPress={() => setSelectedPayment(method)}
                >
                  <View style={styles.paymentContent}>
                    {method.method === "cashondelivery" ? (
                      <ShoppingBag size={20} color={Colors.primary} />
                    ) : (
                      <CreditCard size={20} color={Colors.primary} />
                    )}
                    <View style={styles.paymentTextContainer}>
                      <Text style={styles.paymentTitle}>{method.methodTitle}</Text>
                      <Text style={styles.paymentSubtitle}>
                        {method.description || 
                        (method.method === "cashondelivery" 
                          ? "Pay when you receive your order" 
                          : "Pay securely with your card")}
                      </Text>
                    </View>
                  </View>
                  {selectedPayment?.method === method.method && (
                    <View style={styles.selectedIndicator}>
                      <CheckCircle size={16} color={Colors.white} />
                    </View>
                  )}
                </Pressable>
              ))
            )}
          </View>
        );

      case "review":
        return (
          <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={false}>
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              
              {/* Order Items with Images */}
              <View style={styles.orderItemsContainer}>
                {items.map((item) => (
                  <View key={item.id} style={styles.orderItem}>
                    <Image
                      source={{ uri: item.product.images?.[0]?.url || 'https://via.placeholder.com/100' }}
                      style={styles.orderItemImage}
                      resizeMode="cover"
                    />
                    <View style={styles.orderItemDetails}>
                      <Text style={styles.orderItemName} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      {item.product.selectedOptions && Object.keys(item.product.selectedOptions).length > 0 && (
                        <Text style={styles.orderItemVariant}>
                          {Object.values(item.product.selectedOptions).join(", ")}
                        </Text>
                      )}
                      <View style={styles.orderItemPriceRow}>
                        <Text style={styles.orderItemQuantity}>
                          Qty: {item.quantity}
                        </Text>
                        <Text style={styles.orderItemTotal}>
                          {formatPrice(item.product.price * item.quantity, displayCurrency)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              
              {/* Coupon Section */}
              <View style={styles.couponSection}>
                <Text style={styles.sectionSubtitle}>Apply Coupon</Text>
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
                        (!couponCode.trim() || isApplyingCoupon) && styles.couponButtonDisabled
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
              
              {/* Delivery Details */}
              <View style={styles.deliverySection}>
                <Text style={styles.sectionSubtitle}>Delivery Details</Text>
                <View style={styles.deliveryDetail}>
                  <Text style={styles.deliveryLabel}>Address:</Text>
                  <Text style={styles.deliveryValue}>
                    {selectedAddress?.address1}, {selectedAddress?.city}
                  </Text>
                </View>
                <View style={styles.deliveryDetail}>
                  <Text style={styles.deliveryLabel}>Shipping:</Text>
                  <Text style={styles.deliveryValue}>
                    {selectedShipping?.label} ({selectedShipping?.formattedPrice})
                  </Text>
                </View>
                <View style={styles.deliveryDetail}>
                  <Text style={styles.deliveryLabel}>Payment:</Text>
                  <Text style={styles.deliveryValue}>
                    {selectedPayment?.methodTitle}
                  </Text>
                </View>
              </View>
              
              {/* Order Totals */}
              <View style={styles.totalsContainer}>
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
    }
  };

  const handleNextStep = () => {
    const steps: CheckoutStep[] = ["address", "shipping", "payment", "review"];
    const currentIndex = steps.indexOf(currentStep);
    
    // Validation
    if (currentStep === "address" && !selectedAddress) {
      Alert.alert("Address Required", "Please select a shipping address to continue");
      return;
    }
    
    if (currentStep === "shipping" && !selectedShipping) {
      Alert.alert("Shipping Required", "Please select a shipping method to continue");
      return;
    }
    
    if (currentStep === "payment") {
      if (!selectedShipping) {
        Alert.alert("Shipping Required", "Please go back and select a shipping method first");
        return;
      }
      
      if (paymentMethods.length === 0) {
        Alert.alert(
          "Payment Methods",
          `Please wait while we load payment methods for "${selectedShipping.label}"`,
          [{ text: "OK" }]
        );
        return;
      }
      
      if (!selectedPayment) {
        Alert.alert("Payment Required", "Please select a payment method to continue");
        return;
      }
    }
    
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

  const getStepTitle = (step: CheckoutStep) => {
    switch (step) {
      case "address": return "Address";
      case "shipping": return "Shipping";
      case "payment": return "Payment";
      case "review": return "Review";
    }
  };

  const getStepNumber = (step: CheckoutStep) => {
    switch (step) {
      case "address": return 1;
      case "shipping": return 2;
      case "payment": return 3;
      case "review": return 4;
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
      {/* Progress Steps - Fixed Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronRight size={24} color={Colors.text} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {["address", "shipping", "payment", "review"].map((step) => (
          <View key={step} style={styles.progressStep}>
            <View style={styles.progressStepInner}>
              <View
                style={[
                  styles.progressDot,
                  currentStep === step && styles.progressDotActive,
                  (currentStep === step || 
                   ["address", "shipping", "payment", "review"].indexOf(currentStep) > 
                   ["address", "shipping", "payment", "review"].indexOf(step)) && 
                  styles.progressDotCompleted,
                ]}
              >
                {["address", "shipping", "payment", "review"].indexOf(currentStep) > 
                 ["address", "shipping", "payment", "review"].indexOf(step) ? (
                  <CheckCircle size={12} color={Colors.white} />
                ) : (
                  <Text style={styles.progressNumber}>
                    {getStepNumber(step as CheckoutStep)}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  currentStep === step && styles.progressLabelActive,
                ]}
              >
                {getStepTitle(step as CheckoutStep)}
              </Text>
            </View>
            {step !== "review" && (
              <View style={styles.progressLine} />
            )}
          </View>
        ))}
      </View>

      {/* Current Step Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Action Buttons - Fixed Footer */}
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
              (!selectedAddress || !selectedShipping || !selectedPayment) && 
              styles.nextActionButtonDisabled,
            ]}
            onPress={handleNextStep}
            disabled={isProcessing || 
              (currentStep === "address" && !selectedAddress) ||
              (currentStep === "shipping" && !selectedShipping) ||
              (currentStep === "payment" && !selectedPayment)
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
    transform: [{ rotate: '180deg' }],
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  progressStepInner: {
    alignItems: "center",
    minWidth: 60,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.success,
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  progressLabelActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
    marginTop: -20,
  },
  // Content
  content: {
    flex: 1,
  },
  reviewContent: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  // Address
  addressCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F9FF",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  defaultBadge: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: "500",
  },
  addressDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
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
  // Shipping
  shippingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shippingCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F9FF",
  },
  shippingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  shippingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  shippingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  shippingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  shippingPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: 8,
  },
  // Payment
  paymentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F9FF",
  },
  paymentContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // Review
  orderItemsContainer: {
    marginBottom: 24,
  },
  orderItem: {
    flexDirection: "row",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  orderItemImage: {
    width: 60,
    height: 60,
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
  orderItemVariant: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
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
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  couponSection: {
    marginBottom: 24,
  },
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
  deliverySection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  deliveryDetail: {
    flexDirection: "row",
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 80,
  },
  deliveryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  totalsContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptySection: {
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
  },
  selectedIndicator: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
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
  backButtonSmall: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignSelf: 'center',
  },
  backButtonSmallText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  shippingGroup: {
    marginBottom: 16,
  },
  shippingGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
});