/**
 * Stripe Payment Provider
 *
 * Provider para pagamentos via Stripe (cartão).
 * Usa o PaymentBroker existente para comunicação com o Core.
 */

import type { Currency, PaymentMethod, PaymentRegion } from "@domain/payment";
import { PaymentBroker } from "../../../core/payment/PaymentBroker";
import { logAuditEvent } from "../../../core/audit/AuditService";
import { Logger } from "../../../core/logger";
import type {
  CancelPaymentResult,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundPaymentResult,
} from "../interface";

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || null;

/**
 * Maps Stripe PaymentIntent statuses to internal status values.
 *
 * Stripe statuses: requires_payment_method, requires_confirmation,
 * requires_action, processing, requires_capture, canceled, succeeded.
 */
type InternalPaymentStatus = PaymentStatusResult["status"];

function mapStripeStatus(stripeStatus: string): InternalPaymentStatus {
  switch (stripeStatus) {
    case "succeeded":
      return "completed";
    case "processing":
      return "processing";
    case "canceled":
      return "failed";
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
    case "requires_capture":
      return "pending";
    default:
      return "pending";
  }
}

/** Simple in-memory cache for payment status to avoid excessive API calls. */
const statusCache = new Map<string, { result: PaymentStatusResult; expiresAt: number }>();
const STATUS_CACHE_TTL_MS = 5_000;

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

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    // Check cache first to avoid excessive API calls
    const cached = statusCache.get(paymentId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result;
    }

    try {
      const intentStatus =
        await PaymentBroker.getPaymentIntentStatus(paymentId);

      const result: PaymentStatusResult = {
        success: true,
        status: mapStripeStatus(intentStatus.status),
        paymentId,
        amount: intentStatus.amount,
        currency: intentStatus.currency?.toUpperCase() as Currency | undefined,
        raw: { stripeStatus: intentStatus.status },
      };

      // Cache the result; terminal statuses get a longer TTL
      const isTerminal =
        intentStatus.status === "succeeded" ||
        intentStatus.status === "canceled";
      const ttl = isTerminal ? STATUS_CACHE_TTL_MS * 12 : STATUS_CACHE_TTL_MS;
      statusCache.set(paymentId, {
        result,
        expiresAt: Date.now() + ttl,
      });

      return result;
    } catch (error) {
      Logger.error("[StripeProvider] getPaymentStatus failed", { paymentId, error });
      return {
        success: false,
        status: "pending",
        paymentId,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async cancelPayment(paymentId: string): Promise<CancelPaymentResult> {
    try {
      // Canceling a PaymentIntent is done via the same RPC pattern.
      // For Stripe, canceling a PI before confirmation is equivalent to
      // abandoning it — the Core RPC handles calling paymentIntents.cancel.
      const core = await import("../../../core/infra/dockerCoreFetchClient");
      const client = core.getDockerCoreFetchClient();
      const res = await client.rpc("stripe-payment", {
        action: "cancel-payment-intent",
        payment_intent_id: paymentId,
      });

      if (res.error) {
        return {
          success: false,
          error: res.error.message,
        };
      }

      const data = res.data as { error?: string } | null;
      if (data?.error) {
        return { success: false, error: data.error };
      }

      // Invalidate status cache
      statusCache.delete(paymentId);

      return { success: true };
    } catch (error) {
      Logger.error("[StripeProvider] cancelPayment failed", { paymentId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
  ): Promise<RefundPaymentResult> {
    try {
      const result = await PaymentBroker.createRefund({
        paymentIntentId: paymentId,
        amount,
      });

      // Invalidate status cache after refund
      statusCache.delete(paymentId);

      // Log refund in the audit trail (non-blocking)
      logAuditEvent({
        action: "PAYMENT_REFUNDED",
        orderId: paymentId,
        operatorId: "system",
        operatorName: "System",
        reason: amount
          ? `Partial refund of ${amount} cents`
          : "Full refund",
        timestamp: new Date().toISOString(),
        metadata: {
          refundId: result.refundId,
          refundStatus: result.status,
          refundAmount: result.amount,
          provider: "stripe",
          isPartial: amount !== undefined,
        },
      }).catch(() => {
        // Non-blocking: audit failure should not break the refund flow
      });

      return {
        success: true,
        refundId: result.refundId,
        amount: result.amount,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      Logger.error("[StripeProvider] refundPayment failed", {
        paymentId,
        amount,
        error: message,
      });

      return {
        success: false,
        error: message,
      };
    }
  }

  isAvailable(): boolean {
    return !!STRIPE_KEY;
  }
}

export const stripeProvider = new StripePaymentProvider();
