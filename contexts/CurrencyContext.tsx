// contexts/CurrencyContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import {
  formatPrice as formatPriceUtil,
  parseFormattedPrice,
  APP_CURRENCY,
} from "@/utils/currency";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;
const CURRENCY_STORAGE_KEY = "@app_selected_currency";

export interface ExchangeRate {
  id: string;
  rate: number;
  targetCurrency: number;
  createdAt: string;
  updatedAt: string;
  currency: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal: number;
  groupSeparator: string;
  decimalSeparator: string;
  currencyPosition: string;
  exchangeRate?: ExchangeRate | null;
}

interface ChannelResponse {
  getDefaultChannel: {
    baseCurrency: Currency;
    currencies: Currency[];
  };
}

interface CurrencyContextType {
  baseCurrency: Currency | null;
  selectedCurrency: Currency | null;
  availableCurrencies: Currency[];
  isLoading: boolean;
  exchangeRates: Record<string, number>;
  setSelectedCurrency: (currency: Currency) => Promise<void>;
  formatPrice: (
    price: number | string | undefined | null,
    currencyCode?: string,
  ) => string;
  convertPrice: (
    amount: number | string | undefined | null,
    fromCurrencyCode?: string,
  ) => number;
  getCurrencySymbol: (currencyCode: string) => string;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [selectedCurrency, setSelectedCurrencyState] =
    useState<Currency | null>(null);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(
    {},
  );

  const GET_DEFAULT_CHANNEL = gql`
    query GetDefaultChannel {
      getDefaultChannel {
        baseCurrency {
          id
          code
          name
          symbol
          decimal
          groupSeparator
          decimalSeparator
          currencyPosition
          exchangeRate {
            id
            rate
            targetCurrency
            createdAt
            updatedAt
            currency {
              id
              code
              name
              symbol
            }
          }
        }
        currencies {
          id
          code
          name
          symbol
          decimal
          groupSeparator
          decimalSeparator
          currencyPosition
          exchangeRate {
            id
            rate
            targetCurrency
            createdAt
            updatedAt
            currency {
              id
              code
              name
              symbol
            }
          }
        }
      }
    }
  `;

  const buildExchangeRatesMap = (
    baseCurr: Currency,
    currencies: Currency[],
  ) => {
    const rates: Record<string, number> = {};

    // Base currency rate to itself is 1
    rates[baseCurr.code] = 1;

    // For each currency, extract its exchange rate
    currencies.forEach((currency) => {
      if (currency.exchangeRate?.rate) {
        // The API gives us: 1 USD = 3.11 ILS
        // So we store the rate to convert FROM this currency TO base currency
        rates[currency.code] = currency.exchangeRate.rate;
      } else {
        rates[currency.code] = 1;
      }
    });

    console.log("📊 Exchange rates loaded:", rates);
    // This should log: { ILS: 1, USD: 3.11 } meaning 1 USD = 3.11 ILS
    return rates;
  };

