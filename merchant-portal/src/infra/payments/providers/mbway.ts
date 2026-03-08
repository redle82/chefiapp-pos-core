/**
 * MB Way Payment Provider
 *
 * Provider para pagamentos via MB Way (Portugal).
 * Usa backend como gateway.
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

export class MBWayPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "mbway";
  readonly name = "MB Way";
  readonly supportedRegions: PaymentRegion[] = ["PT"];
  readonly supportedCurrencies: Currency[] = ["EUR"];

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const paymentId = `mbway_${params.orderId}_${Date.now()}`;

    return {
      success: true,
      paymentId,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    return {
      success: true,
      status: "pending",
      paymentId,
    };
  }

  async cancelPayment(_paymentId: string): Promise<CancelPaymentResult> {
    return { success: true };
  }

  async refundPayment(
    _paymentId: string,
    _amount?: number,
  ): Promise<RefundPaymentResult> {
    return {
      success: false,
      error: "Refund via MB Way não implementado",
    };
  }

  isAvailable(): boolean {
    return true;
  }
}

export const mbwayProvider = new MBWayPaymentProvider();
