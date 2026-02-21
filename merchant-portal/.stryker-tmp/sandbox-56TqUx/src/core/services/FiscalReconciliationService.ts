/**
 * FiscalReconciliationService.ts
 *
 * Bridge fiscal: recebe snapshots do POS fiscal, calcula reconciliações,
 * emite eventos FISCAL_SYNC_*.
 *
 * Ref: FISCAL_RECONCILIATION_CONTRACT.md
 */
// @ts-nocheck


import { db } from "../db";

export type FiscalSnapshotSource = "API" | "UPLOAD" | "MANUAL";

export type ReconciliationStatus = "OK" | "DIVERGENT" | "PENDING_DATA";

export interface FiscalSnapshotInput {
  restaurantId: string;
  shiftId?: string;
  posSystem: string;
  source: FiscalSnapshotSource;
  totalFiscalCents: number;
  totalOrdersFiscal?: number;
  payload?: Record<string, unknown>;
}

export interface ReconciliationInput {
  restaurantId: string;
  shiftId?: string;
  totalOperationalCents: number;
  fiscalSnapshotId?: string;
  reconciledBy?: string;
}

export interface ReconciliationResult {
  id: string;
  status: ReconciliationStatus;
  differenceCents: number;
  reasonCode?: string;
  notes?: string;
}

type FiscalSnapshotRow = {
  id: string;
  total_fiscal_cents: number;
};

function parseFiscalSnapshotRow(snapshot: unknown): FiscalSnapshotRow | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const candidate = snapshot as {
    id?: unknown;
    total_fiscal_cents?: unknown;
  };

  if (typeof candidate.id !== "string") {
    return null;
  }

  if (typeof candidate.total_fiscal_cents !== "number") {
    return null;
  }

  return {
    id: candidate.id,
    total_fiscal_cents: candidate.total_fiscal_cents,
  };
}

/**
 * Tolerance threshold in cents for OK status.
 * Differences <= this value are considered OK.
 */
const TOLERANCE_CENTS = 10; // €0.10

