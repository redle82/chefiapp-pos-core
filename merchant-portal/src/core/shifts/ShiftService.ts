/**
 * ShiftService — Clock in/out, breaks, hours calculation.
 *
 * Persists to `shift_logs` table via Docker Core (PostgREST).
 * Each row represents a single operator shift with clock in/out times,
 * break records, and computed totals.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";

/* ── Types ──────────────────────────────────────────────────────── */

export type ClockInMethod = "pin" | "qr" | "manual";
export type BreakType = "lunch" | "short";

export interface BreakRecord {
  type: BreakType;
  start: string; // ISO
  end: string | null; // null = currently on break
}

export interface ShiftLog {
  id: string;
  operator_id: string;
  operator_name: string;
  restaurant_id: string;
  clock_in: string; // ISO
  clock_out: string | null;
  breaks: BreakRecord[];
  total_minutes: number | null;
  method: ClockInMethod;
  status: "active" | "on_break" | "completed" | "auto_closed";
  created_at: string;
  updated_at: string;
}

export interface ShiftSummary {
  date: string;
  restaurant_id: string;
  shifts: ShiftLog[];
  totalShifts: number;
  totalMinutesWorked: number;
  activeNow: number;
}

export interface DateRange {
  from: string; // ISO date
  to: string; // ISO date
}

/* ── Helpers ────────────────────────────────────────────────────── */

