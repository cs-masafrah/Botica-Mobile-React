// services/CurrencyService.ts
import { BAGISTO_CONFIG } from '@/constants/bagisto';
import { CurrencyWithRate, ChannelResponse } from '../app/types/currency';

class CurrencyService {
  private static instance: CurrencyService;
  private baseUrl: string;
  private alternativeUrls: string[];

  private constructor() {
    // IMPORTANT: Remove any trailing /graphql from the base URL first
    const cleanBaseUrl = BAGISTO_CONFIG.baseUrl.replace(/\/graphql\/?$/, '');
    
    // Now construct URLs properly
    this.baseUrl = `${cleanBaseUrl}/graphql`;
    this.alternativeUrls = [
      // Standard GraphQL paths (without duplication)
      `${cleanBaseUrl}/graphql`,
      `${cleanBaseUrl}/graphql/`,
      `${cleanBaseUrl}/api/graphql`,
      `${cleanBaseUrl}/graphql/api`,
      // Bagisto specific paths
      `${cleanBaseUrl}/graphql/catalog`,
      `${cleanBaseUrl}/graphql/shop`,
      `${cleanBaseUrl}/graphql/admin`,
      // Try alternative base paths
      `${cleanBaseUrl}/graphql`,
      `${cleanBaseUrl}/api`,
      // Try with different protocols
      cleanBaseUrl.replace('http://', 'https://') + '/graphql',
    ];
    
    console.log('\n=== CURRENCY SERVICE INITIALIZATION ===');
    console.log('Original Base URL from config:', BAGISTO_CONFIG.baseUrl);
    console.log('Cleaned Base URL:', cleanBaseUrl);
    console.log('Primary GraphQL URL:', this.baseUrl);
    console.log('Alternative URLs to try:', this.alternativeUrls);
    console.log('=========================================\n');
  }

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  private getHeaders(): HeadersInit {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private encodeQuery(query: string): string {
    return encodeURIComponent(query.replace(/\s+/g, ' ').trim());
  }

  async testEndpoint(url: string, method: 'GET' | 'POST' = 'GET'): Promise<{ success: boolean; status?: number; data?: any; error?: string }> {
    try {
      console.log(`Testing endpoint: ${url} with method: ${method}`);
      
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (method === 'POST') {
        options.body = JSON.stringify({ 
          query: '{ __typename }' // Simple test query
        });
        const response = await fetch(url, options);
        console.log(`Test response status for POST ${url}:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, status: response.status, data };
        }
        
        if (response.status === 405) {
          console.log(`  ℹ️ POST returned 405 - server suggests using GET`);
        }
        
        return { success: false, status: response.status };
      } else {
        // For GET, add a simple test query
        const testUrl = `${url}?query=${this.encodeQuery('{ __typename }')}`;
        console.log('GET test URL:', testUrl);
        const response = await fetch(testUrl, options);
        console.log(`Test response status for GET ${url}:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, status: response.status, data };
        }
        return { success: false, status: response.status };
      }
    } catch (error: any) {
      console.log(`Test failed for ${method} ${url}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async discoverEndpoint(): Promise<{ url: string; method: 'GET' | 'POST' }> {
    console.log('\n=== DISCOVERING GRAPHQL ENDPOINT ===');
    
    // Based on the error, the server supports GET and HEAD methods
    for (const url of this.alternativeUrls) {
      console.log(`\n🔍 Testing URL: ${url}`);
      
      // Try GET first
      console.log('  📥 Testing GET...');
      const getResult = await this.testEndpoint(url, 'GET');
      if (getResult.success) {
        console.log(`  ✅ GET works for: ${url}`);
        return { url, method: 'GET' };
      }
      console.log(`  ❌ GET failed with status: ${getResult.status}`);
      
      // Then try POST
      console.log('  📤 Testing POST...');
      const postResult = await this.testEndpoint(url, 'POST');
      if (postResult.success) {
        console.log(`  ✅ POST works for: ${url}`);
        return { url, method: 'POST' };
      }
      console.log(`  ❌ POST failed with status: ${postResult.status}`);
    }
    
    console.log('\n❌ No working endpoint found');
    console.log('Tried URLs:', this.alternativeUrls);
    throw new Error('Could not discover GraphQL endpoint');
  }

  // Main method to fetch all currency data in one call
  async fetchChannelCurrencies(): Promise<{ 
    currencies: CurrencyWithRate[]; 
    baseCurrency: CurrencyWithRate;
  }> {
    const query = `
      query GetDefaultChannel {
        getDefaultChannel {
          id
          code
          name
          description
          timezone
          theme
          hostname
          logoUrl
          faviconUrl
          isMaintenanceOn
          allowedIps
          rootCategoryId
          defaultLocaleId
          baseCurrencyId
          createdAt
          updatedAt
          maintenanceModeText
          baseCurrency {
            id
            code
            name
            symbol
            decimal
            groupSeparator
            decimalSeparator
            currencyPosition
            createdAt
            updatedAt
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
            createdAt
            updatedAt
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

    try {
      console.log('\n=== FETCHING ALL CURRENCY DATA ===');
      
      // Try to discover the correct endpoint first
      let endpoint;
      try {
        endpoint = await this.discoverEndpoint();
        console.log('\n✅ Using discovered endpoint:', endpoint.url);
        console.log('✅ Using method:', endpoint.method);
      } catch (discoveryError) {
        console.log('\n⚠️ Endpoint discovery failed, using default:', this.baseUrl);
        endpoint = { url: this.baseUrl, method: 'GET' };
      }

      // Make the request
      const headers = this.getHeaders();
      console.log(`\n📡 Making ${endpoint.method} request to:`, endpoint.url);
      
      let response;
      if (endpoint.method === 'POST') {
        response = await fetch(endpoint.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query }),
        });
      } else {
        // For GET requests, append the query as a URL parameter
        const url = `${endpoint.url}?query=${this.encodeQuery(query)}`;
        console.log('GET URL (truncated):', url.substring(0, 200) + '...');
        response = await fetch(url, {
          method: 'GET',
          headers,
        });
      }

      console.log('Response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('\n❌ Request failed');
        console.error('Response status:', response.status);
        console.error('Error response body:', text.substring(0, 500));
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: { data: ChannelResponse } = await response.json();
      console.log('\n✅ Response received successfully');
      
      if ((result as any).errors) {
        console.error('GraphQL errors:', JSON.stringify((result as any).errors, null, 2));
        throw new Error((result as any).errors[0]?.message || 'GraphQL error');
      }

      const channel = result.data.getDefaultChannel;
      
      console.log('\n📊 Channel data received:', {
        id: channel.id,
        code: channel.code,
        name: channel.name,
        baseCurrency: channel.baseCurrency?.code,
        currenciesCount: channel.currencies?.length,
        currencies: channel.currencies?.map(c => `${c.code} (rates: ${c.exchangeRate ? 'yes' : 'no'})`)
      });

      // Log exchange rates for debugging
      channel.currencies?.forEach(currency => {
        if (currency.exchangeRate) {
          console.log(`  💱 ${currency.code} exchange rate:`, {
            targetCurrency: currency.exchangeRate.targetCurrency,
            rate: currency.exchangeRate.rate
          });
        }
      });
      
      return {
        currencies: channel.currencies || [],
        baseCurrency: channel.baseCurrency,
      };
    } catch (error) {
      console.error('\n❌ Error fetching currency data:', error);
      throw error;
    }
  }

  formatPrice(
    amount: number,
    currency: CurrencyWithRate,
    exchangeRate?: number
  ): string {
    // Use provided exchange rate or default to 1
    const rate = exchangeRate || 1;
    const convertedAmount = amount * rate;
    const formattedNumber = this.formatNumber(convertedAmount, currency);

    // Handle null currencyPosition
    const position = currency.currencyPosition || 'left';
    
    switch (position) {
      case 'left':
        return `${currency.symbol}${formattedNumber}`;
      case 'left_with_space':
        return `${currency.symbol} ${formattedNumber}`;
      case 'right':
        return `${formattedNumber}${currency.symbol}`;
      case 'right_with_space':
        return `${formattedNumber} ${currency.symbol}`;
      default:
        return `${currency.symbol}${formattedNumber}`;
    }
  }

  private formatNumber(amount: number, currency: CurrencyWithRate): string {
    const parts = amount.toFixed(currency.decimal).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add thousand separators
    const formattedInteger = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      currency.groupSeparator
    );

    if (currency.decimal === 0) {
      return formattedInteger;
    }

    return `${formattedInteger}${currency.decimalSeparator}${decimalPart}`;
  }

  // Helper method to get exchange rate from a currency
  getExchangeRateFromCurrency(currency: CurrencyWithRate): number {
    if (!currency.exchangeRate) return 1;
    return currency.exchangeRate.rate;
  }
}

export default CurrencyService.getInstance();