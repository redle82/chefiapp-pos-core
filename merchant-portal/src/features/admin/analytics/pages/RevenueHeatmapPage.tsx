/**
 * RevenueHeatmapPage — 7x24 heatmap grid (days x hours) with color intensity.
 *
 * Route: /admin/analytics/heatmap
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExportButtons } from "../../../../components/common/ExportButtons";
import type { RevenueHeatmapResult } from "../../../../core/analytics/AdvancedAnalyticsService";
import { getRevenueByHour } from "../../../../core/analytics/AdvancedAnalyticsService";
import { currencyService } from "../../../../core/currency/CurrencyService";
import { centsToDecimalStr } from "../../../../core/export/ExportService";
import { useExportBranding } from "../../../../core/export/useExportBranding";
import { GlobalLoadingView } from "../../../../ui/design-system/components";
import { useRestaurantId } from "../../../../ui/hooks/useRestaurantId";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg-on-dark, var(--surface-elevated))",
  borderRadius: 8,
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  border: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text-primary)",
  margin: "0 0 12px 0",
};

const subText: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-secondary)",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtCents(cents: number): string {
  return currencyService.formatAmount(cents);
}

function intensityColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "rgba(59, 130, 246, 0.03)";
  const ratio = value / max;
  // Gradient from very light blue to deep blue
  if (ratio < 0.1) return "rgba(59, 130, 246, 0.06)";
  if (ratio < 0.25) return "rgba(59, 130, 246, 0.15)";
  if (ratio < 0.4) return "rgba(59, 130, 246, 0.25)";
  if (ratio < 0.55) return "rgba(59, 130, 246, 0.4)";
  if (ratio < 0.7) return "rgba(59, 130, 246, 0.55)";
  if (ratio < 0.85) return "rgba(59, 130, 246, 0.72)";
  return "rgba(59, 130, 246, 0.9)";
}

/* ------------------------------------------------------------------ */
/*  Tooltip component                                                   */
/* ------------------------------------------------------------------ */

