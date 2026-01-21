// utils/currency.ts
export const APP_CURRENCY = "USD";

export const formatPrice = (
  price: number | string,
  currencyCode: string = APP_CURRENCY,
): string => {
  // Convert string to number if needed
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    console.warn(`⚠️ Invalid price value: ${price}`);
    return "$0.00";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(numericPrice);
};

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number => {
  // For now, simple conversion - you can add real conversion rates here
  if (fromCurrency === toCurrency) return amount;

  // Simple conversion rates (example only)
  const conversionRates: Record<string, number> = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
  };

  const fromRate = conversionRates[fromCurrency] || 1;
  const toRate = conversionRates[toCurrency] || 1;

  return (amount / fromRate) * toRate;
};

// Helper to parse formatted price strings
export const parseFormattedPrice = (priceString: string): number => {
  if (!priceString) return 0;

  // Remove currency symbols, commas, etc.
  const cleaned = priceString
    .replace(/[^\d.-]/g, "") // Remove everything except digits, decimal point, and minus
    .trim();

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    console.warn(`⚠️ Could not parse price string: "${priceString}"`);
    return 0;
  }

  return parsed;
};
