/**
 * WasteTrackingService — Tracks and reports food waste for inventory management.
 *
 * Stores waste events in gm_waste_log table and optionally deducts from
 * gm_stock_levels via the apply_stock_movement RPC.
 *
 * Tables used:
 *   gm_waste_log       — Waste event log (product, qty, reason, cost, operator)
 *   gm_stock_levels    — Current stock per location/ingredient (for deduction)
 *   gm_stock_ledger    — Movement audit log (waste logged as action='OUT')
 *   gm_ingredients     — Ingredient master data
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type WasteReason =
  | "expired"
  | "damaged"
  | "preparation_error"
  | "overproduction"
  | "spoiled"
  | "dropped"
  | "returned";

export const WASTE_REASONS: WasteReason[] = [
  "expired",
  "damaged",
  "preparation_error",
  "overproduction",
  "spoiled",
  "dropped",
  "returned",
];

export interface RecordWasteInput {
  restaurantId: string;
  ingredientId: string;
  locationId?: string;
  quantity: number;
  unit: string;
  reason: WasteReason;
  costCents: number;
  notes?: string;
  operatorId?: string;
  operatorName?: string;
}

export interface WasteLogEntry {
  id: string;
  restaurant_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  location_id: string | null;
  quantity: number;
  unit: string;
  reason: WasteReason;
  cost_cents: number;
  notes: string | null;
  operator_id: string | null;
  operator_name: string | null;
  created_at: string;
}

export interface WasteByReasonSummary {
  reason: WasteReason;
  totalQuantity: number;
  totalCostCents: number;
  count: number;
}

export interface WasteByProductSummary {
  ingredientId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  totalCostCents: number;
  count: number;
}

export interface WasteTrendPoint {
  periodLabel: string;
  periodStart: string;
  totalCostCents: number;
  totalQuantity: number;
  count: number;
}

export interface WasteDashboardData {
  todayCostCents: number;
  todayUnits: number;
  weekCostCents: number;
  weekUnits: number;
  monthCostCents: number;
  monthUnits: number;
  topWastedProducts: WasteByProductSummary[];
  byReason: WasteByReasonSummary[];
  trends: WasteTrendPoint[];
  wastePercentOfInventory: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function startOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth(date: Date): string {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function weeksAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

export class WasteTrackingService {
  /**
   * Record a waste event. Inserts into gm_waste_log and deducts from stock.
   */
  async recordWaste(data: RecordWasteInput): Promise<WasteLogEntry> {
    const {
      restaurantId,
      ingredientId,
      locationId,
      quantity,
      unit,
      reason,
      costCents,
      notes,
      operatorId,
      operatorName,
    } = data;

    // 1. Insert waste log entry
    const { data: entry, error: insertError } = await dockerCoreClient
      .from("gm_waste_log")
      .insert({
        restaurant_id: restaurantId,
        ingredient_id: ingredientId,
        location_id: locationId || null,
        quantity,
        unit,
        reason,
        cost_cents: Math.round(costCents),
        notes: notes?.trim() || null,
        operator_id: operatorId || null,
        operator_name: operatorName?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      Logger.error("WasteTrackingService: Failed to record waste", insertError);
      throw insertError;
    }

    // 2. Deduct from stock via RPC (best effort)
    if (locationId) {
      try {
        await dockerCoreClient.rpc("apply_stock_movement", {
          p_restaurant_id: restaurantId,
          p_action: "OUT",
          p_ingredient_id: ingredientId,
          p_location_id: locationId,
          p_qty: quantity,
          p_reason: `waste:${reason}${notes ? ` - ${notes}` : ""}`,
          p_target_location_id: null,
          p_unit_cost: null,
        });
      } catch (err) {
        Logger.error(
          "WasteTrackingService: Failed to deduct stock for waste",
          err,
        );
        // Non-fatal: waste log was still recorded
      }
    }

    return entry as WasteLogEntry;
  }

  /**
   * Get waste entries for a date range.
   */
  async getWasteByPeriod(
    restaurantId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<WasteLogEntry[]> {
    const { data, error } = await dockerCoreClient
      .from("gm_waste_log")
      .select(
        `
        *,
        ingredient:gm_ingredients(name)
      `,
      )
      .eq("restaurant_id", restaurantId)
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo)
      .order("created_at", { ascending: false });

    if (error) {
      Logger.error("WasteTrackingService: getWasteByPeriod failed", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      ...row,
      ingredient_name: row.ingredient?.name ?? "Unknown",
    }));
  }

  /**
   * Aggregate waste by reason for a period.
   */
  async getWasteByCategoryReport(
    restaurantId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<WasteByReasonSummary[]> {
    const entries = await this.getWasteByPeriod(restaurantId, dateFrom, dateTo);

    const map = new Map<WasteReason, WasteByReasonSummary>();
    for (const entry of entries) {
      const existing = map.get(entry.reason) || {
        reason: entry.reason,
        totalQuantity: 0,
        totalCostCents: 0,
        count: 0,
      };
      existing.totalQuantity += Number(entry.quantity);
      existing.totalCostCents += Number(entry.cost_cents);
      existing.count += 1;
      map.set(entry.reason, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalCostCents - a.totalCostCents,
    );
  }

  /**
   * Get waste aggregated by product (ingredient).
   */
  async getWasteByProduct(
    restaurantId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<WasteByProductSummary[]> {
    const entries = await this.getWasteByPeriod(restaurantId, dateFrom, dateTo);

    const map = new Map<string, WasteByProductSummary>();
    for (const entry of entries) {
      const existing = map.get(entry.ingredient_id) || {
        ingredientId: entry.ingredient_id,
        ingredientName: entry.ingredient_name || "Unknown",
        totalQuantity: 0,
        unit: entry.unit,
        totalCostCents: 0,
        count: 0,
      };
      existing.totalQuantity += Number(entry.quantity);
      existing.totalCostCents += Number(entry.cost_cents);
      existing.count += 1;
      map.set(entry.ingredient_id, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalCostCents - a.totalCostCents,
    );
  }

  /**
   * Get total waste cost for a period.
   */
  async getWasteCost(
    restaurantId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    const entries = await this.getWasteByPeriod(restaurantId, dateFrom, dateTo);
    return entries.reduce((sum, e) => sum + Number(e.cost_cents), 0);
  }

  /**
   * Get weekly trends for the last N weeks (default 8).
   */
  async getWasteTrends(
    restaurantId: string,
    weekCount = 8,
  ): Promise<WasteTrendPoint[]> {
    const now = new Date();
    const dateFrom = weeksAgo(weekCount);
    const dateTo = now.toISOString();

    const entries = await this.getWasteByPeriod(restaurantId, dateFrom, dateTo);

    // Group by week
    const weekMap = new Map<string, WasteTrendPoint>();

    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekMonday = new Date(weekStart);
      const day = weekMonday.getDay();
      const diff = weekMonday.getDate() - day + (day === 0 ? -6 : 1);
      weekMonday.setDate(diff);
      weekMonday.setHours(0, 0, 0, 0);

      const key = weekMonday.toISOString().slice(0, 10);
      const label = `${weekMonday.getDate()}/${weekMonday.getMonth() + 1}`;
      weekMap.set(key, {
        periodLabel: label,
        periodStart: weekMonday.toISOString(),
        totalCostCents: 0,
        totalQuantity: 0,
        count: 0,
      });
    }

    for (const entry of entries) {
      const entryDate = new Date(entry.created_at);
      const day = entryDate.getDay();
      const diff = entryDate.getDate() - day + (day === 0 ? -6 : 1);
      const weekMonday = new Date(entryDate);
      weekMonday.setDate(diff);
      weekMonday.setHours(0, 0, 0, 0);
      const key = weekMonday.toISOString().slice(0, 10);

      const point = weekMap.get(key);
      if (point) {
        point.totalCostCents += Number(entry.cost_cents);
        point.totalQuantity += Number(entry.quantity);
        point.count += 1;
      }
    }

    return Array.from(weekMap.values())
      .sort(
        (a, b) =>
          new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
      );
  }

  /**
   * Get full dashboard data for waste tracking.
   */
  async getDashboardData(restaurantId: string): Promise<WasteDashboardData> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const dateTo = endOfToday.toISOString();

    // Fetch all data for the month (superset)
    const monthEntries = await this.getWasteByPeriod(
      restaurantId,
      monthStart,
      dateTo,
    );

    // Compute today
    const todayEntries = monthEntries.filter(
      (e) => new Date(e.created_at) >= new Date(todayStart),
    );
    const todayCostCents = todayEntries.reduce(
      (s, e) => s + Number(e.cost_cents),
      0,
    );
    const todayUnits = todayEntries.reduce(
      (s, e) => s + Number(e.quantity),
      0,
    );

    // Compute week
    const weekEntries = monthEntries.filter(
      (e) => new Date(e.created_at) >= new Date(weekStart),
    );
    const weekCostCents = weekEntries.reduce(
      (s, e) => s + Number(e.cost_cents),
      0,
    );
    const weekUnits = weekEntries.reduce(
      (s, e) => s + Number(e.quantity),
      0,
    );

    // Compute month
    const monthCostCents = monthEntries.reduce(
      (s, e) => s + Number(e.cost_cents),
      0,
    );
    const monthUnits = monthEntries.reduce(
      (s, e) => s + Number(e.quantity),
      0,
    );

    // Top wasted products (from month data)
    const productMap = new Map<string, WasteByProductSummary>();
    for (const entry of monthEntries) {
      const existing = productMap.get(entry.ingredient_id) || {
        ingredientId: entry.ingredient_id,
        ingredientName: entry.ingredient_name || "Unknown",
        totalQuantity: 0,
        unit: entry.unit,
        totalCostCents: 0,
        count: 0,
      };
      existing.totalQuantity += Number(entry.quantity);
      existing.totalCostCents += Number(entry.cost_cents);
      existing.count += 1;
      productMap.set(entry.ingredient_id, existing);
    }
    const topWastedProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalCostCents - a.totalCostCents)
      .slice(0, 5);

    // By reason (from month data)
    const reasonMap = new Map<WasteReason, WasteByReasonSummary>();
    for (const entry of monthEntries) {
      const existing = reasonMap.get(entry.reason) || {
        reason: entry.reason,
        totalQuantity: 0,
        totalCostCents: 0,
        count: 0,
      };
      existing.totalQuantity += Number(entry.quantity);
      existing.totalCostCents += Number(entry.cost_cents);
      existing.count += 1;
      reasonMap.set(entry.reason, existing);
    }
    const byReason = Array.from(reasonMap.values()).sort(
      (a, b) => b.totalCostCents - a.totalCostCents,
    );

    // Trends
    const trends = await this.getWasteTrends(restaurantId, 4);

    // Waste % of inventory cost (estimate from stock levels)
    let wastePercentOfInventory = 0;
    try {
      const { data: stockData } = await dockerCoreClient
        .from("gm_stock_levels")
        .select("qty, unit_cost")
        .eq("restaurant_id", restaurantId);

      if (stockData && stockData.length > 0) {
        const totalInventoryCost = stockData.reduce(
          (s: number, r: any) =>
            s + Number(r.qty || 0) * Number(r.unit_cost || 0),
          0,
        );
        if (totalInventoryCost > 0) {
          wastePercentOfInventory =
            (monthCostCents / 100 / totalInventoryCost) * 100;
        }
      }
    } catch {
      // Non-fatal
    }

    return {
      todayCostCents,
      todayUnits,
      weekCostCents,
      weekUnits,
      monthCostCents,
      monthUnits,
      topWastedProducts,
      byReason,
      trends,
      wastePercentOfInventory,
    };
  }
}

/** Singleton instance */
export const wasteTrackingService = new WasteTrackingService();
