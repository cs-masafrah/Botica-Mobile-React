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
  companyName?: string;
  email?: string;
  vatId?: string;
}

function mapGraphQLAddressToAddress(gqlAddress: any): Address {
  return {
    id: gqlAddress.id,
    firstName: gqlAddress.firstName || '',
    lastName: gqlAddress.lastName || '',
    address1: gqlAddress.address || '',
    address2: undefined, // Bagisto doesn't have address2
    city: gqlAddress.city || '',
    province: gqlAddress.state || gqlAddress.stateName || undefined,
    zip: gqlAddress.postcode || '',
    country: gqlAddress.country || gqlAddress.countryName || '',
    phone: gqlAddress.phone || undefined,
    isDefault: gqlAddress.defaultAddress || false,
    companyName: gqlAddress.companyName || undefined,
    email: gqlAddress.email || undefined,
    vatId: gqlAddress.vatId || undefined,
  };
}

export interface Customer {
  id: string;

  firstName: string;
  lastName: string;
  name?: string;

  gender?: string;
  dateOfBirth?: string;

  email: string;
  phone?: string;

  image?: string;
  imageUrl?: string;

  status?: boolean;
  customerGroupId?: number;
  channelId?: number;

  subscribedToNewsLetter?: boolean;
  isVerified?: boolean;
  isSuspended?: boolean;

  defaultAddress?: Address;
  addresses?: Address[];
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

