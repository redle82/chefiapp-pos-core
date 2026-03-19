/**
 * TimesheetGrid — Weekly timesheet view for all operators.
 *
 * Rows = operators, Columns = days of the week.
 * Each cell shows hours worked with color coding:
 *   - Green: normal hours
 *   - Amber: overtime (>8h)
 *   - Red: absent (0h on a weekday)
 *   - Blue: holiday
 * Totals row and column. Week navigation (prev/next).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  ShiftClockService,
  type ShiftLog,
} from "../../../../core/shifts/ShiftService";

/* ── Helpers ────────────────────────────────────────────────────── */

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDayShort(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { weekday: "short" });
}

function formatDayNum(d: Date): string {
  return d.getDate().toString();
}

function formatHours(minutes: number): string {
  if (minutes === 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

interface OperatorWeekData {
  operatorId: string;
  operatorName: string;
  dailyMinutes: number[]; // 7 entries, one per day
  totalMinutes: number;
}

const OVERTIME_THRESHOLD = 8 * 60; // 8 hours in minutes

/* ── Component ──────────────────────────────────────────────────── */

export function TimesheetGrid() {
  const { t, i18n } = useTranslation("shift");
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [weekOffset, setWeekOffset] = useState(0);
  const [shifts, setShifts] = useState<ShiftLog[]>([]);
  const [loading, setLoading] = useState(false);

  const weekStart = useMemo(() => {
    const base = getWeekStart(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const dateRange = useMemo(
    () => ({
      from: formatDate(weekDays[0]),
      to: formatDate(weekDays[6]),
    }),
    [weekDays],
  );

  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const data = await ShiftClockService.getShiftsForRange(
        restaurantId,
        dateRange,
      );
      setShifts(data);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build operator x day matrix
  const operatorData: OperatorWeekData[] = useMemo(() => {
    const byOperator = new Map<
      string,
      { name: string; dailyMinutes: number[] }
    >();

    for (const shift of shifts) {
      if (!byOperator.has(shift.operator_id)) {
        byOperator.set(shift.operator_id, {
          name: shift.operator_name || shift.operator_id.slice(0, 8),
          dailyMinutes: [0, 0, 0, 0, 0, 0, 0],
        });
      }
      const op = byOperator.get(shift.operator_id)!;
      const shiftDate = shift.clock_in.slice(0, 10);
      const dayIndex = weekDays.findIndex(
        (d) => formatDate(d) === shiftDate,
      );
      if (dayIndex >= 0) {
        const { workedMinutes } = ShiftClockService.calculateHours(shift);
        op.dailyMinutes[dayIndex] += workedMinutes;
      }
    }

    return Array.from(byOperator.entries()).map(([opId, data]) => ({
      operatorId: opId,
      operatorName: data.name,
      dailyMinutes: data.dailyMinutes,
      totalMinutes: data.dailyMinutes.reduce((a, b) => a + b, 0),
    }));
  }, [shifts, weekDays]);

  // Daily totals
  const dailyTotals = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    for (const op of operatorData) {
      for (let i = 0; i < 7; i++) {
        totals[i] += op.dailyMinutes[i];
      }
    }
    return totals;
  }, [operatorData]);

  const grandTotal = dailyTotals.reduce((a, b) => a + b, 0);

  const cellColor = (minutes: number, dayIndex: number): string => {
    if (minutes === 0) {
      // Weekend (Sat=5, Sun=6) = neutral, weekday = red (absent)
      return dayIndex >= 5 ? "#27272a" : "rgba(220, 38, 38, 0.08)";
    }
    if (minutes > OVERTIME_THRESHOLD) return "rgba(245, 158, 11, 0.12)";
    return "rgba(16, 185, 129, 0.08)";
  };

  const textColor = (minutes: number, dayIndex: number): string => {
    if (minutes === 0) return dayIndex >= 5 ? "#52525b" : "#ef4444";
    if (minutes > OVERTIME_THRESHOLD) return "#f59e0b";
    return "#10b981";
  };

  const weekLabel = `${weekDays[0].toLocaleDateString(i18n.language, { day: "numeric", month: "short" })} - ${weekDays[6].toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div>
      {/* Week navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => setWeekOffset((p) => p - 1)}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("timesheet.prevWeek", "Prev")}
        </button>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#e4e4e7",
          }}
        >
          {weekLabel}
        </span>
        <button
          type="button"
          onClick={() => setWeekOffset((p) => Math.min(p + 1, 0))}
          disabled={weekOffset >= 0}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: weekOffset >= 0 ? "#3f3f46" : "#a1a1aa",
            fontSize: 13,
            fontWeight: 600,
            cursor: weekOffset >= 0 ? "default" : "pointer",
          }}
        >
          {t("timesheet.nextWeek", "Next")}
        </button>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 2,
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "#71717a",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t("timesheet.operator", "Operator")}
              </th>
              {weekDays.map((d, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: "center",
                    padding: "6px 8px",
                    color: "#71717a",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    minWidth: 60,
                  }}
                >
                  <div>{formatDayShort(d, i18n.language)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#a1a1aa" }}>
                    {formatDayNum(d)}
                  </div>
                </th>
              ))}
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 12px",
                  color: "#e4e4e7",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                }}
              >
                {t("timesheet.total", "Total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && operatorData.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "#71717a",
                  }}
                >
                  {t("timesheet.loading", "Loading...")}
                </td>
              </tr>
            )}
            {!loading && operatorData.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "#71717a",
                  }}
                >
                  {t("timesheet.noData", "No shift data for this week.")}
                </td>
              </tr>
            )}
            {operatorData.map((op) => (
              <tr key={op.operatorId}>
                <td
                  style={{
                    padding: "8px 12px",
                    color: "#e4e4e7",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {op.operatorName}
                </td>
                {op.dailyMinutes.map((mins, i) => (
                  <td
                    key={i}
                    style={{
                      textAlign: "center",
                      padding: "8px 6px",
                      background: cellColor(mins, i),
                      color: textColor(mins, i),
                      fontWeight: 600,
                      borderRadius: 6,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatHours(mins)}
                    {mins > OVERTIME_THRESHOLD && (
                      <span style={{ fontSize: 10, marginLeft: 2 }}>OT</span>
                    )}
                  </td>
                ))}
                <td
                  style={{
                    textAlign: "center",
                    padding: "8px 12px",
                    color: "#fafafa",
                    fontWeight: 700,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 6,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatHours(op.totalMinutes)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals row */}
          {operatorData.length > 0 && (
            <tfoot>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    color: "#a1a1aa",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  {t("timesheet.totals", "Totals")}
                </td>
                {dailyTotals.map((mins, i) => (
                  <td
                    key={i}
                    style={{
                      textAlign: "center",
                      padding: "8px 6px",
                      color: "#d4d4d8",
                      fontWeight: 700,
                      fontSize: 12,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatHours(mins)}
                  </td>
                ))}
                <td
                  style={{
                    textAlign: "center",
                    padding: "8px 12px",
                    color: "#fafafa",
                    fontWeight: 800,
                    fontSize: 13,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatHours(grandTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
