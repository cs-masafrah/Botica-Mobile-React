// contexts/CurrencyContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CurrencyService from '@/services/CurrencyService';
import { CurrencyWithRate } from '@/app/types/currency';

interface CurrencyContextType {
  currencies: CurrencyWithRate[];
  currentCurrency: CurrencyWithRate | null;
  baseCurrency: CurrencyWithRate | null;
  isLoading: boolean;
  error: string | null;
  setCurrency: (currency: CurrencyWithRate) => Promise<void>;
  formatPrice: (amount: number) => string;
  convertAmount: (amount: number) => number;
  refreshCurrencies: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'selected_currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencies, setCurrencies] = useState<CurrencyWithRate[]>([]);
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyWithRate | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyWithRate | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCurrencies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('\n=== CURRENCY CONTEXT: LOADING DATA ===');
      
      // Fetch all currency data in one call
      const { currencies: fetchedCurrencies, baseCurrency: fetchedBaseCurrency } = 
        await CurrencyService.fetchChannelCurrencies();
      
      console.log('✅ Data loaded successfully');
      console.log('Base currency:', fetchedBaseCurrency.code);
      console.log('Available currencies:', fetchedCurrencies.map(c => c.code).join(', '));
      
      setCurrencies(fetchedCurrencies);
      setBaseCurrency(fetchedBaseCurrency);

      // Build exchange rates map
      const ratesMap = new Map<string, number>();
      fetchedCurrencies.forEach(currency => {
        if (currency.exchangeRate) {
          // Store rate with currency code as key
          ratesMap.set(currency.code, currency.exchangeRate.rate);
          console.log(`💱 Exchange rate for ${currency.code}:`, currency.exchangeRate.rate);
        }
      });
      setExchangeRates(ratesMap);

      // Load saved currency preference
      const savedCurrencyCode = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('Saved currency preference:', savedCurrencyCode || 'none');
      
      const savedCurrency = fetchedCurrencies.find(c => c.code === savedCurrencyCode);
      
      if (savedCurrency) {
        console.log('Using saved currency:', savedCurrency.code);
        setCurrentCurrency(savedCurrency);
      } else {
        console.log('Using base currency:', fetchedBaseCurrency.code);
        setCurrentCurrency(fetchedBaseCurrency);
      }
    } catch (error) {
      console.error('❌ Error loading currencies:', error);
      setError(error instanceof Error ? error.message : 'Failed to load currencies');
      
      // Set fallback data
      const fallback = getFallbackCurrencies();
      setCurrencies(fallback.currencies);
      setBaseCurrency(fallback.baseCurrency);
      setCurrentCurrency(fallback.baseCurrency);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback data function
  const getFallbackCurrencies = () => {
    const usdCurrency: CurrencyWithRate = {
      id: '1',
      code: 'USD',
      name: 'United States Dollar',
      symbol: '$',
      decimal: 2,
      groupSeparator: ',',
      decimalSeparator: '.',
      currencyPosition: 'left',
      createdAt: null,
      updatedAt: null,
      exchangeRate: null
    };

    const ilsCurrency: CurrencyWithRate = {
      id: '2',
      code: 'ILS',
      name: 'Israeli New Shekel',
      symbol: '₪',
      decimal: 2,
      groupSeparator: ',',
      decimalSeparator: '.',
      currencyPosition: 'left_with_space',
      createdAt: null,
      updatedAt: null,
      exchangeRate: {
        id: '1',
        rate: 3.5,
        targetCurrency: 'USD',
        createdAt: null,
        updatedAt: null,
        currency: {
          id: '1',
          code: 'USD',
          name: 'United States Dollar',
          symbol: '$'
        }
      }
    };

    return {
      currencies: [usdCurrency, ilsCurrency],
      baseCurrency: usdCurrency
    };
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const refreshCurrencies = async () => {
    await loadCurrencies();
  };

  const setCurrency = async (currency: CurrencyWithRate) => {
    try {
      console.log('Setting currency to:', currency.code);
      setCurrentCurrency(currency);
      await AsyncStorage.setItem(STORAGE_KEY, currency.code);
    } catch (error) {
      console.error('Error setting currency:', error);
    }
  };

  const convertAmount = (amount: number): number => {
    if (!currentCurrency || !baseCurrency) return amount;
    
    // If current currency is base, return original amount
    if (currentCurrency.code === baseCurrency.code) return amount;
    
    // Get exchange rate from current currency
    const rate = exchangeRates.get(currentCurrency.code);
    return rate ? amount * rate : amount;
  };

  const formatPrice = (amount: number): string => {
    if (!currentCurrency) {
      return amount.toString();
    }

    const convertedAmount = convertAmount(amount);
    return CurrencyService.formatPrice(convertedAmount, currentCurrency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        currentCurrency,
        baseCurrency,
        isLoading,
        error,
        setCurrency,
        formatPrice,
        convertAmount,
        refreshCurrencies,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};