export class FiscalReconciliationService {
  /**
   * Regista um snapshot fiscal vindo do POS.
   * @returns snapshot_id criado
   */
  static async createFiscalSnapshot(
    input: FiscalSnapshotInput,
  ): Promise<string> {
    try {
      const { data, error } = await db
        .from("gm_fiscal_snapshots")
        .insert({
          restaurant_id: input.restaurantId,
          shift_id: input.shiftId || null,
          pos_system: input.posSystem,
          source: input.source,
          total_fiscal_cents: input.totalFiscalCents,
          total_orders_fiscal: input.totalOrdersFiscal || 0,
          payload: input.payload || {},
        })
        .select("id")
        .single();

      if (error) {
        console.error("[FiscalReconciliation] Erro ao criar snapshot:", error);
        throw new Error(`Falha ao criar snapshot fiscal: ${error.message}`);
      }

      if (!data || typeof (data as { id?: string }).id !== "string") {
        throw new Error("Falha ao criar snapshot fiscal: resposta vazia");
      }

      const record = data as { id: string };
      // Emitir evento FISCAL_SYNC_SUCCESS (simplificado)
      await this.emitFiscalSyncEvent({
        restaurantId: input.restaurantId,
        eventType: "FISCAL_SYNC_SUCCESS",
        snapshotId: record.id,
        details: {
          posSystem: input.posSystem,
          source: input.source,
          totalFiscalCents: input.totalFiscalCents,
        },
      });

      return record.id;
    } catch (err) {
      // Emitir evento FISCAL_SYNC_FAILED
      await this.emitFiscalSyncEvent({
        restaurantId: input.restaurantId,
        eventType: "FISCAL_SYNC_FAILED",
        details: {
          error: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
  }

  /**
   * Calcula reconciliação entre ChefIApp e POS fiscal.
   * @returns reconciliation_id e resultado
   */
  static async calculateReconciliation(
    input: ReconciliationInput,
  ): Promise<ReconciliationResult> {
    // Buscar snapshot fiscal se tiver
    let totalFiscalCents = 0;
    let fiscalSnapshotId: string | null = null;

    if (input.fiscalSnapshotId) {
      const { data: snapshot } = await db
        .from("gm_fiscal_snapshots")
        .select("id, total_fiscal_cents")
        .eq("id", input.fiscalSnapshotId)
        .single();

      const snapshotRow = parseFiscalSnapshotRow(snapshot);
      if (snapshotRow) {
        totalFiscalCents = snapshotRow.total_fiscal_cents;
        fiscalSnapshotId = snapshotRow.id;
      }
    } else if (input.shiftId) {
      // Tentar buscar snapshot pelo shift_id
      const { data: snapshot } = await db
        .from("gm_fiscal_snapshots")
        .select("id, total_fiscal_cents")
        .eq("restaurant_id", input.restaurantId)
        .eq("shift_id", input.shiftId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const snapshotRow = parseFiscalSnapshotRow(snapshot);
      if (snapshotRow) {
        totalFiscalCents = snapshotRow.total_fiscal_cents;
        fiscalSnapshotId = snapshotRow.id;
      }
    }

    // Calcular diferença
    const differenceCents = input.totalOperationalCents - totalFiscalCents;
    const absDiff = Math.abs(differenceCents);

    // Determinar status
    let status: ReconciliationStatus;
    let reasonCode: string | undefined;
    let notes: string | undefined;

    if (fiscalSnapshotId === null) {
      status = "PENDING_DATA";
      reasonCode = "AWAITING_FISCAL_SYNC";
      notes = "Aguardando snapshot do POS fiscal para este turno";
    } else if (absDiff <= TOLERANCE_CENTS) {
      status = "OK";
      notes = `Reconciliação automática - diferença de €${(
        absDiff / 100
      ).toFixed(2)} dentro da tolerância`;
    } else {
      status = "DIVERGENT";
      reasonCode = "MANUAL_REVIEW_REQUIRED";
      notes = `Divergência de €${(absDiff / 100).toFixed(
        2,
      )} detectada - requer investigação`;
    }

    // Gravar reconciliação
    const { data, error } = await db
      .from("gm_reconciliations")
      .insert({
        restaurant_id: input.restaurantId,
        shift_id: input.shiftId || null,
        fiscal_snapshot_id: fiscalSnapshotId,
        total_operational_cents: input.totalOperationalCents,
        total_fiscal_cents: totalFiscalCents,
        difference_cents: differenceCents,
        status,
        reason_code: reasonCode,
        notes,
        reconciled_by: input.reconciledBy || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        "[FiscalReconciliation] Erro ao criar reconciliação:",
        error,
      );
      throw new Error(`Falha ao criar reconciliação: ${error.message}`);
    }

    if (!data || typeof (data as { id?: string }).id !== "string") {
      throw new Error("Falha ao criar reconciliação: resposta vazia");
    }

    const record = data as { id: string };
    return {
      id: record.id,
      status,
      differenceCents,
      reasonCode,
      notes,
    };
  }

  /**
   * Atualiza reason_code e notes de uma reconciliação existente.
   */
  static async updateReconciliationNotes(
    reconciliationId: string,
    reasonCode: string | null,
    notes: string | null,
  ): Promise<void> {
    const { error } = await db
      .from("gm_reconciliations")
      .update({
        reason_code: reasonCode,
        notes,
      })
      .eq("id", reconciliationId);

    if (error) {
      throw new Error(`Falha ao atualizar reconciliação: ${error.message}`);
    }
  }

  /**
   * Emite evento FISCAL_SYNC_* para audit log.
   * (Implementação simplificada - adaptar conforme event engine real)
   */
  private static async emitFiscalSyncEvent(params: {
    restaurantId: string;
    eventType: "FISCAL_SYNC_SUCCESS" | "FISCAL_SYNC_FAILED";
    snapshotId?: string;
    details: Record<string, unknown>;
  }): Promise<void> {
    try {
      // Registar em gm_audit_logs
      await db.from("gm_audit_logs").insert({
        event_type: params.eventType,
        action: params.eventType === "FISCAL_SYNC_SUCCESS" ? "CREATE" : "ERROR",
        restaurant_id: params.restaurantId,
        resource_type: "fiscal_snapshot",
        resource_id: params.snapshotId || null,
        details: params.details,
        result:
          params.eventType === "FISCAL_SYNC_SUCCESS" ? "SUCCESS" : "FAILURE",
      });
    } catch (err) {
      console.warn("[FiscalReconciliation] Falha ao emitir evento:", err);
      // Não lançar erro - continuar mesmo se audit log falhar
    }
  }

  /**
   * Workflow completo: recebe snapshot fiscal e calcula reconciliação.
   * @returns { snapshotId, reconciliationId, result }
   */
  static async processShiftReconciliation(params: {
    restaurantId: string;
    shiftId?: string;
    posSystem: string;
    source: FiscalSnapshotSource;
    totalFiscalCents: number;
    totalOrdersFiscal?: number;
    totalOperationalCents: number;
    reconciledBy?: string;
    payload?: Record<string, unknown>;
  }): Promise<{
    snapshotId: string;
    reconciliationId: string;
    result: ReconciliationResult;
  }> {
    // 1. Criar snapshot fiscal
    const snapshotId = await this.createFiscalSnapshot({
      restaurantId: params.restaurantId,
      shiftId: params.shiftId,
      posSystem: params.posSystem,
      source: params.source,
      totalFiscalCents: params.totalFiscalCents,
      totalOrdersFiscal: params.totalOrdersFiscal,
      payload: params.payload,
    });

    // 2. Calcular reconciliação
    const result = await this.calculateReconciliation({
      restaurantId: params.restaurantId,
      shiftId: params.shiftId,
      totalOperationalCents: params.totalOperationalCents,
      fiscalSnapshotId: snapshotId,
      reconciledBy: params.reconciledBy,
    });

    return {
      snapshotId,
      reconciliationId: result.id,
      result,
    };
  }
}

export default FiscalReconciliationService;
