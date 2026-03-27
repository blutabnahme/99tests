export interface PaymentProvider {
  createCheckout(amount: number, currency: string, metadata: any): Promise<string>;
  capturePayment(paymentId: string): Promise<boolean>;
  refundPayment(paymentId: string, amount: number): Promise<boolean>;
  getPaymentStatus(paymentId: string): Promise<string>;
}

export class MockPaymentProvider implements PaymentProvider {
  async createCheckout(amount: number, currency: string, metadata: any): Promise<string> {
    console.log(`[MOCK PAYMENT] createCheckout: €${amount.toFixed(2)} (${currency})`);
    console.log(`[MOCK PAYMENT] metadata:`, metadata);
    // Return a fake session URL/ID that will immediately redirect to our success route.
    return `mock_chk_${Math.random().toString(36).substring(7)}`;
  }

  async capturePayment(paymentId: string): Promise<boolean> {
    console.log(`[MOCK PAYMENT] capturePayment: ${paymentId}`);
    return true;
  }

  async refundPayment(paymentId: string, amount: number): Promise<boolean> {
    console.log(`[MOCK PAYMENT] refundPayment: ${paymentId} for €${amount.toFixed(2)}`);
    return true;
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    console.log(`[MOCK PAYMENT] getPaymentStatus: ${paymentId}`);
    return 'succeeded';
  }
}

// Factory or default instance
export const paymentProvider: PaymentProvider = new MockPaymentProvider();
