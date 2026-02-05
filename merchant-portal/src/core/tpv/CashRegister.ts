/**
 * Cash Register - Sistema de Caixa Real
 *
 * [CLASSIFICATION: INFRASTRUCTURE ADAPTER]
 * [AUTHORITY: HYBRID] (See DOMAIN_WRITE_AUTHORITY_CONTRACT.md)
 *
 * Gerencia abertura e fechamento de caixa com totais reais.
 *
 * [ARCHITECTURE NOTE]
 * This engine operates in HYBRID MODE (Law 2 Exception):
 * 1. Direct Write (Projection): Writes to Core `gm_cash_registers`
 * 2. Kernel Event (Truth): Routes `OPEN/CLOSE` events through `TenantKernel` (Sovereign)
 *
 * WARNING: Does not enforce "truth" if Kernel is missing.
 */

import { getErrorMessage } from "../errors/ErrorMessages";
import { getTableClient, invokeRpc } from "../infra/coreRpc";
import { Logger } from "../logger";
import type { ExecuteSafeFn } from "../services/OrderProcessingService";

// TODO: Import from Kernel context when wired
// import type { TenantKernel } from '../../../../core-engine/kernel/TenantKernel';

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
  /**
   * Abrir caixa
   */
  static async openCashRegister(
    input: OpenCashRegisterInput
  ): Promise<CashRegister> {
    // [ATOMIC] Use RPC — Core quando Docker (FINANCIAL_CORE_VIOLATION_AUDIT)
    const { data: result, error } = await invokeRpc(
      "open_cash_register_atomic",
      {
        p_restaurant_id: input.restaurantId,
        p_name: input.name || "Caixa Principal",
        p_opened_by: input.openedBy,
        p_opening_balance_cents: input.openingBalanceCents,
      }
    );

    if (error) {
      Logger.error("CASH_REGISTER_OPEN_FAILED", error, { input });
      if (error.message?.includes("CASH_REGISTER_ALREADY_OPEN")) {
        throw new CashRegisterError(
          "Já existe um caixa aberto. Feche o caixa atual antes de abrir outro.",
          "CASH_REGISTER_ALREADY_OPEN"
        );
      }
      throw new CashRegisterError(
        `Erro ao abrir caixa: ${error.message || "Erro desconhecido"}`,
        "CASH_REGISTER_OPEN_FAILED"
      );
    }
    // Validation
    if (!input.restaurantId) throw new Error("Restaurant ID required");
    if (!input.openedBy) throw new Error("Opened By required");

    if (!input.kernel && !input.executeSafe) {
      throw new Error(
        "Sovereign Kernel or executeSafe required for Cash Register operations (Phase 16)"
      );
    }

    const tempId = crypto.randomUUID();
    const payload = {
      entity: "cash_register",
      entityId: tempId,
      event: "OPEN",
      restaurantId: input.restaurantId,
      opened_by: input.openedBy,
      opening_balance_cents: input.openingBalanceCents,
      name: (input.name || "Caixa Principal") as string,
    };

    if (input.executeSafe) {
      const res = await input.executeSafe(payload);
      if (!res.ok) {
        const err = new Error(
          getErrorMessage(res.error) || "Erro ao abrir caixa."
        ) as Error & { failureClass?: string };
        err.failureClass = res.failureClass;
        throw err;
      }
    } else {
      await input.kernel.execute(payload);
    }

    // After Kernel Execution (and synchronous Effect), the DB is updated.
    // We fetch the open register.
    const openRegister = await this.getOpenCashRegister(input.restaurantId);
    if (!openRegister) {
      throw new Error(
        "Failed to open cash register (Sovereignty Verification)"
      );
    }

    return openRegister;
  }

  // Close a cash register (Sovereign)
  static async closeCashRegister(
    input: CloseCashRegisterInput
  ): Promise<CashRegister> {
    if (!input.kernel && !input.executeSafe) {
      throw new Error(
        "Sovereign Kernel or executeSafe required for Cash Register operations (Phase 16)"
      );
    }

    const payload = {
      entity: "cash_register",
      entityId: input.cashRegisterId,
      event: "CLOSE",
      restaurantId: input.restaurantId,
      closed_by: input.closedBy,
      closing_balance_cents: input.closingBalanceCents,
    };

    if (input.executeSafe) {
      const res = await input.executeSafe(payload);
      if (!res.ok) {
        const err = new Error(
          getErrorMessage(res.error) || "Erro ao fechar caixa."
        ) as Error & { failureClass?: string };
        err.failureClass = res.failureClass;
        throw err;
      }
    } else {
      await input.kernel.execute(payload);
    }

    // Return updated state
    // Note: getCashRegisterById requires restaurantId in signature?
    // Checking getCashRegisterById below... it takes (id, restaurantId).
    // Let's check signature.
    return this.getCashRegisterById(input.cashRegisterId, input.restaurantId);
  }

  /**
   * Buscar caixa por ID (Core quando Docker — Fase 4)
   */
  static async getCashRegisterById(
    cashRegisterId: string,
    restaurantId: string
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
        "CASH_REGISTER_FETCH_FAILED"
      );
    }
    if (!data) {
      throw new CashRegisterError(
        "Caixa não encontrado. Verifique se o ID está correto.",
        "CASH_REGISTER_NOT_FOUND"
      );
    }

    return this.mapDbRegisterToRegister(data as any);
  }

  /**
   * Buscar caixa aberto do restaurante (Core quando Docker — Fase 4)
   */
  static async getOpenCashRegister(
    restaurantId: string
  ): Promise<CashRegister | null> {
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

      // [OFFLINE RESILIENCE] Skip log spam if backend is simply offline in dev/demo
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
          "CASH_REGISTER_FETCH_OPEN_FAILED"
        );
      }

      Logger.error("CASH_REGISTER_FETCH_OPEN_FAILED", error, { restaurantId });
      throw new CashRegisterError(
        `Erro ao buscar caixa aberto: ${msg || "Erro desconhecido"}`,
        "CASH_REGISTER_FETCH_OPEN_FAILED"
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
        "CASH_REGISTERS_FETCH_FAILED"
      );
    }

    return ((data as any[]) || []).map((reg) =>
      this.mapDbRegisterToRegister(reg)
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
