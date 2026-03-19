/**
 * SumUp Payment Provider
 *
 * Provider para pagamentos via SumUp (Europa - EUR).
 * Suporta cartão via checkout web e card reader via Core RPC.
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

/**
 * Maps SumUp checkout statuses to internal status values.
 *
 * SumUp statuses: PENDING, PAID, EXPIRED, FAILED.
 */
type InternalPaymentStatus = PaymentStatusResult["status"];

function mapSumUpStatus(sumupStatus: string): InternalPaymentStatus {
  switch (sumupStatus) {
    case "PAID":
      return "completed";
    case "PENDING":
      return "pending";
    case "EXPIRED":
      return "expired";
    case "FAILED":
    case "CANCELLED":
      return "failed";
    default:
      return "pending";
  }
}

/** Terminal statuses that will not change. */
function isTerminalStatus(status: string): boolean {
  return ["PAID", "EXPIRED", "FAILED", "CANCELLED"].includes(status);
}

/** Simple in-memory cache for payment status to avoid excessive API calls. */
const statusCache = new Map<
  string,
  { result: PaymentStatusResult; expiresAt: number }
>();
const STATUS_CACHE_TTL_MS = 5_000;
const STATUS_CACHE_TERMINAL_TTL_MS = 60_000;

export class SumUpPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "sumup_eur";
  readonly name = "SumUp (EUR)";
  readonly supportedRegions: PaymentRegion[] = ["PT", "ES", "EU"];
  readonly supportedCurrencies: Currency[] = ["EUR"];

  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
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
      Logger.error("[SumUpProvider] createPayment failed", { error });
      return {
        success: false,
        paymentId: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async getPaymentStatus(checkoutId: string): Promise<PaymentStatusResult> {
    // Check cache first to avoid excessive API calls
    const cached = statusCache.get(checkoutId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result;
    }

    try {
      const checkoutResult =
        await PaymentBroker.getSumUpCheckoutStatus(checkoutId);

      if (!checkoutResult.success) {
        return {
          success: false,
          status: "failed",
          paymentId: checkoutId,
          error: "Falha ao consultar status",
        };
      }

      const rawStatus = checkoutResult.checkout.status;
      const result: PaymentStatusResult = {
        success: true,
        status: mapSumUpStatus(rawStatus),
        paymentId: checkoutResult.checkout.id,
        amount: checkoutResult.checkout.amount,
        currency: checkoutResult.checkout.currency as Currency,
        raw: { sumupStatus: rawStatus, checkout: checkoutResult.checkout },
      };

      // Cache the result; terminal statuses get a longer TTL
      const ttl = isTerminalStatus(rawStatus)
        ? STATUS_CACHE_TERMINAL_TTL_MS
        : STATUS_CACHE_TTL_MS;
      statusCache.set(checkoutId, {
        result,
        expiresAt: Date.now() + ttl,
      });

      return result;
    } catch (error) {
      Logger.error("[SumUpProvider] getPaymentStatus failed", {
        checkoutId,
        error,
      });
      return {
        success: false,
        status: "failed",
        paymentId: checkoutId,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async cancelPayment(checkoutId: string): Promise<CancelPaymentResult> {
    try {
      const core = await import("../../../core/infra/dockerCoreFetchClient");
      const client = core.getDockerCoreFetchClient();
      const res = await client.rpc("sumup-payment", {
        action: "cancel-checkout",
        checkout_id: checkoutId,
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
      statusCache.delete(checkoutId);

      return { success: true };
    } catch (error) {
      Logger.error("[SumUpProvider] cancelPayment failed", {
        checkoutId,
        error,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async refundPayment(
    checkoutId: string,
    amount?: number,
  ): Promise<RefundPaymentResult> {
    try {
      const core = await import("../../../core/infra/dockerCoreFetchClient");
      const client = core.getDockerCoreFetchClient();

      const rpcParams: Record<string, unknown> = {
        action: "create-refund",
        checkout_id: checkoutId,
      };
      if (amount !== undefined) {
        rpcParams.amount = amount;
      }

      const res = await client.rpc("sumup-payment", rpcParams);

      if (res.error) {
        Logger.error("[SumUpProvider] refundPayment RPC error", {
          checkoutId,
          error: res.error,
        });
        return {
          success: false,
          error: res.error.message,
        };
      }

      const data = res.data as {
        id?: string;
        refund_id?: string;
        status?: string;
        amount?: number;
        error?: string;
      } | null;

      if (data?.error) {
        Logger.error("[SumUpProvider] SumUp refund error", {
          checkoutId,
          error: data.error,
        });
        return {
          success: false,
          error: data.error,
        };
      }

      const refundId = data?.id || data?.refund_id;
      if (!refundId) {
        return {
          success: false,
          error: "Core não retornou id do reembolso SumUp",
        };
      }

      // Invalidate status cache after refund
      statusCache.delete(checkoutId);

      // Log refund in the audit trail (non-blocking)
      logAuditEvent({
        action: "PAYMENT_REFUNDED",
        orderId: checkoutId,
        operatorId: "system",
        operatorName: "System",
        reason: amount
          ? `Partial refund of ${amount} cents via SumUp`
          : "Full refund via SumUp",
        timestamp: new Date().toISOString(),
        metadata: {
          refundId,
          refundStatus: data?.status,
          refundAmount: data?.amount ?? amount,
          provider: "sumup",
          isPartial: amount !== undefined,
        },
      }).catch(() => {
        // Non-blocking: audit failure should not break the refund flow
      });

      return {
        success: true,
        refundId,
        amount: data?.amount ?? amount,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      Logger.error("[SumUpProvider] refundPayment failed", {
        checkoutId,
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
    return true;
  }
}

export const sumupProvider = new SumUpPaymentProvider();
