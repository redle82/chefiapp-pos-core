/**
 * DOMAIN WRITE AUTHORITY CONTRACT - ENFORCEMENT GATE
 *
 * "The Gatekeeper of State"
 *
 * Intercepts all direct database writes.
 * - PURE Mode: Blocks all OPERATIONAL STATE direct writes.
 * - HYBRID Mode: Checks ExceptionRegistry.
 */
import { getTableClient } from "../infra/coreRpc";
import { Logger } from "../logger";
import {
  isAuthorized,
  type AllowedOperation,
  type AllowedTable,
  type CallerTag,
} from "./ExceptionRegistry";
import { ReconciliationEngine } from "./ReconciliationEngine";

// Configuration (Environment) — use process.env for Jest/Node (no import.meta in CommonJS)
const KERNEL_WRITE_MODE =
  (typeof process !== "undefined" ? process.env.VITE_KERNEL_MODE : undefined) ||
  ("PURE" as "HYBRID" | "PURE");
// Forensic proof (PHASE 0): emit runtime mode once on module load
Logger.info("KERNEL_WRITE_MODE", { mode: KERNEL_WRITE_MODE });

export class ConstitutionalBreachError extends Error {
  constructor(message: string, public metadata: any) {
    super(message);
    this.name = "CRITICAL_CONSTITUTIONAL_BREACH";
  }
}

export class DbWriteGate {
  /**
   * Authorized Insert
   */
  static async insert<T = any>(
    callerTag: CallerTag | string,
    table: AllowedTable | string,
    data: any,
    context: { tenantId?: string },
  ) {
    this.enforce("INSERT", callerTag, table, context);

    // [LAW 2.5] Mark Dirty if applicable
    const modifiedData = this.applyDirtyStatus(table, data);

    const client = getTableClient();
    const result = await client
      .from(table)
      .insert(modifiedData)
      .select()
      .single();

    // [LAW 2.5] Enqueue Reconciliation
    if (!result.error && context.tenantId && this.isShadowTable(table)) {
      // We use fire-and-forget or await depending on strictness.
      // User says "If enqueue fails, throw CRITICAL". So await is needed.
      try {
        // Must extract ID. Assuming 'id' column exists and is returned.
        // .select().single() above ensures we get data back.
        const entityId = (result.data as any)?.id;
        const entityType = this.mapTableToEntity(table);

        if (entityId && entityType) {
          await ReconciliationEngine.enqueue(
            context.tenantId,
            entityType as import("./ReconciliationEngine").ReconEntity,
            entityId,
            `Hybrid Write by ${callerTag}`,
            "NORMAL",
            { op: "INSERT", caller: callerTag },
          );
        }
      } catch (err: any) {
        Logger.critical("CRITICAL_CONSTITUTIONAL_BREACH", err, {
          context: "DbWriteGate Enqueue",
        });
        throw err; // Blow up as requested
      }
    }

    return result; // Return original result structure (data, error)
  }

  // [LAW 2.5] Shadow Table Strategy
  // Declarative mapping for Reconciliation Engine
  private static SHADOW_TABLES: Record<string, string> = {
    gm_cash_registers: "cash_register",
    // Future mappings:
    // 'gm_orders': 'order',
    // 'gm_payments': 'payment'
  };

  /**
   * Authorized Update
   */
  static async update<T = any>(
    callerTag: CallerTag | string,
    table: AllowedTable | string,
    data: any,
    match: Record<string, any>,
    context: { tenantId?: string },
  ) {
    this.enforce("UPDATE", callerTag, table, context);

    // [RISK MITIGATION] Enforce generic updates by ID to prevent bulk accidents
    // "UPDATE without primary key is forbidden"
    if (!("id" in match)) {
      const error = new ConstitutionalBreachError(
        `Bulk UPDATE forbidden. Must specify 'id' in match criteria.`,
        { table, callerTag, match },
      );
      Logger.critical("UNSAFE_DB_OPERATION", error, { table, match });
      throw error;
    }

    // [LAW 2.5] Mark Dirty
    const modifiedData = this.applyDirtyStatus(table, data);

    const client = getTableClient();
    let query = client.from(table).update(modifiedData);

    // Apply match filters (AND capture them for reconciliation if needed, but ID is best)
    // If we update multiple rows, reconciliation is harder. Hybrid writes usually target single ID.
    // We will assume single ID updates for now or select returned IDs.
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const result = await query.select(); // Request data back to get IDs

    // [LAW 2.5] Enqueue Reconciliation
    if (
      !result.error &&
      result.data &&
      context.tenantId &&
      this.isShadowTable(table)
    ) {
      try {
        const entityType = this.mapTableToEntity(table);

        if (entityType) {
          // Enqueue for ALL affected rows
          const reconType =
            entityType as import("./ReconciliationEngine").ReconEntity;
          await Promise.all(
            (result.data as any[]).map((row: any) =>
              ReconciliationEngine.enqueue(
                context.tenantId!,
                reconType,
                row.id,
                `Hybrid Update by ${callerTag}`,
                "NORMAL",
                { op: "UPDATE", caller: callerTag },
              ),
            ),
          );
        }
      } catch (err: any) {
        Logger.critical("CRITICAL_CONSTITUTIONAL_BREACH", err, {
          context: "DbWriteGate Enqueue",
        });
        throw err;
      }
    }

    return result;
  }

