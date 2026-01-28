import { authService } from '@/services/auth';
// services/OrderService.ts - UPDATED TO USE AUTH CONTEXT
// import { useAuthStore } from '@/service/auth'; // Or import your auth context
import { bagistoService } from "./bagisto";

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qtyOrdered: number;
  total: number;
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
  // Get order list - SIMPLIFIED
  async getOrdersList(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Order[]; paginatorInfo: any }> {
    try {
      const { page = 1, limit = 10 } = params || {};

      console.log("📋 [ORDER SERVICE] Fetching orders list...");

      // Use the comprehensive query
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
            }
          }
        }
      `;

      const variables = {
        first: limit,
        page: page,
      };

      const result = await bagistoService.executeQuery<OrderListResponse>(
        query,
        variables,
      );

      if (result?.ordersList) {
        console.log(
          `✅ [ORDER SERVICE] Fetched ${result.ordersList.data.length} orders`,
        );
        return {
          data: result.ordersList.data,
          paginatorInfo: result.ordersList.paginatorInfo,
        };
      }

      console.log("⚠️ [ORDER SERVICE] No orders data returned");
      return { data: [], paginatorInfo: {} };
    } catch (error) {
      console.error("❌ [ORDER SERVICE] Failed to fetch orders:", error);
      
      // Check if it's an authentication error
      if (error instanceof Error) {
        if (error.message.includes('HTTP 401') || 
            error.message.includes('Unauthenticated') ||
            error.message.includes('Authentication')) {
          console.error("🔐 [ORDER SERVICE] Authentication error");
        }
      }
      
      return { data: [], paginatorInfo: this.getEmptyPaginatorInfo() };
    }
  }

  // Get single order detail - SIMPLIFIED (search within ordersList)
  async getOrderDetail(orderId: string): Promise<Order | null> {
    try {
      console.log("📋 [ORDER SERVICE] Fetching order detail:", orderId);

      // Get all orders (with higher limit) to search
      const ordersList = await this.getOrdersList({ limit: 50 });
      const order = ordersList.data.find(
        (o) => o.id.toString() === orderId || o.incrementId === orderId,
      );

      if (order) {
        return order;
      }

      console.log("⚠️ [ORDER SERVICE] Order not found in list:", orderId);
      return null;
    } catch (error) {
      console.error("❌ [ORDER SERVICE] Failed to fetch order detail:", error);
      return null;
    }
  }

  // Get order by increment ID (search within ordersList)
  async getOrderByIncrementId(incrementId: string): Promise<Order | null> {
    try {
      console.log("📋 [ORDER SERVICE] Fetching order by number:", incrementId);

      // Search in orders list
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
      hasMorePages: false
    };
  }
}

export const orderService = new OrderService();