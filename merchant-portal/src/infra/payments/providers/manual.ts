/**
 * Manual Payment Provider
 *
 * Provider para pagamentos manuais (dinheiro, transferência, etc.)
 * Não requer integração externa.
 */

import type { Currency, PaymentMethod, PaymentRegion } from "@domain/payment";
import type {
  CancelPaymentResult,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundPaymentResult,
} from "../interface";

export class ManualPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "cash";
  readonly name = "Manual/Cash";
  readonly supportedRegions: PaymentRegion[] = [
    "BR",
    "PT",
    "ES",
    "EU",
    "US",
    "GB",
    "MX",
    "CA",
    "AU",
    "DEFAULT",
  ];
  readonly supportedCurrencies: Currency[] = [
    "BRL",
    "EUR",
    "USD",
    "GBP",
    "MXN",
    "CAD",
    "AUD",
  ];

  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    const paymentId = `manual_${params.orderId}_${Date.now()}`;

    return {
      success: true,
      paymentId,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    return {
      success: true,
      status: "completed",
      paymentId,
    };
  }

  async cancelPayment(_paymentId: string): Promise<CancelPaymentResult> {
    return { success: true };
  }

  async refundPayment(
    _paymentId: string,
    amount?: number,
  ): Promise<RefundPaymentResult> {
    return {
      success: true,
      refundId: `refund_manual_${Date.now()}`,
      amount,
    };
  }

  isAvailable(): boolean {
    return true;
  }
}

export const manualProvider = new ManualPaymentProvider();
