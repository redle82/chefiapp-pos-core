/**
 * Cash Register - Sistema de Caixa Real
 *
 * [CLASSIFICATION: INFRASTRUCTURE ADAPTER]
 * [AUTHORITY: PostgreSQL RPCs] (open_cash_register_atomic, close_cash_register_atomic)
 *
 * Gerencia abertura e fechamento de caixa com totais reais.
 *
 * [ARCHITECTURE NOTE — 2026-02-20]
 * Write authority: PostgreSQL RPCs are the sole write path.
 * Event Sourcing (TenantKernel) is architecturally dormant — see
 * core-engine/ARCHITECTURE_DECISION.md. The kernel/executeSafe parameters
 * on interfaces are kept for backward compat but are NOT used.
 */

import { getTableClient, invokeRpc } from "../infra/coreRpc";
import { Logger } from "../logger";

// TODO: Import from Kernel context when wired
// import type { TenantKernel } from '../../../../core-engine/kernel/TenantKernel';

/** @deprecated Kept for interface compat — kernel is dormant, RPCs are sole write path */
type ExecuteSafeFn = (
  payload: Record<string, unknown>,
) => Promise<{ ok: boolean; error?: string; failureClass?: string }>;

export class CashRegisterError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "CashRegisterError";
  }
}

export interface CashRegister {
  id: string;
  restaurantId: string;
  name: string;
  status: "open" | "closed";
  openedAt?: Date;
  closedAt?: Date;
  openedBy?: string;
  closedBy?: string;
  openingBalanceCents: number;
  closingBalanceCents?: number;
  totalSalesCents: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenCashRegisterInput {
  restaurantId: string;
  name?: string;
  openingBalanceCents: number;
  openedBy: string;
  kernel?: any; // TenantKernel - typed as any for now until wiring is complete
  /** CORE_FAILURE_MODEL: pass from useKernel().executeSafe to get failureClass on error */
  executeSafe?: ExecuteSafeFn;
}

export interface CloseCashRegisterInput {
  cashRegisterId: string;
  restaurantId: string;
  closingBalanceCents: number;
  closedBy: string;
  kernel?: any; // TenantKernel
  executeSafe?: ExecuteSafeFn;
}

export class CashRegisterEngine {
  private static readonly SEED_RESTAURANT_ID =
    "00000000-0000-0000-0000-000000000100";
  /**
   * Abrir caixa
   *
   * [WRITE PATH]: PostgreSQL RPC `open_cash_register_atomic` (sole authority).
   * Kernel/executeSafe parameters are accepted but ignored — the RPC is the
   * single source of truth for cash register operations (see ADR in
   * core-engine/ARCHITECTURE_DECISION.md).
   */
  static async openCashRegister(
    input: OpenCashRegisterInput,
  ): Promise<CashRegister> {
    // Pre-validation (fail fast before hitting the DB)
    if (!input.restaurantId) {
      throw new CashRegisterError("Restaurant ID required", "VALIDATION_ERROR");
    }
    if (!input.openedBy) {
      throw new CashRegisterError("Opened By required", "VALIDATION_ERROR");
    }

    // [ATOMIC] RPC — single write path (FINANCIAL_CORE_VIOLATION_AUDIT)
    const { data: result, error } = await invokeRpc(
      "open_cash_register_atomic",
      {
        p_restaurant_id: input.restaurantId,
        p_name: input.name || "Caixa Principal",
        p_opened_by: input.openedBy,
        p_opening_balance_cents: input.openingBalanceCents,
      },
    );

    if (error) {
      Logger.error("CASH_REGISTER_OPEN_FAILED", error, { input });
      if (error.message?.includes("CASH_REGISTER_ALREADY_OPEN")) {
        throw new CashRegisterError(
          "Já existe um caixa aberto. Feche o caixa atual antes de abrir outro.",
          "CASH_REGISTER_ALREADY_OPEN",
        );
      }
      throw new CashRegisterError(
        `Erro ao abrir caixa: ${error.message || "Erro desconhecido"}`,
        "CASH_REGISTER_OPEN_FAILED",
      );
    }

    // Fetch the created register to return full object
    const openRegister = await this.getOpenCashRegister(input.restaurantId);
    if (!openRegister) {
      throw new CashRegisterError(
        "Cash register created but not found on verification read",
        "CASH_REGISTER_VERIFICATION_FAILED",
      );
    }

    return openRegister;
  }

  /**
   * Close a cash register
   *
   * [WRITE PATH]: PostgreSQL RPC `close_cash_register_atomic` (sole authority).
   * Generates Z-Report atomically with reconciliation (expected vs declared).
   */
  static async closeCashRegister(
    input: CloseCashRegisterInput,
  ): Promise<CashRegister> {
    if (!input.cashRegisterId) {
      throw new CashRegisterError(
        "Cash Register ID required",
        "VALIDATION_ERROR",
      );
    }
    if (!input.restaurantId) {
      throw new CashRegisterError("Restaurant ID required", "VALIDATION_ERROR");
    }
    if (!input.closedBy) {
      throw new CashRegisterError("Closed By required", "VALIDATION_ERROR");
    }

    // [ATOMIC] RPC — single write path with Z-Report generation
    const { data: result, error } = await invokeRpc(
      "close_cash_register_atomic",
      {
        p_cash_register_id: input.cashRegisterId,
        p_restaurant_id: input.restaurantId,
        p_closed_by: input.closedBy,
        p_declared_closing_cents: input.closingBalanceCents,
      },
    );

    if (error) {
      Logger.error("CASH_REGISTER_CLOSE_FAILED", error, { input });
      if (error.message?.includes("CASH_REGISTER_NOT_OPEN")) {
        throw new CashRegisterError(
          "Este caixa já está fechado.",
          "CASH_REGISTER_NOT_OPEN",
        );
      }
      if (error.message?.includes("CASH_REGISTER_NOT_FOUND")) {
        throw new CashRegisterError(
          "Caixa não encontrado.",
          "CASH_REGISTER_NOT_FOUND",
        );
      }
      throw new CashRegisterError(
        `Erro ao fechar caixa: ${error.message || "Erro desconhecido"}`,
        "CASH_REGISTER_CLOSE_FAILED",
      );
    }

    // Return updated state from DB
    return this.getCashRegisterById(input.cashRegisterId, input.restaurantId);
  }

