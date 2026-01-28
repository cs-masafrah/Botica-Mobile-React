// services/ShippingService.ts - FIXED TO HANDLE OBJECT METHODS
import { bagistoService } from './bagisto';

export interface ShippingMethodGroup {
  title: string;
  methods: any[]; 
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
  // Get available shipping methods - FIXED for object methods
  async getShippingMethods(): Promise<{
    message: string;
    shippingMethods: ShippingMethodGroup[];
    cart?: any;
  }> {
    try {
      console.log('🚚 [SHIPPING SERVICE] Fetching shipping methods...');
      
      // SIMPLER QUERY - Based on your example
      const query = `
        query GetShippingMethods {
          shippingMethods {
            shippingMethods {
              title
              methods {
                code
                label
                price
                formattedPrice
              }
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ shippingMethods: any }>(query);
      
      console.log('🚚 [SHIPPING SERVICE] Raw GraphQL response:', JSON.stringify(result, null, 2));
      
      if (!result) {
        console.log('🚚 [SHIPPING SERVICE] No response from server');
        return {
          message: 'No response from server',
          shippingMethods: []
        };
      }
      
      const shippingData = result.shippingMethods;
      
      if (!shippingData || !shippingData.shippingMethods) {
        console.log('🚚 [SHIPPING SERVICE] No shipping methods in response');
        return {
          message: 'No shipping methods available',
          shippingMethods: []
        };
      }
      
      // Log the structure to debug
      console.log('🚚 [SHIPPING SERVICE] Shipping methods structure:', {
        count: shippingData.shippingMethods?.length || 0,
        firstItem: shippingData.shippingMethods?.[0],
        firstItemMethods: shippingData.shippingMethods?.[0]?.methods,
        methodsIsArray: Array.isArray(shippingData.shippingMethods?.[0]?.methods)
      });
      
      // Normalize the data structure
      let normalizedMethods: ShippingMethodGroup[] = [];
      
      if (shippingData.shippingMethods && shippingData.shippingMethods.length > 0) {
        normalizedMethods = shippingData.shippingMethods.map((group: any) => {
          let methodsArray: any[] = [];
          
          if (Array.isArray(group.methods)) {
            // Already an array
            methodsArray = group.methods;
          } else if (group.methods && typeof group.methods === 'object') {
            // Single object, wrap in array
            methodsArray = [group.methods];
          } else if (group.methods) {
            // Could be string or other type
            methodsArray = [group.methods];
          }
          
          return {
            title: group.title || 'Shipping Options',
            methods: methodsArray
          };
        }).filter((group: any) => group.methods.length > 0);
      }
      
      console.log('🚚 [SHIPPING SERVICE] Normalized methods:', normalizedMethods);
      
      return {
        message: shippingData.message || 'Shipping methods loaded',
        shippingMethods: normalizedMethods,
        cart: shippingData.cart
      };
    } catch (error: any) {
      console.error('❌ [SHIPPING SERVICE] Failed to get shipping methods:', error.message);
      console.error('❌ [SHIPPING SERVICE] Error stack:', error.stack);
      
      return {
        message: error.message || 'Failed to load shipping methods',
        shippingMethods: []
      };
    }
  }

  // Apply shipping method
  async applyShippingMethod(methodCode: string): Promise<{
    success: boolean;
    cart?: any;
    message?: string;
    jumpToSection?: string;
  }> {
    try {
      console.log('🚚 [SHIPPING SERVICE] Applying shipping method:', methodCode);

      // Use the correct input type - Based on Bagisto's response
      const query = `
        mutation SaveShippingMethod {
          saveShipping(input: { method: "${methodCode}" }) {
            message
            jumpToSection
            cart {
              id
              shippingMethod
              grandTotal
              shippingAmount
              subTotal
              taxTotal
              discountAmount
              itemsCount
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ saveShipping: any }>(query);

      const saveResult = result?.saveShipping;
      
      console.log('✅ Shipping method response:', {
        success: saveResult?.success,
        message: saveResult?.message,
        cartId: saveResult?.cart?.id,
        shippingMethod: saveResult?.cart?.shippingMethod
      });
      
      // FIX: Handle undefined success field - check if message indicates success
      const isSuccess = saveResult?.success === true || 
                      (saveResult?.message && saveResult.message.toLowerCase().includes('success'));
      
      return {
        success: isSuccess,
        cart: saveResult?.cart,
        message: saveResult?.message,
        jumpToSection: saveResult?.jumpToSection
      };
    } catch (error: any) {
      console.error('❌ [SHIPPING SERVICE] Failed to apply shipping method:', error.message);
      return { 
        success: false,
        message: error.message || 'Failed to apply shipping method'
      };
    }
  }
}

export const shippingService = new ShippingService();