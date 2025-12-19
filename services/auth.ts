import { SHOPIFY_CONFIG } from '@/constants/shopify';
import { BAGISTO_CONFIG } from '@/constants/bagisto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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

function mapGraphQLAddressToAddress(gqlAddress: any): Address {
  return {
    id: gqlAddress.id,
    firstName: gqlAddress.firstName,
    lastName: gqlAddress.lastName,
    address1: gqlAddress.address,
    address2: undefined,
    city: gqlAddress.city,
    province: gqlAddress.state,
    zip: gqlAddress.postcode,
    country: gqlAddress.country,
    phone: gqlAddress.phone,
    isDefault: gqlAddress.defaultAddress,
  };
}


export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  phone?: string;
  defaultAddress?: Address;
  addresses?: Address[];
}


interface AuthState {
  accessToken: string;
  expiresAt: string; // computed
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
    this.baseUrl = BAGISTO_CONFIG.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // -------------------------------
  // CUSTOMER LOGIN
  // -------------------------------
  async login(email: string, password: string): Promise<AuthState> {
    try {
      console.log('Attempting customer login:', email);

      const query = `
        mutation CustomerLogin(
          $email: String!
          $password: String!
        ) {
          customerLogin(
            input: {
              email: $email
              password: $password
            }
          ) {
            success
            message
            accessToken
            tokenType
            expiresIn
            customer {
              id
              name
              email
              phone
              defaultAddress {
                id
                firstName
                lastName
                address
                city
                state
                postcode
                country
                phone
                defaultAddress
              }
            }
          }
        }
      `;

      const variables = {
        email,
        password,
        remember: true,
        // deviceToken: GlobalData.fcmToken,
        // deviceName: GlobalData.deviceName,
      };
      console.log("Base URL: " + this.baseUrl);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log('Login response:', JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(', '));
      }

      const result = json?.data?.customerLogin;

      if (!result?.success) {
        throw new Error(result?.message || 'Login failed');
      }

      if (!result.accessToken) {
        throw new Error('No access token received');
      }

      // -------------------------------
      // Build Customer
      // -------------------------------
      const customer: Customer = {
        id: result.customer.id,
        email: result.customer.email,
        displayName: result.customer.name,
        phone: result.customer.phone,
        defaultAddress: result.customer.defaultAddress
          ? mapGraphQLAddressToAddress(result.customer.defaultAddress)
          : undefined,
      };

      // -------------------------------
      // Compute expiresAt
      // -------------------------------
      const expiresAt = new Date(
        Date.now() + result.expiresIn * 1000
      ).toISOString();

      const authState: AuthState = {
        accessToken: result.accessToken,
        expiresAt,
        customer,
      };

      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(authState)
      );

      console.log('Login successful:', customer.email);

      return authState;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  async signup(email: string, password: string, firstName: string, lastName: string): Promise<AuthState> {
    try {
      console.log('Signing up customer:', email);

      const query = `
        mutation CustomerSignUp($input: SignUpInput!) {
          customerSignUp(input: $input) {
            success
            message
            accessToken
            tokenType
            expiresIn
            customer {
              id
              name
              email
              phone
              defaultAddress {
                id
                firstName
                lastName
                address
                city
                state
                postcode
                country
                phone
                defaultAddress
              }
            }
          }
        }
      `;

      const variables = {
        input: {
          firstName,
          lastName,
          email,
          password,
          passwordConfirmation: password,
          subscribedToNewsLetter: true,
          agreement: true,
          deviceToken: 'example-device-token',
          deviceName: 'React Native App',
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log('Signup response:', JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(', '));
      }

      const result = json.data?.customerSignUp;

      if (!result?.success) {
        throw new Error(result?.message || 'Signup failed');
      }

      if (!result.accessToken) {
        throw new Error('No access token received');
      }

      const customer: Customer = {
        id: result.customer.id,
        email: result.customer.email,
        displayName: result.customer.name,
        phone: result.customer.phone,
        defaultAddress: result.customer.defaultAddress
          ? mapGraphQLAddressToAddress(result.customer.defaultAddress)
          : undefined,
      };

      const expiresAt = new Date(
        Date.now() + result.expiresIn * 1000
      ).toISOString();

      const authState: AuthState = {
        accessToken: result.accessToken,
        expiresAt,
        customer,
      };
      
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(authState)
      );

      console.log('Signup successful:', customer.email);

      return authState;
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

  async logout(): Promise<void> {
    try {
      console.log('Logging out...');

      const query = `
        mutation CustomerLogout {
          customerLogout {
            success
            message
          }
        }
      `;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${(await this.getStoredAuth())?.accessToken}`,
        },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      console.log('Logout response:', JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        console.error('GraphQL Errors:', json.errors);
      }

      const result = json.data?.customerLogout;

      if (!result?.success) {
        console.warn(result?.message || 'Logout failed on server');
      }

    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 🔥 ALWAYS clear local auth
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('Local auth cleared');
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