  // Helper to add Dirty Status
  private static applyDirtyStatus(table: string, data: any): any {
    if (this.isShadowTable(table)) {
      return { ...data, kernel_shadow_status: "DIRTY" };
    }
    return data;
  }

  // Helper to check if table has shadow fields
  private static isShadowTable(table: string): boolean {
    return table in this.SHADOW_TABLES;
  }

  private static mapTableToEntity(table: string): string | null {
    return this.SHADOW_TABLES[table] ?? null;
  }

  /**
   * Authorized Delete
   */
  static async delete(
    callerTag: CallerTag | string,
    table: AllowedTable | string,
    match: Record<string, any>,
    context: { tenantId?: string },
  ) {
    this.enforce("DELETE", callerTag, table, context);

    // [RISK MITIGATION] Enforce generic deletes by ID to prevent bulk accidents
    if (!("id" in match)) {
      const error = new ConstitutionalBreachError(
        `Bulk DELETE forbidden. Must specify 'id' in match criteria.`,
        { table, callerTag, match },
      );
      Logger.critical("UNSAFE_DB_OPERATION", error, { table, match });
      throw error;
    }

    const client = getTableClient();
    let query = client.from(table).delete();

    // Apply match filters
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return await query;
  }

  /**
   * Authorized Upsert
   */
  static async upsert<T = any>(
    callerTag: CallerTag | string,
    table: AllowedTable | string,
    data: any,
    context: { tenantId?: string },
  ) {
    this.enforce("UPSERT", callerTag, table, context);
    const client = getTableClient();
    return await client.from(table).upsert(data).select();
  }

  /**
   * The Enforcer (Law 6)
   */
  private static enforce(
    op: AllowedOperation,
    callerTag: CallerTag | string,
    table: string,
    ctx: { tenantId?: string },
  ) {
    // 1. PURE MODE CHECK (Law 3 - Kill Switch)
    // [SOVEREIGNTY] SCOPED ENFORCEMENT
    // Pure mode only blocks "Operational State" (Orders, Cash, Payments).
    // "System State" (Onboarding, Restaurants, Profiles) remains allowed via Gate/Registry for now.
    const OPERATIONAL_TABLES = [
      "gm_orders",
      "gm_order_items",
      "gm_cash_registers",
      "gm_payments",
    ];

    if (KERNEL_WRITE_MODE === "PURE" && OPERATIONAL_TABLES.includes(table)) {
      const error = new ConstitutionalBreachError(
        `Direct DB write attempted in PURE mode by ${callerTag}`,
        { op, table, tenantId: ctx.tenantId },
      );
      Logger.error("CRITICAL_CONSTITUTIONAL_BREACH", error, { op, table, ctx });
      throw error;
    }

    // 2. HYBRID MODE CHECK (Law 2 - Registry)
    if (!isAuthorized(callerTag, table, op)) {
      const error = new ConstitutionalBreachError(
        `Unauthorized Direct DB write by ${callerTag} on ${table}`,
        { op, table, tenantId: ctx.tenantId },
      );
      Logger.error("UNAUTHORIZED_DB_WRITE", error, { op, table, ctx });
      throw error;
    }

    // 3. TENANT CONTEXT CHECK (Architecture Invariant)
    if (!ctx.tenantId && table.startsWith("gm_")) {
      Logger.warn("DB_WRITE_WITHOUT_TENANT_ID", { op, table, callerTag });
      // Could throw here too if we want to be strict about multi-tenancy
    }
  }
}
