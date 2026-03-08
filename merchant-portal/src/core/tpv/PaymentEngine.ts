/**
 * Payment Engine - Sistema de Pagamentos Real
 *
 * Gerencia pagamentos de pedidos com métodos reais e persistência.
 */

import { logAuditEvent } from "../audit/logAuditEvent";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { getTableClient, invokeRpc } from "../infra/coreRpc";
import { Logger } from "../logger";
import type { PaymentMethod, PaymentStatus } from "./OrderEngine";

export interface PaymentInput {
  orderId: string;
  restaurantId: string;
  cashRegisterId: string; // [REQUIRED] Sovereign Validation
  amountCents: number;
  method: PaymentMethod;
  metadata?: Record<string, any>;
  idempotencyKey?: string; // Optional external key
}

export interface Payment {
  id: string;
  tenantId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class PaymentEngine {
  // ... (JSDoc unchanged)
  static async processPayment(input: PaymentInput): Promise<Payment> {
    const startTime = Date.now();

    // Gerar idempotency key para prevenir replay attacks
    const idempotencyKey =
      input.idempotencyKey ||
      `${input.orderId}-${Date.now()}-${crypto.randomUUID()}`;

    // Usar função SQL transacional — Core quando Docker (FINANCIAL_CORE_VIOLATION_AUDIT)
    const { data, error } = await invokeRpc<{
      success?: boolean;
      payment_id?: string;
    }>("process_order_payment", {
      p_order_id: input.orderId,
      p_restaurant_id: input.restaurantId,
      p_cash_register_id: input.cashRegisterId,
      p_method: input.method,
      p_amount_cents: input.amountCents,
      p_operator_id: input.metadata?.operatorId || null,
      p_idempotency_key: idempotencyKey,
    });

    const durationMs = Date.now() - startTime;

    if (error) {
      // LOG FALHA (observabilidade)
      await this.logPaymentAttempt({
        orderId: input.orderId,
        restaurantId: input.restaurantId,
        operatorId: input.metadata?.operatorId,
        amountCents: input.amountCents,
        method: input.method,
        result: "fail",
        errorCode: error?.code || "UNKNOWN",
        errorMessage: error?.message,
        idempotencyKey,
        durationMs,
      });
      throw new Error(
        `Erro ao processar pagamento: ${error?.message || "Erro desconhecido"}`,
      );
    }

    if (!data || !data.success) {
      // LOG FALHA (observabilidade)
      await this.logPaymentAttempt({
        orderId: input.orderId,
        restaurantId: input.restaurantId,
        operatorId: input.metadata?.operatorId,
        amountCents: input.amountCents,
        method: input.method,
        result: "fail",
        errorCode: "TRANSACTION_FAILED",
        errorMessage: "Payment transaction returned no success",
        idempotencyKey,
        durationMs,
      });
      throw new Error(
        "Transação de pagamento falhou. Verifique os dados e tente novamente.",
      );
    }

    // LOG SUCESSO (observabilidade)
    await this.logPaymentAttempt({
      orderId: input.orderId,
      restaurantId: input.restaurantId,
      operatorId: input.metadata?.operatorId,
      amountCents: input.amountCents,
      method: input.method,
      result: "success",
      idempotencyKey,
      paymentId: data.payment_id,
      durationMs,
    });

    // Audit log (gm_audit_logs)
    await logAuditEvent({
      action: "payment_processed",
      resourceEntity: "gm_payments",
      resourceId: data.payment_id,
      metadata: {
        restaurant_id: input.restaurantId,
        order_id: input.orderId,
        amount_cents: input.amountCents,
        method: input.method,
        idempotency_key: idempotencyKey,
        duration_ms: durationMs,
      },
    });

    // [INVENTORY] Stock deduction happens via DB trigger on order CLOSED.

    // Buscar pagamento criado para retornar objeto completo (Core quando Docker — Fase 4)
    const paymentId = data?.payment_id;
    const client = await getTableClient();
    const { data: paymentData, error: fetchError } = await client
      .from("gm_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !paymentData) {
      throw new Error(
        `Erro ao buscar pagamento criado: ${
          (fetchError as Error)?.message || "Pagamento não encontrado"
        }`,
      );
    }

    const row = paymentData as Record<string, unknown>;
    return {
      id: row.id as string,
      tenantId: (row.tenant_id ?? row.restaurant_id) as string,
      orderId: row.order_id as string,
      amountCents: row.amount_cents as number,
      currency: row.currency as string,
      method: (row.payment_method ?? row.method) as PaymentMethod,
      status: row.status as PaymentStatus,
      createdAt: new Date(row.created_at as string),
      metadata: row.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * P1.1 FIX: Process split/partial payment atomically
   *
   * Uses process_split_payment_atomic RPC which:
   * - Locks the order row to prevent race conditions
   * - Validates remaining balance atomically
   * - Returns error if overpayment attempted
   *
   * @throws Error if payment exceeds remaining or order already paid
   */
  static async processSplitPayment(input: PaymentInput): Promise<{
    payment: Payment;
    remainingAfter: number;
    isFullyPaid: boolean;
  }> {
    const startTime = Date.now();
    const idempotencyKey =
      input.idempotencyKey ||
      `split-${input.orderId}-${Date.now()}-${crypto.randomUUID()}`;

    // Use atomic RPC — Core quando Docker (FINANCIAL_CORE_VIOLATION_AUDIT)
    const { data, error } = await invokeRpc<{
      success?: boolean;
      payment_id?: string;
      remaining_after?: number;
      is_fully_paid?: boolean;
    }>("process_split_payment_atomic", {
      p_order_id: input.orderId,
      p_restaurant_id: input.restaurantId,
      p_cash_register_id: input.cashRegisterId,
      p_method: input.method,
      p_amount_cents: input.amountCents,
      p_operator_id: input.metadata?.operatorId || null,
      p_idempotency_key: idempotencyKey,
    });

    const durationMs = Date.now() - startTime;

    if (error) {
      await this.logPaymentAttempt({
        orderId: input.orderId,
        restaurantId: input.restaurantId,
        operatorId: input.metadata?.operatorId,
        amountCents: input.amountCents,
        method: input.method,
        result: "fail",
        errorCode: error?.code || "UNKNOWN",
        errorMessage: error?.message,
        idempotencyKey,
        durationMs,
      });

      // Parse specific errors
      if (error?.message?.includes("OVERPAYMENT")) {
        throw new Error(
          "Valor excede o saldo restante. Atualize e tente novamente.",
        );
      }
      if (error?.message?.includes("ALREADY_PAID")) {
        throw new Error("Pedido já foi pago por outro operador.");
      }
      throw new Error(`Erro ao processar pagamento: ${error?.message}`);
    }

    if (!data?.success) {
      throw new Error("Transação de pagamento falhou.");
    }

    // Log success
    await this.logPaymentAttempt({
      orderId: input.orderId,
      restaurantId: input.restaurantId,
      operatorId: input.metadata?.operatorId,
      amountCents: input.amountCents,
      method: input.method,
      result: "success",
      idempotencyKey,
      paymentId: data.payment_id,
      durationMs,
    });

    // [INVENTORY] Stock deduction happens via DB trigger on order CLOSED.

    // Fetch the created payment (Core quando Docker — Fase 4)
    const paymentId = data.payment_id;
    const client = await getTableClient();
    const { data: paymentData, error: fetchError } = await client
      .from("gm_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !paymentData) {
      throw new Error("Pagamento processado mas não encontrado.");
    }

    const row = paymentData as Record<string, unknown>;
    return {
      payment: {
        id: row.id as string,
        tenantId: (row.tenant_id ?? row.restaurant_id) as string,
        orderId: row.order_id as string,
        amountCents: row.amount_cents as number,
        currency: row.currency as string,
        method: (row.payment_method ?? row.method) as PaymentMethod,
        status: row.status as PaymentStatus,
        createdAt: new Date(row.created_at as string),
        metadata: row.metadata as Record<string, unknown> | undefined,
      },
      remainingAfter: data.remaining_after ?? 0,
      isFullyPaid: data.is_fully_paid ?? false,
    };
  }

  /**
   * Buscar pagamentos de um pedido (Core quando Docker — Fase 4)
   */
  static async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const client = await getTableClient();
    const chain = (client as any)
      .from("gm_payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    const { data, error } = (await chain) as {
      data: Record<string, unknown>[] | null;
      error: unknown;
    };

    if (error)
      throw new Error(`Failed to fetch payments: ${(error as Error).message}`);

    return (data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      tenantId: (p.tenant_id ?? p.restaurant_id) as string,
      orderId: p.order_id as string,
      amountCents: p.amount_cents as number,
      currency: p.currency as string,
      method: (p.payment_method ?? p.method) as PaymentMethod,
      status: p.status as PaymentStatus,
      createdAt: new Date(p.created_at as string),
      metadata: p.metadata as Record<string, unknown> | undefined,
    }));
  }