function HeatmapTooltip({
  visible,
  x,
  y,
  content,
}: {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: x + 12,
        top: y - 30,
        background: "#1a1a1a",
        border: "1px solid #404040",
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 12,
        color: "#e5e5e5",
        pointerEvents: "none",
        zIndex: 1000,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {content}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function RevenueHeatmapPage() {
  const { t } = useTranslation("analytics");
  const { restaurantId, loading: loadingId } = useRestaurantId();
  const branding = useExportBranding();
  const [data, setData] = useState<RevenueHeatmapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(30);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: string }>({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  const dayLabels = useMemo(
    () => [
      t("heatmap.days.mon"),
      t("heatmap.days.tue"),
      t("heatmap.days.wed"),
      t("heatmap.days.thu"),
      t("heatmap.days.fri"),
      t("heatmap.days.sat"),
      t("heatmap.days.sun"),
    ],
    [t],
  );

  const hourLabels = useMemo(
    () => Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`),
    [],
  );

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    setLoading(true);
    const now = new Date();
    const from = new Date(now.getTime() - periodDays * 86400 * 1000);
    getRevenueByHour(restaurantId, { from, to: now })
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [restaurantId, periodDays]);

  if (loadingId || !restaurantId) return <GlobalLoadingView />;
  if (loading) return <GlobalLoadingView message={t("loading")} />;

  const cellsByKey = new Map<string, { revenueCents: number; ordersCount: number }>();
  if (data) {
    for (const cell of data.cells) {
      cellsByKey.set(`${cell.dayOfWeek}-${cell.hour}`, { revenueCents: cell.revenueCents, ordersCount: cell.ordersCount });
    }
  }

  const maxRevenue = data?.maxRevenueCents ?? 0;

  // Build export data
  const exportRows: Array<Array<unknown>> = [];
  for (let d = 0; d < 7; d++) {
    const row: unknown[] = [dayLabels[d]];
    for (let h = 0; h < 24; h++) {
      const cell = cellsByKey.get(`${d}-${h}`);
      row.push(cell ? centsToDecimalStr(cell.revenueCents) : "0.00");
    }
    exportRows.push(row);
  }

  return (
    <section className="page-enter admin-content-page" aria-label={t("heatmap.title")}>
      <AdminPageHeader
        title={t("heatmap.title")}
        subtitle={t("heatmap.subtitle")}
        actions={
          data ? (
            <ExportButtons
              title={t("heatmap.title")}
              filename="revenue-heatmap"
              branding={branding}
              formats={["pdf", "excel", "csv"]}
              orientation="landscape"
              datasets={[
                {
                  name: t("heatmap.title"),
                  columns: [
                    { header: "" },
                    ...hourLabels.map((h) => ({ header: h })),
                  ],
                  rows: exportRows,
                },
              ]}
            />
          ) : undefined
        }
      />

      {/* Period selector */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        {[7, 14, 30, 90].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => setPeriodDays(days)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: periodDays === days ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
              background: periodDays === days ? "rgba(59,130,246,0.15)" : "transparent",
              color: periodDays === days ? "#60a5fa" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {days}d
          </button>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>{t("heatmap.title")}</h3>
        {!data || maxRevenue === 0 ? (
          <p style={subText}>{t("heatmap.noHeatmapData")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ padding: "4px 8px", fontSize: 11, color: "var(--text-secondary)", textAlign: "left" }} />
                  {hourLabels.map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "4px 2px",
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        textAlign: "center",
                        fontWeight: 400,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayLabels.map((dayLabel, dayIdx) => (
                  <tr key={dayIdx}>
                    <td
                      style={{
                        padding: "4px 8px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {dayLabel}
                    </td>
                    {hourLabels.map((_, hourIdx) => {
                      const cell = cellsByKey.get(`${dayIdx}-${hourIdx}`);
                      const revenue = cell?.revenueCents ?? 0;
                      const orders = cell?.ordersCount ?? 0;
                      return (
                        <td
                          key={hourIdx}
                          style={{
                            padding: 1,
                          }}
                          onMouseEnter={(e) => {
                            setTooltip({
                              visible: true,
                              x: e.clientX,
                              y: e.clientY,
                              content: `${dayLabel} ${String(hourIdx).padStart(2, "0")}:00 - ${fmtCents(revenue)} (${orders} orders)`,
                            });
                          }}
                          onMouseMove={(e) => {
                            setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
                          }}
                          onMouseLeave={() => {
                            setTooltip((prev) => ({ ...prev, visible: false }));
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: 28,
                              minWidth: 20,
                              borderRadius: 3,
                              background: intensityColor(revenue, maxRevenue),
                              transition: "background 0.2s ease",
                              cursor: "crosshair",
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", marginRight: 4 }}>Low</span>
              {[0.03, 0.15, 0.25, 0.4, 0.55, 0.72, 0.9].map((opacity, i) => (
                <div
                  key={i}
                  style={{
                    width: 20,
                    height: 12,
                    borderRadius: 2,
                    background: `rgba(59, 130, 246, ${opacity})`,
                  }}
                />
              ))}
              <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 4 }}>High</span>
            </div>
          </div>
        )}
      </div>

      {/* Peak Times + Staffing Suggestions */}
      {data && data.peakHours.length > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>{t("heatmap.peakTimes")}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {data.peakHours.map((h) => (
              <span
                key={h}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#60a5fa",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {h}
              </span>
            ))}
          </div>
          <div style={{ ...cardStyle, background: "rgba(34,197,94,0.06)", borderColor: "#22c55e", marginBottom: 0 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#22c55e", margin: "0 0 4px 0" }}>
              {t("heatmap.staffingSuggestion")}
            </h4>
            <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0 }}>
              {t("heatmap.staffHint", { hours: data.peakHours.join(", ") })}
            </p>
          </div>
        </div>
      )}

      <HeatmapTooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        content={tooltip.content}
      />
    </section>
  );
}
