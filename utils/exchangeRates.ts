// utils/exchangeRates.ts
import { Currency, ExchangeRate } from "@/contexts/CurrencyContext";

export const getExchangeRateInfo = (
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: Record<string, number>,
): { rate: number; isValid: boolean } => {
  const rate =
    exchangeRates[fromCurrency.code] / exchangeRates[toCurrency.code];
  return {
    rate,
    isValid: !isNaN(rate) && rate > 0,
  };
};

export const formatExchangeRate = (
  fromCurrency: Currency,
  toCurrency: Currency,
  rate: number,
): string => {
  return `1 ${fromCurrency.code} = ${rate.toFixed(4)} ${toCurrency.code}`;
};
