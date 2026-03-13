// contexts/CartContext.tsx
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { CartItem, Product, ShippingRate } from "@/types/product";
import { SelectedCustomizableOption } from "@/app/types/customizable-options";
import { APP_CURRENCY } from "@/utils/currency";
import { bagistoService } from "@/services/bagisto";
import { checkoutService } from "@/services/CheckoutService";
import { orderService } from "@/services/OrderService";
import {
  extractBagistoPrice,
  extractBagistoImage,
  extractBagistoCurrency,
  extractCartTotals,
} from "@/utils/bagistoHelpers";
import { shippingService } from "@/services/ShippingService";

interface ShippingAddress {
  companyName?: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  country: string;
  state?: string;
  postcode: string;
  phone: string;
  useForShipping?: boolean;
  defaultAddress?: boolean;
  saveAddress?: boolean;
}

export const [CartContext, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartDetails, setCartDetails] = useState<any>(null);
  const [selectedShippingRate, setSelectedShippingRate] =
    useState<ShippingRate | null>(null);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [hasError, setHasError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCart = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setHasError(false);
      console.log("🛒 [CART] Loading cart from Bagisto...");

      const bagistoCart = await bagistoService.getCartDetails();

      console.log("🛒 [CART] Cart response:", {
        id: bagistoCart?.id,
        itemsCount: bagistoCart?.itemsCount,
        itemsQty: bagistoCart?.itemsQty,
        itemsLength: bagistoCart?.items?.length,
      });

      setCartDetails(bagistoCart);

      if (!bagistoCart || !bagistoCart.items || bagistoCart.items.length === 0) {
        console.log("🛒 [CART] Cart is empty");
        setItems([]);
        setLastLoadTime(Date.now());
        return;
      }

      const convertedItems: CartItem[] = bagistoCart.items
        .filter((item: any) => item && item.id)
        .map((item: any) => {
          const price = extractBagistoPrice(item);
          const imageUrl = extractBagistoImage(item);
          const currencyCode = extractBagistoCurrency(item);

          const itemTotal = price * (item.quantity || 1);

          const cartItem: CartItem = {
            id: item.id.toString(),
            quantity: item.quantity || 1,
            product: {
              id: item.product?.id?.toString() || item.id.toString(),
              productId: item.product?.id?.toString() || item.id.toString(),
              name: item.name || item.product?.name || "Product",
              price: price,
              currencyCode: currencyCode,
              image: imageUrl,
              variantId: item.product?.id?.toString() || item.id.toString(),
              inStock: true,
              brand: item.product?.sku || "",
              type: item.product?.type || item.type || "simple",
              sku: item.product?.sku || item.sku || "",
              selectedConfigurableOption: item.selectedConfigurableOption,
              selectedOptions: item.selectedOptions || {},
              customizableOptions: item.customizableOptions || [],
            },
            formattedPrice: {
              price: price,
              total: itemTotal,
              taxAmount: 0,
              discountAmount: 0,
              currency: currencyCode,
            },
          };

          return cartItem;
        });

      console.log("✅ [CART] Successfully converted items:", {
        totalItems: convertedItems.length,
        totalPrice: convertedItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        ),
      });

      setItems(convertedItems);
      setLastLoadTime(Date.now());
      setHasError(false);
    } catch (error: any) {
      console.error("❌ [CART] Failed to load cart:", {
        message: error.message,
        stack: error.stack?.split("\n")[0],
      });
      setHasError(true);
      setItems([]);
      setCartDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("🛒 [CART] Initial cart load");
    loadCart();
  }, [loadCart, refreshKey]);

  const addToCart = useCallback(
    async (
      product: Product,
      quantity: number = 1,
      selectedOptions?: Record<string, string>,
      customizableOptions?: SelectedCustomizableOption[],
    ) => {
      try {
        setIsLoading(true);
        
        // LOG THE FULL PRODUCT OBJECT
        console.log("🔍 [CART] Full product object:", JSON.stringify({
          id: product.id,
          productId: product.productId,
          variantId: product.variantId,
          selectedConfigurableOption: product.selectedConfigurableOption,
          type: product.type,
          sku: product.sku,
          name: product.name,
          // Check if it has configurableData
          hasConfigurableData: !!(product as any).configutableData,
          configurableData: (product as any).configutableData,
        }, null, 2));

        const resolvedProductId = product?.variantId ?? product?.productId ?? product?.id;
        
        console.log("🔍 [CART] Resolved product ID:", resolvedProductId);

        if (!resolvedProductId) {
          throw new Error("Invalid product: missing product ID");
        }

        const input: any = {
          productId: String(resolvedProductId),
          quantity: quantity,
          isBuyNow: false,
        };

        if (selectedOptions && Object.keys(selectedOptions).length > 0) {
          console.log("🔄 [CART] Selected options found:", selectedOptions);

          input.superAttribute = Object.entries(selectedOptions).map(
            ([attributeCode, optionValue]) => ({
              attributeCode,
              attributeOptionId: optionValue,
            }),
          );
        }

        if (customizableOptions && customizableOptions.length > 0) {
          console.log("🔄 [CART] Customizable options found:", customizableOptions);

          input.customizableOptions = customizableOptions.map((opt) => {
            let value: any = opt.optionValue;

            // Handle file uploads
            if (value && typeof value === "object" && "uri" in value) {
              value = {
                uri: value.uri,
                name: value.name,
                type: value.mimeType || "application/octet-stream",
              };
            }

            // IMPORTANT: Bagisto expects ARRAY values
            return {
              id: opt.optionId,
              value: Array.isArray(value) ? value.map(String) : [String(value)],
            };
          });
        }

        if (product.selectedConfigurableOption) {
          input.selectedConfigurableOption = product.selectedConfigurableOption;
        }

        if (product.variantId && !input.selectedConfigurableOption) {
          input.selectedConfigurableOption = product.variantId;
        }

        console.log("🔄 [CART] GraphQL input:", JSON.stringify(input, null, 2));

        const result = await bagistoService.addToCart(input);

        console.log("📨 [CART] Add to cart response:", {
          success: result?.success,
          message: result?.message,
          cartId: result?.cart?.id,
          itemsCount: result?.cart?.itemsCount,
        });

        if (result?.success && result.cart) {
          console.log("✅ [CART] Product added successfully!");

          setCartDetails(result.cart);

          if (result.cart.items && result.cart.items.length > 0) {
            const convertedItems: CartItem[] = result.cart.items
              .filter((item: any) => item && item.id)
              .map((item: any) => {
                const price = extractBagistoPrice(item);
                const imageUrl = extractBagistoImage(item);
                const currencyCode = extractBagistoCurrency(item);
                const itemTotal = price * (item.quantity || 1);

                return {
                  id: item.id.toString(),
                  quantity: item.quantity || 1,
                  product: {
                    id: item.product?.id?.toString() || item.id.toString(),
                    productId: item.product?.id?.toString() || item.id.toString(),
                    name: item.name || item.product?.name || "Product",
                    price: price,
                    currencyCode: currencyCode,
                    image: imageUrl,
                    variantId: item.product?.id?.toString() || item.id.toString(),
                    inStock: true,
                    brand: item.product?.sku || "",
                    type: item.product?.type || item.type || "simple",
                    sku: item.product?.sku || item.sku || "",
                    selectedConfigurableOption: item.selectedConfigurableOption,
                    selectedOptions: item.selectedOptions || {},
                    customizableOptions: item.customizableOptions || [],
                  },
                  formattedPrice: {
                    price: price,
                    total: itemTotal,
                    taxAmount: 0,
                    discountAmount: 0,
                  },
                };
              });

            console.log("🔄 [CART] Updated local items state:", {
              itemsCount: convertedItems.length,
            });

            setItems(convertedItems);
          }
        }

        await loadCart(true);

        console.log("✅ [CART] Product added successfully and cart reloaded");

        return {
          success: true,
          message: result?.message || `${product.name} added to cart`,
          product,
          quantity,
          cart: result?.cart,
          cartItems: result?.cart?.items || [],
        };
      } catch (error: any) {
        console.error("❌ [CART] Failed to add to cart:", {
          error: error.message,
          productId: product?.variantId ?? product?.productId ?? product?.id,
          productName: product.name,
        });

        return {
          success: false,
          message: error.message || "Failed to add to cart",
          product,
          quantity,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [loadCart],
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }

      try {
        setIsLoading(true);
        console.log("🔄 [CART] Updating quantity:", cartItemId, quantity);

        const result = await bagistoService.updateCartItem([
          { id: cartItemId, quantity },
        ]);

        console.log("✅ [CART] Update result:", result);

        if (!result?.success) {
          throw new Error(result?.message || "Failed to update quantity");
        }

        await loadCart();

        console.log("✅ [CART] Quantity updated successfully");
      } catch (error: any) {
        console.error("❌ [CART] Failed to update quantity:", error.message);

        const itemIndex = items.findIndex((item) => item.id === cartItemId);
        if (itemIndex >= 0) {
          const updatedItems = [...items];
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            quantity: quantity,
          };
          setItems(updatedItems);
          console.log("🔄 [CART] Updated local state as fallback");
        }

        Alert.alert(
          "Sync Issue",
          "Quantity updated locally. Please refresh cart to sync with server.",
        );

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [items, loadCart],
  );

  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        setIsLoading(true);
        console.log("🗑️ [CART] Removing from cart:", cartItemId);

        const result = await bagistoService.removeFromCart(cartItemId);

        console.log("✅ [CART] Remove result:", {
          success: result?.success,
          message: result?.message,
          remainingItems: result?.cart?.itemsCount,
        });

        if (!result?.success) {
          throw new Error(result?.message || "Failed to remove item");
        }

        setItems((prevItems) =>
          prevItems.filter((item) => item.id !== cartItemId),
        );

        if (result.cart) {
          setCartDetails(result.cart);
        } else {
          await loadCart();
        }

        console.log("✅ [CART] Item removed successfully");
      } catch (error: any) {
        console.error("❌ [CART] Failed to remove from cart:", error.message);

        Alert.alert(
          "Remove Failed",
          error.message || "Could not remove item from cart. Please try again.",
        );

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [loadCart],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        setIsLoading(true);
        console.log("🎫 [CART] Applying coupon:", code);

        const result = await bagistoService.applyCoupon(code);

        if (!result?.success) {
          throw new Error(result?.message || "Failed to apply coupon");
        }

        await loadCart();

        console.log("✅ [CART] Coupon applied successfully");

        return {
          success: true,
          message: result.message || "Coupon applied successfully",
        };
      } catch (error: any) {
        console.error("❌ [CART] Failed to apply coupon:", error.message);
        return {
          success: false,
          message: error.message || "Failed to apply coupon",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [loadCart],
  );

  const removeCoupon = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🎫 [CART] Removing coupon");

      const result = await bagistoService.removeCoupon();

      if (!result?.success) {
        throw new Error(result?.message || "Failed to remove coupon");
      }

      await loadCart();

      console.log("✅ [CART] Coupon removed successfully");

      return {
        success: true,
        message: result.message || "Coupon removed successfully",
      };
    } catch (error: any) {
      console.error("❌ [CART] Failed to remove coupon:", error.message);
      return {
        success: false,
        message: error.message || "Failed to remove coupon",
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadCart]);

  const getShippingMethods = useCallback(async (shippingMethod?: string) => {
    try {
      setIsLoading(true);
      console.log("🚚 [CART] Getting shipping methods");

      const result = await shippingService.getShippingMethods();

      console.log("✅ [CART] Shipping methods result:", {
        message: result?.message,
        shippingMethodsCount: result?.shippingMethods?.length || 0,
      });

      setShippingMethods(result?.shippingMethods || []);

      console.log("✅ [CART] Shipping methods loaded");
      return result;
    } catch (error: any) {
      console.error("❌ [CART] Failed to get shipping methods:", error.message);
      return {
        message: error.message,
        shippingMethods: [],
        paymentMethods: [],
        cart: null,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCheckoutAddresses = useCallback(
    async (billing: any, shipping: any) => {
      try {
        setIsLoading(true);
        console.log("🏠 [CART] Saving checkout addresses");

        const result = await bagistoService.saveCheckoutAddresses({
          billing,
          shipping,
        });

        console.log("✅ [CART] Addresses result:", result);

        setShippingMethods(result?.shippingMethods || []);
        setPaymentMethods(result?.paymentMethods || []);

        console.log("✅ [CART] Addresses saved");
        return result;
      } catch (error: any) {
        console.error("❌ [CART] Failed to save addresses:", error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const savePayment = useCallback(async (method: string) => {
    try {
      setIsLoading(true);
      console.log("💳 [CART] Saving payment method:", method);

      const result = await bagistoService.savePayment(method);

      console.log("✅ [CART] Payment saved:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [CART] Failed to save payment:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (params?: any) => {
    try {
      setIsLoading(true);
      console.log("📋 [CART] Fetching orders...");

      const result = await orderService.getOrdersList(params);
      console.log("✅ [CART] Orders loaded:", result?.data?.length || 0);
      return result;
    } catch (error: any) {
      console.error("❌ [CART] Failed to fetch orders:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrderDetail = useCallback(async (orderId: string) => {
    try {
      setIsLoading(true);
      console.log("📋 [CART] Fetching order detail...");

      const result = await orderService.getOrderDetail(orderId);
      console.log("✅ [CART] Order detail loaded");
      return result;
    } catch (error: any) {
      console.error("❌ [CART] Failed to fetch order detail:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const placeOrder = useCallback(async (paymentDetails?: any) => {
    try {
      setIsLoading(true);
      console.log("🛍️ [CART] Placing order...");

      const response = await checkoutService.placeOrder({
        isPaymentCompleted: true,
        paymentMethod: "cashondelivery",
        ...paymentDetails,
      });

      if (!response?.success) {
        throw new Error(response?.redirectUrl || "Failed to place order");
      }

      setItems([]);
      setCartDetails(null);

      console.log("✅ [CART] Order placed:", response?.order?.incrementId);

      return {
        orderId: response?.order?.id,
        orderName: response?.order?.incrementId,
        redirectUrl: response?.redirectUrl,
      };
    } catch (error: any) {
      console.error("❌ [CART] Failed to place order:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeCheckout = useCallback(
    async (shippingInfo: {
      fullName: string;
      phone: string;
      email: string;
      city: string;
      address: string;
    }) => {
      if (items.length === 0) {
        throw new Error("Cart is empty");
      }

      try {
        console.log("🛍️ [CART] Starting checkout process...");

        const [firstName, ...lastNameParts] = shippingInfo.fullName.split(" ");
        const lastName = lastNameParts.join(" ") || firstName;

        const billingAddress: ShippingAddress = {
          firstName,
          lastName,
          email: shippingInfo.email,
          address: shippingInfo.address,
          city: shippingInfo.city,
          country: "US",
          state: "",
          postcode: "",
          phone: shippingInfo.phone,
          useForShipping: true,
          defaultAddress: false,
          saveAddress: false,
        };

        const addressResponse = await saveCheckoutAddresses(
          billingAddress,
          billingAddress,
        );

        if (addressResponse?.shippingMethods?.length > 0) {
          const firstMethod = addressResponse.shippingMethods[0].methods[0];
          // Handle shipping method selection if needed
        }

        await savePayment("cashondelivery");

        const orderResult = await placeOrder();

        console.log("✅ [CART] Order placed successfully");
        return orderResult;
      } catch (error: any) {
        console.error("❌ [CART] Checkout error:", error.message);
        throw error;
      }
    },
    [items, saveCheckoutAddresses, savePayment, placeOrder],
  );

  const subtotal = useMemo(() => {
    const cartTotals = extractCartTotals(cartDetails);
    return cartTotals.subTotal || 0;
  }, [cartDetails]);

  const total = useMemo(() => {
    const cartTotals = extractCartTotals(cartDetails);
    return cartTotals.grandTotal || 0;
  }, [cartDetails]);

  const tax = useMemo(() => {
    const cartTotals = extractCartTotals(cartDetails);
    return cartTotals.tax || 0;
  }, [cartDetails]);

  const discount = useMemo(() => {
    const cartTotals = extractCartTotals(cartDetails);
    return cartTotals.discount || 0;
  }, [cartDetails]);

  const shippingCost = useMemo(() => {
    if (!selectedShippingRate) return 0;
    return selectedShippingRate.price || 0;
  }, [selectedShippingRate]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const clearCart = useCallback(async () => {
    try {
      setItems([]);
      setCartDetails(null);
      setSelectedShippingRate(null);
      setShippingMethods([]);
      setPaymentMethods([]);
      setHasError(false);
      if (bagistoService.clearCartStorage) {
        await bagistoService.clearCartStorage();
      }
      console.log("🛒 [CART] Cart cleared");
    } catch (error) {
      console.error("❌ [CART] Failed to clear cart:", error);
    }
  }, []);

  const debugCart = useCallback(async () => {
    console.log("🔍 [CART DEBUG] Current state:", {
      itemsCount: items.length,
      items: items.map((item) => ({
        id: item.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
      })),
      isLoading,
      hasError,
      cartDetails: {
        id: cartDetails?.id,
        itemsCount: cartDetails?.itemsCount,
        itemsQty: cartDetails?.itemsQty,
        itemsLength: cartDetails?.items?.length,
        formattedPrice: cartDetails?.formattedPrice,
      },
      totals: extractCartTotals(cartDetails),
      lastLoadTime: new Date(lastLoadTime).toLocaleTimeString(),
    });

    if (bagistoService.testCartConnection) {
      const testResult = await bagistoService.testCartConnection();
      console.log("🔍 [CART DEBUG] Bagisto test:", testResult);
    }
  }, [items, isLoading, hasError, cartDetails, lastLoadTime]);

  const forceRefreshCart = useCallback(async () => {
    console.log("🔄 [CART] Force refreshing cart...");
    setRefreshKey((prev) => prev + 1);
    await loadCart();
  }, [loadCart]);

  return useMemo(
    () => ({
      items,
      cartDetails,
      isLoading,
      hasError,
      selectedShippingRate,
      setSelectedShippingRate,
      shippingMethods,
      paymentMethods,
      lastLoadTime,

      addToCart,
      updateQuantity,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      loadCart,
      clearCart,
      debugCart,
      forceRefreshCart,

      saveCheckoutAddresses,
      savePayment,
      placeOrder,
      completeCheckout,

      fetchOrders,
      fetchOrderDetail,

      subtotal,
      shippingCost,
      total,
      tax,
      discount,
      itemCount,

      currencyCode: APP_CURRENCY,
      shippingDiscounts: [],
      applicableShippingDiscount: null,
      getDiscountThreshold: () => 0,
    }),
    [
      items,
      cartDetails,
      isLoading,
      hasError,
      selectedShippingRate,
      shippingMethods,
      paymentMethods,
      lastLoadTime,
      addToCart,
      updateQuantity,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      loadCart,
      clearCart,
      debugCart,
      forceRefreshCart,
      saveCheckoutAddresses,
      savePayment,
      placeOrder,
      completeCheckout,
      subtotal,
      shippingCost,
      total,
      tax,
      discount,
      itemCount,
      fetchOrders,
      fetchOrderDetail,
    ],
  );
});