// services/CheckoutService.ts - FIXED VERSION
import { bagistoService } from './bagisto';

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

class CheckoutService {
  // Save checkout addresses - CORRECTED for Bagisto API
  async saveCheckoutAddresses(billing: CheckoutAddress, shipping: CheckoutAddress): Promise<{
    message: string;
    cart: any;
    shippingMethods?: any[];
    paymentMethods?: any[];
  }> {
    try {
      console.log('🏠 [CHECKOUT SERVICE] Saving addresses for Bagisto...');

      // Based on the error and typical Bagisto schema, we need a different approach
      // Let's try the correct mutation based on Bagisto docs
      const query = `
        mutation SaveCheckoutAddresses($input: CheckoutAddressesInput!) {
          saveCheckoutAddresses(input: $input) {
            message
            cart {
              id
              customerEmail
              customerFirstName
              customerLastName
              shippingMethod
              itemsCount
              itemsQty
              subTotal
              taxTotal
              discountAmount
              shippingAmount
              grandTotal
            }
            shippingMethods {
              title
              methods {
                code
                label
                price
                formattedPrice
                basePrice
                formattedBasePrice
              }
            }
            paymentMethods {
              method
              methodTitle
              description
              sort
            }
          }
        }
      `;

      // CORRECT: Bagisto expects a single input object with billing and shipping inside
      const variables = {
        input: {
          billing: {
            address1: [billing.address],
            city: billing.city,
            country: billing.country,
            firstName: billing.firstName,
            lastName: billing.lastName,
            email: billing.email,
            phone: billing.phone,
            postcode: billing.postcode,
            state: billing.state || '',
            useForShipping: billing.useForShipping !== false,
            companyName: billing.companyName || '',
            address2: billing.address2 || ''
          },
          shipping: {
            address1: [shipping.address],
            city: shipping.city,
            country: shipping.country,
            firstName: shipping.firstName,
            lastName: shipping.lastName,
            email: shipping.email,
            phone: shipping.phone,
            postcode: shipping.postcode,
            state: shipping.state || '',
            companyName: shipping.companyName || '',
            address2: shipping.address2 || ''
          }
        }
      };

      const result = await bagistoService.executeQuery<{ saveCheckoutAddresses: any }>(query, variables);
      const addressResult = result?.saveCheckoutAddresses;
      
      console.log("✅ [CHECKOUT SERVICE] Addresses saved:", {
        message: addressResult?.message,
        shippingMethods: addressResult?.shippingMethods?.length || 0,
        paymentMethods: addressResult?.paymentMethods?.length || 0
      });
      
      return {
        message: addressResult?.message || '',
        cart: addressResult?.cart || null,
        shippingMethods: addressResult?.shippingMethods || [],
        paymentMethods: addressResult?.paymentMethods || [],
      };
    } catch (error: any) {
      console.error('❌ [CHECKOUT SERVICE] Failed to save addresses:', error.message);
      
      // Try alternative approach if the first one fails
      try {
        console.log("🔄 [CHECKOUT SERVICE] Trying alternative address save approach...");
        return await this.saveCheckoutAddressesLegacy(billing, shipping);
      } catch (altError) {
        console.error('❌ [CHECKOUT SERVICE] Alternative also failed:', altError);
        return {
          message: error.message || 'Failed to save addresses',
          cart: null
        };
      }
    }
  }

