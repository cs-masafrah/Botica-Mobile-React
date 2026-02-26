import { SHOPIFY_CONFIG } from "@/constants/shopify";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const SHOPIFY_API_VERSION = "2024-10";
const AUTH_STORAGE_KEY = "@beauty_auth";

export interface Address {
  id: string;
  companyName?: string;
  firstName: string;
  lastName: string;
  email: string;
  vatId?: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postcode: string;
  phone: string;
  defaultAddress: boolean;
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
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // -------------------------------
  // CUSTOMER LOGIN
  // -------------------------------
  async login(email: string, password: string): Promise<AuthState> {
    try {
      console.log("Attempting customer login:", email);

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
              firstName
              lastName
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
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log("Login response:", JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
      }

      const result = json?.data?.customerLogin;

      if (!result?.success) {
        throw new Error(result?.message || "Login failed");
      }

      if (!result.accessToken) {
        throw new Error("No access token received");
      }

      const customer: Customer = {
        id: result.customer.id,
        email: result.customer.email,
        firstName: result.customer.firstName,
        lastName: result.customer.lastName,
        name: result.customer.name,
        phone: result.customer.phone,
        defaultAddress: result.customer.defaultAddress
          ? {
              id: result.customer.defaultAddress.id,
              companyName: result.customer.defaultAddress.companyName || "",
              firstName: result.customer.defaultAddress.firstName,
              lastName: result.customer.defaultAddress.lastName,
              email:
                result.customer.defaultAddress.email || result.customer.email,
              vatId: result.customer.defaultAddress.vatId || "",
              address: result.customer.defaultAddress.address,
              country: result.customer.defaultAddress.country,
              state: result.customer.defaultAddress.state,
              city: result.customer.defaultAddress.city,
              postcode: result.customer.defaultAddress.postcode,
              phone: result.customer.defaultAddress.phone,
              defaultAddress:
                result.customer.defaultAddress.defaultAddress || false,
            }
          : undefined,
      };

      const expiresAt = new Date(
        Date.now() + result.expiresIn * 1000,
      ).toISOString();

      const authState: AuthState = {
        accessToken: result.accessToken,
        expiresAt,
        customer,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));

      console.log("Login successful:", customer.email);

      return authState;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<AuthState> {
    try {
      console.log("Signing up customer:", email);

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
              firstName
              lastName
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
          deviceToken: "example-device-token",
          deviceName: "React Native App",
        },
      };

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log("Signup response:", JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
      }

      const result = json.data?.customerSignUp;

      if (!result?.success) {
        throw new Error(result?.message || "Signup failed");
      }

      if (!result.accessToken) {
        throw new Error("No access token received");
      }

      const customer: Customer = {
        id: result.customer.id,
        email: result.customer.email,
        firstName: result.customer.firstName,
        lastName: result.customer.lastName,
        name: result.customer.name,
        phone: result.customer.phone,
        defaultAddress: result.customer.defaultAddress
          ? {
              id: result.customer.defaultAddress.id,
              companyName: result.customer.defaultAddress.companyName || "",
              firstName: result.customer.defaultAddress.firstName,
              lastName: result.customer.defaultAddress.lastName,
              email:
                result.customer.defaultAddress.email || result.customer.email,
              vatId: result.customer.defaultAddress.vatId || "",
              address: result.customer.defaultAddress.address,
              country: result.customer.defaultAddress.country,
              state: result.customer.defaultAddress.state,
              city: result.customer.defaultAddress.city,
              postcode: result.customer.defaultAddress.postcode,
              phone: result.customer.defaultAddress.phone,
              defaultAddress:
                result.customer.defaultAddress.defaultAddress || false,
            }
          : undefined,
      };

      const expiresAt = new Date(
        Date.now() + result.expiresIn * 1000,
      ).toISOString();

      const authState: AuthState = {
        accessToken: result.accessToken,
        expiresAt,
        customer,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));

      console.log("Signup successful:", customer.email);

