// utils/bagistoHelpers.ts

export const parseCurrencyString = (priceString: string | number): number => {
  if (!priceString) return 0;
  
  if (typeof priceString === 'number') {
    return priceString;
  }
  
  if (typeof priceString === 'string') {
    // Remove currency symbols, commas, etc.
    const cleaned = priceString
      .replace(/[^\d.-]/g, '') // Remove everything except digits, decimal point, and minus
      .trim();
    
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) {
      console.warn(`⚠️ Could not parse price string: "${priceString}"`);
      return 0;
    }
    
    return parsed;
  }
  
  return 0;
};

export const extractBagistoPrice = (item: any): number => {
  if (!item) return 0;
  
  console.log('💰 [PRICE] Extracting price from:', {
    id: item.id,
    name: item.name,
    formattedPrice: item.formattedPrice,
  });
  
  // Priority 1: formattedPrice.price (e.g., "$33.00")
  if (item.formattedPrice?.price) {
    const price = parseCurrencyString(item.formattedPrice.price);
    if (price > 0) {
      console.log(`💰 [PRICE] Using formattedPrice.price: $${price}`);
      return price;
    }
  }
  
  // Priority 2: formattedPrice.total / quantity
  if (item.formattedPrice?.total && item.quantity) {
    const total = parseCurrencyString(item.formattedPrice.total);
    const quantity = item.quantity || 1;
    if (total > 0 && quantity > 0) {
      const price = total / quantity;
      console.log(`💰 [PRICE] Calculated from total: $${price} (total: $${total} ÷ quantity: ${quantity})`);
      return price;
    }
  }
  
  // Priority 3: Direct price field
  if (item.price) {
    const price = parseCurrencyString(item.price);
    if (price > 0) {
      console.log(`💰 [PRICE] Using item.price: $${price}`);
      return price;
    }
  }
  
  console.warn(`⚠️ [PRICE] Could not extract price for item: ${item.name}`);
  return 0;
};

export const extractBagistoImage = (item: any): string => {
  if (!item) return '';
  
  console.log('🖼️ [IMAGE] Extracting image from item');
  
  // Check item.images first
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    const firstImage = item.images[0];
    if (firstImage.url) {
      console.log(`🖼️ [IMAGE] Found in item.images[0].url: ${firstImage.url}`);
      return firstImage.url;
    }
    if (firstImage.path) {
      const url = `http://127.0.0.1:8000/storage/${firstImage.path}`;
      console.log(`🖼️ [IMAGE] Built from item.images[0].path: ${url}`);
      return url;
    }
  }
  
  // Check item.product.images
  if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
    const firstImage = item.product.images[0];
    if (firstImage.url) {
      console.log(`🖼️ [IMAGE] Found in product.images[0].url: ${firstImage.url}`);
      return firstImage.url;
    }
    if (firstImage.path) {
      const url = `http://127.0.0.1:8000/storage/${firstImage.path}`;
      console.log(`🖼️ [IMAGE] Built from product.images[0].path: ${url}`);
      return url;
    }
  }
  
  console.warn(`⚠️ [IMAGE] No image found for item: ${item.name}`);
  return '';
};

export const extractBagistoCurrency = (item: any): string => {
  if (!item) return 'USD';
  
  // Check formattedPrice string for currency symbol
  if (item.formattedPrice?.price) {
    const priceStr = item.formattedPrice.price;
    if (priceStr.includes('$')) return 'USD';
    if (priceStr.includes('€')) return 'EUR';
    if (priceStr.includes('£')) return 'GBP';
  }
  
  return 'USD';
};

export const extractCartTotals = (cartDetails: any) => {
  if (!cartDetails?.formattedPrice) {
    console.log('💰 [CART TOTALS] No formattedPrice in cart details');
    return {
      subtotal: 0,
      tax: 0,
      discount: 0,
      grandTotal: 0,
      shipping: 0,
    };
  }
  
  const totals = {
    subtotal: parseCurrencyString(cartDetails.formattedPrice.subTotal || '0'),
    tax: parseCurrencyString(cartDetails.formattedPrice.taxTotal || '0'),
    discount: parseCurrencyString(cartDetails.formattedPrice.discountAmount || '0'),
    grandTotal: parseCurrencyString(cartDetails.formattedPrice.grandTotal || '0'),
    shipping: 0,
  };
  
  console.log('💰 [CART TOTALS] Extracted:', totals);
  return totals;
};