  // Alternative legacy approach for Bagisto v1.x or different schema
  private async saveCheckoutAddressesLegacy(billing: CheckoutAddress, shipping: CheckoutAddress): Promise<{
    message: string;
    cart: any;
    shippingMethods?: any[];
    paymentMethods?: any[];
  }> {
    try {
      // Try the mutation that might exist in older Bagisto versions
      const query = `
        mutation SaveBillingAddress($billing: BillingAddressInput!) {
          saveBillingAddress(input: $billing) {
            message
            cart {
              id
            }
          }
        }
        
        mutation SaveShippingAddress($shipping: ShippingAddressInput!) {
          saveShippingAddress(input: $shipping) {
            message
            shippingMethods {
              title
              methods {
                code
                label
                price
                formattedPrice
                basePrice
                formattedBasePrice
              }
            }
            cart {
              id
              customerEmail
              customerFirstName
              customerLastName
              shippingMethod
              itemsCount
              itemsQty
              subTotal
              taxTotal
              discountAmount
              shippingAmount
              grandTotal
            }
          }
        }
      `;

      // First save billing address
      const billingResult = await bagistoService.executeQuery<any>(`
        mutation SaveBillingAddress($input: BillingAddressInput!) {
          saveBillingAddress(input: $input) {
            message
            cart {
              id
            }
          }
        }
      `, {
        input: {
          address1: [billing.address],
          city: billing.city,
          country: billing.country,
          firstName: billing.firstName,
          lastName: billing.lastName,
          email: billing.email,
          phone: billing.phone,
          postcode: billing.postcode,
          state: billing.state || '',
          useForShipping: billing.useForShipping !== false
        }
      });

      // Then save shipping address
      const shippingResult = await bagistoService.executeQuery<any>(`
        mutation SaveShippingAddress($input: ShippingAddressInput!) {
          saveShippingAddress(input: $input) {
            message
            shippingMethods {
              title
              methods {
                code
                label
                price
                formattedPrice
                basePrice
                formattedBasePrice
              }
            }
            cart {
              id
              customerEmail
              customerFirstName
              customerLastName
              shippingMethod
              itemsCount
              itemsQty
              subTotal
              taxTotal
              discountAmount
              shippingAmount
              grandTotal
            }
          }
        }
      `, {
        input: {
          address1: [shipping.address],
          city: shipping.city,
          country: shipping.country,
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          email: shipping.email,
          phone: shipping.phone,
          postcode: shipping.postcode,
          state: shipping.state || ''
        }
      });

      return {
        message: shippingResult?.saveShippingAddress?.message || '',
        cart: shippingResult?.saveShippingAddress?.cart || null,
        shippingMethods: shippingResult?.saveShippingAddress?.shippingMethods || [],
        paymentMethods: [] // Payment methods will come later
      };
    } catch (error) {
      throw error;
    }
  }

  // Simple method to just set shipping address (when billing is already same as shipping)
  async saveShippingAddressOnly(address: CheckoutAddress): Promise<{
    message: string;
    cart: any;
    shippingMethods?: any[];
  }> {
    try {
      const query = `
        mutation SaveShippingAddress($input: ShippingAddressInput!) {
          saveShippingAddress(input: $input) {
            message
            shippingMethods {
              title
              methods {
                code
                label
                price
                formattedPrice
                basePrice
                formattedBasePrice
              }
            }
            cart {
              id
              customerEmail
              customerFirstName
              customerLastName
              shippingMethod
              itemsCount
              itemsQty
              subTotal
              taxTotal
              discountAmount
              shippingAmount
              grandTotal
            }
          }
        }
      `;

      const variables = {
        input: {
          address1: [address.address],
          city: address.city,
          country: address.country,
          firstName: address.firstName,
          lastName: address.lastName,
          email: address.email,
          phone: address.phone,
          postcode: address.postcode,
          state: address.state || '',
          companyName: address.companyName || '',
          address2: address.address2 || ''
        }
      };

      const result = await bagistoService.executeQuery<{ saveShippingAddress: any }>(query, variables);
      
      return {
        message: result?.saveShippingAddress?.message || '',
        cart: result?.saveShippingAddress?.cart || null,
        shippingMethods: result?.saveShippingAddress?.shippingMethods || []
      };
    } catch (error: any) {
      console.error('❌ [CHECKOUT SERVICE] Failed to save shipping address:', error);
      throw error;
    }
  }

  // Save payment method
  async savePayment(method: string): Promise<{
    cart: any;
    jumpToSection?: string;
  }> {
    try {
      const query = `
        mutation SavePayment($input: SavePaymentInput!) {
          savePayment(input: $input) {
            jumpToSection
            cart {
              id
              couponCode
              itemsCount
              itemsQty
              grandTotal
              formattedPrice {
                grandTotal
                subTotal
                taxTotal
                discountAmount
              }
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ savePayment: any }>(query, {
        input: { method }
      });
      
      return {
        cart: result?.savePayment?.cart || null,
        jumpToSection: result?.savePayment?.jumpToSection
      };
    } catch (error: any) {
      console.error('❌ [CHECKOUT SERVICE] Failed to save payment:', error);
      return {
        cart: null
      };
    }
  }

  // Place order
  async placeOrder(paymentMethod: string = 'cashondelivery'): Promise<{
    success: boolean;
    order?: {
      id: string;
      incrementId: string;
    };
    redirectUrl?: string;
  }> {
    try {
      const query = `
        mutation PlaceOrder($payment: PaymentInput!) {
          placeOrder(payment: $payment) {
            success
            redirectUrl
            order {
              id
              incrementId
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ placeOrder: any }>(query, {
        payment: {
          method: paymentMethod
        }
      });
      
      const orderResult = result?.placeOrder;
      
      return {
        success: orderResult?.success || false,
        order: orderResult?.order,
        redirectUrl: orderResult?.redirectUrl
      };
    } catch (error: any) {
      console.error('❌ [CHECKOUT SERVICE] Failed to place order:', error);
      return { success: false };
    }
  }
}

export const checkoutService = new CheckoutService();