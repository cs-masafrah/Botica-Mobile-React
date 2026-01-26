// services/PaymentService.ts - SIMPLIFIED
import { bagistoService } from './bagisto';

export interface PaymentMethod {
  method: string;
  methodTitle: string;
  description?: string;
  sort: number;
}

class PaymentService {
  // Get payment methods - ONLY after shipping method is provided
  async getPaymentMethods(shippingMethodCode: string): Promise<{
    message: string;
    paymentMethods: PaymentMethod[];
  }> {
    try {
      if (!shippingMethodCode) {
        throw new Error('Shipping method is required to load payment methods');
      }
      
      console.log("💳 [PAYMENT SERVICE] Fetching payment methods for shipping:", shippingMethodCode);
      
      const query = `
        query GetPaymentMethods($input: PaymentMethodsInput!) {
          paymentMethods(input: $input) {
            message
            paymentMethods {
              method
              methodTitle
              description
              sort
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery<{ paymentMethods: any }>(query, {
        input: { shippingMethod: shippingMethodCode }
      });
      
      const paymentData = result?.paymentMethods;
      
      console.log("💳 [PAYMENT SERVICE] Payment methods response:", {
        message: paymentData?.message,
        count: paymentData?.paymentMethods?.length || 0
      });
      
      return {
        message: paymentData?.message || '',
        paymentMethods: paymentData?.paymentMethods || []
      };
    } catch (error: any) {
      console.error('❌ [PAYMENT SERVICE] Failed to get payment methods:', error.message);
      return {
        message: error.message || 'Failed to load payment methods',
        paymentMethods: []
      };
    }
  }

  // Test with a dummy shipping method to verify the schema
  async testWithDummyShipping(): Promise<{
    success: boolean;
    count: number;
    message: string;
  }> {
    try {
      // Try with common Bagisto shipping method codes
      const dummyMethods = [
        "flatrate_flatrate",
        "free_free",
        "standard_standard",
        "express_express"
      ];
      
      for (const dummyMethod of dummyMethods) {
        try {
          console.log(`🧪 Testing with dummy shipping method: ${dummyMethod}`);
          
          const query = `
            query TestPaymentMethods {
              paymentMethods(input: { shippingMethod: "${dummyMethod}" }) {
                message
                paymentMethods {
                  method
                  methodTitle
                }
              }
            }
          `;
          
          const result = await bagistoService.executeQuery<{ paymentMethods: any }>(query);
          
          if (result?.paymentMethods?.paymentMethods?.length > 0) {
            return {
              success: true,
              count: result?.paymentMethods?.paymentMethods?.length || 0,
              message: `Works with shipping method: ${dummyMethod}`
            };
          }
        } catch (error: any) {
          console.log(`❌ Failed with ${dummyMethod}:`, error.message);
        }
      }
      
      return {
        success: false,
        count: 0,
        message: "No dummy shipping method worked"
      };
    } catch (error: any) {
      return {
        success: false,
        count: 0,
        message: error.message
      };
    }
  }
}

export const paymentService = new PaymentService();