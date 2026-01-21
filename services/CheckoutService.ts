// services/CheckoutService.ts
import { bagistoService } from './bagisto';

export interface ShippingMethod {
  title: string;
  methods: Array<{
    code: string;
    formattedPrice: string;
  }>;
}

export interface CheckoutAddress {
  companyName?: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  address2?: string;
  city: string;
  country: string;
  state?: string;
  postcode: string;
  phone: string;
  useForShipping?: boolean;
  defaultAddress?: boolean;
  saveAddress?: boolean;
}

export interface PaymentMethod {
  method: string;
  methodTitle: string;
  description?: string;
  sort: number;
}

class CheckoutService {
  // Get shipping methods
  async getShippingMethods(shippingMethod?: string): Promise<{
    message: string;
    shippingMethods: ShippingMethod[];
    paymentMethods: PaymentMethod[];
    cart: any;
  }> {
    try {
      const query = `
        query paymentMethods {
          paymentMethods(input: {
            ${shippingMethod ? `shippingMethod: "${shippingMethod}"` : ''}
          }) {
            message
            paymentMethods {
              method
              methodTitle
              description
              sort
            }
            cart {
              id
              customerEmail
              customerFirstName
              customerLastName
              shippingMethod
              couponCode
              isGift
              itemsCount
              itemsQty
              formattedPrice {
                grandTotal
              }
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { paymentMethods: any };
      }>(query);

      return result.data?.paymentMethods || {
        message: '',
        shippingMethods: [],
        paymentMethods: [],
        cart: null
      };
    } catch (error) {
      console.error('❌ [CHECKOUT SERVICE] Failed to get shipping methods:', error);
      return {
        message: 'Failed to load shipping methods',
        shippingMethods: [],
        paymentMethods: [],
        cart: null
      };
    }
  }

  // Save checkout addresses
  async saveCheckoutAddresses(billing: CheckoutAddress, shipping: CheckoutAddress): Promise<{
    message: string;
    shippingMethods: ShippingMethod[];
    paymentMethods: PaymentMethod[];
    cart: any;
    jumpToSection: string;
  }> {
    try {
      // Format addresses according to Bagisto GraphQL schema
      const billingInput = {
        defaultAddress: false,
        companyName: billing.companyName || '',
        firstName: billing.firstName,
        lastName: billing.lastName,
        email: billing.email,
        address: `${billing.address}${billing.address2 ? ' ' + billing.address2 : ''}`,
        city: billing.city,
        country: billing.country,
        state: billing.state || '',
        postcode: billing.postcode,
        phone: billing.phone,
        useForShipping: billing.useForShipping || true,
        defaultAddress: false,
        saveAddress: false
      };

      const shippingInput = {
        defaultAddress: false,
        companyName: shipping.companyName || '',
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        email: shipping.email,
        address: `${shipping.address}${shipping.address2 ? ' ' + shipping.address2 : ''}`,
        city: shipping.city,
        country: shipping.country,
        state: shipping.state || '',
        postcode: shipping.postcode,
        phone: shipping.phone
      };

      const query = `
        mutation saveCheckoutAddresses {
          saveCheckoutAddresses(input: {
            billing: ${JSON.stringify(billingInput).replace(/"([^"]+)":/g, '$1:')},
            shipping: ${JSON.stringify(shippingInput).replace(/"([^"]+)":/g, '$1:')}
          }) {
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
            }
            cart {
              id
              customerEmail
              customerFirstName
              customerLastName
              shippingMethod
              couponCode
              isGift
              itemsCount
              itemsQty
              formattedPrice {
                grandTotal
              }
            }
            jumpToSection
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { saveCheckoutAddresses: any };
      }>(query);

      return result.data?.saveCheckoutAddresses || {
        message: 'Failed to save addresses',
        shippingMethods: [],
        paymentMethods: [],
        cart: null,
        jumpToSection: ''
      };
    } catch (error: any) {
      console.error('❌ [CHECKOUT SERVICE] Failed to save addresses:', error);
      return {
        message: error.message || 'Failed to save addresses',
        shippingMethods: [],
        paymentMethods: [],
        cart: null,
        jumpToSection: ''
      };
    }
  }