      return authState;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  async getCustomer(): Promise<Customer> {
    const auth = await this.getStoredAuth();
    if (!auth) throw new Error("Not authenticated");

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
      method: "POST",
      headers: {
        ...this.headers,
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();
    const account = json.data?.accountInfo;
    if (!account) throw new Error("Account not found");

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
        ? {
            id: account.defaultAddress.id,
            companyName: account.defaultAddress.companyName || "",
            firstName: account.defaultAddress.firstName,
            lastName: account.defaultAddress.lastName,
            email: account.defaultAddress.email || account.email,
            vatId: account.defaultAddress.vatId || "",
            address: account.defaultAddress.address,
            country: account.defaultAddress.country,
            state: account.defaultAddress.state,
            city: account.defaultAddress.city,
            postcode: account.defaultAddress.postcode,
            phone: account.defaultAddress.phone,
            defaultAddress: account.defaultAddress.defaultAddress || false,
          }
        : undefined,
    };

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ ...auth, customer }),
    );

    return customer;
  }

  async logout(): Promise<void> {
    try {
      console.log("Logging out...");

      const query = `
        mutation CustomerLogout {
          customerLogout {
            success
            message
          }
        }
      `;

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${(await this.getStoredAuth())?.accessToken}`,
        },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      console.log("Logout response:", JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        console.error("GraphQL Errors:", json.errors);
      }

      const result = json.data?.customerLogout;

      if (!result?.success) {
        console.warn(result?.message || "Logout failed on server");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log("Local auth cleared");
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
        console.error("Failed to parse auth data:", parseError);
        console.log("Clearing corrupted auth data");
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      const expiresAt = new Date(authState.expiresAt);
      const now = new Date();

      if (expiresAt <= now) {
        console.log("Access token expired");
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      return authState;
    } catch (error) {
      console.error("Get stored auth error:", error);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }

  async updateAccount(input: {
    firstName: string;
    lastName: string;
    email: string;
    gender?: "MALE" | "FEMALE" | "OTHER" | string | undefined;
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
      if (!authState) throw new Error("Not authenticated");

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
        method: "POST",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${authState.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      if (json.errors?.length)
        throw new Error(json.errors.map((e: any) => e.message).join(", "));

      const result = json.data?.updateAccount;
      if (!result?.success)
        throw new Error(result?.message || "Update account failed");

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

      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ ...authState, customer }),
      );

      return customer;
    } catch (error) {
      console.error("Update account error:", error);
      throw error;
    }
  }

  async getAddresses(): Promise<Address[]> {
    try {
      console.log("Fetching customer addresses...");

      const auth = await this.getStoredAuth();
      if (!auth) throw new Error("Not authenticated");

      if (!auth.customer?.id) {
        throw new Error("Customer ID not found");
      }

      // Get customer ID and convert to number if needed
      const customerId = parseInt(auth.customer.id, 10);
      if (isNaN(customerId)) {
        throw new Error("Invalid customer ID");
      }

      const query = `
        query addresses($input: FilterCustomerAddressInput) {
          addresses(first: 10, page: 1, input: $input) {
            paginatorInfo {
              count
              currentPage
              lastPage
              total
            }
            data {
              id
              companyName
              firstName
              lastName
              email
              vatId
              address
              country
              state
              city
              postcode
              phone
              defaultAddress
            }
          }
        }
      `;

      // Filter by customer ID to get only this customer's addresses
      const variables = {
        input: {
          customerId: customerId,
        },
      };

      console.log("Fetching addresses for customer ID:", customerId);

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log("Get addresses response:", JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
      }

      const addressesData = json.data?.addresses?.data || [];

      console.log(`Found ${addressesData.length} addresses for customer`);

      // Direct mapping without transformation
      return addressesData.map((address: any) => ({
        id: address.id,
        companyName: address.companyName || undefined,
        firstName: address.firstName,
        lastName: address.lastName,
        email: address.email,
        vatId: address.vatId || undefined,
        address: address.address,
        country: address.country,
        state: address.state,
        city: address.city,
        postcode: address.postcode,
        phone: address.phone,
        defaultAddress: address.defaultAddress || false,
      }));
    } catch (error) {
      console.error("Get addresses error:", error);
      throw error;
    }
  }

  // Update the addAddress method in services/auth.ts
  async addAddress(address: Omit<Address, "id">): Promise<Address> {
    try {
      console.log("Adding new address:", JSON.stringify(address, null, 2));

      const auth = await this.getStoredAuth();
      if (!auth) throw new Error("Not authenticated");

      const query = `
        mutation CreateAddress($input: AddressInput!) {
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
              city
              postcode
              phone
              defaultAddress
            }
          }
        }
      `;

      const variables = {
        input: {
          companyName: address.companyName || null,
          firstName: address.firstName,
          lastName: address.lastName,
          email: address.email,
          vatId: address.vatId || null,
          address: address.address,
          country: address.country,
          state: address.state,
          city: address.city,
          postcode: address.postcode,
          phone: address.phone,
          defaultAddress: address.defaultAddress,
        },
      };

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log("Add address response:", JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
      }

      const result = json.data?.createAddress;

      console.log("Create Address Result:" + result);

      if (!result?.success) {
        throw new Error(result?.message || "Failed to create address");
      }

      if (!result.address) {
        throw new Error("Address created but no details returned");
      }

      // Direct mapping
      return {
        id: result.address.id,
        companyName: result.address.companyName || undefined,
        firstName: result.address.firstName,
        lastName: result.address.lastName,
        email: result.address.email,
        vatId: result.address.vatId || undefined,
        address: result.address.address,
        country: result.address.country,
        state: result.address.state,
        city: result.address.city,
        postcode: result.address.postcode,
        phone: result.address.phone,
        defaultAddress: result.address.defaultAddress || false,
      };
    } catch (error) {
      console.error("Add address error:", error);
      throw error;
    }
  }

  async updateAddress(
    addressId: string,
    address: Omit<Address, "id">,
  ): Promise<Address> {
    try {
      const auth = await this.getStoredAuth();
      if (!auth) throw new Error("Not authenticated");

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
          email: address.email,
          vatId: address.vatId || null,
          address: address.address,
          country: address.country,
          state: address.state,
          city: address.city,
          postcode: address.postcode,
          phone: address.phone,
          defaultAddress: address.defaultAddress,
        },
      };

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
      }

      const result = json.data?.updateAddress;

      if (!result?.success) {
        throw new Error(result?.message || "Failed to update address");
      }

      // Direct mapping
      return {
        id: result.address.id,
        companyName: result.address.companyName || undefined,
        firstName: result.address.firstName,
        lastName: result.address.lastName,
        email: result.address.email,
        vatId: result.address.vatId || undefined,
        address: result.address.address,
        country: result.address.country,
        state: result.address.state,
        city: result.address.city,
        postcode: result.address.postcode,
        phone: result.address.phone,
        defaultAddress: result.address.defaultAddress || false,
      };
    } catch (error) {
      console.error("Update address error:", error);
      throw error;
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    try {
      console.log("Deleting customer address (Bagisto)...", addressId);

      const auth = await this.getStoredAuth();
      if (!auth) throw new Error("Not authenticated");

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
        method: "POST",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      console.log("Delete address response:", JSON.stringify(json, null, 2));

      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
      }

      const result = json.data?.deleteAddress;

      if (!result?.success) {
        throw new Error(result?.message || "Failed to delete address");
      }

      console.log("Address deleted successfully");
    } catch (error) {
      console.error("Delete address error:", error);
      throw error;
    }
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    try {
      console.log("Setting default address...", addressId);

      const auth = await this.getStoredAuth();
      if (!auth) throw new Error("Not authenticated");

      // First, get all addresses for this customer
      const addresses = await this.getAddresses();

      // Find the address to set as default
      const addressToUpdate = addresses.find((addr) => addr.id === addressId);
      if (!addressToUpdate) {
        throw new Error("Address not found for this customer");
      }

      // Update the address with defaultAddress: true
      const updatedAddress = {
        companyName: addressToUpdate.companyName || "",
        firstName: addressToUpdate.firstName,
        lastName: addressToUpdate.lastName,
        email: addressToUpdate.email,
        vatId: addressToUpdate.vatId || "",
        address: addressToUpdate.address,
        country: addressToUpdate.country,
        state: addressToUpdate.state,
        city: addressToUpdate.city,
        postcode: addressToUpdate.postcode,
        phone: addressToUpdate.phone,
        defaultAddress: true,
      };

      await this.updateAddress(addressId, updatedAddress);

      // Also, set other addresses of this customer to not default
      const otherAddresses = addresses.filter((addr) => addr.id !== addressId);

      for (const address of otherAddresses) {
        if (address.defaultAddress) {
          const nonDefaultAddress = {
            companyName: address.companyName || "",
            firstName: address.firstName,
            lastName: address.lastName,
            email: address.email,
            vatId: address.vatId || "",
            address: address.address,
            country: address.country,
            state: address.state,
            city: address.city,
            postcode: address.postcode,
            phone: address.phone,
            defaultAddress: false,
          };

          try {
            await this.updateAddress(address.id, nonDefaultAddress);
          } catch (error) {
            console.error(`Failed to update address ${address.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Set default address error:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
