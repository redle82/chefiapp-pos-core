/**
 * SumUp Payment Provider
 *
 * Provider para pagamentos via SumUp (Europa - EUR).
 * Suporta cartão via checkout web.
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

export class SumUpPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "sumup_eur";
  readonly name = "SumUp (EUR)";
  readonly supportedRegions: PaymentRegion[] = ["PT", "ES", "EU"];
  readonly supportedCurrencies: Currency[] = ["EUR"];

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    try {
      const result = await PaymentBroker.createSumUpCheckout({
        orderId: params.orderId,
        restaurantId: params.restaurantId,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        returnUrl: params.returnUrl,
      });

      if (!result.success || !result.checkout) {
        return {
          success: false,
          paymentId: null,
          error: "Falha ao criar checkout SumUp",
        };
      }

      return {
        success: true,
        paymentId: result.paymentId || null,
        checkoutId: result.checkout.id,
        checkoutUrl: result.checkout.url,
        expiresAt: result.checkout.expiresAt,
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
      const result = await PaymentBroker.getSumUpCheckoutStatus(checkoutId);

      if (!result.success) {
        return {
          success: false,
          status: "failed",
          error: "Falha ao consultar status",
        };
      }

      const statusMap: Record<string, PaymentStatusResult["status"]> = {
        PENDING: "pending",
        PAID: "completed",
        EXPIRED: "expired",
        FAILED: "failed",
      };

      return {
        success: true,
        status: statusMap[result.checkout.status] || "pending",
        paymentId: result.checkout.id,
        amount: result.checkout.amount,
        currency: result.checkout.currency as Currency,
        raw: result.checkout,
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
      error: "Refund via SumUp não implementado",
    };
  }

  isAvailable(): boolean {
    return true;
  }
}

export const sumupProvider = new SumUpPaymentProvider();
