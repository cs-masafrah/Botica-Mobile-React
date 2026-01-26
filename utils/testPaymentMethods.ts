// utils/testPaymentMethods.ts
import { paymentService } from '@/services/PaymentService';

export async function testPaymentMethodsConnection() {
  console.log("🧪 Testing payment methods connection...");
  
  try {
    const result = await paymentService.testPaymentMethods();
    
    console.log("🧪 Test result:", result);
    
    if (result.success) {
      console.log(`✅ Success with method: ${result.method}, found ${result.count} payment methods`);
    } else {
      console.log("❌ All approaches failed");
    }
    
    return result;
  } catch (error) {
    console.error("🧪 Test failed:", error);
    return { success: false, method: 'error', count: 0 };
  }
}