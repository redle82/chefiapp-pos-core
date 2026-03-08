/**
 * Stripe Payment Provider
 *
 * Provider para pagamentos via Stripe (cartão).
 * Usa o PaymentBroker existente para comunicação com o Core.
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

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || null;

export class StripePaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "card";
  readonly name = "Stripe";
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
    try {
      const result = await PaymentBroker.createPaymentIntent({
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        restaurantId: params.restaurantId,
        operatorId: params.operatorId,
        cashRegisterId: params.cashRegisterId,
      });

      return {
        success: true,
        paymentId: result.id,
        clientSecret: result.clientSecret,
      };
    } catch (error) {
      return {
        success: false,
        paymentId: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async getPaymentStatus(_paymentId: string): Promise<PaymentStatusResult> {
    return {
      success: true,
      status: "pending",
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
      error: "Refund via Stripe não implementado",
    };
  }

  isAvailable(): boolean {
    return !!STRIPE_KEY;
  }
}

export const stripeProvider = new StripePaymentProvider();
