// app/types/currency.ts
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal: number;
  groupSeparator: string;
  decimalSeparator: string;
  currencyPosition: 'left' | 'right' | 'left_with_space' | 'right_with_space' | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ExchangeRate {
  id: string;
  rate: number;
  targetCurrency: string; // This might be an ID or code - adjust based on your data
  createdAt: string | null;
  updatedAt: string | null;
  currency: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
}

// Currency with exchange rate (for currencies that have exchangeRate as an object, not array)
export interface CurrencyWithRate extends Currency {
  exchangeRate: ExchangeRate | null; // Based on your response, it's a single object, not array
}

// For the channel response
export interface ChannelResponse {
  getDefaultChannel: {
    id: string;
    code: string;
    name: string;
    description: string;
    timezone: string | null;
    theme: string;
    hostname: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    isMaintenanceOn: boolean;
    allowedIps: string;
    rootCategoryId: number;
    defaultLocaleId: number;
    baseCurrencyId: number;
    createdAt: string;
    updatedAt: string;
    maintenanceModeText: string;
    baseCurrency: CurrencyWithRate;
    currencies: CurrencyWithRate[];
  };
}