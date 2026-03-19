/**
 * WasteReportPage — Admin page for detailed waste reporting.
 *
 * Route: /admin/inventory/waste
 * Features: date range filter, detailed table, summary stats,
 * export (PDF/Excel/CSV), actionable insights.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ExportButtons } from "../../../../components/common/ExportButtons";
import { useCurrency } from "../../../../core/currency/useCurrency";
import { useExportBranding } from "../../../../core/export/useExportBranding";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import {
  wasteTrackingService,
  type WasteByReasonSummary,
  type WasteLogEntry,
} from "../../../../core/inventory/WasteTrackingService";
import type { ExportDataset } from "../../../../core/export/ExportService";
import { WasteDashboardWidget } from "../components/WasteDashboardWidget";

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const page: React.CSSProperties = {
  padding: 24,
  maxWidth: 1100,
  margin: "0 auto",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 20,
};

const titleText: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#f5f5f5",
};

const subtitle: React.CSSProperties = {
  fontSize: 13,
  color: "#737373",
  marginTop: 4,
};

const filterRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #404040",
  background: "#262626",
  color: "#e5e5e5",
  fontSize: 14,
  outline: "none",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginTop: 16,
};

const th: React.CSSProperties = {
  textAlign: "left" as const,
  padding: "10px 12px",
  borderBottom: "2px solid #333",
  fontSize: 12,
  fontWeight: 600,
  color: "#737373",
  textTransform: "uppercase" as const,
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #262626",
  fontSize: 13,
  color: "#d4d4d4",
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
  marginBottom: 24,
};

const summaryCard: React.CSSProperties = {
  background: "#262626",
  border: "1px solid #333",
  borderRadius: 8,
  padding: "14px 16px",
  textAlign: "center" as const,
};

const summaryValue: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#fbbf24",
};

const summaryLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#737373",
  marginTop: 4,
};

const insightBox: React.CSSProperties = {
  background: "#1c1917",
  border: "1px solid #78350f",
  borderRadius: 8,
  padding: "14px 18px",
  marginTop: 20,
  fontSize: 13,
  color: "#fbbf24",
  lineHeight: 1.5,
};

const reasonBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  background: "#292211",
  color: "#d97706",
};

const emptyState: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "40px 20px",
  color: "#737373",
  fontSize: 14,
};

const backBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#a3a3a3",
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
  marginBottom: 12,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WasteReportPage() {
  const { t } = useTranslation("operational");
  const navigate = useNavigate();
  const { symbol: currencySymbol } = useCurrency();
  const { identity } = useRestaurantIdentity();
  const exportBranding = useExportBranding();
  const restaurantId =
    identity?.restaurantId || "00000000-0000-0000-0000-000000000100";

  // Date range (default: last 30 days)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [entries, setEntries] = useState<WasteLogEntry[]>([]);
  const [byReason, setByReason] = useState<WasteByReasonSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);

      const [entriesData, reasonData] = await Promise.all([
        wasteTrackingService.getWasteByPeriod(
          restaurantId,
          from.toISOString(),
          to.toISOString(),
        ),
        wasteTrackingService.getWasteByCategoryReport(
          restaurantId,
          from.toISOString(),
          to.toISOString(),
        ),
      ]);

      setEntries(entriesData);
      setByReason(reasonData);
    } catch {
      // Silent failure
    } finally {
      setLoading(false);
    }
  }, [restaurantId, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (cents: number) =>
    `${currencySymbol}${(cents / 100).toFixed(2)}`;

  // Summary stats
  const totalCostCents = entries.reduce(
    (s, e) => s + Number(e.cost_cents),
    0,
  );
  const totalUnits = entries.reduce((s, e) => s + Number(e.quantity), 0);
  const totalEvents = entries.length;

  // Top reason for insights
  const topReason = byReason[0];

  // Actionable insight
  const insight = useMemo(() => {
    if (!topReason || topReason.totalCostCents <= 0) return null;

    const reasonLabel = t(`waste.reason.${topReason.reason}`, {
      defaultValue: topReason.reason,
    });
    const savingsIfHalved = fmt(Math.round(topReason.totalCostCents / 2));

    return t("waste.insight", {
      reason: reasonLabel,
      cost: fmt(topReason.totalCostCents),
      savings: savingsIfHalved,
      defaultValue: `Top waste cause: {{reason}} ({{cost}}). Reducing it by 50% would save {{savings}}/period.`,
    });
  }, [topReason, fmt, t]);

  // Export datasets
  const exportDatasets: ExportDataset[] = useMemo(
    () => [
      {
        title: t("waste.reportTitle", { defaultValue: "Waste Report" }),
        headers: [
          t("waste.colDate", { defaultValue: "Date" }),
          t("waste.colProduct", { defaultValue: "Product" }),
          t("waste.colQuantity", { defaultValue: "Qty" }),
          t("waste.colUnit", { defaultValue: "Unit" }),
          t("waste.colReason", { defaultValue: "Reason" }),
          t("waste.colCost", { defaultValue: "Cost" }),
          t("waste.colOperator", { defaultValue: "Operator" }),
          t("waste.colNotes", { defaultValue: "Notes" }),
        ],
        rows: entries.map((e) => [
          new Date(e.created_at).toLocaleDateString(),
          e.ingredient_name || "",
          String(e.quantity),
          e.unit,
          t(`waste.reason.${e.reason}`, { defaultValue: e.reason }),
          fmt(e.cost_cents),
          e.operator_name || "-",
          e.notes || "",
        ]),
      },
    ],
    [entries, fmt, t],
  );

  const dateRangeLabel = `${dateFrom} - ${dateTo}`;

  return (
    <div style={page}>
      {/* Back */}
      <button
        type="button"
        style={backBtn}
        onClick={() => navigate(-1)}
      >
        {t("waste.back", { defaultValue: "\u2190 Back" })}
      </button>

      {/* Header */}
      <div style={headerRow}>
        <div>
          <div style={titleText}>
            {t("waste.reportTitle", { defaultValue: "Waste Report" })}
          </div>
          <div style={subtitle}>
            {t("waste.reportSubtitle", {
              defaultValue:
                "Detailed view of waste events with cost analysis and trends.",
            })}
          </div>
        </div>
        <ExportButtons
          title={t("waste.reportTitle", { defaultValue: "Waste Report" })}
          subtitle={t("waste.reportSubtitle", {
            defaultValue: "Detailed waste analysis",
          })}
          dateRange={dateRangeLabel}
          filename={`waste-report-${dateFrom}-${dateTo}`}
          branding={exportBranding}
          datasets={exportDatasets}
          disabled={entries.length === 0}
          orientation="landscape"
        />
      </div>

      {/* Date filters */}
      <div style={filterRow}>
        <label style={{ color: "#a3a3a3", fontSize: 13 }}>
          {t("waste.filterFrom", { defaultValue: "From" })}
        </label>
        <input
          type="date"
          style={inputStyle}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <label style={{ color: "#a3a3a3", fontSize: 13 }}>
          {t("waste.filterTo", { defaultValue: "To" })}
        </label>
        <input
          type="date"
          style={inputStyle}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      {/* Summary cards */}
      <div style={summaryGrid}>
        <div style={summaryCard}>
          <div style={summaryValue}>{fmt(totalCostCents)}</div>
          <div style={summaryLabel}>
            {t("waste.totalCost", { defaultValue: "Total Cost" })}
          </div>
        </div>
        <div style={summaryCard}>
          <div style={summaryValue}>{totalUnits}</div>
          <div style={summaryLabel}>
            {t("waste.totalUnits", { defaultValue: "Total Units" })}
          </div>
        </div>
        <div style={summaryCard}>
          <div style={summaryValue}>{totalEvents}</div>
          <div style={summaryLabel}>
            {t("waste.totalEvents", { defaultValue: "Events" })}
          </div>
        </div>
        <div style={summaryCard}>
          <div style={summaryValue}>
            {totalEvents > 0
              ? fmt(Math.round(totalCostCents / totalEvents))
              : fmt(0)}
          </div>
          <div style={summaryLabel}>
            {t("waste.avgCostPerEvent", { defaultValue: "Avg per Event" })}
          </div>
        </div>
      </div>

      {/* Dashboard Widget */}
      <WasteDashboardWidget />

      {/* Insight */}
      {insight && <div style={insightBox}>{insight}</div>}

      {/* Detailed table */}
      {loading ? (
        <p style={emptyState}>
          {t("waste.loading", { defaultValue: "Loading..." })}
        </p>
      ) : entries.length === 0 ? (
        <p style={emptyState}>
          {t("waste.noData", {
            defaultValue:
              "No waste data yet. Use 'Log Waste' to start tracking.",
          })}
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>
                  {t("waste.colDate", { defaultValue: "Date" })}
                </th>
                <th style={th}>
                  {t("waste.colProduct", { defaultValue: "Product" })}
                </th>
                <th style={th}>
                  {t("waste.colQuantity", { defaultValue: "Qty" })}
                </th>
                <th style={th}>
                  {t("waste.colReason", { defaultValue: "Reason" })}
                </th>
                <th style={th}>
                  {t("waste.colCost", { defaultValue: "Cost" })}
                </th>
                <th style={th}>
                  {t("waste.colOperator", { defaultValue: "Operator" })}
                </th>
                <th style={th}>
                  {t("waste.colNotes", { defaultValue: "Notes" })}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td style={td}>
                    {new Date(entry.created_at).toLocaleDateString()}{" "}
                    <span style={{ color: "#737373", fontSize: 11 }}>
                      {new Date(entry.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td style={td}>{entry.ingredient_name}</td>
                  <td style={td}>
                    {entry.quantity} {entry.unit}
                  </td>
                  <td style={td}>
                    <span style={reasonBadge}>
                      {t(`waste.reason.${entry.reason}`, {
                        defaultValue: entry.reason,
                      })}
                    </span>
                  </td>
                  <td style={{ ...td, color: "#fbbf24", fontWeight: 600 }}>
                    {fmt(entry.cost_cents)}
                  </td>
                  <td style={td}>{entry.operator_name || "-"}</td>
                  <td style={{ ...td, color: "#a3a3a3", maxWidth: 200 }}>
                    {entry.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
