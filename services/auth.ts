import { SHOPIFY_CONFIG } from '@/constants/shopify';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOPIFY_API_VERSION = '2024-10';
const AUTH_STORAGE_KEY = '@beauty_auth';

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  displayName: string;
  defaultAddress?: Address;
}

interface AuthState {
  accessToken: string;
  expiresAt: string;
  customer: Customer;
}

interface GraphQLResponse {
  data?: any;
  errors?: { message: string }[];
}

class AuthService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    const storeName = SHOPIFY_CONFIG.storeName;
    const token = SHOPIFY_CONFIG.storefrontAccessToken;
    
    if (!storeName || storeName === 'YOUR_STORE_NAME' || !token || token === 'YOUR_STOREFRONT_ACCESS_TOKEN') {
      console.warn('Shopify not configured. Please update constants/shopify.ts');
      this.baseUrl = '';
      this.headers = {};
      return;
    }
    
    this.baseUrl = `https://${storeName}.myshopify.com/api/${SHOPIFY_API_VERSION}/graphql.json`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    };
  }

  private async graphqlQuery(query: string): Promise<GraphQLResponse> {
    if (!this.baseUrl) {
      throw new Error('Shopify not configured');
    }

    console.log('Auth GraphQL Query:', query);
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API error response:', errorText);
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data: GraphQLResponse = await response.json();
    console.log('Auth GraphQL Response:', JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data;
  }

  async login(email: string, password: string): Promise<AuthState> {
    try {
      console.log('Attempting login for:', email);
      
      const query = `
        mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
          customerAccessTokenCreate(input: $input) {
            customerAccessToken {
              accessToken
              expiresAt
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          email,
          password,
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Login response:', JSON.stringify(data, null, 2));

      const result = data.data?.customerAccessTokenCreate;
      
      if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
        const error = result.customerUserErrors[0];
        throw new Error(error.message || 'Login failed');
      }

      const accessToken = result?.customerAccessToken?.accessToken;
      const expiresAt = result?.customerAccessToken?.expiresAt;

      if (!accessToken) {
        throw new Error('No access token received');
      }

      const customer = await this.getCustomer(accessToken);
      
      const authState: AuthState = {
        accessToken,
        expiresAt,
        customer,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      console.log('Login successful for:', customer.email);
      
      return authState;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(email: string, password: string, firstName: string, lastName: string): Promise<AuthState> {
    try {
      console.log('Creating customer account for:', email);
      
      const query = `
        mutation customerCreate($input: CustomerCreateInput!) {
          customerCreate(input: $input) {
            customer {
              id
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          email,
          password,
          firstName,
          lastName,
          acceptsMarketing: false,
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Signup response:', JSON.stringify(data, null, 2));

      const result = data.data?.customerCreate;
      
      if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
        const error = result.customerUserErrors[0];
        throw new Error(error.message || 'Signup failed');
      }

      if (!result?.customer?.id) {
        throw new Error('Failed to create account');
      }

      console.log('Account created, logging in...');
      return await this.login(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async getCustomer(accessToken: string): Promise<Customer> {
    try {
      const query = `
        query getCustomer($customerAccessToken: String!) {
          customer(customerAccessToken: $customerAccessToken) {
            id
            email
            firstName
            lastName
            phone
            displayName
          }
        }
      `;

      const variables = {
        customerAccessToken: accessToken,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Get customer response:', JSON.stringify(data, null, 2));

      const customer = data.data?.customer;
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || undefined,
        displayName: customer.displayName,
      };
    } catch (error) {
      console.error('Get customer error:', error);
      throw error;
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      console.log('Logging out...');
      
      const query = `
        mutation customerAccessTokenDelete($customerAccessToken: String!) {
          customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
            deletedAccessToken
            deletedCustomerAccessTokenId
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        customerAccessToken: accessToken,
      };

      await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  async getStoredAuth(): Promise<AuthState | null> {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;

      let authState: AuthState;
      try {
        authState = JSON.parse(stored);
      } catch (parseError) {
        console.error('Failed to parse auth data:', parseError);
        console.log('Clearing corrupted auth data');
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      
      const expiresAt = new Date(authState.expiresAt);
      const now = new Date();
      
      if (expiresAt <= now) {
        console.log('Access token expired');
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      return authState;
    } catch (error) {
      console.error('Get stored auth error:', error);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }

  async updateCustomer(accessToken: string, input: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
  }): Promise<Customer> {
    try {
      console.log('Updating customer...', input);
      
      const query = `
        mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
          customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
            customer {
              id
              email
              firstName
              lastName
              phone
              displayName
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      const customerInput: any = {};
      if (input.firstName !== undefined) customerInput.firstName = input.firstName;
      if (input.lastName !== undefined) customerInput.lastName = input.lastName;
      if (input.phone !== undefined) {
        customerInput.phone = input.phone || '';
      }

      const variables = {
        customerAccessToken: accessToken,
        customer: customerInput,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Update customer response:', JSON.stringify(data, null, 2));

      const result = data.data?.customerUpdate;
      
      if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
        const error = result.customerUserErrors[0];
        throw new Error(error.message || 'Update failed');
      }

      const customer = result?.customer;
      
      if (!customer) {
        throw new Error('Failed to update customer');
      }

      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || undefined,
        displayName: customer.displayName,
      };
    } catch (error) {
      console.error('Update customer error:', error);
      throw error;
    }
  }

  async getAddresses(accessToken: string): Promise<Address[]> {
    try {
      console.log('Fetching customer addresses...');
      
      const query = `
        query getCustomerAddresses($customerAccessToken: String!) {
          customer(customerAccessToken: $customerAccessToken) {
            addresses(first: 50) {
              edges {
                node {
                  id
                  firstName
                  lastName
                  address1
                  address2
                  city
                  province
                  zip
                  country
                  phone
                }
              }
            }
            defaultAddress {
              id
            }
          }
        }
      `;

      const variables = {
        customerAccessToken: accessToken,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Get addresses response:', JSON.stringify(data, null, 2));

      const addresses = data.data?.customer?.addresses?.edges || [];
      const defaultAddressId = data.data?.customer?.defaultAddress?.id;
      
      return addresses.map(({ node }: any) => ({
        id: node.id,
        firstName: node.firstName || '',
        lastName: node.lastName || '',
        address1: node.address1 || '',
        address2: node.address2 || undefined,
        city: node.city || '',
        province: node.province || undefined,
        zip: node.zip || '',
        country: node.country || '',
        phone: node.phone || undefined,
        isDefault: node.id === defaultAddressId,
      }));
    } catch (error) {
      console.error('Get addresses error:', error);
      throw error;
    }
  }

  async addAddress(accessToken: string, address: Omit<Address, 'id'>): Promise<Address> {
    try {
      console.log('Adding customer address...', address);
      
      const query = `
        mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
          customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
            customerAddress {
              id
              firstName
              lastName
              address1
              address2
              city
              province
              zip
              country
              phone
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      const variables = {
        customerAccessToken: accessToken,
        address: {
          firstName: address.firstName,
          lastName: address.lastName,
          address1: address.address1,
          address2: address.address2 || '',
          city: address.city,
          province: address.province || '',
          zip: address.zip,
          country: address.country,
          phone: address.phone || '',
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Add address response:', JSON.stringify(data, null, 2));

      const result = data.data?.customerAddressCreate;
      
      if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
        const error = result.customerUserErrors[0];
        throw new Error(error.message || 'Failed to add address');
      }

      const newAddress = result?.customerAddress;
      
      if (!newAddress) {
        throw new Error('Failed to add address');
      }

      return {
        id: newAddress.id,
        firstName: newAddress.firstName || '',
        lastName: newAddress.lastName || '',
        address1: newAddress.address1 || '',
        address2: newAddress.address2 || undefined,
        city: newAddress.city || '',
        province: newAddress.province || undefined,
        zip: newAddress.zip || '',
        country: newAddress.country || '',
        phone: newAddress.phone || undefined,
      };
    } catch (error) {
      console.error('Add address error:', error);
      throw error;
    }
  }

  async updateAddress(accessToken: string, addressId: string, address: Omit<Address, 'id'>): Promise<Address> {
    try {
      console.log('Updating customer address...', addressId, address);
      
      const query = `
        mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
          customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
            customerAddress {
              id
              firstName
              lastName
              address1
              address2
              city
              province
              zip
              country
              phone
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      const variables = {
        customerAccessToken: accessToken,
        id: addressId,
        address: {
          firstName: address.firstName,
          lastName: address.lastName,
          address1: address.address1,
          address2: address.address2 || '',
          city: address.city,
          province: address.province || '',
          zip: address.zip,
          country: address.country,
          phone: address.phone || '',
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Update address response:', JSON.stringify(data, null, 2));

      const result = data.data?.customerAddressUpdate;
      
      if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
        const error = result.customerUserErrors[0];
        throw new Error(error.message || 'Failed to update address');
      }

      const updatedAddress = result?.customerAddress;
      
      if (!updatedAddress) {
        throw new Error('Failed to update address');
      }

      return {
        id: updatedAddress.id,
        firstName: updatedAddress.firstName || '',
        lastName: updatedAddress.lastName || '',
        address1: updatedAddress.address1 || '',
        address2: updatedAddress.address2 || undefined,
        city: updatedAddress.city || '',
        province: updatedAddress.province || undefined,
        zip: updatedAddress.zip || '',
        country: updatedAddress.country || '',
        phone: updatedAddress.phone || undefined,
      };
    } catch (error) {
      console.error('Update address error:', error);
      throw error;
    }
  }

  async deleteAddress(accessToken: string, addressId: string): Promise<void> {
    try {
      console.log('Deleting customer address...', addressId);
      
      const query = `
        mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
          customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
            deletedCustomerAddressId
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      const variables = {
        customerAccessToken: accessToken,
        id: addressId,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Delete address response:', JSON.stringify(data, null, 2));

      const result = data.data?.customerAddressDelete;
      
      if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
        const error = result.customerUserErrors[0];
        throw new Error(error.message || 'Failed to delete address');
      }

      console.log('Address deleted successfully');
    } catch (error) {
      console.error('Delete address error:', error);
      throw error;
    }
  }

  async setDefaultAddress(accessToken: string, addressId: string): Promise<void> {
    try {
      console.log('Setting default address...', addressId);
      
      const query = `
        mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
          customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
            customer {
              id
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      const variables = {
        customerAccessToken: accessToken,
        addressId: addressId,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      console.log('Set default address response:', JSON.stringify(data, null, 2));

      const result = data.data?.customerDefaultAddressUpdate;
      
      if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
        const error = result.customerUserErrors[0];
        throw new Error(error.message || 'Failed to set default address');
      }

      console.log('Default address set successfully');
    } catch (error) {
      console.error('Set default address error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
