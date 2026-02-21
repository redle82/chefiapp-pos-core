/**
 * RECONCILIATION ENGINE (Law 2.5)
 *
 * "The Healer of State"
 *
 * Responsibilities:
 * 1. Enqueue jobs when Dual-Write occurs (Dirty State).
 * 2. Process jobs to rebuild Projections from Event Store (Truth).
 * 3. Quarantine entities that cannot be reconciled.
 *
 * FINANCIAL_CORE_VIOLATION_AUDIT Fase 4: usa getTableClient() e invokeRpc (Core quando Docker).
 */
// @ts-nocheck


import { getTableClient, invokeRpc } from "../infra/coreRpc";
import { Logger } from "../logger";

// Using relative imports assuming this file is in src/core/governance/
// Adjust if needed based on actual file structure

export type ReconEntity = "cash_register" | "order"; // Add others as needed
export type ReconStatus =
  | "PENDING"
  | "PROCESSING"
  | "RESOLVED"
  | "FAILED"
  | "DEAD";
export type ShadowStatus = "CLEAN" | "DIRTY" | "QUARANTINED";

export class ReconciliationEngine {
  /**
   * Enqueue a reconciliation job.
   * Called by DbWriteGate after a Dirty Write.
   */
  static async enqueue(
    restaurantId: string,
    entityType: ReconEntity,
    entityId: string,
    reason: string,
    severity: "NORMAL" | "HIGH" | "CRITICAL" = "NORMAL",
    context: any = {},
  ): Promise<void> {
    const client = await getTableClient();
    const { error } = await client.from("gm_reconciliation_queue").insert({
      restaurant_id: restaurantId,
      entity_type: entityType,
      entity_id: entityId,
      reason,
      severity,
      context,
      status: "PENDING",
    });

    if (error) {
      Logger.error("RECONCILIATION_ENQUEUE_FAILED", error, {
        restaurantId,
        entityId,
        reason,
      });
      // Critical Breach: If we can't enqueue the fix, the system is drifting without a safety net.
      throw new Error(
        `CRITICAL_CONSTITUTIONAL_BREACH: Failed to enqueue reconciliation for ${entityType}:${entityId}. System integrity at risk.`,
      );
    }
  }

