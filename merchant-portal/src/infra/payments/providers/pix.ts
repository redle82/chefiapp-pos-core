/**
 * Pix Payment Provider
 *
 * Provider para pagamentos via Pix (Brasil).
 * Usa SumUp como gateway.
 */

import type { Currency, PaymentMethod, PaymentRegion } from "@domain/payment";
import { PaymentBroker } from "../../../core/payment/PaymentBroker";
import type {
  CancelPaymentResult,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundPaymentResult,
} from "../interface";

export class PixPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "pix";
  readonly name = "Pix (SumUp)";
  readonly supportedRegions: PaymentRegion[] = ["BR"];
  readonly supportedCurrencies: Currency[] = ["BRL"];

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    try {
      const result = await PaymentBroker.createPixCheckout({
        orderId: params.orderId,
        amount: params.amount,
        restaurantId: params.restaurantId,
        description: params.description,
      });

      const qrCodeUrl =
        result.raw?.transactions?.[0]?.qr_code_url ||
        `https://api.sumup.com/qr/${result.checkout_id}`;

      return {
        success: true,
        paymentId: result.checkout_reference,
        checkoutId: result.checkout_id,
        qrCodeUrl,
      };
    } catch (error) {
      return {
        success: false,
        paymentId: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async getPaymentStatus(checkoutId: string): Promise<PaymentStatusResult> {
    try {
      const result = await PaymentBroker.getPixCheckoutStatus(checkoutId);

      const statusMap: Record<string, PaymentStatusResult["status"]> = {
        PENDING: "pending",
        PAID: "completed",
        EXPIRED: "expired",
        FAILED: "failed",
      };

      return {
        success: true,
        status: statusMap[result.status] || "pending",
        paymentId: result.checkout_id,
        amount: result.amount,
        currency: result.currency as Currency,
        raw: result.raw,
      };
    } catch (error) {
      return {
        success: false,
        status: "failed",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
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
      error: "Refund via Pix não implementado",
    };
  }

  isAvailable(): boolean {
    return true;
  }
}

export const pixProvider = new PixPaymentProvider();