  // Save payment method
  async savePayment(method: string): Promise<{
    jumpToSection: string;
    cart: any;
  }> {
    try {
      const query = `
        mutation savePayment {
          savePayment(input: {
            method: "${method}"
          }) {
            jumpToSection
            cart {
              id
              couponCode
              itemsCount
              itemsQty
              grandTotal
              appliedTaxRates {
                taxName
                totalAmount
              }
              items {
                id
                quantity
                appliedTaxRate
                price
                formattedPrice {
                  price
                  total
                }
                type
                name
                productId
                product {
                  id
                  type
                  sku
                  parentId
                  images {
                    url
                  }
                }
              }
              formattedPrice {
                grandTotal
                subTotal
                taxTotal
                discountAmount
              }
              shippingAddress {
                id
                address
                postcode
                city
                state
                country
                phone
              }
              billingAddress {
                id
                address
                postcode
                city
                state
                country
                phone
              }
              selectedShippingRate {
                id
                methodTitle
                formattedPrice {
                  price
                  basePrice
                }
              }
              payment {
                id
                method
                methodTitle
              }
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { savePayment: any };
      }>(query);

      return result.data?.savePayment || {
        jumpToSection: '',
        cart: null
      };
    } catch (error: any) {
      console.error('❌ [CHECKOUT SERVICE] Failed to save payment:', error);
      return {
        jumpToSection: '',
        cart: null
      };
    }
  }

  // Place order
  async placeOrder(paymentDetails?: {
    isPaymentCompleted?: boolean;
    error?: boolean;
    message?: string;
    transactionId?: string;
    paymentStatus?: string;
    paymentType?: string;
    paymentMethod?: string;
    orderID?: string;
  }): Promise<{
    success: boolean;
    redirectUrl?: string;
    order: {
      id: string;
      incrementId: string;
    };
  }> {
    try {
      const {
        isPaymentCompleted = true,
        error = false,
        message = '',
        transactionId = '',
        paymentStatus = 'completed',
        paymentType = 'cashondelivery',
        paymentMethod = 'cashondelivery',
        orderID = ''
      } = paymentDetails || {};

      const query = `
        mutation placeOrder {
          placeOrder(
            isPaymentCompleted: ${isPaymentCompleted},
            error: ${error},
            message: "${message}",
            transactionId: "${transactionId}",
            paymentStatus: "${paymentStatus}",
            paymentType: "${paymentType}",
            paymentMethod: "${paymentMethod}",
            orderID: "${orderID}"
          ) {
            success
            redirectUrl
            order {
              id
              incrementId
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { placeOrder: any };
      }>(query);

      return result.data?.placeOrder || {
        success: false,
        order: { id: '', incrementId: '' }
      };
    } catch (error: any) {
      console.error('❌ [CHECKOUT SERVICE] Failed to place order:', error);
      return {
        success: false,
        order: { id: '', incrementId: '' }
      };
    }
  }

  // Get countries and states (for address forms)
  async getCountriesAndStates() {
    try {
      const query = `
        query countries {
          countries {
            id
            code
            name
            translations {
              id
              locale
              name
            }
            states {
              id
              countryCode
              code
              defaultName
              translations {
                id
                locale
              }
            }
          }
        }
      `;

      const result = await bagistoService.rawRequest<{
        data: { countries: any[] };
      }>(query);

      return result.data?.countries || [];
    } catch (error) {
      console.error('❌ [CHECKOUT SERVICE] Failed to get countries:', error);
      return [];
    }
  }

  // Apply shipping method
  async applyShippingMethod(methodCode: string): Promise<boolean> {
    try {
      // This might need to be implemented differently based on your Bagisto setup
      console.log('🚚 [CHECKOUT SERVICE] Applying shipping method:', methodCode);
      return true;
    } catch (error) {
      console.error('❌ [CHECKOUT SERVICE] Failed to apply shipping method:', error);
      return false;
    }
  }
}

export const checkoutService = new CheckoutService();