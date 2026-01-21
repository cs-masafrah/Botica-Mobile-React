// services/OrderService.ts
import { bagistoService } from './bagisto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Order {
  id: string;
  incrementId: string;
  status: string;
  totalQtyOrdered: number;
  createdAt: string;
  formattedPrice: {
    grandTotal: number;
    subTotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingAmount: number;
  };
}

export interface OrderDetail {
  id: string;
  incrementId: string;
  status: string;
  shippingTitle: string;
  createdAt: string;
  billingAddress: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    address: string;
    postcode: string;
    city: string;
    state: string;
    country: string;
    phone: string;
  };
  shippingAddress: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    address: string;
    postcode: string;
    city: string;
    state: string;
    country: string;
    phone: string;
  };
  items: OrderItem[];
  payment: {
    id: string;
    method: string;
    methodTitle: string;
  };
  formattedPrice: {
    grandTotal: number;
    subTotal: number;
    taxAmount: number;
    discountAmount: number;
    shippingAmount: number;
  };
}

export interface OrderItem {
  id: string;
  sku: string;
  type: string;
  name: string;
  qtyOrdered: number;
  qtyShipped: number;
  qtyInvoiced: number;
  qtyCanceled: number;
  qtyRefunded: number;
  additional: any;
  formattedPrice: {
    price: number;
    total: number;
    baseTotal: number;
    discountAmount: number;
    taxAmount: number;
  };
  product: {
    id: string;
    sku: string;
    images: Array<{
      id: string;
      url: string;
      productId: string;
    }>;
  };
}

