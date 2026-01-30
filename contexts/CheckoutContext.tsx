// contexts/CheckoutContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { bagistoService } from "@/services/bagisto";
import { Alert } from "react-native";

interface CheckoutAddress {
  firstName: string;
  lastName: string;
  email: string;
  address: string[];
  country: string;
  state: string;
  city: string;
  postcode: string;
  phone: string;
  useForShipping?: boolean;
  defaultAddress?: boolean;
  companyName?: string;
}

interface ShippingMethod {
  code: string;
  label: string;
  price: number;
  formattedPrice: string;
}

interface PaymentMethod {
  method: string;
  methodTitle: string;
  description?: string;
  sort?: number;
  image?: string;
}

interface CheckoutContextType {
  // State
  step: number;
  billingAddress: CheckoutAddress | null;
  shippingAddress: CheckoutAddress | null;
  useBillingForShipping: boolean;
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  selectedShippingMethod: string | null;
  selectedPaymentMethod: string | null;
  isLoading: boolean;
  error: string | null;
  orderResult: any | null;

  // Methods
  setStep: (step: number) => void;
  saveAddresses: (
    billing: CheckoutAddress,
    shipping: CheckoutAddress,
  ) => Promise<any>;
  setUseBillingForShipping: (value: boolean) => void;
  selectShippingMethod: (methodCode: string) => Promise<any>;
  selectPaymentMethod: (method: string) => Promise<any>;
  placeOrder: () => Promise<any>;
  resetCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined,
);

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within CheckoutProvider");
  }
  return context;
};

