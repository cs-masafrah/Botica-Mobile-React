import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { CartItem, Product, ShippingRate } from "@/types/product";
import { APP_CURRENCY } from "@/utils/currency";
import { bagistoService } from "@/services/bagisto";
import { checkoutService } from "@/services/CheckoutService";
import { orderService } from "@/services/OrderService";
import {
  extractBagistoPrice,
  extractBagistoImage,
  extractBagistoCurrency,
  extractCartTotals,
  parseCurrencyString,
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
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for forced reloads

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

      // Check if cart is empty
      if (
        !bagistoCart ||
        !bagistoCart.items ||
        bagistoCart.items.length === 0
      ) {
        console.log("🛒 [CART] Cart is empty");
        setItems([]);
        setLastLoadTime(Date.now());
        return;
      }

      // Convert Bagisto cart items to local format
      const convertedItems: CartItem[] = bagistoCart.items
        .filter((item) => item && item.id)
        .map((item) => {
          const price = extractBagistoPrice(item);
          const imageUrl = extractBagistoImage(item);
          const currencyCode = extractBagistoCurrency(item);

          console.log(`📦 [CART ITEM] ${item.name}:`, {
            rawPrice: item.formattedPrice?.price,
            extractedPrice: price,
            quantity: item.quantity,
            total: price * (item.quantity || 1),
            hasImage: !!imageUrl,
            currency: currencyCode,
          });

          // Calculate total for this item
          const itemTotal = price * (item.quantity || 1);

          // Create cart item
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
              // Bagisto specific fields
              selectedConfigurableOption: item.selectedConfigurableOption,
              selectedOptions: item.selectedOptions || {},
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
        items: convertedItems.map((item) => ({
          name: item.product.name.substring(0, 20),
          price: item.product.price,
          quantity: item.quantity,
          total: item.product.price * item.quantity,
        })),
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

  // Initial cart load
  useEffect(() => {
    console.log("🛒 [CART] Initial cart load");
    loadCart();
  }, [loadCart, refreshKey]); // Add refreshKey dependency

  /// Add to cart
  const addToCart = useCallback(
    async (
      product: Product,
      quantity: number = 1,
      selectedOptions?: Record<string, string>,
    ) => {
      try {
        setIsLoading(true);
        console.log("➕ [CART] Adding product to cart:", {
          productId: product.productId || product.id,
          productName: product.name,
          quantity,
          selectedOptions,
          price: product.price,
        });

        // Prepare input matching GraphQL schema
        const input: any = {
          productId: product.productId || product.id,
          quantity: quantity,
          isBuyNow: false, // Set to false as in your query
        };

        // Handle configurable options for variants
        if (selectedOptions && Object.keys(selectedOptions).length > 0) {
          console.log("🔄 [CART] Selected options found:", selectedOptions);

          // Convert to superAttribute format (Bagisto expects this format)
          input.superAttribute = Object.entries(selectedOptions).map(
            ([attributeCode, optionValue]) => ({
              attributeCode,
              attributeOptionId: optionValue,
            }),
          );
        }

        // Handle selected variant ID if available
        if (product.selectedConfigurableOption) {
          input.selectedConfigurableOption = product.selectedConfigurableOption;
        }

        // If variantId is provided, use it as selectedConfigurableOption
        if (product.variantId && !input.selectedConfigurableOption) {
          input.selectedConfigurableOption = product.variantId;
        }

        console.log("🔄 [CART] GraphQL input:", JSON.stringify(input, null, 2));

        const result = await bagistoService.addToCart(input);

        // Log the response for debugging
        console.log("📨 [CART] Add to cart response:", {
          success: result.success,
          message: result.message,
          cartId: result.cart?.id,
          itemsCount: result.cart?.itemsCount,
          items: result.cart?.items?.length || 0,
        });

        if (result.success && result.cart) {
          console.log("✅ [CART] Product added successfully!");

          // Log the added item details
          if (result.cart?.items && result.cart.items.length > 0) {
            const latestItem = result.cart.items[result.cart.items.length - 1];
            console.log("📦 [CART] Added item details:", {
              productName: latestItem.product.name,
              quantity: latestItem.quantity,
              price: latestItem.product.price,
              total: latestItem.quantity * latestItem.product.price,
              images: latestItem.product.images?.length || 0,
            });
          }

          // Update cartDetails state with the new cart data
          setCartDetails(result.cart);

          // Convert and update items state
          if (result.cart.items && result.cart.items.length > 0) {
            const convertedItems: CartItem[] = result.cart.items
              .filter((item) => item && item.id)
              .map((item) => {
                const price = extractBagistoPrice(item);
                const imageUrl = extractBagistoImage(item);
                const currencyCode = extractBagistoCurrency(item);

                // Calculate total for this item
                const itemTotal = price * (item.quantity || 1);

                // Create cart item
                const cartItem: CartItem = {
                  id: item.id.toString(),
                  quantity: item.quantity || 1,
                  product: {
                    id: item.product?.id?.toString() || item.id.toString(),
                    productId:
                      item.product?.id?.toString() || item.id.toString(),
                    name: item.name || item.product?.name || "Product",
                    price: price,
                    currencyCode: currencyCode,
                    image: imageUrl,
                    variantId:
                      item.product?.id?.toString() || item.id.toString(),
                    inStock: true,
                    brand: item.product?.sku || "",
                    type: item.product?.type || item.type || "simple",
                    sku: item.product?.sku || item.sku || "",
                    // Bagisto specific fields
                    selectedConfigurableOption: item.selectedConfigurableOption,
                    selectedOptions: item.selectedOptions || {},
                  },
                  formattedPrice: {
                    price: price,
                    total: itemTotal,
                    taxAmount: 0,
                    discountAmount: 0,
                  },
                };

                return cartItem;
              });

            console.log("🔄 [CART] Updated local items state:", {
              itemsCount: convertedItems.length,
              totalItems: convertedItems.reduce(
                (sum, item) => sum + item.quantity,
                0,
              ),
            });

            setItems(convertedItems);
          }
        }

        // Always reload cart to ensure we have the latest state
        await loadCart(true);

        console.log("✅ [CART] Product added successfully and cart reloaded");

        return {
          success: true,
          message: result.message || `${product.name} added to cart`,
          product,
          quantity,
          cart: result.cart,
          cartItems: result.cart?.items || [],
        };
      } catch (error: any) {
        console.error("❌ [CART] Failed to add to cart:", {
          error: error.message,
          productId: product.productId || product.id,
          productName: product.name,
          stack: error.stack,
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
    [loadCart, setCartDetails, setItems, setIsLoading],
  );

  // Update quantity - FIXED VERSION
  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }

      try {
        setIsLoading(true);
        console.log("🔄 [CART] Updating quantity:", cartItemId, quantity);

        // Update via Bagisto
        const result = await bagistoService.updateCartItem([
          { id: cartItemId, quantity },
        ]);

        console.log("✅ [CART] Update result:", result);

        if (!result.success) {
          throw new Error(result.message || "Failed to update quantity");
        }

        // Force reload cart
        await loadCart();

        console.log("✅ [CART] Quantity updated successfully");
      } catch (error: any) {
        console.error("❌ [CART] Failed to update quantity:", error.message);

        // Update local state as fallback
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

  // In CartContext.tsx, update the removeFromCart function:

  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        setIsLoading(true);
        console.log("🗑️ [CART] Removing from cart:", cartItemId);

        const result = await bagistoService.removeFromCart(cartItemId);

        console.log("✅ [CART] Remove result:", {
          success: result.success,
          message: result.message,
          remainingItems: result.cart?.itemsCount,
        });

        if (!result.success) {
          throw new Error(result.message || "Failed to remove item");
        }

        // Update local state immediately
        setItems((prevItems) =>
          prevItems.filter((item) => item.id !== cartItemId),
        );

        // Also update cart details if available in response
        if (result.cart) {
          setCartDetails(result.cart);
        } else {
          // Force reload cart to get updated state
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

  // contexts/CartContext.tsx - Add these methods
  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        setIsLoading(true);
        console.log("🎫 [CART] Applying coupon:", code);

        const result = await bagistoService.applyCoupon(code);

        if (!result?.success) {
          throw new Error(result?.message || "Failed to apply coupon");
        }

        // Update cart details with the new coupon data
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

      // Update cart details to remove coupon
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

  // Get shipping methods
  const getShippingMethods = useCallback(async (shippingMethod?: string) => {
    try {
      setIsLoading(true);
      console.log("🚚 [CART] Getting shipping methods");

      // Use shippingService instead of checkoutService
      const result = await shippingService.getShippingMethods();

      console.log("✅ [CART] Shipping methods result:", {
        message: result.message,
        shippingMethodsCount: result.shippingMethods?.length || 0,
      });

      setShippingMethods(result.shippingMethods || []);

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

  // Save checkout addresses
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

        setShippingMethods(result.shippingMethods || []);
        setPaymentMethods(result.paymentMethods || []);

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

  // Save payment
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

  // Fetch orders
  const fetchOrders = useCallback(async (params?: any) => {
    try {
      setIsLoading(true);
      console.log("📋 [CART] Fetching orders...");

      const result = await orderService.getOrdersList(params);
      console.log("✅ [CART] Orders loaded:", result.data.length);
      return result;
    } catch (error: any) {
      console.error("❌ [CART] Failed to fetch orders:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch order detail
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

  // Place order
  const placeOrder = useCallback(async (paymentDetails?: any) => {
    try {
      setIsLoading(true);
      console.log("🛍️ [CART] Placing order...");

      const response = await checkoutService.placeOrder({
        isPaymentCompleted: true,
        paymentMethod: "cashondelivery",
        ...paymentDetails,
      });

      if (!response.success) {
        throw new Error(response.redirectUrl || "Failed to place order");
      }

      // Clear cart after successful order
      setItems([]);
      setCartDetails(null);

      console.log("✅ [CART] Order placed:", response.order.incrementId);

      return {
        orderId: response.order.id,
        orderName: response.order.incrementId,
        redirectUrl: response.redirectUrl,
      };
    } catch (error: any) {
      console.error("❌ [CART] Failed to place order:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Complete checkout
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

        if (addressResponse.shippingMethods.length > 0) {
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

  // Calculate totals
  // const subtotal = useMemo(() => {
  //   const cartTotals = extractCartTotals(cartDetails);
  //   return cartTotals.subtotal;
  // }, [cartDetails]);

  // const total = useMemo(() => {
  //   const cartTotals = extractCartTotals(cartDetails);
  //   return cartTotals.grandTotal;
  // }, [cartDetails]);

  // const tax = useMemo(() => {
  //   const cartTotals = extractCartTotals(cartDetails);
  //   return cartTotals.tax;
  // }, [cartDetails]);

  // const discount = useMemo(() => {
  //   const cartTotals = extractCartTotals(cartDetails);
  //   return cartTotals.discount;
  // }, [cartDetails]);

  // Calculate totals - FIXED VERSION
  const subtotal = useMemo(() => {
    const cartTotals = extractCartTotals(cartDetails);
    console.log("🧮 [CART] subtotal calculation:", {
      raw: cartTotals,
      subTotal: cartTotals.subTotal, // camelCase
      cartDetailsKeys: cartDetails ? Object.keys(cartDetails) : [],
    });
    return cartTotals.subTotal; // camelCase
  }, [cartDetails]);

  const total = useMemo(() => {
    const cartTotals = extractCartTotals(cartDetails);
    console.log("🧮 [CART] total calculation:", cartTotals.grandTotal);
    return cartTotals.grandTotal;
  }, [cartDetails]);

  const tax = useMemo(() => {
    const cartTotals = extractCartTotals(cartDetails);
    console.log("🧮 [CART] tax calculation:", cartTotals.tax);
    return cartTotals.tax;
  }, [cartDetails]);

  const discount = useMemo(() => {
    const cartTotals = extractCartTotals(cartDetails);
    console.log("🧮 [CART] discount calculation:", cartTotals.discount);
    return cartTotals.discount;
  }, [cartDetails]);

  const shippingCost = useMemo(() => {
    if (!selectedShippingRate) return 0;
    return selectedShippingRate.price || 0;
  }, [selectedShippingRate]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setItems([]);
      setCartDetails(null);
      setSelectedShippingRate(null);
      setShippingMethods([]);
      setPaymentMethods([]);
      setHasError(false);
      await bagistoService.clearCartStorage();
      console.log("🛒 [CART] Cart cleared");
    } catch (error) {
      console.error("❌ [CART] Failed to clear cart:", error);
    }
  }, []);

  // Debug cart
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

    // Test Bagisto service directly
    const testResult = await bagistoService.testCartConnection();
    console.log("🔍 [CART DEBUG] Bagisto test:", testResult);
  }, [items, isLoading, hasError, cartDetails, lastLoadTime]);

  // Force refresh cart
  const forceRefreshCart = useCallback(async () => {
    console.log("🔄 [CART] Force refreshing cart...");
    setRefreshKey((prev) => prev + 1);
    await loadCart();
  }, [loadCart]);

  return useMemo(
    () => ({
      // State
      items,
      cartDetails,
      isLoading,
      hasError,
      selectedShippingRate,
      setSelectedShippingRate,
      shippingMethods,
      paymentMethods,
      lastLoadTime,

      // Cart operations
      addToCart,
      updateQuantity,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      loadCart,
      clearCart,
      debugCart,
      forceRefreshCart,

      // Checkout operations
      saveCheckoutAddresses,
      savePayment,
      placeOrder,
      completeCheckout,

      fetchOrders,
      fetchOrderDetail,

      // Totals
      subtotal,
      shippingCost,
      total,
      tax,
      discount,
      itemCount,

      // For compatibility with existing components
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