  /**
   * Run a batch of reconciliation jobs.
   * Typically called by Edge Function or Cron.
   */
  static async runOnce(
    limit: number = 25,
  ): Promise<{ processed: number; resolved: number; failed: number }> {
    const stats = { processed: 0, resolved: 0, failed: 0 };

    const { data: jobs, error } = await invokeRpc<unknown[]>(
      "dequeue_reconciliation_jobs",
      { p_limit: limit },
    );

    if (error) {
      Logger.error("RECONCILIATION_DEQUEUE_FAILED", error);
      return stats;
    }

    const jobList = Array.isArray(jobs) ? jobs : [];
    if (jobList.length === 0) return stats;

    console.log(`[Reconciler] Processing ${jobList.length} jobs...`);

    type JobRow = {
      id: string;
      attempts: number;
      max_attempts: number;
      entity_id: string;
      restaurant_id: string;
      entity_type: string;
    };
    for (const job of jobList as JobRow[]) {
      stats.processed++;
      try {
        await this.processJob(job);
        stats.resolved++;
      } catch (err: any) {
        stats.failed++;
        Logger.error("RECONCILIATION_JOB_FAILED", err, { jobId: job.id });

        const isDead = job.attempts >= job.max_attempts;
        const newStatus = isDead ? "DEAD" : "FAILED";

        const client = await getTableClient();
        await client
          .from("gm_reconciliation_queue")
          .update({
            status: newStatus,
            last_error: err.message || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
    }

    return stats;
  }

  private static async processJob(job: any): Promise<void> {
    switch (job.entity_type) {
      case "cash_register":
        await this.reconcileCashRegister(job);
        break;
      default:
        throw new Error(`Unknown entity type: ${job.entity_type}`);
    }
  }

  // --- HANDLERS ---

  private static async reconcileCashRegister(job: any): Promise<void> {
    // 1. Fetch Event Stream
    // Table: event_store
    // Schema: stream_type (TenantId) | stream_id (Entity:Id) | stream_version

    const streamType = job.restaurant_id;
    const streamIdSuffix = `CASH_REGISTER:${job.entity_id}`;

    const client = await getTableClient();
    const { data: events, error } = await client
      .from("event_store")
      .select("*")
      .eq("stream_type", streamType)
      .eq("stream_id", streamIdSuffix)
      .order("stream_version", { ascending: true }); // Column is stream_version, not version

    if (error) throw new Error(`Failed to fetch events: ${error.message}`);

    const eventsList = Array.isArray(events) ? events : [];
    if (eventsList.length === 0) {
      Logger.warn(
        "Reconciler: No events found used to rebuild state. Quarantining.",
        { streamType, streamIdSuffix },
      );
      await this.markQuarantined(
        "gm_cash_registers",
        job.entity_id,
        job.restaurant_id,
        "NO_EVENT_STREAM",
      );
      throw new Error("NO_EVENT_STREAM: Projection quarantined.");
    }

    const state: any = {
      status: "closed",
      total_sales_cents: 0,
    };
    let lastEventId = null;
    let lastVersion = 0;

    for (const event of eventsList) {
      lastEventId = event.event_id; // Check column name in PostgresEventStore (event_id)
      lastVersion = event.stream_version;
      const payload = event.payload || {}; // Payload is JSONB, might come as object from Core

      // Parse payload if string (Core client might auto-parse, but be safe)
      const data = typeof payload === "string" ? JSON.parse(payload) : payload;

      const type = event.event_type || event.type; // Column event_type

      if (type.endsWith("OPENED") || type === "CASH_REGISTER_OPEN") {
        state.status = "open";
        state.opened_at = event.created_at;
        state.opened_by = data.opened_by || event.meta?.actorId;
        state.opening_balance_cents = data.opening_balance_cents;
        state.total_sales_cents = 0; // Reset on open
        state.name = data.name || state.name;
      } else if (type.endsWith("CLOSED") || type === "CASH_REGISTER_CLOSE") {
        state.status = "closed";
        state.closed_at = event.created_at;
        state.closed_by = data.closed_by || event.meta?.actorId;
        state.closing_balance_cents = data.closing_balance_cents;
        state.total_sales_cents = data.total_sales_cents;
      }
      // Handle other events...
    }

    // 3. Write Projection (CLEAN)
    // We bypass the Gate's "DIRTY" logic by explicitly calling a "system write" or just using the Gate with a speical tag?
    // Actually, we should update the DB row directly here to set CLEAN.
    // DbWriteGate might interfere if we use it. We should use logic that sets shadow status CLEAN.

    const updateClient = await getTableClient();
    const { error: updateError } = await updateClient
      .from("gm_cash_registers")
      .update({
        status: state.status,
        opened_at: state.opened_at,
        opened_by: state.opened_by,
        opening_balance_cents: state.opening_balance_cents,
        total_sales_cents: state.total_sales_cents,
        closed_at: state.closed_at,
        closed_by: state.closed_by,
        closing_balance_cents: state.closing_balance_cents,
        // Shadow Fields (Core may not have these columns yet; optional migration)
        kernel_shadow_status: "CLEAN",
        kernel_last_event_id: lastEventId,
        kernel_last_event_version: lastVersion,
      })
      .eq("id", job.entity_id)
      .eq("restaurant_id", job.restaurant_id);

    if (updateError) throw updateError;

    // 4. Mark Job Resolved
    await updateClient
      .from("gm_reconciliation_queue")
      .update({ status: "RESOLVED", updated_at: new Date().toISOString() })
      .eq("id", job.id);

    console.log(`[Reconciler] Repaired CashRegister ${job.entity_id}`);
  }

  private static async markQuarantined(
    table: string,
    id: string,
    tenantId: string,
    _reason: string,
  ) {
    const client = await getTableClient();
    await client
      .from(table)
      .update({ kernel_shadow_status: "QUARANTINED" })
      .eq("id", id)
      .eq("restaurant_id", tenantId); // Safety
  }
}
