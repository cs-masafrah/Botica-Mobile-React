// utils/currency.ts - UPDATED VERSION
const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: "₪",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  SAR: "﷼",
  AED: "د.إ",
  QAR: "ر.ق",
  KWD: "د.ك",
  BHD: ".د.ب",
  OMR: "ر.ع.",
};

const EXCHANGE_RATES_TO_ILS: Record<string, number> = {
  ILS: 1,
  USD: 3.7,
  EUR: 4,
  GBP: 4.6,
  JPY: 0.026,
  SAR: 0.99,
  AED: 1.01,
  QAR: 1.02,
  KWD: 12.1,
  BHD: 9.8,
  OMR: 9.6,
};

export const APP_CURRENCY = "ILS";

// Helper function to parse formatted price strings (e.g., "$66.00" -> 66)
export function parseFormattedPrice(
  priceString: string | number | undefined | null,
): number {
  if (!priceString && priceString !== 0) {
    return 0;
  }

  if (typeof priceString === "number") {
    return priceString;
  }

  if (typeof priceString === "string") {
    // Remove all non-numeric characters except decimal point and minus sign
    const cleaned = priceString.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) {
      console.warn(
        `⚠️ [CURRENCY] Could not parse price string: "${priceString}"`,
      );
      return 0;
    }

    return parsed;
  }

  return 0;
}

export function convertCurrency(
  amount: number | string | undefined | null,
  fromCurrency: string,
  toCurrency: string = APP_CURRENCY,
): number {
  // Handle undefined, null, or invalid amount
  if (!amount && amount !== 0) {
    return 0;
  }

  // Parse the amount if it's a string (handles formatted strings like "$66.00")
  const numAmount = parseFormattedPrice(amount);

  if (numAmount === 0) {
    return 0;
  }

  if (fromCurrency === toCurrency) {
    return numAmount;
  }

  const fromRate = EXCHANGE_RATES_TO_ILS[fromCurrency] ?? 1;
  const toRate = EXCHANGE_RATES_TO_ILS[toCurrency] ?? 1;
  const amountInILS = numAmount * fromRate;

  if (toCurrency === "ILS") {
    return amountInILS;
  }

  return amountInILS / toRate;
}

// MAIN FIX: Update formatPrice to have a default currency
export function formatPrice(
  price: number | string | undefined | null,
  currencyCode?: string, // Make it optional
  defaultCurrency: string = APP_CURRENCY, // Add default parameter
): string {
  // Parse the price first (handles strings like "$66.00")
  const numPrice = parseFormattedPrice(price);

  if (numPrice === 0 && price !== 0) {
    const symbol =
      CURRENCY_SYMBOLS[currencyCode || defaultCurrency] ||
      currencyCode ||
      defaultCurrency;
    return `${symbol}0.00`;
  }

  // Use provided currency or default
  const currency = currencyCode || defaultCurrency;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  // Format with proper decimal places
  const formatted = numPrice.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
}

// Overloaded version for backward compatibility
export function formatCurrency(
  price: number | string | undefined | null,
  currencyCode?: string,
  defaultCurrency: string = APP_CURRENCY,
): string {
  return formatPrice(price, currencyCode, defaultCurrency);
}

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

// Helper function to safely extract price from Bagisto response
export function extractPrice(item: any): number {
  if (!item) return 0;

  // Try different possible price locations
  if (item.formattedPrice?.price !== undefined) {
    return parseFormattedPrice(item.formattedPrice.price);
  }

  if (item.price !== undefined) {
    return parseFormattedPrice(item.price);
  }

  if (item.product?.price !== undefined) {
    return parseFormattedPrice(item.product.price);
  }

  return 0;
}

// Helper function to extract currency code from Bagisto order
export function extractCurrencyFromOrder(order: any): string {
  if (!order) return APP_CURRENCY;

  // Try different possible currency code locations
  if (order.baseCurrencyCode) return order.baseCurrencyCode;
  if (order.channelCurrencyCode) return order.channelCurrencyCode;
  if (order.orderCurrencyCode) return order.orderCurrencyCode;

  // Check formattedPrice string for currency symbol
  if (order.formattedPrice?.grandTotal) {
    const priceStr = String(order.formattedPrice.grandTotal);
    if (priceStr.includes("₪")) return "ILS";
    if (priceStr.includes("$")) return "USD";
    if (priceStr.includes("€")) return "EUR";
    if (priceStr.includes("£")) return "GBP";
    if (priceStr.includes("¥")) return "JPY";
  }

  return APP_CURRENCY;
}

// Helper to extract all cart totals from Bagisto response
export function extractCartTotals(cartDetails: any): {
  subTotal: number;
  taxTotal: number;
  discountAmount: number;
  grandTotal: number;
  baseGrandTotal: number;
  discountedSubTotal: number;
} {
  if (!cartDetails?.formattedPrice) {
    return {
      subTotal: 0,
      taxTotal: 0,
      discountAmount: 0,
      grandTotal: 0,
      baseGrandTotal: 0,
      discountedSubTotal: 0,
    };
  }

  return {
    subTotal: parseFormattedPrice(cartDetails.formattedPrice.subTotal),
    taxTotal: parseFormattedPrice(cartDetails.formattedPrice.taxTotal),
    discountAmount: parseFormattedPrice(
      cartDetails.formattedPrice.discountAmount,
    ),
    grandTotal: parseFormattedPrice(cartDetails.formattedPrice.grandTotal),
    baseGrandTotal: parseFormattedPrice(
      cartDetails.formattedPrice.baseGrandTotal ||
        cartDetails.formattedPrice.grandTotal,
    ),
    discountedSubTotal: parseFormattedPrice(
      cartDetails.formattedPrice.discountedSubTotal ||
        cartDetails.formattedPrice.subTotal,
    ),
  };
}
