// services/bagisto.ts
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { graphqlQueries } from "@/utils/graphqlQueries";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Helper function for GraphQL requests
// async function fetchGraphQL<T>(
//   query: string,
//   variables?: any,
//   headers?: Record<string, string>,
// ): Promise<GraphQLResponse<T>> {
//   try {
//     const defaultHeaders = {
//       "Content-Type": "application/json",
//       Accept: "application/json",
//       "X-Requested-With": "XMLHttpRequest",
//     };

//     const response = await fetch(GRAPHQL_ENDPOINT, {
//       method: "POST",
//       headers: { ...defaultHeaders, ...headers },
//       body: JSON.stringify({ query, variables }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("❌ [GRAPHQL] Fetch error:", error);
//     throw error;
//   }
// }
// Your existing fetchGraphQL function
async function fetchGraphQL<T>(
  query: string,
  variables?: any,
  headers?: Record<string, string>,
): Promise<GraphQLResponse<T>> {
  try {
    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };

    console.log("📡 [GRAPHQL] Endpoint:", GRAPHQL_ENDPOINT);
    console.log("📝 [GRAPHQL] Query length:", query.length);
    console.log(
      "📦 [GRAPHQL] Variables:",
      variables ? JSON.stringify(variables, null, 2) : "None",
    );

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { ...defaultHeaders, ...headers },
      body: JSON.stringify({ query, variables }),
    });

    console.log(
      "📨 [GRAPHQL] Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      // Try to read error response
      let errorText = "";
      try {
        errorText = await response.text();
        console.error("❌ [GRAPHQL] Error response:", errorText);
      } catch (e) {
        // Ignore if can't read text
      }

      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`,
      );
    }

    const data = await response.json();
    console.log("✅ [GRAPHQL] Response received");

    if (data.errors) {
      console.error("❌ [GRAPHQL] GraphQL errors:", data.errors);
    }

    return data;
  } catch (error) {
    console.error("❌ [GRAPHQL] Fetch error:", error);
    throw error;
  }
}

export class BagistoService {
  private token: string | null = null;
  private cartToken: string | null = null;
  private cartId: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      this.token = await AsyncStorage.getItem("@bagisto_token");
      this.cartToken = await AsyncStorage.getItem("@bagisto_cart_token");
      this.cartId = await AsyncStorage.getItem("@bagisto_cart_id");

      console.log("🔐 [BAGISTO] Loaded tokens:", {
        authToken: this.token ? "Yes" : "No",
        cartToken: this.cartToken ? "Yes" : "No",
        cartId: this.cartId || "None",
      });
    } catch (error) {
      console.error("❌ [BAGISTO] Failed to load tokens:", error);
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (this.cartToken) {
      headers["Cart-Token"] = this.cartToken;
    }

    if (this.cartId) {
      headers["Cart-Id"] = this.cartId;
    }

    return headers;
  }

  // ==================== CART METHODS ====================

  async getCartDetails(): Promise<any> {
    try {
      console.log("🛒 [BAGISTO] Fetching cart details...");

      const query = `
      query GetCartDetails {
        cartDetail {
          message
          id
          itemsQty
          itemsCount
          couponCode
          taxTotal
          discountAmount
          subTotal
          grandTotal
          formattedPrice {
            price
            total
            taxAmount
            discountAmount
            grandTotal
          }
          items {
            id
            name
            quantity
            sku
            type
            formattedPrice {
              price
              total
              taxAmount
              discountAmount
            }
            product {
              id
              name
              price
              sku
              type
              images {
                id
                url
                path
                type
              }
            }
          }
        }
      }
    `;

      console.log("🛒 [BAGISTO] Cart query sent");

      const response = await fetchGraphQL<any>(query, {}, this.getHeaders());

      console.log("🛒 [BAGISTO] Cart response received");

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        return null;
      }

      const cartDetail = response.data?.cartDetail;

      if (!cartDetail) {
        console.log("🛒 [BAGISTO] No cart data found");
        return null;
      }

      console.log("✅ [BAGISTO] Cart loaded:", {
        id: cartDetail.id,
        itemsCount: cartDetail.itemsCount,
        itemsQty: cartDetail.itemsQty,
        subTotal: cartDetail.subTotal,
        taxTotal: cartDetail.taxTotal,
        discountAmount: cartDetail.discountAmount,
        grandTotal: cartDetail.grandTotal,
        items: cartDetail.items?.length || 0,
      });

      return cartDetail;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to get cart details:", error.message);
      return null;
    }
  }

  async addToCart(input: any): Promise<any> {
    try {
      console.log("➕ [BAGISTO] Adding to cart:", input);

      const query = `
      mutation AddItemToCart($input: AddItemToCartInput!) {
        addItemToCart(input: $input) {
          success
          message
          cart {
            id
            itemsQty
            itemsCount
            couponCode
            taxTotal
            discountAmount
            subTotal
            grandTotal
            formattedPrice {
              price
              total
              taxAmount
              discountAmount
              grandTotal
            }
            items {
              id
              name
              quantity
              sku
              type
              formattedPrice {
                price
                total
                taxAmount
                discountAmount
              }
              product {
                id
                name
                price
                sku
                type
                images {
                  id
                  url
                  path
                  type
                }
              }
            }
          }
        }
      }
    `;

      console.log("➕ [BAGISTO] Add to cart query sent");

      const response = await fetchGraphQL<any>(
        query,
        { input },
        this.getHeaders(),
      );

      console.log("➕ [BAGISTO] Add to cart response received");

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(response.errors[0]?.message || "Failed to add to cart");
      }

      const result = response.data?.addItemToCart;

      if (!result) {
        throw new Error("No response from add to cart");
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to add to cart");
      }

      console.log("✅ [BAGISTO] Added to cart:", {
        success: result.success,
        message: result.message,
        cartId: result.cart?.id,
        itemsCount: result.cart?.itemsCount,
        subTotal: result.cart?.subTotal,
        grandTotal: result.cart?.grandTotal,
      });

      return result;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to add to cart:", error.message);
      throw error;
    }
  }

  async updateCartItem(
    items: Array<{ id: string; quantity: number }>,
  ): Promise<any> {
    try {
      console.log("🔄 [BAGISTO] Updating cart items:", items);

      // Map the items to the correct format for the mutation
      const qty = items.map((item) => ({
        cartItemId: item.id,
        quantity: item.quantity,
      }));

      const query = `
        mutation UpdateItemToCart($input: UpdateItemToCartInput!) {
          updateItemToCart(input: $input) {
            success
            message
            cart {
              id
              itemsQty
              itemsCount
            }
          }
        }
      `;

      const variables = {
        input: { qty },
      };

      console.log(
        "🔄 [BAGISTO] Update variables:",
        JSON.stringify(variables, null, 2),
      );

      const response = await fetchGraphQL<any>(
        query,
        variables,
        this.getHeaders(),
      );

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(response.errors[0]?.message || "Failed to update cart");
      }

      const result = response.data?.updateItemToCart;

      if (!result) {
        throw new Error("No response from update cart");
      }

      console.log("✅ [BAGISTO] Cart updated:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to update cart:", error.message);
      throw error;
    }
  }

  async removeFromCart(id: string): Promise<any> {
    try {
      console.log("🗑️ [BAGISTO] Removing from cart:", id);

      const query = `
      mutation RemoveCartItem($id: ID!) {
        removeCartItem(id: $id) {
          success
          message
          cart {
            id
            itemsQty
            itemsCount
            couponCode
            taxTotal
            discountAmount
            subTotal
            grandTotal
            formattedPrice {
              price
              total
              taxAmount
              discountAmount
              grandTotal
            }
            items {
              id
              name
              quantity
              product {
                id
                name
                price
                sku
                images {
                  id
                  url
                }
              }
              formattedPrice {
                price
                total
                taxAmount
                discountAmount
              }
            }
          }
        }
      }
    `;

      console.log("🗑️ [BAGISTO] Remove cart query sent");

      const response = await fetchGraphQL<any>(
        query,
        { id },
        this.getHeaders(),
      );

      console.log("🗑️ [BAGISTO] Remove response received");

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(
          response.errors[0]?.message || "Failed to remove from cart",
        );
      }

      const result = response.data?.removeCartItem;

      if (!result) {
        throw new Error("No response from remove from cart");
      }

      console.log("✅ [BAGISTO] Item removed:", {
        success: result.success,
        message: result.message,
        cartId: result.cart?.id,
        itemsCount: result.cart?.itemsCount,
        subTotal: result.cart?.subTotal,
        grandTotal: result.cart?.grandTotal,
      });

      return result;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to remove from cart:", error.message);
      throw error;
    }
  }

  async applyCoupon(code: string): Promise<any> {
    try {
      console.log("🎫 [BAGISTO] Applying coupon:", code);

      const query = `
        mutation ApplyCoupon($couponCode: String!) {
          applyCoupon(input: { couponCode: $couponCode }) {
            success
            message
            cart {
              id
              itemsQty
              itemsCount
            }
          }
        }
      `;

      const response = await fetchGraphQL<any>(
        query,
        { couponCode: code },
        this.getHeaders(),
      );

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(
          response.errors[0]?.message || "Failed to apply coupon",
        );
      }

      const result = response.data?.applyCoupon;

      if (!result) {
        throw new Error("No response from apply coupon");
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to apply coupon");
      }

      console.log("✅ [BAGISTO] Coupon applied:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to apply coupon:", error.message);
      throw error;
    }
  }

  async removeCoupon(): Promise<any> {
    try {
      console.log("🎫 [BAGISTO] Removing coupon");

      const query = `
        mutation {
          removeCoupon {
            success
            message
            cart {
              id
              itemsQty
              itemsCount
            }
          }
        }
      `;

      const response = await fetchGraphQL<any>(query, {}, this.getHeaders());

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(
          response.errors[0]?.message || "Failed to remove coupon",
        );
      }

      const result = response.data?.removeCoupon;

      if (!result) {
        throw new Error("No response from remove coupon");
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to remove coupon");
      }

      console.log("✅ [BAGISTO] Coupon removed:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to remove coupon:", error.message);
      throw error;
    }
  }

  // ==================== CHECKOUT METHODS ====================

  async getPaymentMethods(shippingMethod?: string): Promise<any> {
    try {
      console.log("🚚 [BAGISTO] Getting payment methods");

      const query = `
        query GetPaymentMethods($shippingMethod: String) {
          paymentMethods(shippingMethod: $shippingMethod) {
            message
            paymentMethods {
              method
              methodTitle
              description
              sort
            }
            cart {
              id
              itemsQty
              itemsCount
            }
          }
        }
      `;

      const response = await fetchGraphQL<any>(
        query,
        { shippingMethod },
        this.getHeaders(),
      );

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(
          response.errors[0]?.message || "Failed to get payment methods",
        );
      }

      const result = response.data?.paymentMethods;

      if (!result) {
        throw new Error("No response from payment methods");
      }

      console.log("✅ [BAGISTO] Payment methods loaded");
      return result;
    } catch (error: any) {
      console.error(
        "❌ [BAGISTO] Failed to get payment methods:",
        error.message,
      );
      throw error;
    }
  }

  async saveCheckoutAddresses(input: {
    billing: any;
    shipping: any;
  }): Promise<any> {
    try {
      console.log("🏠 [BAGISTO] Saving checkout addresses");

      const query = `
        mutation SaveCheckoutAddresses($input: SaveCheckoutAddressesInput!) {
          saveCheckoutAddresses(input: $input) {
            message
            shippingMethods {
              title
              methods {
                code
                formattedPrice
              }
            }
            paymentMethods {
              method
              methodTitle
              description
              sort
            }
            cart {
              id
              itemsQty
              itemsCount
            }
            jumpToSection
          }
        }
      `;

      const response = await fetchGraphQL<any>(
        query,
        { input },
        this.getHeaders(),
      );

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(
          response.errors[0]?.message || "Failed to save addresses",
        );
      }

      const result = response.data?.saveCheckoutAddresses;

      if (!result) {
        throw new Error("No response from save addresses");
      }

      console.log("✅ [BAGISTO] Addresses saved");
      return result;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to save addresses:", error.message);
      throw error;
    }
  }

  async savePayment(method: string): Promise<any> {
    try {
      console.log("💳 [BAGISTO] Saving payment method:", method);

      const query = `
        mutation SavePayment($method: String!) {
          savePayment(input: { method: $method }) {
            jumpToSection
            cart {
              id
              itemsQty
              itemsCount
            }
          }
        }
      `;

      const response = await fetchGraphQL<any>(
        query,
        { method },
        this.getHeaders(),
      );

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(
          response.errors[0]?.message || "Failed to save payment",
        );
      }

      const result = response.data?.savePayment;

      if (!result) {
        throw new Error("No response from save payment");
      }

      console.log("✅ [BAGISTO] Payment saved");
      return result;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to save payment:", error.message);
      throw error;
    }
  }

  async placeOrder(variables?: any): Promise<any> {
    try {
      console.log("🛍️ [BAGISTO] Placing order...");

      const query = `
        mutation PlaceOrder($input: PlaceOrderInput!) {
          placeOrder(input: $input) {
            success
            redirectUrl
            order {
              id
              incrementId
            }
          }
        }
      `;

      const response = await fetchGraphQL<any>(
        query,
        { input: variables },
        this.getHeaders(),
      );

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(response.errors[0]?.message || "Failed to place order");
      }

      const result = response.data?.placeOrder;

      if (!result) {
        throw new Error("No response from place order");
      }

      if (!result.success) {
        throw new Error(result.redirectUrl || "Failed to place order");
      }

      console.log("✅ [BAGISTO] Order placed:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to place order:", error.message);
      throw error;
    }
  }

  // ==================== DEBUG METHODS ====================

  async testCartConnection(): Promise<any> {
    try {
      console.log("🧪 [BAGISTO] Testing cart connection...");

      const cart = await this.getCartDetails();

      console.log("🧪 [BAGISTO] Cart test result:", {
        success: !!cart,
        cartId: cart?.id,
        itemsCount: cart?.itemsCount,
        itemsQty: cart?.itemsQty,
      });

      return cart;
    } catch (error) {
      console.error("🧪 [BAGISTO] Cart test failed:", error);
      return null;
    }
  }

  async clearCartStorage() {
    try {
      await AsyncStorage.removeItem("@bagisto_cart_id");
      await AsyncStorage.removeItem("@bagisto_cart_token");
      this.cartId = null;
      this.cartToken = null;
      console.log("🗑️ [BAGISTO] Cleared cart storage");
    } catch (error) {
      console.error("❌ [BAGISTO] Failed to clear cart storage:", error);
    }
  }

  // Helper to execute any GraphQL query
  async executeQuery(query: string, variables: any = {}): Promise<any> {
    try {
      console.log("⚡ [BAGISTO] Executing GraphQL query");

      const response = await fetchGraphQL<any>(
        query,
        variables,
        this.getHeaders(),
      );

      if (response.errors) {
        console.error("❌ [BAGISTO] GraphQL errors:", response.errors);
        throw new Error(response.errors[0]?.message || "GraphQL query failed");
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ [BAGISTO] Failed to execute query:", error.message);
      throw error;
    }
  }
}

export const bagistoService = new BagistoService();