class OrderService {
  // Get order list with optional filters
  async getOrdersList(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    orderId?: string;
  }): Promise<{ data: Order[]; paginatorInfo: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        status = '',
        startDate = '',
        endDate = '',
        orderId = '',
      } = params || {};

      // Build input based on Flutter query structure
      const input: any = {};
      if (orderId) input.incrementId = orderId;
      if (startDate) input.orderDateFrom = startDate;
      if (endDate) input.orderDateTo = endDate;
      if (status) input.status = status;

      const query = `
        query ordersList {
          ordersList(
            page: ${page}
            first: ${limit}
            input: {
              ${orderId ? `incrementId: "${orderId}",` : ''}
              ${startDate ? `orderDateFrom: "${startDate}",` : ''}
              ${endDate ? `orderDateTo: "${endDate}",` : ''}
              ${status ? `status: "${status}"` : ''}
            }
          ) {
            paginatorInfo {
              count
              currentPage
              lastPage
              total
            }
            data {
              id
              incrementId
              status
              totalQtyOrdered
              createdAt
              formattedPrice {
                grandTotal
                subTotal
                discountAmount
                taxAmount
                shippingAmount
              }
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { ordersList: any };
      }>(query);

      return result.data?.ordersList || { data: [], paginatorInfo: {} };
    } catch (error) {
      console.error('❌ [ORDER SERVICE] Failed to fetch orders:', error);
      return { data: [], paginatorInfo: {} };
    }
  }

  // Get order details
  async getOrderDetail(orderId: string): Promise<OrderDetail | null> {
    try {
      const query = `
        query orderDetail {
          orderDetail(id: "${orderId}") {
            id
            incrementId
            status
            shippingTitle
            createdAt
            billingAddress {
              id
              firstName
              lastName
              companyName
              address
              postcode
              city
              state
              country
              phone
            }
            shippingAddress {
              id
              firstName
              lastName
              companyName
              address
              postcode
              city
              state
              country
              phone
            }
            items {
              id
              sku
              type
              name
              qtyOrdered
              qtyShipped
              qtyInvoiced
              qtyCanceled
              qtyRefunded
              additional
              formattedPrice {
                price
                total
                baseTotal
                discountAmount
                taxAmount
              }
              product {
                id
                sku
                images {
                  id
                  url
                  productId
                }
              }
            }
            payment {
              id
              method
              methodTitle
            }
            formattedPrice {
              grandTotal
              subTotal
              taxAmount
              discountAmount
              shippingAmount
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { orderDetail: OrderDetail };
      }>(query);

      return result.data?.orderDetail || null;
    } catch (error) {
      console.error('❌ [ORDER SERVICE] Failed to fetch order detail:', error);
      return null;
    }
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const query = `
        mutation cancelCustomerOrder {
          cancelCustomerOrder(id: "${orderId}") {
            success
            message
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { cancelCustomerOrder: { success: boolean; message: string } };
      }>(query);

      return result.data?.cancelCustomerOrder || { success: false, message: 'Failed to cancel order' };
    } catch (error: any) {
      console.error('❌ [ORDER SERVICE] Failed to cancel order:', error);
      return { success: false, message: error.message };
    }
  }

  // Re-order
  async reorder(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const query = `
        mutation reorder {
          reorder(id: "${orderId}") {
            success
            message
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { reorder: { success: boolean; message: string } };
      }>(query);

      return result.data?.reorder || { success: false, message: 'Failed to reorder' };
    } catch (error: any) {
      console.error('❌ [ORDER SERVICE] Failed to reorder:', error);
      return { success: false, message: error.message };
    }
  }

  // Get invoices for an order
  async getInvoices(orderId: string, page: number = 1, limit: number = 10) {
    try {
      const query = `
        query viewInvoices {
          viewInvoices(
            page: ${page}
            first: ${limit}
            input: {
              orderId: "${orderId}"
            }
          ) {
            paginatorInfo {
              count
              currentPage
              lastPage
              total
            }
            data {
              id
              formattedPrice {
                subTotal
                taxAmount
                grandTotal
                shippingAmount
              }
              items {
                id
                name
                sku
                qty
                formattedPrice {
                  total
                  price
                  taxAmount
                  baseTotal
                }
                product {
                  id
                  sku
                }
              }
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { viewInvoices: any };
      }>(query);

      return result.data?.viewInvoices || { data: [], paginatorInfo: {} };
    } catch (error) {
      console.error('❌ [ORDER SERVICE] Failed to fetch invoices:', error);
      return { data: [], paginatorInfo: {} };
    }
  }

  // Get shipments for an order
  async getShipments(orderId: string, page: number = 1, limit: number = 10) {
    try {
      const query = `
        query viewShipments {
          viewShipments(
            page: ${page}
            first: ${limit}
            input: {
              orderId: "${orderId}"
            }
          ) {
            paginatorInfo {
              count
              currentPage
              lastPage
              total
            }
            data {
              id
              trackNumber
              items {
                id
                name
                sku
                qty
              }
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { viewShipments: any };
      }>(query);

      return result.data?.viewShipments || { data: [], paginatorInfo: {} };
    } catch (error) {
      console.error('❌ [ORDER SERVICE] Failed to fetch shipments:', error);
      return { data: [], paginatorInfo: {} };
    }
  }

  // Get refunds for an order
  async getRefunds(orderId: string, page: number = 1, limit: number = 10) {
    try {
      const query = `
        query viewRefunds {
          viewRefunds(
            page: ${page}
            first: ${limit}
            input: {
              orderId: "${orderId}"
            }
          ) {
            paginatorInfo {
              count
              currentPage
              lastPage
              total
            }
            data {
              id
              formattedPrice {
                subTotal
                adjustmentRefund
                adjustmentFee
                grandTotal
                shippingAmount
              }
              items {
                id
                name
                sku
                qty
                formattedPrice {
                  total
                  price
                  taxAmount
                  baseTotal
                }
              }
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { viewRefunds: any };
      }>(query);

      return result.data?.viewRefunds || { data: [], paginatorInfo: {} };
    } catch (error) {
      console.error('❌ [ORDER SERVICE] Failed to fetch refunds:', error);
      return { data: [], paginatorInfo: {} };
    }
  }

  // Download invoice PDF
  async downloadInvoice(invoiceId: string) {
    try {
      // This would typically be a different endpoint for PDF download
      // You might need to adjust based on your Bagisto setup
      console.log('📄 [ORDER SERVICE] Downloading invoice:', invoiceId);
      // Implementation depends on your Bagisto API
      return null;
    } catch (error) {
      console.error('❌ [ORDER SERVICE] Failed to download invoice:', error);
      return null;
    }
  }
}

export const orderService = new OrderService();