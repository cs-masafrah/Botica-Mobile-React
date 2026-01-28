// services/bagisto.ts - COMPLETE VERSION
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Helper function for GraphQL requests
async function fetchGraphQL<T>(
  query: string,
  variables?: any,
  headers?: Record<string, string>,
): Promise<GraphQLResponse<T>> {
  try {
    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { ...defaultHeaders, ...headers },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ [GRAPHQL] Fetch error:", error);
    throw error;
  }
}

export class BagistoService {
  private token: string | null = null;
  private cartToken: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      this.token = await AsyncStorage.getItem("@bagisto_token");
      this.cartToken = await AsyncStorage.getItem("@bagisto_cart_token");
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

    return headers;
  }

  // Core GraphQL execution method
  async executeQuery<T>(query: string, variables: any = {}): Promise<T | null> {
    try {
      const response = await fetchGraphQL<T>(
        query,
        variables,
        this.getHeaders(),
      );

      if (response.errors) {
        const errorMessage = response.errors[0]?.message || "GraphQL query failed";
        throw new Error(errorMessage);
      }

      return response.data || null;
    } catch (error: any) {
      console.error(
        "❌ [BAGISTO] Failed to execute query:",
        error?.response?.errors || error
      );
      throw error;
    }
  }

  // ==================== CART METHODS ====================

  async getCartDetails(): Promise<any> {
    try {
      const query = `
        query GetCartDetails {
          cartDetail {
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
                }
              }
            }
          }
        }
      `;

      const result = await this.executeQuery<{ cartDetail: any }>(query);
      return result?.cartDetail || null;
    } catch (error) {
      console.error("❌ [BAGISTO] Failed to get cart details:", error);
      return null;
    }
  }

  async addToCart(input: any): Promise<any> {
    try {
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
                  }
                }
              }
            }
          }
        }
      `;

      const result = await this.executeQuery<{ addItemToCart: any }>(query, { input });
      return result?.addItemToCart || null;
    } catch (error) {
      console.error("❌ [BAGISTO] Failed to add to cart:", error);
      throw error;
    }
  }

  async updateCartItem(items: Array<{ id: string; quantity: number }>): Promise<any> {
    try {
      console.log('🔄 [BAGISTO] Updating cart items:', items);

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

      const result = await this.executeQuery<{ updateItemToCart: any }>(query, variables);
      return result?.updateItemToCart || { success: false, message: 'Update failed' };
    } catch (error: any) {
      console.error('❌ [BAGISTO] Failed to update cart:', error.message);
      throw error;
    }
  }

  async removeFromCart(id: string): Promise<any> {
    try {
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
            }
          }
        }
      `;

      const result = await this.executeQuery<{ removeCartItem: any }>(query, { id });
      return result?.removeCartItem || null;
    } catch (error) {
      console.error("❌ [BAGISTO] Failed to remove from cart:", error);
      throw error;
    }
  }

  async applyCoupon(code: string): Promise<any> {
    try {
      const query = `
        mutation ApplyCoupon($input: ApplyCouponInput!) {
          applyCoupon(input: $input) {
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

      const result = await this.executeQuery<{ applyCoupon: any }>(query, {
        input: { couponCode: code },
      });
      return result?.applyCoupon || null;
    } catch (error) {
      console.error("❌ [BAGISTO] Failed to apply coupon:", error);
      throw error;
    }
  }

  async removeCoupon(): Promise<any> {
    try {
      const query = `
        mutation RemoveCoupon {
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

      const result = await this.executeQuery<{ removeCoupon: any }>(query);
      return result?.removeCoupon || null;
    } catch (error) {
      console.error("❌ [BAGISTO] Failed to remove coupon:", error);
      throw error;
    }
  }

  // ==================== CHECKOUT METHODS ====================

  // async saveCheckoutAddresses(input: {
  //   billing: any;
  //   shipping: any;
  // }): Promise<any> {
  //   try {
  //     console.log('🏠 [BAGISTO] Saving checkout addresses');

  //     const query = `
  //       mutation SaveCheckoutAddresses($input: SaveCheckoutAddressesInput!) {
  //         saveCheckoutAddresses(input: $input) {
  //           message
  //           shippingMethods {
  //             title
  //             methods {
  //               code
  //               label
  //               price
  //               formattedPrice
  //               basePrice
  //               formattedBasePrice
  //             }
  //           }
  //           paymentMethods {
  //             method
  //             methodTitle
  //             description
  //             sort
  //           }
  //           cart {
  //             id
  //             itemsQty
  //             itemsCount
  //           }
  //           jumpToSection
  //         }
  //       }
  //     `;

  //     const result = await this.executeQuery<{ saveCheckoutAddresses: any }>(query, { input });
  //     return result?.saveCheckoutAddresses || null;
  //   } catch (error: any) {
  //     console.error('❌ [BAGISTO] Failed to save addresses:', error.message);
  //     throw error;
  //   }
  // }

  async savePayment(method: string): Promise<any> {
    try {
      console.log('💳 [BAGISTO] Saving payment method:', method);

      const query = `
        mutation SavePayment($input: SavePaymentInput!) {
          savePayment(input: $input) {
            jumpToSection
            cart {
              id
              itemsQty
              itemsCount
            }
          }
        }
      `;

      const result = await this.executeQuery<{ savePayment: any }>(query, {
        input: { method }
      });
      return result?.savePayment || null;
    } catch (error: any) {
      console.error('❌ [BAGISTO] Failed to save payment:', error.message);
      throw error;
    }
  }

  // Debug method
  async clearCartStorage() {
    try {
      await AsyncStorage.removeItem("@bagisto_cart_token");
      this.cartToken = null;
      console.log("🗑️ [BAGISTO] Cleared cart storage");
    } catch (error) {
      console.error("❌ [BAGISTO] Failed to clear cart storage:", error);
    }
  }
}

export const bagistoService = new BagistoService();