  const fetchChannelData = async () => {
    try {
      setIsLoading(true);

      const response = await request<ChannelResponse>(
        GRAPHQL_ENDPOINT,
        GET_DEFAULT_CHANNEL,
      );

      const channelData = response.getDefaultChannel;

      // Set base currency
      setBaseCurrency(channelData.baseCurrency);

      // Set all available currencies
      setAvailableCurrencies(channelData.currencies);

      // Build exchange rates map
      const rates = buildExchangeRatesMap(
        channelData.baseCurrency,
        channelData.currencies,
      );
      setExchangeRates(rates);

      // Load saved currency preference
      const savedCurrencyCode =
        await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);

      if (savedCurrencyCode) {
        const saved = channelData.currencies.find(
          (c: Currency) => c.code === savedCurrencyCode,
        );
        setSelectedCurrencyState(saved || channelData.baseCurrency);
      } else {
        setSelectedCurrencyState(channelData.baseCurrency);
      }
    } catch (error) {
      console.error("❌ Failed to fetch currency data:", error);

      // Fallback to default currency
      const fallbackCurrency: Currency = {
        id: "1",
        code: APP_CURRENCY,
        name: APP_CURRENCY === "ILS" ? "New Israeli Shekel" : "US Dollar",
        symbol: APP_CURRENCY === "ILS" ? "₪" : "$",
        decimal: 2,
        groupSeparator: ",",
        decimalSeparator: ".",
        currencyPosition: "before",
        exchangeRate: null,
      };

      setBaseCurrency(fallbackCurrency);
      setAvailableCurrencies([fallbackCurrency]);
      setSelectedCurrencyState(fallbackCurrency);
      setExchangeRates({ [APP_CURRENCY]: 1 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, []);

  const refreshRates = async () => {
    await fetchChannelData();
  };

  const setSelectedCurrency = async (currency: Currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency.code);
      setSelectedCurrencyState(currency);
    } catch (error) {
      console.error("Failed to save currency preference:", error);
    }
  };

  // Convert price using exchange rates from API
  // Fix the convertPrice function
  const convertPrice = (
    amount: number | string | undefined | null,
    fromCurrencyCode?: string,
  ): number => {
    if (!amount && amount !== 0) return 0;

    const numAmount = parseFormattedPrice(amount);
    if (numAmount === 0) return 0;

    const fromCode = fromCurrencyCode || baseCurrency?.code || APP_CURRENCY;
    const toCode = selectedCurrency?.code || baseCurrency?.code || APP_CURRENCY;

    if (fromCode === toCode) return numAmount;

    // Get rates from our exchange rates map
    const fromRate = exchangeRates[fromCode] || 1;
    const toRate = exchangeRates[toCode] || 1;

    // CORRECTED FORMULA:
    // If 1 USD = 3.11 ILS, then:
    // fromRate (USD) = 3.11, toRate (ILS) = 1
    // To convert 100 USD to ILS: 100 * (fromRate/toRate) = 100 * (3.11/1) = 311 ILS
    // To convert 311 ILS to USD: 311 * (fromRate/toRate) = 311 * (1/3.11) = 100 USD
    const convertedAmount = numAmount * (fromRate / toRate);

    console.log(
      `💱 Converting: ${numAmount} ${fromCode} -> ${convertedAmount.toFixed(2)} ${toCode} (rates: ${fromCode}=${fromRate}, ${toCode}=${toRate})`,
    );

    return convertedAmount;
  };
  // Format price with proper symbol and decimals
  const formatPrice = (
    price: number | string | undefined | null,
    currencyCode?: string,
  ): string => {
    const numPrice = parseFormattedPrice(price);

    // Determine which currency to use for formatting
    const formatCurrency = currencyCode
      ? availableCurrencies.find((c) => c.code === currencyCode)
      : selectedCurrency || baseCurrency;

    const currency = formatCurrency || baseCurrency;

    if (!currency) {
      // Fallback to util function
      return formatPriceUtil(price, currencyCode || APP_CURRENCY);
    }

    if (numPrice === 0 && price !== 0) {
      return `${currency.symbol}0.00`;
    }

    // Format with proper decimal places from currency data
    const formatted = numPrice.toLocaleString("en-US", {
      minimumFractionDigits: currency.decimal,
      maximumFractionDigits: currency.decimal,
    });

    // Handle currency position (before/after)
    if (currency.currencyPosition === "after") {
      return `${formatted}${currency.symbol}`;
    }

    return `${currency.symbol}${formatted}`;
  };

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = availableCurrencies.find((c) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  return (
    <CurrencyContext.Provider
      value={{
        baseCurrency,
        selectedCurrency,
        availableCurrencies,
        isLoading,
        exchangeRates,
        setSelectedCurrency,
        formatPrice,
        convertPrice,
        getCurrencySymbol,
        refreshRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
