/**
 * MB Way Payment Provider
 *
 * Provider para pagamentos via MB Way (Portugal).
 * Usa Docker Core RPC `mbway-payment` para comunicação com SIBS.
 */

import type { Currency, PaymentMethod, PaymentRegion } from "@domain/payment";
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
 * Maps MB Way statuses to internal status values.
 *
 * MB Way statuses: PENDING, COMPLETED, EXPIRED, DECLINED, CANCELLED.
 */
type InternalPaymentStatus = PaymentStatusResult["status"];

function mapMBWayStatus(mbwayStatus: string): InternalPaymentStatus {
  switch (mbwayStatus) {
    case "COMPLETED":
      return "completed";
    case "PENDING":
    case "PROCESSING":
      return "pending";
    case "EXPIRED":
      return "expired";
    case "DECLINED":
    case "CANCELLED":
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

/** Terminal statuses that will not change. */
function isTerminalStatus(status: string): boolean {
  return ["COMPLETED", "EXPIRED", "DECLINED", "CANCELLED", "FAILED"].includes(
    status,
  );
}

/** Simple in-memory cache for payment status to avoid excessive API calls. */
const statusCache = new Map<
  string,
  { result: PaymentStatusResult; expiresAt: number }
>();
const STATUS_CACHE_TTL_MS = 5_000;
const STATUS_CACHE_TERMINAL_TTL_MS = 60_000;

export class MBWayPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "mbway";
  readonly name = "MB Way";
  readonly supportedRegions: PaymentRegion[] = ["PT"];
  readonly supportedCurrencies: Currency[] = ["EUR"];

  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    try {
      const core = await import("../../../core/infra/dockerCoreFetchClient");
      const client = core.getDockerCoreFetchClient();
      const res = await client.rpc("mbway-payment", {
        action: "create-payment",
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        restaurant_id: params.restaurantId,
        order_id: params.orderId,
        operator_id: params.operatorId,
        cash_register_id: params.cashRegisterId,
      });

      if (res.error) {
        Logger.error("[MBWayProvider] Core RPC Error:", { error: res.error });
        return {
          success: false,
          paymentId: null,
          error: res.error.message,
        };
      }

      const data = res.data as {
        id?: string;
        reference?: string;
        status?: string;
        error?: string;
      } | null;

      if (data?.error) {
        Logger.error("[MBWayProvider] MB Way Error:", { error: data.error });
        return {
          success: false,
          paymentId: null,
          error: data.error,
        };
      }

      const paymentId = data?.id || data?.reference;
      if (!paymentId) {
        return {
          success: false,
          paymentId: null,
          error: "Core não retornou id de pagamento MB Way",
        };
      }

      return {
        success: true,
        paymentId,
      };
    } catch (error) {
      Logger.error("[MBWayProvider] createPayment failed", { error });
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
      const core = await import("../../../core/infra/dockerCoreFetchClient");
      const client = core.getDockerCoreFetchClient();
      const res = await client.rpc("mbway-payment", {
        action: "get-payment-status",
        payment_id: paymentId,
      });

      if (res.error) {
        Logger.error("[MBWayProvider] getPaymentStatus RPC error", {
          paymentId,
          error: res.error,
        });
        return {
          success: false,
          status: "pending",
          paymentId,
          error: res.error.message,
        };
      }

      const data = res.data as {
        status?: string;
        amount?: number;
        currency?: string;
        error?: string;
      } | null;

      if (data?.error) {
        Logger.error("[MBWayProvider] MB Way status error", {
          paymentId,
          error: data.error,
        });
        return {
          success: false,
          status: "pending",
          paymentId,
          error: data.error,
        };
      }

      const rawStatus = data?.status || "PENDING";
      const result: PaymentStatusResult = {
        success: true,
        status: mapMBWayStatus(rawStatus),
        paymentId,
        amount: data?.amount,
        currency: data?.currency?.toUpperCase() as Currency | undefined,
        raw: { mbwayStatus: rawStatus },
      };

      // Cache the result; terminal statuses get a longer TTL
      const ttl = isTerminalStatus(rawStatus)
        ? STATUS_CACHE_TERMINAL_TTL_MS
        : STATUS_CACHE_TTL_MS;
      statusCache.set(paymentId, {
        result,
        expiresAt: Date.now() + ttl,
      });

      return result;
    } catch (error) {
      Logger.error("[MBWayProvider] getPaymentStatus failed", {
        paymentId,
        error,
      });
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
      const core = await import("../../../core/infra/dockerCoreFetchClient");
      const client = core.getDockerCoreFetchClient();
      const res = await client.rpc("mbway-payment", {
        action: "cancel-payment",
        payment_id: paymentId,
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
      Logger.error("[MBWayProvider] cancelPayment failed", {
        paymentId,
        error,
      });
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
      const core = await import("../../../core/infra/dockerCoreFetchClient");
      const client = core.getDockerCoreFetchClient();

      const rpcParams: Record<string, unknown> = {
        action: "create-refund",
        payment_id: paymentId,
      };
      if (amount !== undefined) {
        rpcParams.amount = amount;
      }

      const res = await client.rpc("mbway-payment", rpcParams);

      if (res.error) {
        Logger.error("[MBWayProvider] refundPayment RPC error", {
          paymentId,
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
        Logger.error("[MBWayProvider] MB Way refund error", {
          paymentId,
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
          error: "Core não retornou id do reembolso MB Way",
        };
      }

      // Invalidate status cache after refund
      statusCache.delete(paymentId);

      // Log refund in the audit trail (non-blocking)
      logAuditEvent({
        action: "PAYMENT_REFUNDED",
        orderId: paymentId,
        operatorId: "system",
        operatorName: "System",
        reason: amount
          ? `Partial refund of ${amount} cents via MB Way`
          : "Full refund via MB Way",
        timestamp: new Date().toISOString(),
        metadata: {
          refundId,
          refundStatus: data?.status,
          refundAmount: data?.amount ?? amount,
          provider: "mbway",
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

      Logger.error("[MBWayProvider] refundPayment failed", {
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
    return true;
  }
}

export const mbwayProvider = new MBWayPaymentProvider();
