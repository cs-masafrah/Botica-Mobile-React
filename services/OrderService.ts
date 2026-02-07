import { authService } from "@/services/auth";

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qtyOrdered: number;
  total: number;
  product?: {
    id: string;
    type?: string;
  };
}

export interface OrderComment {
  id: string;
  comment: string;
  createdAt: string;
}

export interface OrderShipment {
  id: string;
  status: string;
}

export interface OrderInvoice {
  id: string;
  totalQty: number;
  subTotal: number;
  grandTotal: number;
  baseSubTotal: number;
  createdAt: string;
}

export interface OrderRefund {
  id: string;
  subTotal: number;
  totalQty: number;
  grandTotal: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Address {
  id: string;
  city: string;
  postcode: string;
  country: string;
}

export interface Payment {
  id: string;
  method: string;
  methodTitle?: string;
}

export interface Channel {
  id: string;
  name: string;
}

export interface FormattedPrice {
  price?: string | null;
  basePrice?: string | null;
  shippingAmount: string;
}

export interface Order {
  id: string | number;
  incrementId: string;
  status: string;
  statusLabel: string;
  channelName: string;
  isGuest: number;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  shippingMethod: string;
  shippingTitle: string;
  shippingDescription: string;
  couponCode: string | null;
  isGift: number;
  totalItemCount: number;
  totalQtyOrdered: number;
  baseCurrencyCode: string;
  channelCurrencyCode: string;
  orderCurrencyCode: string;
  grandTotal: number;
  baseGrandTotal: number;
  grandTotalInvoiced: number;
  baseGrandTotalInvoiced: number;
  grandTotalRefunded: number;
  baseGrandTotalRefunded: number;
  subTotal: number;
  baseSubTotal: number;
  subTotalInvoiced: number;
  baseSubTotalInvoiced: number;
  subTotalRefunded: number;
  baseSubTotalRefunded: number;
  discountPercent: number;
  discountAmount: number;
  baseDiscountAmount: number;
  discountInvoiced: number;
  baseDiscountInvoiced: number;
  discountRefunded: number;
  baseDiscountRefunded: number;
  taxAmount: number;
  baseTaxAmount: number;
  taxAmountInvoiced: number;
  baseTaxAmountInvoiced: number;
  taxAmountRefunded: number;
  baseTaxAmountRefunded: number;
  shippingAmount: number;
  baseShippingAmount: number;
  shippingInvoiced: number;
  baseShippingInvoiced: number;
  shippingRefunded: number;
  baseShippingRefunded: number;
  shippingDiscountAmount: number;
  baseShippingDiscountAmount: number;
  shippingTaxAmount: number;
  baseShippingTaxAmount: number;
  shippingTaxRefunded: number;
  baseShippingTaxRefunded: number;
  subTotalInclTax: number;
  baseSubTotalInclTax: number;
  shippingAmountInclTax: number;
  baseShippingAmountInclTax: number;
  customerId: string | number | null;
  customerType: string | null;
  channelId: number;
  channelType: string;
  cartId: string | number | null;
  appliedCartRuleIds: string | null;
  createdAt: string;
  updatedAt: string;
  formattedPrice: FormattedPrice;
  items: OrderItem[];
  comments: OrderComment[];
  shipments: OrderShipment[];
  invoices: OrderInvoice[];
  refunds: OrderRefund[];
  customer: Customer | null;
  addresses: Address[];
  payment: Payment;
  billingAddress: Address;
  shippingAddress: Address;
  channel: Channel;
}

export interface PaginatorInfo {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  hasMorePages: boolean;
}

export interface OrderListResponse {
  ordersList: {
    paginatorInfo: PaginatorInfo;
    data: Order[];
  };
}

interface FilterCustomerOrderInput {
  status?: string;
  customerEmail?: string;
  incrementId?: string;
  createdAt?: {
    from?: string;
    to?: string;
  };
}

class OrderService {
  // Get order list - FIXED AUTHENTICATION
  async getOrdersList(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Order[]; paginatorInfo: any }> {
    try {
      const { page = 1, limit = 10 } = params || {};

      console.log("📋 [ORDER SERVICE] Fetching orders list...");

      // First, get the authentication token from authService
      const auth = await authService.getStoredAuth();
      if (!auth) {
        console.error("❌ [ORDER SERVICE] Not authenticated");
        throw new Error("Not authenticated. Please log in first.");
      }

      // Use the comprehensive query with customer-specific query
      const query = `
        query OrdersList($first: Int = 10, $page: Int) {
          ordersList(first: $first, page: $page) {
            paginatorInfo {
              currentPage
              lastPage
              total
              perPage
              hasMorePages
            }
            data {
              id
              incrementId
              status
              statusLabel
              grandTotal
              subTotal
              discountAmount
              taxAmount
              shippingAmount
              totalQtyOrdered
              totalItemCount
              createdAt
              formattedPrice {
                grandTotal
                subTotal
                discountAmount
                taxAmount
                shippingAmount
              }
              payment {
                method
                methodTitle
              }
              shippingAddress {
                city
                postcode
                country
              }
              items {
                id
                name
                sku
                price
                qtyOrdered
                total
                product {
                  id
                  type
                }
              }
            }
          }
        }
      `;

      const variables = {
        first: limit,
        page: page,
      };

      // Create headers with the auth token
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${auth.accessToken}`,
      };

      // Use a direct fetch instead of bagistoService to ensure proper auth headers
      const response = await fetch(authService.baseUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ [ORDER SERVICE] HTTP error:",
          response.status,
          response.statusText,
        );
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      // Check for GraphQL errors
      if (json.errors?.length) {
        const errorMessage = json.errors.map((e: any) => e.message).join(", ");
        console.error("❌ [ORDER SERVICE] GraphQL errors:", errorMessage);
        throw new Error(errorMessage);
      }

      if (json.data?.ordersList) {
        console.log(
          `✅ [ORDER SERVICE] Fetched ${json.data.ordersList.data.length} orders`,
        );
        return {
          data: json.data.ordersList.data,
          paginatorInfo: json.data.ordersList.paginatorInfo,
        };
      }

      console.log("⚠️ [ORDER SERVICE] No orders data returned");
      return { data: [], paginatorInfo: this.getEmptyPaginatorInfo() };
    } catch (error) {
      console.error("❌ [ORDER SERVICE] Failed to fetch orders:", error);

      // Check if it's an authentication error
      if (error instanceof Error) {
        if (
          error.message.includes("HTTP 401") ||
          error.message.includes("Unauthenticated") ||
          error.message.includes("Authentication") ||
          error.message.includes("Not authenticated")
        ) {
          console.error(
            "🔐 [ORDER SERVICE] Authentication error - logging out user",
          );
          // Clear auth state
          await authService.logout();
        }
      }

      return { data: [], paginatorInfo: this.getEmptyPaginatorInfo() };
    }
  }

  // Get single order detail - FIXED AUTHENTICATION
  async getOrderDetail(orderId: string): Promise<Order | null> {
    try {
      console.log("📋 [ORDER SERVICE] Fetching order detail:", orderId);

      // First, get the authentication token
      const auth = await authService.getStoredAuth();
      if (!auth) {
        console.error("❌ [ORDER SERVICE] Not authenticated for order detail");
        throw new Error("Not authenticated. Please log in first.");
      }

      // Query for a specific order
      const query = `
        query OrderDetail($id: ID!) {
          orderDetail(id: $id) {
            id
            incrementId
            status
            statusLabel
            grandTotal
            subTotal
            discountAmount
            taxAmount
            shippingAmount
            totalQtyOrdered
            totalItemCount
            createdAt
            formattedPrice {
              grandTotal
              subTotal
              discountAmount
              taxAmount
              shippingAmount
            }
            payment {
              method
              methodTitle
            }
            shippingAddress {
              city
              postcode
              country
            }
            billingAddress {
              city
              postcode
              country
            }
            items {
              id
              name
              sku
              price
              qtyOrdered
              total
              product {
                id
                type
                name
                sku
              }
            }
          }
        }
      `;

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${auth.accessToken}`,
      };

      const response = await fetch(authService.baseUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query, variables: { id: orderId } }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ [ORDER SERVICE] HTTP error for order detail:",
          response.status,
        );
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.errors?.length) {
        const errorMessage = json.errors.map((e: any) => e.message).join(", ");
        console.error(
          "❌ [ORDER SERVICE] GraphQL errors for order detail:",
          errorMessage,
        );
        throw new Error(errorMessage);
      }

