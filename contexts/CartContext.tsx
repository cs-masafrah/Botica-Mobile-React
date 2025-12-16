import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartItem, Product, ShippingRate, ShippingDiscount } from '@/types/product';
import { shopifyService } from '@/services/shopify';
import { APP_CURRENCY, convertCurrency } from '@/utils/currency';

const CART_STORAGE_KEY = '@beauty_cart';
const CART_CURRENCY = APP_CURRENCY;

export const [CartContext, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null);
  const [shippingDiscounts, setShippingDiscounts] = useState<ShippingDiscount[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          } else {
            console.warn('Invalid cart format, clearing storage');
            await AsyncStorage.removeItem(CART_STORAGE_KEY);
          }
        } catch (parseError) {
          console.error('Failed to parse cart data:', parseError);
          console.log('Clearing corrupted cart data');
          await AsyncStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveCart = useCallback(async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, [items]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const loadDiscounts = async () => {
      setIsLoadingDiscounts(true);
      try {
        const discounts = await shopifyService.getShippingDiscounts();
        console.log('[CartContext] ✅ Loaded shipping discounts:', discounts.length);
        setShippingDiscounts(discounts);
      } catch {
        console.log('[CartContext] ℹ️  No shipping discounts configured. Continuing without discounts.');
        setShippingDiscounts([]);
      } finally {
        setIsLoadingDiscounts(false);
      }
    };
    
    loadDiscounts();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveCart();
    }
  }, [items, isLoaded, saveCart]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    console.log('[CartContext] addToCart called:', { productId: product.id, productName: product.name, quantity });
    setItems((prevItems) => {
      console.log('[CartContext] Current cart items:', prevItems.length);
      const existingItem = prevItems.find(item => {
        const isSameId = item.product.id === product.id;
        const isSameVariantId = product.variantId && item.product.variantId === product.variantId;
        return isSameId || isSameVariantId;
      });
      
      if (existingItem) {
        console.log('[CartContext] Item exists, updating quantity from', existingItem.quantity, 'to', existingItem.quantity + quantity);
        return prevItems.map(item => {
          const isSameId = item.product.id === product.id;
          const isSameVariantId = product.variantId && item.product.variantId === product.variantId;
          return (isSameId || isSameVariantId)
            ? { ...item, quantity: item.quantity + quantity }
            : item;
        });
      }
      
      console.log('[CartContext] Adding new item to cart');
      const newItems = [...prevItems, { product, quantity }];
      console.log('[CartContext] New cart items count:', newItems.length);
      return newItems;
    });
    setSuccessMessage('Product successfully added to cart');
    setTimeout(() => setSuccessMessage(null), 1200);
  }, []);

  const addMultipleToCart = useCallback((items: { product: Product; quantity: number }[]) => {
    console.log('[CartContext] addMultipleToCart called with', items.length, 'items');
    console.log('[CartContext] Items details:', items.map(i => ({ name: i.product.name, qty: i.quantity })));
    
    return new Promise<void>((resolve) => {
      setItems((prevItems) => {
        console.log('[CartContext] Current cart before update:', prevItems.length, 'items');
        let updatedItems = [...prevItems];
        
        for (const { product, quantity } of items) {
          console.log('[CartContext] Processing product:', product.name, 'variantId:', product.variantId);
          const existingIndex = updatedItems.findIndex(item => {
            const isSameId = item.product.id === product.id;
            const isSameVariantId = product.variantId && item.product.variantId === product.variantId;
            return isSameId || isSameVariantId;
          });
          
          if (existingIndex !== -1) {
            console.log('[CartContext] Found existing item at index', existingIndex, 'updating quantity');
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + quantity
            };
          } else {
            console.log('[CartContext] Adding as new item');
            updatedItems.push({ product, quantity });
          }
        }
        
        console.log('[CartContext] Updated cart items count:', updatedItems.length);
        console.log('[CartContext] Updated cart details:', updatedItems.map(i => ({ name: i.product.name, qty: i.quantity })));
        
        setTimeout(() => {
          console.log('[CartContext] Resolving promise after state update');
          resolve();
        }, 100);
        
        return updatedItems;
      });
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getDiscountThreshold = useCallback(
    (discount: ShippingDiscount) =>
      convertCurrency(discount.minimumOrderAmount, discount.currencyCode, CART_CURRENCY),
    [],
  );

  const subtotal = useMemo(
    () => {
      const total = items.reduce((sum, item) => {
        const lineTotal = item.product.price * item.quantity;
        const converted = convertCurrency(
          lineTotal,
          item.product.currencyCode || CART_CURRENCY,
          CART_CURRENCY,
        );
        console.log(`[CartContext] 🧮 Line item: ${item.product.name} x${item.quantity} = ${lineTotal} ${item.product.currencyCode} → ${converted} ${CART_CURRENCY}`);
        return sum + converted;
      }, 0);
      console.log(`[CartContext] 🧮 Subtotal: ${total} ${CART_CURRENCY}`);
      return total;
    },
    [items],
  );
  
  const applicableShippingDiscount = useMemo(() => {
    console.log('[CartContext] 🎁 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[CartContext] 🎁 DISCOUNT ELIGIBILITY CHECK');
    console.log('[CartContext] 🎁 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (shippingDiscounts.length === 0) {
      console.log('[CartContext] 🎁 ❌ No shipping discounts configured in Shopify');
      console.log('[CartContext] 🎁 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return null;
    }
    
    if (subtotal === 0) {
      console.log('[CartContext] 🎁 ❌ Cart subtotal is 0');
      console.log('[CartContext] 🎁 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return null;
    }
    
    console.log(`[CartContext] 🎁 Current cart subtotal: ${subtotal.toFixed(2)} ${CART_CURRENCY}`);
    console.log(`[CartContext] 🎁 Available shipping discounts: ${shippingDiscounts.length}`);
    console.log('[CartContext] 🎁');
    
    const applicableDiscounts = shippingDiscounts.filter(discount => {
      const normalizedMinimum = getDiscountThreshold(discount);
      const isApplicable = subtotal >= normalizedMinimum;
      
      console.log(`[CartContext] 🎁   Discount: "${discount.title}"`);
      console.log(`[CartContext] 🎁     Code: ${discount.code}`);
      console.log(`[CartContext] 🎁     Minimum required: ${discount.minimumOrderAmount.toFixed(2)} ${discount.currencyCode} → ${normalizedMinimum.toFixed(2)} ${CART_CURRENCY}`);
      console.log(`[CartContext] 🎁     Cart subtotal: ${subtotal.toFixed(2)} ${CART_CURRENCY}`);
      console.log(`[CartContext] 🎁     Eligible: ${isApplicable ? '✅ YES' : '❌ NO'}`);
      console.log('[CartContext] 🎁');
      
      return isApplicable;
    });
    
    if (applicableDiscounts.length === 0) {
      console.log('[CartContext] 🎁 ❌ No discounts meet the minimum order amount');
      const nextDiscount = shippingDiscounts
        .map(d => ({ discount: d, threshold: getDiscountThreshold(d) }))
        .filter(e => subtotal < e.threshold)
        .sort((a, b) => a.threshold - b.threshold)[0];
      
      if (nextDiscount) {
        const remaining = nextDiscount.threshold - subtotal;
        console.log(`[CartContext] 🎁 💡 Add ${remaining.toFixed(2)} ${CART_CURRENCY} more for "${nextDiscount.discount.title}"`);
      }
      console.log('[CartContext] 🎁 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return null;
    }
    
    applicableDiscounts.sort(
      (a, b) => getDiscountThreshold(b) - getDiscountThreshold(a),
    );
    const discount = applicableDiscounts[0];
    
    console.log('[CartContext] 🎁 ✅✅✅ FREE SHIPPING DISCOUNT QUALIFIED! ✅✅✅');
    console.log(`[CartContext] 🎁   Title: ${discount.title}`);
    console.log(`[CartContext] 🎁   Code: ${discount.code}`);
    console.log(`[CartContext] 🎁   Minimum: ${discount.minimumOrderAmount.toFixed(2)} ${discount.currencyCode}`);
    console.log(`[CartContext] 🎁   Your subtotal: ${subtotal.toFixed(2)} ${CART_CURRENCY}`);
    console.log('[CartContext] 🎁 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return discount;
  }, [shippingDiscounts, subtotal, getDiscountThreshold]);
  
  const shippingCost = useMemo(() => {
    console.log('[CartContext] 🚢 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[CartContext] 🚢 SHIPPING COST CALCULATION');
    console.log('[CartContext] 🚢 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!selectedShippingRate) {
      console.log('[CartContext] 🚢 ❌ No shipping rate selected');
      console.log('[CartContext] 🚢 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return 0;
    }
    
    const baseShippingCost = convertCurrency(
      selectedShippingRate.price,
      selectedShippingRate.currencyCode,
      CART_CURRENCY
    );
    
    console.log(`[CartContext] 🚢 Selected shipping rate: ${selectedShippingRate.title}`);
    console.log(`[CartContext] 🚢 Original price: ${selectedShippingRate.price.toFixed(2)} ${selectedShippingRate.currencyCode}`);
    console.log(`[CartContext] 🚢 Converted price: ${baseShippingCost.toFixed(2)} ${CART_CURRENCY}`);
    console.log('[CartContext] 🚢');
    
    if (applicableShippingDiscount) {
      console.log('[CartContext] 🚢 🎉 FREE SHIPPING DISCOUNT APPLIED!');
      console.log(`[CartContext] 🚢   Discount: ${applicableShippingDiscount.title}`);
      console.log(`[CartContext] 🚢   Original shipping: ${baseShippingCost.toFixed(2)} ${CART_CURRENCY}`);
      console.log(`[CartContext] 🚢   Final shipping: 0.00 ${CART_CURRENCY}`);
      console.log(`[CartContext] 🚢   You saved: ${baseShippingCost.toFixed(2)} ${CART_CURRENCY}`);
      console.log('[CartContext] 🚢 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return 0;
    }
    
    console.log(`[CartContext] 🚢 No discount applied`);
    console.log(`[CartContext] 🚢 Final shipping cost: ${baseShippingCost.toFixed(2)} ${CART_CURRENCY}`);
    console.log('[CartContext] 🚢 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return baseShippingCost;
  }, [selectedShippingRate, applicableShippingDiscount]);

  const total = useMemo(() => {
    const calculatedTotal = subtotal + shippingCost;
    console.log('[CartContext] 💰 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[CartContext] 💰 FINAL TOTAL CALCULATION');
    console.log('[CartContext] 💰 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[CartContext] 💰 Subtotal:          ${subtotal.toFixed(2)} ${CART_CURRENCY}`);
    console.log(`[CartContext] 💰 Shipping:          ${shippingCost.toFixed(2)} ${CART_CURRENCY}`);
    if (applicableShippingDiscount) {
      console.log(`[CartContext] 💰 Discount Applied:  ${applicableShippingDiscount.title}`);
    }
    console.log(`[CartContext] 💰 ─────────────────────────────────`);
    console.log(`[CartContext] 💰 TOTAL:             ${calculatedTotal.toFixed(2)} ${CART_CURRENCY}`);
    console.log('[CartContext] 💰 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return calculatedTotal;
  }, [subtotal, shippingCost, applicableShippingDiscount]);
  
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const completeCheckout = useCallback(async (shippingInfo: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    address: string;
  }) => {
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    try {
      console.log('[CartContext] 🛍️ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[CartContext] 🛍️ CHECKOUT PROCESS STARTING');
      console.log('[CartContext] 🛍️ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const originalShippingCost = selectedShippingRate
        ? convertCurrency(selectedShippingRate.price, selectedShippingRate.currencyCode, CART_CURRENCY)
        : 0;
      
      const finalShippingCost = applicableShippingDiscount && originalShippingCost > 0 ? 0 : originalShippingCost;
      
      console.log(`[CartContext] 🛍️ Items in cart: ${items.length}`);
      console.log(`[CartContext] 🛍️ Subtotal: ${subtotal.toFixed(2)} ${CART_CURRENCY}`);
      console.log(`[CartContext] 🛍️ Selected shipping rate: ${selectedShippingRate?.title || 'None'}`);
      console.log(`[CartContext] 🛍️ Original shipping cost: ${originalShippingCost.toFixed(2)} ${CART_CURRENCY}`);
      console.log(`[CartContext] 🛍️ Applicable discount: ${applicableShippingDiscount?.title || 'None'}`);
      console.log(`[CartContext] 🛍️ Discount code: ${applicableShippingDiscount?.code || 'N/A'}`);
      console.log(`[CartContext] 🛍️ Final shipping cost: ${finalShippingCost.toFixed(2)} ${CART_CURRENCY}`);
      console.log(`[CartContext] 🛍️ Total: ${total.toFixed(2)} ${CART_CURRENCY}`);
      console.log(`[CartContext] 🛍️ Will send discount code to Shopify: ${!!applicableShippingDiscount ? 'YES' : 'NO'}`);
      console.log('[CartContext] 🛍️');
      
      const unavailableItems = items.filter(item => !item.product.variantId || !item.product.inStock);
      if (unavailableItems.length > 0) {
        const productNames = unavailableItems.map(item => item.product.name).join(', ');
        throw new Error(`Some products cannot be purchased: ${productNames}. Please remove them from your cart.`);
      }
      
      const [firstName, ...lastNameParts] = shippingInfo.fullName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      const lineItems = items.map(item => ({
        variantId: item.product.variantId!,
        quantity: item.quantity,
      }));

      const orderPayload = {
        lineItems,
        customer: {
          email: shippingInfo.email,
          firstName,
          lastName,
        },
        shippingAddress: {
          firstName,
          lastName,
          address1: shippingInfo.address,
          city: shippingInfo.city,
          phone: shippingInfo.phone,
          country: 'US',
        },
        shippingLine: selectedShippingRate ? {
          title: applicableShippingDiscount && originalShippingCost > 0 
            ? `${selectedShippingRate.title} (Free Shipping Applied)` 
            : selectedShippingRate.title,
          price: finalShippingCost,
          code: selectedShippingRate.id,
        } : undefined,
        discountCodes: applicableShippingDiscount ? [applicableShippingDiscount.code] : undefined,
      };
      
      console.log('[CartContext] 🛍️ Order payload:', JSON.stringify(orderPayload, null, 2));
      console.log('[CartContext] 🛍️ Creating order in Shopify...');
      
      const result = await shopifyService.createOrder(orderPayload);
      
      console.log('[CartContext] 🛍️ ✅ Order created successfully!');
      console.log(`[CartContext] 🛍️ Order ID: ${result.orderId}`);
      console.log(`[CartContext] 🛍️ Order Name: ${result.orderName}`);
      console.log('[CartContext] 🛍️ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      clearCart();
      
      return result;
    } catch (error) {
      console.error('[CartContext] 🛍️ ❌ Checkout error:', error);
      throw error;
    }
  }, [items, clearCart, selectedShippingRate, applicableShippingDiscount, subtotal, total]);

  return useMemo(() => ({
    items,
    addToCart,
    addMultipleToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    completeCheckout,
    subtotal,
    shippingCost,
    total,
    itemCount,
    isLoaded,
    successMessage,
    selectedShippingRate,
    setSelectedShippingRate,
    shippingDiscounts,
    applicableShippingDiscount,
    isLoadingDiscounts,
    currencyCode: CART_CURRENCY,
    getDiscountThreshold,
  }), [items, addToCart, addMultipleToCart, removeFromCart, updateQuantity, clearCart, completeCheckout, subtotal, shippingCost, total, itemCount, isLoaded, successMessage, selectedShippingRate, shippingDiscounts, applicableShippingDiscount, isLoadingDiscounts, getDiscountThreshold]);
});
