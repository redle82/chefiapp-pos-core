/**
 * Pix Payment Provider
 *
 * Provider para pagamentos via Pix (Brasil).
 * Usa SumUp como gateway. Suporta reembolsos instantâneos.
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
 * Maps Pix/SumUp checkout statuses to internal status values.
 *
 * Pix statuses (via SumUp): PENDING, PAID, EXPIRED, FAILED.
 */
type InternalPaymentStatus = PaymentStatusResult["status"];

function mapPixStatus(pixStatus: string): InternalPaymentStatus {
  switch (pixStatus) {
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

export class PixPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "pix";
  readonly name = "Pix (SumUp)";
  readonly supportedRegions: PaymentRegion[] = ["BR"];
  readonly supportedCurrencies: Currency[] = ["BRL"];

  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
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
      Logger.error("[PixProvider] createPayment failed", { error });
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
        await PaymentBroker.getPixCheckoutStatus(checkoutId);

      const rawStatus = checkoutResult.status;
      const result: PaymentStatusResult = {
        success: true,
        status: mapPixStatus(rawStatus),
        paymentId: checkoutResult.checkout_id,
        amount: checkoutResult.amount,
        currency: checkoutResult.currency as Currency,
        raw: { pixStatus: rawStatus, ...checkoutResult.raw },
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
      Logger.error("[PixProvider] getPaymentStatus failed", {
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
      const res = await client.rpc("pix-payment", {
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
      Logger.error("[PixProvider] cancelPayment failed", {
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

      const res = await client.rpc("pix-payment", rpcParams);

      if (res.error) {
        Logger.error("[PixProvider] refundPayment RPC error", {
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
        Logger.error("[PixProvider] Pix refund error", {
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
          error: "Core não retornou id do reembolso Pix",
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
          ? `Partial refund of ${amount} cents via Pix`
          : "Full refund via Pix",
        timestamp: new Date().toISOString(),
        metadata: {
          refundId,
          refundStatus: data?.status,
          refundAmount: data?.amount ?? amount,
          provider: "pix",
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

      Logger.error("[PixProvider] refundPayment failed", {
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

export const pixProvider = new PixPaymentProvider();