      if (json.data?.orderDetail) {
        return json.data.orderDetail;
      }

      console.log("⚠️ [ORDER SERVICE] Order not found:", orderId);
      return null;
    } catch (error) {
      console.error("❌ [ORDER SERVICE] Failed to fetch order detail:", error);
      return null;
    }
  }

  // Get order by increment ID
  async getOrderByIncrementId(incrementId: string): Promise<Order | null> {
    try {
      console.log("📋 [ORDER SERVICE] Fetching order by number:", incrementId);

      // First get orders list and search
      const ordersList = await this.getOrdersList({ limit: 50 });
      const order = ordersList.data.find((o) => o.incrementId === incrementId);

      if (order) {
        return order;
      }

      console.log(
        "⚠️ [ORDER SERVICE] Order not found by increment ID:",
        incrementId,
      );
      return null;
    } catch (error) {
      console.error(
        "❌ [ORDER SERVICE] Failed to fetch order by increment ID:",
        error,
      );
      return null;
    }
  }

  // Helper to get empty paginator info
  private getEmptyPaginatorInfo(): any {
    return {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 10,
      hasMorePages: false,
    };
  }

  // Add a helper method to check if user is authenticated
  async checkAuthentication(): Promise<boolean> {
    try {
      const auth = await authService.getStoredAuth();
      return !!auth;
    } catch (error) {
      console.error(
        "❌ [ORDER SERVICE] Failed to check authentication:",
        error,
      );
      return false;
    }
  }
}

export const orderService = new OrderService();
