/**
 * ShiftDashboardPage — Admin page for managing operator shifts.
 *
 * Sections:
 * 1. Today's active shifts (who is clocked in)
 * 2. Weekly timesheet grid
 * 3. Shift history (searchable table)
 *
 * Route: /admin/shifts
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  ShiftClockService,
  type ShiftLog,
  type ShiftSummary,
} from "../../../../core/shift/ShiftService";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { TimesheetGrid } from "../components/TimesheetGrid";

/* ── Helpers ────────────────────────────────────────────────────── */

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type TabId = "today" | "timesheet" | "history";

/* ── Component ──────────────────────────────────────────────────── */

export function ShiftDashboardPage() {
  const { t } = useTranslation("shift");
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [tab, setTab] = useState<TabId>("today");
  const [todaySummary, setTodaySummary] = useState<ShiftSummary | null>(null);
  const [history, setHistory] = useState<ShiftLog[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Load today's summary ──────────────────────────────────────
  const loadToday = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      // Auto-close stale shifts first
      await ShiftClockService.autoCloseStaleShifts(restaurantId);
      const summary = await ShiftClockService.getShiftSummary(
        restaurantId,
        todayISO(),
      );
      setTodaySummary(summary);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // ── Load history ──────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const data = await ShiftClockService.getShiftsForRange(restaurantId, {
        from: thirtyDaysAgo.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
      });
      setHistory(data);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (tab === "today") loadToday();
    if (tab === "history") loadHistory();
  }, [tab, loadToday, loadHistory]);

  const filteredHistory = historySearch
    ? history.filter(
        (s) =>
          s.operator_name
            .toLowerCase()
            .includes(historySearch.toLowerCase()) ||
          s.operator_id.includes(historySearch),
      )
    : history;

  const statusLabel = (status: ShiftLog["status"]): string => {
    switch (status) {
      case "active":
        return t("dashboard.statusActive", "Active");
      case "on_break":
        return t("dashboard.statusOnBreak", "On Break");
      case "completed":
        return t("dashboard.statusCompleted", "Completed");
      case "auto_closed":
        return t("dashboard.statusAutoClosed", "Auto-closed");
      default:
        return status;
    }
  };

  const statusColor = (status: ShiftLog["status"]): string => {
    switch (status) {
      case "active":
        return "#10b981";
      case "on_break":
        return "#f59e0b";
      case "completed":
        return "#6b7280";
      case "auto_closed":
        return "#ef4444";
      default:
        return "#71717a";
    }
  };

  // ── Tab styles ────────────────────────────────────────────────

  const tabStyle = (id: TabId): React.CSSProperties => ({
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    background: tab === id ? "rgba(255,255,255,0.08)" : "transparent",
    color: tab === id ? "#fafafa" : "#71717a",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <section className="page-enter admin-content-page flex flex-col gap-6">
      <AdminPageHeader
        title={t("dashboard.title", "Shifts")}
        subtitle={t(
          "dashboard.subtitle",
          "Clock in/out tracking, timesheets and shift history.",
        )}
        actions={
          <button
            type="button"
            onClick={() => {
              if (tab === "today") loadToday();
              else if (tab === "history") loadHistory();
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "#a1a1aa",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("dashboard.refresh", "Refresh")}
          </button>
        }
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <button type="button" style={tabStyle("today")} onClick={() => setTab("today")}>
          {t("dashboard.tabToday", "Today")}
          {todaySummary && todaySummary.activeNow > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "#10b981",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 8,
              }}
            >
              {todaySummary.activeNow}
            </span>
          )}
        </button>
        <button type="button" style={tabStyle("timesheet")} onClick={() => setTab("timesheet")}>
          {t("dashboard.tabTimesheet", "Timesheet")}
        </button>
        <button type="button" style={tabStyle("history")} onClick={() => setTab("history")}>
          {t("dashboard.tabHistory", "History")}
        </button>
      </div>

      {/* ── Tab: Today ────────────────────────────────────────────── */}
      {tab === "today" && (
        <div>
          {loading && !todaySummary && (
            <p style={{ color: "#71717a", padding: 24, textAlign: "center" }}>
              {t("dashboard.loading", "Loading...")}
            </p>
          )}

          {todaySummary && (
            <>
              {/* Summary cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <SummaryCard
                  label={t("dashboard.activeNow", "Active now")}
                  value={String(todaySummary.activeNow)}
                  accent="#10b981"
                />
                <SummaryCard
                  label={t("dashboard.totalShifts", "Total shifts")}
                  value={String(todaySummary.totalShifts)}
                  accent="#3b82f6"
                />
                <SummaryCard
                  label={t("dashboard.hoursWorked", "Hours worked")}
                  value={formatDuration(todaySummary.totalMinutesWorked)}
                  accent="#8b5cf6"
                />
              </div>

              {/* Active shifts list */}
              {todaySummary.shifts.length === 0 ? (
                <p style={{ color: "#71717a", textAlign: "center", padding: 24 }}>
                  {t("dashboard.noShiftsToday", "No shifts today.")}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {todaySummary.shifts.map((shift) => {
                    const hours = ShiftClockService.calculateHours(shift);
                    return (
                      <div
                        key={shift.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: statusColor(shift.status),
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div
                              style={{
                                color: "#e4e4e7",
                                fontWeight: 600,
                                fontSize: 14,
                              }}
                            >
                              {shift.operator_name || shift.operator_id.slice(0, 8)}
                            </div>
                            <div style={{ color: "#71717a", fontSize: 12 }}>
                              {formatTime(shift.clock_in)}
                              {shift.clock_out && ` - ${formatTime(shift.clock_out)}`}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                          }}
                        >
                          <span
                            style={{
                              color: statusColor(shift.status),
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {statusLabel(shift.status)}
                          </span>
                          <span
                            style={{
                              color: "#d4d4d8",
                              fontSize: 14,
                              fontWeight: 600,
                              fontVariantNumeric: "tabular-nums",
                              minWidth: 60,
                              textAlign: "right",
                            }}
                          >
                            {formatDuration(hours.workedMinutes)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Timesheet ───────────────────────────────────────── */}
      {tab === "timesheet" && <TimesheetGrid />}

      {/* ── Tab: History ──────────────────────────────────────────── */}
      {tab === "history" && (
        <div>
          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder={t(
                "dashboard.searchPlaceholder",
                "Search by operator name...",
              )}
              style={{
                width: "100%",
                maxWidth: 340,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "#e4e4e7",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          {loading && history.length === 0 ? (
            <p style={{ color: "#71717a", textAlign: "center", padding: 24 }}>
              {t("dashboard.loading", "Loading...")}
            </p>
          ) : filteredHistory.length === 0 ? (
            <p style={{ color: "#71717a", textAlign: "center", padding: 24 }}>
              {t("dashboard.noHistory", "No shift history found.")}
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0 4px",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    {[
                      t("dashboard.colOperator", "Operator"),
                      t("dashboard.colDate", "Date"),
                      t("dashboard.colClockIn", "Clock In"),
                      t("dashboard.colClockOut", "Clock Out"),
                      t("dashboard.colBreaks", "Breaks"),
                      t("dashboard.colTotal", "Total"),
                      t("dashboard.colStatus", "Status"),
                    ].map((col) => (
                      <th
                        key={col}
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
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((shift) => {
                    const hours = ShiftClockService.calculateHours(shift);
                    return (
                      <tr key={shift.id}>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#e4e4e7",
                            fontWeight: 500,
                          }}
                        >
                          {shift.operator_name || shift.operator_id.slice(0, 8)}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#a1a1aa",
                          }}
                        >
                          {formatDate(shift.clock_in)}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#a1a1aa",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatTime(shift.clock_in)}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#a1a1aa",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {shift.clock_out ? formatTime(shift.clock_out) : "-"}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#a1a1aa",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {hours.breakMinutes > 0
                            ? `${hours.breakMinutes}m`
                            : "-"}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#d4d4d8",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatDuration(hours.workedMinutes)}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              color: statusColor(shift.status),
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {statusLabel(shift.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Summary Card sub-component ─────────────────────────────────── */

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#71717a",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: accent,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
