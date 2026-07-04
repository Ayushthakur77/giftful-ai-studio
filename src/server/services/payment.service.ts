/**
 * Vendor-agnostic payment provider interface. Razorpay impl in 4b.
 */
export interface PaymentOrder {
  id: string;
  amountPaise: number;
  currency: string;
  receipt?: string;
}

export interface PaymentService {
  createOrder(input: { amountPaise: number; currency?: string; receipt?: string; notes?: Record<string, string> }): Promise<PaymentOrder>;
  verifyClientPayment(input: { orderId: string; paymentId: string; signature: string }): Promise<boolean>;
  verifyWebhookSignature(input: { rawBody: string; signature: string }): Promise<boolean>;
  fetchPayment(paymentId: string): Promise<{ status: "authorized" | "captured" | "failed"; amountPaise: number }>;
  refund(paymentId: string, amountPaise: number): Promise<{ refundId: string }>;
}

export const paymentService: PaymentService = {
  async createOrder() {
    throw new Error("PaymentService is not yet configured. Set RAZORPAY_* env vars.");
  },
  async verifyClientPayment() {
    throw new Error("PaymentService is not yet configured. Set RAZORPAY_* env vars.");
  },
  async verifyWebhookSignature() {
    throw new Error("PaymentService is not yet configured. Set RAZORPAY_* env vars.");
  },
  async fetchPayment() {
    throw new Error("PaymentService is not yet configured. Set RAZORPAY_* env vars.");
  },
  async refund() {
    throw new Error("PaymentService is not yet configured. Set RAZORPAY_* env vars.");
  },
};