      const customer: Customer = {
        id: result.customer.id,
        email: result.customer.email,
        firstName: result.customer.firstName,
        lastName: result.customer.lastName,
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
        firstName: result.customer.firstName,
        lastName: result.customer.lastName,
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

  async getCustomer(): Promise<Customer> {
    const auth = await this.getStoredAuth();
    if (!auth) throw new Error('Not authenticated');

    const query = `
      query accountInfo {
        accountInfo {
          id
          firstName
          lastName
          name
          gender
          dateOfBirth
          email
          phone
          image
          imageUrl
          status
          customerGroupId
          subscribedToNewsLetter
          isVerified
          isSuspended
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
          addresses {
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
    `;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        ...this.headers,
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();
    const account = json.data?.accountInfo;
    if (!account) throw new Error('Account not found');

    const customer: Customer = {
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      name: account.name,
      gender: account.gender,
      dateOfBirth: account.dateOfBirth,
      email: account.email,
      phone: account.phone,
      image: account.image,
      imageUrl: account.imageUrl,
      status: account.status,
      customerGroupId: account.customerGroupId,
      subscribedToNewsLetter: account.subscribedToNewsLetter,
      isVerified: account.isVerified,
      isSuspended: account.isSuspended,
      defaultAddress: account.defaultAddress
        ? mapGraphQLAddressToAddress(account.defaultAddress)
        : undefined,
      addresses: account.addresses?.map(mapGraphQLAddressToAddress),
    };

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ ...auth, customer })
    );

    return customer;
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

  async updateAccount(input: {
    firstName: string;
    lastName: string;
    email: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | string | undefined;
    dateOfBirth?: string | null;
    phone?: string | null;
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirmation?: string;
    newsletterSubscriber?: boolean;
    image?: string | null;
  }): Promise<Customer> {
    try {
      const authState = await this.getStoredAuth();
      if (!authState) throw new Error('Not authenticated');

      const query = `
        mutation updateAccount($input: UpdateAccountInput!) {
          updateAccount(input: $input) {
            success
            message
            customer {
              id
              name
              email
              imageUrl
            }
          }
        }
      `;

      const variables = { input };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${authState.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      if (json.errors?.length) throw new Error(json.errors.map((e: any) => e.message).join(', '));

      const result = json.data?.updateAccount;
      if (!result?.success) throw new Error(result?.message || 'Update account failed');

      const updated = result.customer;

      const customer: Customer = {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone || undefined,
        gender: updated.gender,
        dateOfBirth: updated.dateOfBirth ?? undefined,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...authState, customer }));

      return customer;
    } catch (error) {
      console.error('Update account error:', error);
      throw error;
    }
  }

  async getAddresses(): Promise<Address[]> {
    try {
      console.log('Fetching customer addresses (Bagisto)...');
      
      const auth = await this.getStoredAuth();
      if (!auth) throw new Error('Not authenticated');

      const query = `
        query addresses {
          addresses(
            first: 11
            page: 1
            input: {}
          ) {
            paginatorInfo {
              count
              currentPage
              lastPage
              total
            }
            data {
              id
              parentAddressId
              customerId
              cartId
              orderId
              firstName
              lastName
              gender
              companyName
              address
              city
              state
              stateName
              country
              countryName
              postcode
              email
              phone
              vatId
              defaultAddress
              useForShipping
            }
          }
        }
      `;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      console.log('Get addresses response:', JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(', '));
      }

      const addressesData = json.data?.addresses?.data || [];
      
      return addressesData.map((address: any) => ({
        id: address.id,
        firstName: address.firstName || '',
        lastName: address.lastName || '',
        address1: address.address || '',
        address2: undefined,
        city: address.city || '',
        province: address.state || address.stateName || undefined,
        zip: address.postcode || '',
        country: address.country || address.countryName || '',
        phone: address.phone || undefined,
        isDefault: address.defaultAddress || false,
        companyName: address.companyName || undefined,
        email: address.email || undefined,
        vatId: address.vatId || undefined,
      }));
    } catch (error) {
      console.error('Get addresses error:', error);
      throw error;
    }
  }

  async addAddress(address: Omit<Address, 'id'> & {
    email: string;
    companyName?: string;
    vatId?: string;
  }): Promise<Address> {
    try {
      console.log('Adding customer address (Bagisto)...', address);

      const auth = await this.getStoredAuth();
      if (!auth) throw new Error('Not authenticated');

      const query = `
        mutation createAddress($input: AddressInput!) {
          createAddress(input: $input) {
            success
            message
            address {
              id
              companyName
              firstName
              lastName
              email
              vatId
              address
              country
              state
              stateName
              city
              postcode
              phone
              defaultAddress
            }
          }
        }
      `;

      const customer = await this.getCustomer();

      const variables = {
        input: {
          email: customer.email,
          companyName: address.companyName ?? null,
          firstName: address.firstName,
          lastName: address.lastName,
          address: address.address1,
          country: address.country,
          state: address.province ?? '',
          city: address.city,
          postcode: address.zip,
          phone: address.phone ?? '',
          vatId: address.vatId ?? null,
          defaultAddress: address.isDefault ?? false,
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log('Create address response:', JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(', '));
      }

      const result = json.data?.createAddress;

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to create address');
      }

      if (!result.address) {
        throw new Error('Address was created but no address data returned');
      }

      return mapGraphQLAddressToAddress(result.address);
    } catch (error) {
      console.error('Add address error:', error);
      throw error;
    }
  }

  async updateAddress(addressId: string, address: Omit<Address, 'id'>): Promise<Address> {
    try {
      console.log('Updating customer address (Bagisto)...', addressId, address);

      const auth = await this.getStoredAuth();
      if (!auth) throw new Error('Not authenticated');

      const query = `
        mutation updateAddress($id: ID!, $input: AddressInput!) {
          updateAddress(id: $id, input: $input) {
            success
            message
            address {
              id
              companyName
              firstName
              lastName
              email
              vatId
              address
              country
              state
              stateName
              city
              postcode
              phone
              defaultAddress
            }
          }
        }
      `;

      const variables = {
        id: addressId,
        input: {
          companyName: address.companyName || null,
          firstName: address.firstName,
          lastName: address.lastName,
          address: address.address1,
          country: address.country,
          state: address.province || '',
          city: address.city,
          email: address.email || '',
          postcode: address.zip,
          phone: address.phone || '',
          vatId: address.vatId || null,
          defaultAddress: address.isDefault || false,
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log('Update address response:', JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(', '));
      }

      const result = json.data?.updateAddress;

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to update address');
      }

      if (!result.address) {
        throw new Error('Address was updated but no address data returned');
      }

      return mapGraphQLAddressToAddress(result.address);
    } catch (error) {
      console.error('Update address error:', error);
      throw error;
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    try {
      console.log('Deleting customer address (Bagisto)...', addressId);

      const auth = await this.getStoredAuth();
      if (!auth) throw new Error('Not authenticated');

      const query = `
        mutation deleteAddress($id: ID!) {
          deleteAddress(id: $id) {
            success
            message
          }
        }
      `;

      const variables = {
        id: addressId,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log('Delete address response:', JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(', '));
      }

      const result = json.data?.deleteAddress;

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to delete address');
      }

      console.log('Address deleted successfully');
    } catch (error) {
      console.error('Delete address error:', error);
      throw error;
    }
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    try {
      console.log('Setting default address (Bagisto)...', addressId);

      const auth = await this.getStoredAuth();
      if (!auth) throw new Error('Not authenticated');

      // First, get all addresses to find the current one
      const addresses = await this.getAddresses();
      
      // Get the address to set as default
      const addressToUpdate = addresses.find(addr => addr.id === addressId);
      if (!addressToUpdate) {
        throw new Error('Address not found');
      }

      // Update the address with isDefault: true
      const updatedAddress = {
        firstName: addressToUpdate.firstName,
        lastName: addressToUpdate.lastName,
        address1: addressToUpdate.address1,
        address2: addressToUpdate.address2,
        city: addressToUpdate.city,
        province: addressToUpdate.province,
        zip: addressToUpdate.zip,
        country: addressToUpdate.country,
        phone: addressToUpdate.phone,
        companyName: addressToUpdate.companyName,
        email: addressToUpdate.email,
        vatId: addressToUpdate.vatId,
        isDefault: true,
      };

      await this.updateAddress(addressId, updatedAddress);
    } catch (error) {
      console.error('Set default address error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();