  /**
   * Buscar pagamentos do dia (Core quando Docker — Fase 4)
   * Core usa restaurant_id.
   */
  static async getTodayPayments(restaurantId: string): Promise<Payment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const client = await getTableClient();
    const restaurantCol =
      getBackendType() === BackendType.docker ? "restaurant_id" : "tenant_id";
    const chain = (client as any)
      .from("gm_payments")
      .select("*")
      .eq(restaurantCol, restaurantId)
      .eq("status", "paid")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });
    const { data, error } = (await chain) as {
      data: Record<string, unknown>[] | null;
      error: unknown;
    };

    if (error)
      throw new Error(`Failed to fetch payments: ${(error as Error).message}`);

    return (data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      tenantId: (p.tenant_id ?? p.restaurant_id) as string,
      orderId: p.order_id as string,
      amountCents: p.amount_cents as number,
      currency: p.currency as string,
      method: (p.payment_method ?? p.method) as PaymentMethod,
      status: p.status as PaymentStatus,
      createdAt: new Date(p.created_at as string),
      metadata: p.metadata as Record<string, unknown> | undefined,
    }));
  }

  /**
   * OBSERVABILIDADE: Logar tentativa de pagamento (sucesso ou falha)
   *
   * Esta função é chamada em TODA tentativa de pagamento.
   * O log é append-only e imutável para auditoria.
   */
  private static async logPaymentAttempt(input: {
    orderId: string;
    restaurantId: string;
    operatorId?: string;
    amountCents: number;
    method: PaymentMethod;
    result: "success" | "fail" | "timeout" | "cancelled";
    errorCode?: string;
    errorMessage?: string;
    idempotencyKey?: string;
    paymentId?: string;
    durationMs?: number;
  }): Promise<void> {
    try {
      await invokeRpc("fn_log_payment_attempt", {
        p_order_id: input.orderId,
        p_restaurant_id: input.restaurantId,
        p_operator_id: input.operatorId || null,
        p_amount_cents: input.amountCents,
        p_method: input.method,
        p_result: input.result,
        p_error_code: input.errorCode || null,
        p_error_message: input.errorMessage || null,
        p_idempotency_key: input.idempotencyKey || null,
        p_payment_id: input.paymentId || null,
        p_duration_ms: input.durationMs || null,
        p_client_info: JSON.stringify({
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "server",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Log silencioso - não deve falhar o pagamento se o log falhar
      Logger.error("[PaymentEngine] Failed to log payment attempt:", err);
    }
  }

  /**
   * MÉTRICAS: Obter saúde do sistema de pagamentos
   */
  static async getPaymentHealth(restaurantId: string): Promise<{
    attempts24h: number;
    success24h: number;
    fail24h: number;
    successRate: number;
    avgDurationMs: number;
    totalProcessedCents: number;
    mostCommonError: string | null;
  }> {
    const { data, error } = await invokeRpc<Record<string, unknown>>(
      "get_payment_health",
      {
        p_restaurant_id: restaurantId,
      },
    );

    if (error) {
      Logger.error("[PaymentEngine] Failed to get payment health:", error);
      return {
        attempts24h: 0,
        success24h: 0,
        fail24h: 0,
        successRate: 100,
        avgDurationMs: 0,
        totalProcessedCents: 0,
        mostCommonError: null,
      };
    }

    const d = data ?? {};
    return {
      attempts24h: (d.attempts_24h as number) ?? 0,
      success24h: (d.success_24h as number) ?? 0,
      fail24h: (d.fail_24h as number) ?? 0,
      successRate: (d.success_rate as number) ?? 100,
      avgDurationMs: (d.avg_duration_ms as number) ?? 0,
      totalProcessedCents: (d.total_processed_cents as number) ?? 0,
      mostCommonError: (d.most_common_error as string) ?? null,
    };
  }
}