  /**
   * Buscar caixa por ID (Core quando Docker — Fase 4)
   */
  static async getCashRegisterById(
    cashRegisterId: string,
    restaurantId: string,
  ): Promise<CashRegister> {
    const client = await getTableClient();
    const { data, error } = await client
      .from("gm_cash_registers")
      .select("*")
      .eq("id", cashRegisterId)
      .eq("restaurant_id", restaurantId)
      .single();

    if (error) {
      Logger.error("CASH_REGISTER_FETCH_FAILED", error, {
        cashRegisterId,
        restaurantId,
      });
      throw new CashRegisterError(
        `Erro ao buscar caixa: ${error.message || "Erro desconhecido"}`,
        "CASH_REGISTER_FETCH_FAILED",
      );
    }
    if (!data) {
      throw new CashRegisterError(
        "Caixa não encontrado. Verifique se o ID está correto.",
        "CASH_REGISTER_NOT_FOUND",
      );
    }

    return this.mapDbRegisterToRegister(data as any);
  }

  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * Buscar caixa aberto do restaurante (Core quando Docker — Fase 4)
   */
  static async getOpenCashRegister(
    restaurantId: string,
  ): Promise<CashRegister | null> {
    if (
      restaurantId !== CashRegisterEngine.SEED_RESTAURANT_ID &&
      !CashRegisterEngine.UUID_REGEX.test(restaurantId)
    ) {
      return null;
    }
    const client = await getTableClient();
    const { data, error } = await client
      .from("gm_cash_registers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("status", "open")
      .maybeSingle();

    if (error) {
      const msg = error.message ?? "";
      const tableMissing =
        msg.includes("does not exist") ||
        msg.includes("relation") ||
        (error as { code?: string }).code === "42P01";

      if (tableMissing) {
        return null;
      }

      // [OFFLINE RESILIENCE] Skip log spam if backend is simply offline in dev/trial
      const isConnectionError =
        msg.includes("Failed to fetch") ||
        msg.includes("net::ERR_CONNECTION_REFUSED");
      if (isConnectionError) {
        return null;
      }

      const isAbort =
        msg.includes("aborted") ||
        (error as { name?: string }).name === "AbortError";
      if (isAbort) {
        throw new CashRegisterError(
          `Erro ao buscar caixa aberto: ${msg || "Erro desconhecido"}`,
          "CASH_REGISTER_FETCH_OPEN_FAILED",
        );
      }

      Logger.error("CASH_REGISTER_FETCH_OPEN_FAILED", error, { restaurantId });
      throw new CashRegisterError(
        `Erro ao buscar caixa aberto: ${msg || "Erro desconhecido"}`,
        "CASH_REGISTER_FETCH_OPEN_FAILED",
      );
    }

    return data ? this.mapDbRegisterToRegister(data as any) : null;
  }

  /**
   * Buscar caixas do restaurante (Core quando Docker — Fase 4)
   */
  static async getCashRegisters(restaurantId: string): Promise<CashRegister[]> {
    const client = await getTableClient();
    const { data, error } = await client
      .from("gm_cash_registers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      const msg = error.message ?? "";
      const tableMissing =
        msg.includes("does not exist") ||
        msg.includes("relation") ||
        (error as { code?: string }).code === "42P01";
      if (tableMissing) {
        return [];
      }
      Logger.error("CASH_REGISTERS_FETCH_FAILED", error, { restaurantId });
      throw new CashRegisterError(
        `Erro ao buscar caixas: ${msg || "Erro desconhecido"}`,
        "CASH_REGISTERS_FETCH_FAILED",
      );
    }

    return ((data as any[]) || []).map((reg) =>
      this.mapDbRegisterToRegister(reg),
    );
  }

  /**
   * Mapear dados do banco para CashRegister
   */
  private static mapDbRegisterToRegister(dbRegister: {
    id: string;
    restaurant_id: string;
    name: string;
    status: string;
    opened_at?: string;
    closed_at?: string;
    opened_by?: string;
    closed_by?: string;
    opening_balance_cents: number;
    closing_balance_cents?: number;
    total_sales_cents: number;
    created_at: string;
    updated_at: string;
  }): CashRegister {
    return {
      id: dbRegister.id,
      restaurantId: dbRegister.restaurant_id,
      name: dbRegister.name,
      status: dbRegister.status as "open" | "closed",
      openedAt: dbRegister.opened_at
        ? new Date(dbRegister.opened_at)
        : undefined,
      closedAt: dbRegister.closed_at
        ? new Date(dbRegister.closed_at)
        : undefined,
      openedBy: dbRegister.opened_by,
      closedBy: dbRegister.closed_by,
      openingBalanceCents: dbRegister.opening_balance_cents,
      closingBalanceCents: dbRegister.closing_balance_cents,
      totalSalesCents: dbRegister.total_sales_cents,
      createdAt: new Date(dbRegister.created_at),
      updatedAt: new Date(dbRegister.updated_at),
    };
  }

  // [DEPRECATED] emitCashRegisterEvent removed - now using Kernel.execute()
}