function generateId(): string {
  return `shift_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function minutesBetween(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60_000,
  );
}

function totalBreakMinutes(breaks: BreakRecord[]): number {
  return breaks.reduce((sum, b) => {
    if (!b.end) return sum;
    return sum + minutesBetween(b.start, b.end);
  }, 0);
}

/** Parse breaks from DB (stored as JSONB). */
function parseBreaks(raw: unknown): BreakRecord[] {
  if (Array.isArray(raw)) return raw as BreakRecord[];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as BreakRecord[];
    } catch {
      return [];
    }
  }
  return [];
}

function rowToShiftLog(row: Record<string, unknown>): ShiftLog {
  return {
    id: row.id as string,
    operator_id: row.operator_id as string,
    operator_name: (row.operator_name as string) ?? "",
    restaurant_id: row.restaurant_id as string,
    clock_in: row.clock_in as string,
    clock_out: (row.clock_out as string) ?? null,
    breaks: parseBreaks(row.breaks),
    total_minutes: (row.total_minutes as number) ?? null,
    method: (row.method as ClockInMethod) ?? "manual",
    status: (row.status as ShiftLog["status"]) ?? "active",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/* ── Service ────────────────────────────────────────────────────── */

export const ShiftClockService = {
  /**
   * Clock in — start a new shift for an operator.
   */
  async clockIn(
    operatorId: string,
    operatorName: string,
    restaurantId: string,
    method: ClockInMethod = "manual",
  ): Promise<{ success: boolean; shiftId?: string; error?: string }> {
    // Check if operator already has an active shift
    const existing = await this.getActiveShift(operatorId, restaurantId);
    if (existing) {
      return { success: false, error: "ALREADY_CLOCKED_IN" };
    }

    const now = new Date().toISOString();
    const id = generateId();

    const { error } = await dockerCoreClient.from("shift_logs").insert({
      id,
      operator_id: operatorId,
      operator_name: operatorName,
      restaurant_id: restaurantId,
      clock_in: now,
      clock_out: null,
      breaks: JSON.stringify([]),
      total_minutes: null,
      method,
      status: "active",
      created_at: now,
      updated_at: now,
    });

    if (error) {
      Logger.error("[ShiftClockService] clockIn failed", { error });
      return { success: false, error: error.message };
    }

    return { success: true, shiftId: id };
  },

  /**
   * Clock out — end a shift.
   */
  async clockOut(
    operatorId: string,
    shiftId: string,
  ): Promise<{ success: boolean; totalMinutes?: number; error?: string }> {
    const shift = await this.getShiftById(shiftId);
    if (!shift) {
      return { success: false, error: "SHIFT_NOT_FOUND" };
    }
    if (shift.status === "completed" || shift.status === "auto_closed") {
      return { success: false, error: "ALREADY_CLOCKED_OUT" };
    }

    // End any active break first
    const breaks = [...shift.breaks];
    const activeBreak = breaks.find((b) => b.end === null);
    if (activeBreak) {
      activeBreak.end = new Date().toISOString();
    }

    const now = new Date().toISOString();
    const totalWorked = minutesBetween(shift.clock_in, now);
    const breakMins = totalBreakMinutes(breaks);
    const totalMinutes = Math.max(0, totalWorked - breakMins);

    const { error } = await dockerCoreClient
      .from("shift_logs")
      .update({
        clock_out: now,
        breaks: JSON.stringify(breaks),
        total_minutes: totalMinutes,
        status: "completed",
        updated_at: now,
      })
      .eq("id", shiftId)
      .eq("operator_id", operatorId);

    if (error) {
      Logger.error("[ShiftClockService] clockOut failed", { error });
      return { success: false, error: error.message };
    }

    return { success: true, totalMinutes };
  },

  /**
   * Start a break (lunch or short).
   */
  async startBreak(
    shiftId: string,
    breakType: BreakType,
  ): Promise<{ success: boolean; error?: string }> {
    const shift = await this.getShiftById(shiftId);
    if (!shift) return { success: false, error: "SHIFT_NOT_FOUND" };
    if (shift.status !== "active") {
      return { success: false, error: "SHIFT_NOT_ACTIVE" };
    }

    // Check no active break already
    const hasActiveBreak = shift.breaks.some((b) => b.end === null);
    if (hasActiveBreak) {
      return { success: false, error: "ALREADY_ON_BREAK" };
    }

    const now = new Date().toISOString();
    const newBreaks: BreakRecord[] = [
      ...shift.breaks,
      { type: breakType, start: now, end: null },
    ];

    const { error } = await dockerCoreClient
      .from("shift_logs")
      .update({
        breaks: JSON.stringify(newBreaks),
        status: "on_break",
        updated_at: now,
      })
      .eq("id", shiftId);

    if (error) {
      Logger.error("[ShiftClockService] startBreak failed", { error });
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * End the current break.
   */
  async endBreak(
    shiftId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const shift = await this.getShiftById(shiftId);
    if (!shift) return { success: false, error: "SHIFT_NOT_FOUND" };

    const breaks = [...shift.breaks];
    const activeBreak = breaks.find((b) => b.end === null);
    if (!activeBreak) {
      return { success: false, error: "NO_ACTIVE_BREAK" };
    }

    activeBreak.end = new Date().toISOString();
    const now = new Date().toISOString();

    const { error } = await dockerCoreClient
      .from("shift_logs")
      .update({
        breaks: JSON.stringify(breaks),
        status: "active",
        updated_at: now,
      })
      .eq("id", shiftId);

    if (error) {
      Logger.error("[ShiftClockService] endBreak failed", { error });
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Get the active shift for an operator.
   */
  async getActiveShift(
    operatorId: string,
    restaurantId: string,
  ): Promise<ShiftLog | null> {
    const { data, error } = await dockerCoreClient
      .from("shift_logs")
      .select("*")
      .eq("operator_id", operatorId)
      .eq("restaurant_id", restaurantId)
      .in("status", ["active", "on_break"])
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return rowToShiftLog(data as Record<string, unknown>);
  },

  /**
   * Get a shift by ID.
   */
  async getShiftById(shiftId: string): Promise<ShiftLog | null> {
    const { data, error } = await dockerCoreClient
      .from("shift_logs")
      .select("*")
      .eq("id", shiftId)
      .maybeSingle();

    if (error || !data) return null;
    return rowToShiftLog(data as Record<string, unknown>);
  },

  /**
   * Get shift history for an operator within a date range.
   */
  async getShiftHistory(
    operatorId: string,
    restaurantId: string,
    range?: DateRange,
  ): Promise<ShiftLog[]> {
    let query = dockerCoreClient
      .from("shift_logs")
      .select("*")
      .eq("operator_id", operatorId)
      .eq("restaurant_id", restaurantId)
      .order("clock_in", { ascending: false });

    if (range) {
      query = query
        .gte("clock_in", range.from)
        .lte("clock_in", `${range.to}T23:59:59.999Z`);
    }

    const { data, error } = await query.limit(100);

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(rowToShiftLog);
  },

  /**
   * Calculate hours for a shift (total minus breaks).
   */
  calculateHours(shift: ShiftLog): {
    totalMinutes: number;
    breakMinutes: number;
    workedMinutes: number;
  } {
    const end = shift.clock_out ?? new Date().toISOString();
    const totalMinutes = minutesBetween(shift.clock_in, end);
    const breakMinutes = totalBreakMinutes(shift.breaks);
    return {
      totalMinutes,
      breakMinutes,
      workedMinutes: Math.max(0, totalMinutes - breakMinutes),
    };
  },

  /**
   * Get shift summary for a restaurant on a given date.
   */
  async getShiftSummary(
    restaurantId: string,
    date: string, // YYYY-MM-DD
  ): Promise<ShiftSummary> {
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    const { data, error } = await dockerCoreClient
      .from("shift_logs")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("clock_in", dayStart)
      .lte("clock_in", dayEnd)
      .order("clock_in", { ascending: false });

    const shifts = error || !data
      ? []
      : (data as Record<string, unknown>[]).map(rowToShiftLog);

    const activeNow = shifts.filter(
      (s) => s.status === "active" || s.status === "on_break",
    ).length;

    const totalMinutesWorked = shifts.reduce((sum, s) => {
      const { workedMinutes } = this.calculateHours(s);
      return sum + workedMinutes;
    }, 0);

    return {
      date,
      restaurant_id: restaurantId,
      shifts,
      totalShifts: shifts.length,
      totalMinutesWorked,
      activeNow,
    };
  },

  /**
   * Get all shifts for a restaurant within a date range (for timesheet).
   */
  async getShiftsForRange(
    restaurantId: string,
    range: DateRange,
  ): Promise<ShiftLog[]> {
    const { data, error } = await dockerCoreClient
      .from("shift_logs")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("clock_in", range.from)
      .lte("clock_in", `${range.to}T23:59:59.999Z`)
      .order("clock_in", { ascending: false });

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(rowToShiftLog);
  },

  /**
   * Auto-close shifts that exceeded max duration (14h) or crossed midnight.
   * Should be called periodically (e.g., on app load or every hour).
   */
  async autoCloseStaleShifts(restaurantId: string): Promise<number> {
    const MAX_SHIFT_HOURS = 14;
    const cutoffTime = new Date(
      Date.now() - MAX_SHIFT_HOURS * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await dockerCoreClient
      .from("shift_logs")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .in("status", ["active", "on_break"])
      .lt("clock_in", cutoffTime);

    if (error || !data || data.length === 0) return 0;

    const now = new Date().toISOString();
    let closed = 0;

    for (const row of data as Record<string, unknown>[]) {
      const shift = rowToShiftLog(row);
      const breaks = [...shift.breaks];

      // End any active break
      const activeBreak = breaks.find((b) => b.end === null);
      if (activeBreak) {
        activeBreak.end = now;
      }

      const totalWorked = minutesBetween(shift.clock_in, now);
      const breakMins = totalBreakMinutes(breaks);
      const totalMinutes = Math.max(0, totalWorked - breakMins);

      const { error: updateError } = await dockerCoreClient
        .from("shift_logs")
        .update({
          clock_out: now,
          breaks: JSON.stringify(breaks),
          total_minutes: totalMinutes,
          status: "auto_closed",
          updated_at: now,
        })
        .eq("id", shift.id);

      if (!updateError) closed++;
    }

    if (closed > 0) {
      Logger.warn(`[ShiftClockService] Auto-closed ${closed} stale shifts`);
    }
    return closed;
  },

  /**
   * Update a shift (manager correction).
   */
  async updateShift(
    shiftId: string,
    updates: { clock_in?: string; clock_out?: string; breaks?: BreakRecord[] },
  ): Promise<{ success: boolean; error?: string }> {
    const shift = await this.getShiftById(shiftId);
    if (!shift) return { success: false, error: "SHIFT_NOT_FOUND" };

    const clockIn = updates.clock_in ?? shift.clock_in;
    const clockOut = updates.clock_out ?? shift.clock_out;
    const breaks = updates.breaks ?? shift.breaks;
    const now = new Date().toISOString();

    let totalMinutes: number | null = null;
    if (clockOut) {
      const totalWorked = minutesBetween(clockIn, clockOut);
      const breakMins = totalBreakMinutes(breaks);
      totalMinutes = Math.max(0, totalWorked - breakMins);
    }

    const { error } = await dockerCoreClient
      .from("shift_logs")
      .update({
        clock_in: clockIn,
        clock_out: clockOut,
        breaks: JSON.stringify(breaks),
        total_minutes: totalMinutes,
        updated_at: now,
      })
      .eq("id", shiftId);

    if (error) {
      Logger.error("[ShiftClockService] updateShift failed", { error });
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
