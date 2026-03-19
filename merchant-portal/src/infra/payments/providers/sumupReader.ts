/**
 * SumUp Card Reader Provider
 *
 * Provider para pagamentos presenciais via leitor SumUp.
 * Alternativa ao Stripe Terminal para mercados europeus (EUR).
 *
 * Fluxo:
 * 1. Cria checkout via Core RPC (PaymentBroker)
 * 2. Abre o fluxo de pagamento SumUp (widget/redirect)
 * 3. Poll do status até conclusão ou expiração
 */

import type { Currency, PaymentMethod, PaymentRegion } from "@domain/payment";
import { Logger } from "../../../core/logger";
import { PaymentBroker } from "../../../core/payment/PaymentBroker";
import type {
  CancelPaymentResult,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundPaymentResult,
} from "../interface";

// ─── SumUp Checkout Types ───────────────────────────────────────────

interface SumUpCheckout {
  id: string;
  url: string;
  status: string;
  amount: number;
  currency: string;
  expiresAt: string;
  reference: string;
}

// ─── Constants ──────────────────────────────────────────────────────

/** Poll interval for checkout status (ms) */
const POLL_INTERVAL_MS = 2000;

/** Maximum number of poll attempts before timeout */
const MAX_POLL_ATTEMPTS = 90; // 3 minutes at 2s intervals

// ─── Provider ───────────────────────────────────────────────────────

export class SumUpReaderProvider implements PaymentProvider {
  readonly id: PaymentMethod = "sumup_reader" as PaymentMethod;
  readonly name = "SumUp (Leitor)";
  readonly supportedRegions: PaymentRegion[] = ["PT", "ES", "EU"];
  readonly supportedCurrencies: Currency[] = ["EUR"];

  private activeCheckoutId: string | null = null;
  private pollAbortController: AbortController | null = null;

  /**
   * Create a checkout and initiate payment via SumUp reader.
   *
   * Uses the existing PaymentBroker.createSumUpCheckout which
   * communicates with the Core/Gateway to create a SumUp checkout.
   */
  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    try {
      const checkout = await this.createCheckout(
        params.amount,
        params.currency,
        `${params.orderId.slice(-8)}`,
        params.orderId,
        params.restaurantId,
        params.description,
        params.returnUrl,
      );

      this.activeCheckoutId = checkout.id;

      return {
        success: true,
        paymentId: checkout.id,
        checkoutId: checkout.id,
        checkoutUrl: checkout.url,
        expiresAt: checkout.expiresAt,
      };
    } catch (error) {
      Logger.error("[SumUpReader] createPayment error:", error);
      return {
        success: false,
        paymentId: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Poll checkout status from SumUp via Core/Gateway.
   *
   * Maps SumUp statuses to the standard PaymentStatusResult.
   */
  async getPaymentStatus(checkoutId: string): Promise<PaymentStatusResult> {
    try {
      const result = await PaymentBroker.getSumUpCheckoutStatus(checkoutId);

      if (!result.success) {
        return {
          success: false,
          status: "failed",
          error: "Falha ao consultar status do checkout",
        };
      }

      const statusMap: Record<string, PaymentStatusResult["status"]> = {
        PENDING: "pending",
        PROCESSING: "processing",
        PAID: "completed",
        EXPIRED: "expired",
        FAILED: "failed",
      };

      return {
        success: true,
        status: statusMap[result.checkout.status] ?? "pending",
        paymentId: result.checkout.id,
        amount: result.checkout.amount,
        currency: result.checkout.currency as Currency,
        raw: result.checkout,
      };
    } catch (error) {
      Logger.error("[SumUpReader] getPaymentStatus error:", error);
      return {
        success: false,
        status: "failed",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Poll for payment completion.
   * Resolves when payment succeeds, fails, or expires.
   *
   * @param checkoutId - SumUp checkout ID
   * @param onStatusChange - Callback for status updates
   * @returns Final payment status
   */
  async pollUntilComplete(
    checkoutId: string,
    onStatusChange?: (status: PaymentStatusResult) => void,
  ): Promise<PaymentStatusResult> {
    this.pollAbortController = new AbortController();
    const signal = this.pollAbortController.signal;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (signal.aborted) {
        return {
          success: false,
          status: "failed",
          error: "Polling cancelado",
        };
      }

      const status = await this.getPaymentStatus(checkoutId);
      onStatusChange?.(status);

      if (
        status.status === "completed" ||
        status.status === "failed" ||
        status.status === "expired"
      ) {
        this.activeCheckoutId = null;
        return status;
      }

      // Wait before next poll
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, POLL_INTERVAL_MS);
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timeout);
            reject(new Error("Polling aborted"));
          },
          { once: true },
        );
      }).catch(() => {
        // Aborted — will be handled by signal check at loop start
      });
    }

    return {
      success: false,
      status: "expired",
      error: "Timeout: pagamento não completado no tempo esperado",
    };
  }

  async cancelPayment(_paymentId: string): Promise<CancelPaymentResult> {
    // Abort any active polling
    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = null;
    }

    this.activeCheckoutId = null;

    return { success: true };
  }

  async refundPayment(
    _paymentId: string,
    _amount?: number,
  ): Promise<RefundPaymentResult> {
    return {
      success: false,
      error: "Reembolso via SumUp Reader não implementado. Use o painel SumUp.",
    };
  }

  isAvailable(): boolean {
    // SumUp reader is available when the SumUp integration is configured
    return true;
  }

  /** Whether there is an active checkout in progress */
  hasActiveCheckout(): boolean {
    return this.activeCheckoutId !== null;
  }

  // ─── Private ──────────────────────────────────────────────────────

  /**
   * Create a SumUp checkout via PaymentBroker.
   */
  private async createCheckout(
    amount: number,
    currency: string,
    reference: string,
    orderId: string,
    restaurantId: string,
    description?: string,
    returnUrl?: string,
  ): Promise<SumUpCheckout> {
    const result = await PaymentBroker.createSumUpCheckout({
      orderId,
      restaurantId,
      amount,
      currency,
      description: description ?? `Pedido ${reference}`,
      returnUrl,
    });

    if (!result.success || !result.checkout) {
      throw new Error("Falha ao criar checkout SumUp para leitor");
    }

    return {
      id: result.checkout.id,
      url: result.checkout.url,
      status: result.checkout.status,
      amount: result.checkout.amount,
      currency: result.checkout.currency,
      expiresAt: result.checkout.expiresAt,
      reference: result.checkout.reference,
    };
  }
}

export const sumupReaderProvider = new SumUpReaderProvider();
