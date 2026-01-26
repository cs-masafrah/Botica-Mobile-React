// services/ShippingService.ts - FIXED WITH CORRECT SCHEMA
import { bagistoService } from './bagisto';

export interface ShippingMethodGroup {
  title: string;
  methods: ShippingMethod[];
}

export interface ShippingMethod {
  code: string;
  label: string;
  price: number;
  formattedPrice: string;
  basePrice: number;
  formattedBasePrice: string;
}

class ShippingService {
  // Get available shipping methods - FIXED (no input argument needed)
  async getShippingMethods(): Promise<{
    message: string;
    shippingMethods: ShippingMethodGroup[];
    cart?: any;
  }> {
    try {
      console.log('🚚 [SHIPPING SERVICE] Fetching shipping methods...');
      
      // Based on error: shippingMethods doesn't take an "input" argument
      const query = `
        query GetShippingMethods {
          shippingMethods {
            message
            cart {
              id
              customerEmail
              customerFirstName
              customerLastName
              isGuest
              itemsCount
              itemsQty
              cartCurrencyCode
              baseCurrencyCode
              channelCurrencyCode
              subTotal
              taxTotal
              discountAmount
              shippingAmount
              grandTotal
              couponCode
              shippingMethod
              isGift
              isActive
              updatedAt
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
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ shippingMethods: any }>(query);
      
      if (!result) {
        console.log('🚚 [SHIPPING SERVICE] No response from server');
        return {
          message: 'No response from server',
          shippingMethods: []
        };
      }
      
      const shippingData = result.shippingMethods;
      
      console.log('🚚 [SHIPPING SERVICE] Response:', {
        message: shippingData?.message,
        methodsCount: shippingData?.shippingMethods?.length || 0,
        hasCart: !!shippingData?.cart
      });
      
      if (!shippingData) {
        return {
          message: 'No shipping data received',
          shippingMethods: []
        };
      }
      
      return {
        message: shippingData.message || '',
        shippingMethods: shippingData.shippingMethods || [],
        cart: shippingData.cart
      };
    } catch (error: any) {
      console.error('❌ [SHIPPING SERVICE] Failed to get shipping methods:', error);
      
      return {
        message: error.message || 'Failed to load shipping methods',
        shippingMethods: []
      };
    }
  }

  // Apply shipping method
  async applyShippingMethod(methodCode: string): Promise<boolean> {
    try {
      const query = `
        mutation ApplyShippingMethod($method: String!) {
          applyShippingMethod(method: $method) {
            success
            message
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ applyShippingMethod: any }>(query, {
        method: methodCode
      });
      return result?.applyShippingMethod?.success || false;
    } catch (error) {
      console.error('❌ [SHIPPING SERVICE] Failed to apply shipping method:', error);
      return false;
    }
  }
}

export const shippingService = new ShippingService();