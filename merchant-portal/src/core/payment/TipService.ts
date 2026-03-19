/**
 * TipService — Calculates, applies, and tracks gratuities.
 *
 * Tips are NOT taxed (fiscal compliance). They are tracked separately
 * from the order total for reporting and operator attribution.
 *
 * Storage: tips are persisted inside `ReceiptData.tipCents` (receipt log)
 * and in a dedicated `gm_tip_log` table for per-operator aggregation.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TipType = "percentage" | "fixed" | "round_up";

export interface TipSuggestion {
  /** Human-readable label: "5%", "10%", "Round up", etc. */
  label: string;
  /** Tip amount in cents. */
  amountCents: number;
  /** How this suggestion was derived. */
  type: TipType;
  /** For percentage tips, the percentage value (5, 10, 15, 20). */
  percentage?: number;
}

export interface TipRecord {
  orderId: string;
  amountCents: number;
  type: TipType;
  operatorId: string | null;
  operatorName: string | null;
  createdAt: string;
}

export interface TipLogRow {
  id: string;
  restaurant_id: string;
  order_id: string;
  amount_cents: number;
  tip_type: TipType;
  operator_id: string | null;
  operator_name: string | null;
  shift_id: string | null;
  created_at: string;
}

export interface TipAggregation {
  operatorId: string;
  operatorName: string;
  totalCents: number;
  count: number;
}

export interface TipSummary {
  totalCents: number;
  totalCount: number;
  byOperator: TipAggregation[];
}

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

/**
 * Returns suggested tip amounts for a given subtotal (post-tax total).
 * Includes 5%, 10%, 15%, 20% presets plus a round-up option.
 */
export function calculateTipSuggestions(subtotalCents: number): TipSuggestion[] {
  const suggestions: TipSuggestion[] = [];

  for (const pct of [5, 10, 15, 20]) {
    suggestions.push({
      label: `${pct}%`,
      amountCents: Math.round(subtotalCents * (pct / 100)),
      type: "percentage",
      percentage: pct,
    });
  }

  // Round-up: ceil to the next whole currency unit (e.g., 3420 -> 3500)
  const roundedUp = Math.ceil(subtotalCents / 100) * 100;
  const roundUpDelta = roundedUp - subtotalCents;
  if (roundUpDelta > 0 && roundUpDelta < subtotalCents) {
    suggestions.push({
      label: "round_up",
      amountCents: roundUpDelta,
      type: "round_up",
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Saves a tip record to gm_tip_log (fire-and-forget).
 * Called after payment is confirmed.
 */
export async function saveTip(
  restaurantId: string,
  record: TipRecord,
  shiftId?: string | null,
): Promise<string | null> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_tip_log")
      .insert({
        restaurant_id: restaurantId,
        order_id: record.orderId,
        amount_cents: record.amountCents,
        tip_type: record.type,
        operator_id: record.operatorId,
        operator_name: record.operatorName,
        shift_id: shiftId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      Logger.warn("[TipService] Failed to save tip", {
        order_id: record.orderId,
        error: error.message,
      });
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    Logger.warn("[TipService] saveTip error", {
      order_id: record.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Removes a tip record for a given order.
 */
export async function removeTip(orderId: string): Promise<void> {
  try {
    await dockerCoreClient
      .from("gm_tip_log")
      .delete()
      .eq("order_id", orderId);
  } catch (err) {
    Logger.warn("[TipService] removeTip error", {
      order_id: orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Aggregates tips per operator within a date range.
 */
export async function getTipsByOperator(
  restaurantId: string,
  dateFrom: string,
  dateTo: string,
): Promise<TipSummary> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_tip_log")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", `${dateFrom}T00:00:00`)
      .lte("created_at", `${dateTo}T23:59:59`)
      .order("created_at", { ascending: false });

    if (error || !data) {
      Logger.warn("[TipService] getTipsByOperator error", {
        error: error?.message,
      });
      return { totalCents: 0, totalCount: 0, byOperator: [] };
    }

    const rows = data as TipLogRow[];
    return aggregateTips(rows);
  } catch (err) {
    Logger.warn("[TipService] getTipsByOperator error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { totalCents: 0, totalCount: 0, byOperator: [] };
  }
}

/**
 * Aggregates tips for a specific shift.
 */
export async function getTipsByShift(
  restaurantId: string,
  shiftId: string,
): Promise<TipSummary> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_tip_log")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("shift_id", shiftId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      Logger.warn("[TipService] getTipsByShift error", {
        error: error?.message,
      });
      return { totalCents: 0, totalCount: 0, byOperator: [] };
    }

    const rows = data as TipLogRow[];
    return aggregateTips(rows);
  } catch (err) {
    Logger.warn("[TipService] getTipsByShift error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { totalCents: 0, totalCount: 0, byOperator: [] };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function aggregateTips(rows: TipLogRow[]): TipSummary {
  const totalCents = rows.reduce((sum, r) => sum + r.amount_cents, 0);
  const totalCount = rows.length;

  const byOpMap = new Map<string, TipAggregation>();
  for (const row of rows) {
    const key = row.operator_id ?? "__unassigned__";
    const existing = byOpMap.get(key);
    if (existing) {
      existing.totalCents += row.amount_cents;
      existing.count += 1;
    } else {
      byOpMap.set(key, {
        operatorId: row.operator_id ?? "",
        operatorName: row.operator_name ?? "—",
        totalCents: row.amount_cents,
        count: 1,
      });
    }
  }

  const byOperator = Array.from(byOpMap.values()).sort(
    (a, b) => b.totalCents - a.totalCents,
  );

  return { totalCents, totalCount, byOperator };
}