export const CheckoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [step, setStep] = useState(1);
  const [billingAddress, setBillingAddress] = useState<CheckoutAddress | null>(
    null,
  );
  const [shippingAddress, setShippingAddress] =
    useState<CheckoutAddress | null>(null);
  const [useBillingForShipping, setUseBillingForShipping] = useState(true);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<
    string | null
  >(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any | null>(null);

  const saveAddresses = useCallback(
    async (billing: CheckoutAddress, shipping: CheckoutAddress) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("🏠 Saving checkout addresses...");
        console.log("Billing address:", JSON.stringify(billing, null, 2));
        console.log("Shipping address:", JSON.stringify(shipping, null, 2));

        const result = await bagistoService.saveCheckoutAddresses({
          billing: {
            firstName: billing.firstName,
            lastName: billing.lastName,
            email: billing.email,
            address: billing.address,
            country: billing.country,
            state: billing.state,
            city: billing.city,
            postcode: billing.postcode,
            phone: billing.phone,
            useForShipping: billing.useForShipping || false,
            defaultAddress: billing.defaultAddress || false,
            companyName: billing.companyName || "",
          },
          shipping: {
            firstName: shipping.firstName,
            lastName: shipping.lastName,
            email: shipping.email,
            address: shipping.address,
            country: shipping.country,
            state: shipping.state,
            city: shipping.city,
            postcode: shipping.postcode,
            phone: shipping.phone,
            defaultAddress: shipping.defaultAddress || false,
            companyName: shipping.companyName || "",
          },
        });

        console.log("✅ Addresses saved:", JSON.stringify(result, null, 2));

        if (result) {
          // Store addresses in state
          setBillingAddress(billing);
          setShippingAddress(shipping);

          // Extract shipping methods
          if (result.shippingMethods && result.shippingMethods.length > 0) {
            console.log(
              "🚚 Shipping methods structure:",
              result.shippingMethods,
            );

            const methods: ShippingMethod[] = [];

            result.shippingMethods.forEach((group: any) => {
              console.log("📦 Processing shipping group:", {
                title: group.title,
                methods: group.methods,
                methodsType: typeof group.methods,
                isArray: Array.isArray(group.methods),
              });

              if (group.methods) {
                // Handle single object case
                if (!Array.isArray(group.methods)) {
                  const method = group.methods;
                  methods.push({
                    code: method.code,
                    label: method.label,
                    price: method.price || 0,
                    formattedPrice: method.formattedPrice || method.label,
                  });
                } else {
                  // Handle array case
                  group.methods.forEach((method: any) => {
                    methods.push({
                      code: method.code,
                      label: method.label,
                      price: method.price || 0,
                      formattedPrice: method.formattedPrice || method.label,
                    });
                  });
                }
              }
            });

            console.log("✅ Extracted shipping methods:", methods);
            setShippingMethods(methods);
          }

          // Extract and set payment methods
          if (result.paymentMethods) {
            console.log("💳 Payment methods:", result.paymentMethods);
            setPaymentMethods(result.paymentMethods);
          }

          // Move to shipping methods step
          setStep(2);
        }

        return result;
      } catch (error: any) {
        console.error("❌ Failed to save addresses:", error);
        const errorMessage = error.message || "Failed to save addresses";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const selectShippingMethod = useCallback(async (methodCode: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🚚 Selecting shipping method:", methodCode);

      const shippingResult = await bagistoService.saveShippingMethod(methodCode);

      if (shippingResult) {
        setSelectedShippingMethod(methodCode);

        // Now load payment methods for this shipping method
        console.log(
          "💳 Loading payment methods for shipping method:",
          methodCode,
        );

        try {
          const paymentMethodsResult =
            await bagistoService.getPaymentMethods(methodCode);
          console.log("💳 Payment methods result:", paymentMethodsResult);

          if (paymentMethodsResult?.paymentMethods) {
            const methods = paymentMethodsResult.paymentMethods.map(
              (pm: any) => ({
                method: pm.method || "",
                methodTitle: pm.methodTitle || "",
                description: pm.description || "",
                sort: pm.sort || 0,
                image: pm.image || "",
              }),
            );

            setPaymentMethods(methods);
            console.log("✅ Set payment methods:", methods);
          } else {
            console.log("⚠️ No payment methods returned");
            setPaymentMethods([]);
          }
        } catch (paymentError: any) {
          console.error("❌ Failed to load payment methods:", paymentError);
          // Still continue, show empty state
          setPaymentMethods([]);
        }

        // Move to payment step
        setStep(3);
      }

      return shippingResult;
    } catch (error: any) {
      console.error("❌ Failed to select shipping method:", error);
      setError(error.message || "Failed to select shipping method");
      Alert.alert(
        "Error",
        "Failed to select shipping method. Please try again.",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectPaymentMethod = useCallback(async (method: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("💳 Selecting payment method:", method);

      const result = await bagistoService.savePayment(method);

      if (result) {
        setSelectedPaymentMethod(method);
        setStep(4); // Move to review step
      }

      return result;
    } catch (error: any) {
      console.error("❌ Failed to select payment method:", error);
      setError(error.message || "Failed to select payment method");
      Alert.alert(
        "Error",
        "Failed to select payment method. Please try again.",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const placeOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🛍️ Placing order...");

      const result = await bagistoService.placeOrder();

      console.log("✅ Order placed:", result);

      if (result?.success) {
        setOrderResult(result);
        setStep(5); // Move to success step
      }

      return result;
    } catch (error: any) {
      console.error("❌ Failed to place order:", error);
      setError(error.message || "Failed to place order");
      Alert.alert("Error", "Failed to place order. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetCheckout = useCallback(() => {
    setStep(1);
    setBillingAddress(null);
    setShippingAddress(null);
    setUseBillingForShipping(true);
    setShippingMethods([]);
    setPaymentMethods([]);
    setSelectedShippingMethod(null);
    setSelectedPaymentMethod(null);
    setOrderResult(null);
    setError(null);
  }, []);

  const value = {
    step,
    billingAddress,
    shippingAddress,
    useBillingForShipping,
    shippingMethods,
    paymentMethods,
    selectedShippingMethod,
    selectedPaymentMethod,
    isLoading,
    error,
    orderResult,
    setStep,
    saveAddresses,
    setUseBillingForShipping,
    selectShippingMethod,
    selectPaymentMethod,
    placeOrder,
    resetCheckout,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};