// services/CheckoutService.ts - WITH SCHEMA DISCOVERY
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
  
  // Add these for compatibility with address data
  first_name?: string;
  last_name?: string;
  company_name?: string;
}

class CheckoutService {
  // Method to discover the correct input type for saveCheckoutAddresses
  async discoverAddressInputType(): Promise<{
    inputTypeName: string;
    fields: string[];
  }> {
    try {
      const query = `
        query DiscoverAddressInputType {
          __type(name: "SaveShippingAddressInput") {
            name
            inputFields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery<any>(query);
      const typeInfo = result?.__type;
      
      if (typeInfo) {
        const fields = typeInfo.inputFields.map((field: any) => field.name);
        return {
          inputTypeName: typeInfo.name,
          fields
        };
      }
      
      return {
        inputTypeName: 'SaveShippingAddressInput',
        fields: []
      };
    } catch (error) {
      console.log('⚠️ Could not discover input type, using fallback');
      return {
        inputTypeName: 'SaveShippingAddressInput',
        fields: []
      };
    }
  }

  // Save checkout addresses - WITH DYNAMIC FIELD MAPPING
  async saveCheckoutAddresses(billing: CheckoutAddress, shipping: CheckoutAddress): Promise<{
  message: string;
  cart: any;
  shippingMethods?: any[];
  paymentMethods?: any[];
  jumpToSection?: string;
}> {
  try {
    console.log('🏠 [CHECKOUT SERVICE] Saving addresses...');

    // CORRECT MUTATION
    const query = `
      mutation SaveCheckoutAddresses($input: SaveShippingAddressInput!) {
        saveCheckoutAddresses(input: $input) {
          message
          jumpToSection
          cart {
            id
            customerEmail
            itemsCount
            itemsQty
            cartCurrencyCode
            subTotal
            discountAmount
            taxTotal
            shippingAmount
            grandTotal
            couponCode
            shippingMethod
            updatedAt
          }
          shippingMethods {
            title
            methods {
              code
              label
              formattedPrice
              price
            }
          }
          paymentMethods {
            method
            methodTitle
            description
          }
        }
      }
    `;

    // CORRECT VARIABLES - CAMEL CASE in GraphQL!
    const variables = {
      input: {
        billing: {
          firstName: billing.firstName,
          lastName: billing.lastName,
          email: billing.email,
          address: billing.address,
          city: billing.city,
          country: billing.country,
          state: billing.state || '',
          postcode: billing.postcode,
          phone: billing.phone,
          companyName: billing.companyName || '',
        },
        shipping: {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          email: shipping.email,
          address: shipping.address,
          city: shipping.city,
          country: shipping.country,
          state: shipping.state || '',
          postcode: shipping.postcode,
          phone: shipping.phone,
          companyName: shipping.companyName || '',
        }
      }
    };

    console.log('📤 [CHECKOUT SERVICE] Sending address data:', JSON.stringify(variables, null, 2));
    
    const result = await bagistoService.executeQuery<{ saveCheckoutAddresses: any }>(query, variables);
    const addressResult = result?.saveCheckoutAddresses;
    
    if (!addressResult) {
      throw new Error('No response from saveCheckoutAddresses mutation');
    }
    
    console.log("✅ [CHECKOUT SERVICE] Addresses saved successfully:", {
      message: addressResult.message,
      jumpToSection: addressResult.jumpToSection,
      shippingMethods: addressResult.shippingMethods?.length || 0,
      paymentMethods: addressResult.paymentMethods?.length || 0
    });
    
    // Normalize shipping methods structure if needed
    let normalizedShippingMethods = addressResult.shippingMethods || [];
    if (normalizedShippingMethods.length > 0 && normalizedShippingMethods[0].methods && !Array.isArray(normalizedShippingMethods[0].methods)) {
      normalizedShippingMethods = normalizedShippingMethods.map((group: any) => ({
        ...group,
        methods: [group.methods]
      }));
    }
    
    return {
      message: addressResult.message || '',
      cart: addressResult.cart || null,
      shippingMethods: normalizedShippingMethods,
      paymentMethods: addressResult.paymentMethods || [],
      jumpToSection: addressResult.jumpToSection
    };
  } catch (error: any) {
    console.error('❌ [CHECKOUT SERVICE] Failed to save addresses:', error.message);
    return {
      message: error.message || 'Failed to save addresses',
      cart: null
    };
  }
}
  // Alternative: Get shipping methods directly without saving addresses first
  private async getShippingMethodsDirectly(): Promise<{
    message: string;
    cart: any;
    shippingMethods?: any[];
    paymentMethods?: any[];
    jumpToSection?: string;
  }> {
    try {
      console.log('🚚 [CHECKOUT SERVICE] Getting shipping methods directly...');
      
      // Query to get shipping methods directly
      const query = `
        query GetShippingMethodsDirectly {
          shippingMethods {
            message
            shippingMethods {
              title
              methods {
                code
                label
                formattedPrice
                price
              }
            }
            cart {
              id
              customerEmail
              itemsCount
              itemsQty
              cartCurrencyCode
              subTotal
              discountAmount
              taxTotal
              shippingAmount
              grandTotal
              couponCode
              shippingMethod
              updatedAt
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ shippingMethods: any }>(query);
      const shippingData = result?.shippingMethods;
      
      return {
        message: shippingData?.message || '',
        cart: shippingData?.cart || null,
        shippingMethods: shippingData?.shippingMethods || [],
        paymentMethods: [],
        jumpToSection: undefined
      };
    } catch (error) {
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
  async placeOrder(): Promise<{
    success: boolean;
    order?: {
      id: string;
      incrementId: string;
      status: string;
      grandTotal: number;
    };
    redirectUrl?: string;
    message?: string;
  }> {
    try {
      console.log('🧾 [CHECKOUT SERVICE] Placing order...');

      // CORRECT MUTATION - Based on your example
      const query = `
        mutation PlaceOrder {
          placeOrder(
            isPaymentCompleted: false
            error: false
            message: "Order placed via mobile app"
            paymentMethod: "cashondelivery"
            paymentType: "offline"
          ) {
            success
            redirectUrl
            selectedMethod
            order {
              id
              incrementId
              status
              grandTotal
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ placeOrder: any }>(query);
      const orderResult = result?.placeOrder;

      return {
        success: orderResult?.success || false,
        order: orderResult?.order,
        redirectUrl: orderResult?.redirectUrl,
        message: orderResult?.selectedMethod || 'Order processing'
      };
    } catch (error: any) {
      console.error('❌ [CHECKOUT SERVICE] Failed to place order:', error);
      return { 
        success: false,
        message: error.message || 'Failed to place order'
      };
    }
  }
}

export const checkoutService = new CheckoutService();