const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

const EXCHANGE_RATES_TO_ILS: Record<string, number> = {
  ILS: 1,
  USD: 3.7,
  EUR: 4,
  GBP: 4.6,
  JPY: 0.026,
};

export const APP_CURRENCY = 'ILS';

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string = APP_CURRENCY): number {
  if (!amount || fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = EXCHANGE_RATES_TO_ILS[fromCurrency] ?? 1;
  const toRate = EXCHANGE_RATES_TO_ILS[toCurrency] ?? 1;
  const amountInILS = amount * fromRate;

  if (toCurrency === 'ILS') {
    return amountInILS;
  }

  return amountInILS / toRate;
}

export function formatPrice(price: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  return `${symbol}${price.toFixed(2)}`;
}

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

export function formatCurrency(price: number, currencyCode: string): string {
  return formatPrice(price, currencyCode);
}
