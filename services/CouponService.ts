// services/CouponService.ts
import { bagistoService } from './bagisto';

export interface CartAfterCoupon {
  id: string;
  couponCode: string;
  itemsCount: number;
  itemsQty: number;
  cartCurrencyCode: string;
  subTotal: number;
  discountAmount: number;
  taxTotal: number;
  shippingAmount: number;
  grandTotal: number;
  updatedAt: string;
}

class CouponService {
  // Apply coupon code
  async applyCoupon(code: string): Promise<{
    success: boolean;
    message: string;
    cart: CartAfterCoupon | null;
  }> {
    try {
      const query = `
        mutation applyCoupon($input: ApplyCouponInput!) {
          applyCoupon(input: $input) {
            success
            message
            cart {
              id
              couponCode
              itemsCount
              itemsQty
              cartCurrencyCode
              subTotal
              discountAmount
              taxTotal
              shippingAmount
              grandTotal
              updatedAt
            }
          }
        }
      `;

      const variables = {
        input: { code }
      };

      const result = await bagistoService.executeQuery(query, variables) as { applyCoupon: any };
      const couponResult = result?.applyCoupon;
      
      if (!couponResult) {
        return {
          success: false,
          message: 'Failed to apply coupon',
          cart: null
        };
      }

      return {
        success: couponResult.success,
        message: couponResult.message,
        cart: couponResult.cart
      };
    } catch (error: any) {
      console.error('❌ [COUPON SERVICE] Failed to apply coupon:', error);
      return {
        success: false,
        message: error.message || 'Failed to apply coupon',
        cart: null
      };
    }
  }

  // Remove coupon
  async removeCoupon(): Promise<{
    success: boolean;
    message: string;
    cart: CartAfterCoupon | null;
  }> {
    try {
      const query = `
        mutation removeCoupon {
          removeCoupon {
            success
            message
            cart {
              id
              couponCode
              itemsCount
              itemsQty
              cartCurrencyCode
              subTotal
              discountAmount
              taxTotal
              shippingAmount
              grandTotal
              updatedAt
            }
          }
        }
      `;

      const result = await bagistoService.executeQuery(query) as { removeCoupon: any };
      const couponResult = result?.removeCoupon;
      
      if (!couponResult) {
        return {
          success: false,
          message: 'Failed to remove coupon',
          cart: null
        };
      }

      return {
        success: couponResult.success,
        message: couponResult.message,
        cart: couponResult.cart
      };
    } catch (error: any) {
      console.error('❌ [COUPON SERVICE] Failed to remove coupon:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove coupon',
        cart: null
      };
    }
  }
}

export const couponService = new CouponService();