/**
 * WasteDashboardWidget — Summary widget for waste tracking.
 *
 * Shows KPI cards (today/week/month), top 5 wasted products,
 * waste by reason breakdown, and a 4-week trend bar.
 * Dark theme with amber accents.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../../core/currency/useCurrency";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import {
  wasteTrackingService,
  type WasteDashboardData,
} from "../../../../core/inventory/WasteTrackingService";

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const widget: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: 12,
  padding: 20,
};

const titleRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const titleText: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#f5f5f5",
};

const kpiGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
  marginBottom: 20,
};

const kpiCard: React.CSSProperties = {
  background: "#262626",
  border: "1px solid #333",
  borderRadius: 8,
  padding: "12px 14px",
  textAlign: "center" as const,
};

const kpiValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#fbbf24",
};

const kpiLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#737373",
  marginTop: 2,
};

const kpiUnits: React.CSSProperties = {
  fontSize: 12,
  color: "#a3a3a3",
  marginTop: 2,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#a3a3a3",
  marginBottom: 8,
  marginTop: 16,
};

const productRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 0",
  borderBottom: "1px solid #262626",
  fontSize: 13,
};

const reasonBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 0",
  fontSize: 13,
};

const barFill: (pct: number) => React.CSSProperties = (pct) => ({
  height: 6,
  borderRadius: 3,
  background: "#d97706",
  width: `${Math.max(pct, 2)}%`,
  transition: "width 0.3s ease",
});

const trendRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 4,
  height: 60,
  marginTop: 8,
};

const trendBar: (heightPct: number) => React.CSSProperties = (heightPct) => ({
  flex: 1,
  background: "#d97706",
  borderRadius: "4px 4px 0 0",
  height: `${Math.max(heightPct, 4)}%`,
  transition: "height 0.3s ease",
  minHeight: 2,
});

const trendLabel: React.CSSProperties = {
  fontSize: 10,
  color: "#737373",
  textAlign: "center" as const,
  marginTop: 4,
};

const loadingText: React.CSSProperties = {
  color: "#737373",
  fontSize: 13,
  textAlign: "center" as const,
  padding: 20,
};

const percentBadge: React.CSSProperties = {
  fontSize: 11,
  color: "#d97706",
  background: "#292211",
  padding: "2px 8px",
  borderRadius: 4,
  fontWeight: 600,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WasteDashboardWidget() {
  const { t } = useTranslation("operational");
  const { symbol: currencySymbol } = useCurrency();
  const { identity } = useRestaurantIdentity();
  const restaurantId =
    identity?.restaurantId || "00000000-0000-0000-0000-000000000100";

  const [data, setData] = useState<WasteDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const result = await wasteTrackingService.getDashboardData(restaurantId);
        if (!cancelled) setData(result);
      } catch {
        // Silent failure — widget is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const fmt = (cents: number) =>
    `${currencySymbol}${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div style={widget}>
        <div style={titleRow}>
          <span style={titleText}>
            {t("waste.dashboardTitle", { defaultValue: "Waste Tracking" })}
          </span>
        </div>
        <p style={loadingText}>
          {t("waste.loading", { defaultValue: "Loading..." })}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const maxTrendCost = Math.max(...data.trends.map((p) => p.totalCostCents), 1);

  return (
    <div style={widget}>
      {/* Header */}
      <div style={titleRow}>
        <span style={titleText}>
          {t("waste.dashboardTitle", { defaultValue: "Waste Tracking" })}
        </span>
        {data.wastePercentOfInventory > 0 && (
          <span style={percentBadge}>
            {data.wastePercentOfInventory.toFixed(1)}%{" "}
            {t("waste.ofInventory", { defaultValue: "of inventory" })}
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div style={kpiGrid}>
        <div style={kpiCard}>
          <div style={kpiValue}>{fmt(data.todayCostCents)}</div>
          <div style={kpiLabel}>
            {t("waste.today", { defaultValue: "Today" })}
          </div>
          <div style={kpiUnits}>
            {data.todayUnits} {t("waste.units", { defaultValue: "units" })}
          </div>
        </div>
        <div style={kpiCard}>
          <div style={kpiValue}>{fmt(data.weekCostCents)}</div>
          <div style={kpiLabel}>
            {t("waste.thisWeek", { defaultValue: "This Week" })}
          </div>
          <div style={kpiUnits}>
            {data.weekUnits} {t("waste.units", { defaultValue: "units" })}
          </div>
        </div>
        <div style={kpiCard}>
          <div style={kpiValue}>{fmt(data.monthCostCents)}</div>
          <div style={kpiLabel}>
            {t("waste.thisMonth", { defaultValue: "This Month" })}
          </div>
          <div style={kpiUnits}>
            {data.monthUnits} {t("waste.units", { defaultValue: "units" })}
          </div>
        </div>
      </div>

      {/* Top Wasted Products */}
      {data.topWastedProducts.length > 0 && (
        <>
          <div style={sectionTitle}>
            {t("waste.topWasted", { defaultValue: "Top Wasted Products" })}
          </div>
          {data.topWastedProducts.map((p) => (
            <div key={p.ingredientId} style={productRow}>
              <span style={{ color: "#e5e5e5" }}>{p.ingredientName}</span>
              <span style={{ color: "#fbbf24", fontWeight: 600, fontSize: 12 }}>
                {fmt(p.totalCostCents)} ({p.totalQuantity} {p.unit})
              </span>
            </div>
          ))}
        </>
      )}

      {/* Waste by Reason */}
      {data.byReason.length > 0 && (
        <>
          <div style={sectionTitle}>
            {t("waste.byReason", { defaultValue: "By Reason" })}
          </div>
          {data.byReason.map((r) => {
            const maxCost = data.byReason[0]?.totalCostCents || 1;
            const pct = (r.totalCostCents / maxCost) * 100;
            return (
              <div key={r.reason} style={reasonBar}>
                <span style={{ color: "#a3a3a3", width: 120, flexShrink: 0 }}>
                  {t(`waste.reason.${r.reason}`, { defaultValue: r.reason })}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={barFill(pct)} />
                </div>
                <span
                  style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600, width: 70, textAlign: "right" }}
                >
                  {fmt(r.totalCostCents)}
                </span>
              </div>
            );
          })}
        </>
      )}

      {/* 4-Week Trend */}
      {data.trends.length > 0 && (
        <>
          <div style={sectionTitle}>
            {t("waste.trendTitle", { defaultValue: "Weekly Trend" })}
          </div>
          <div style={trendRow}>
            {data.trends.map((point) => (
              <div key={point.periodStart} style={{ flex: 1, textAlign: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    height: 50,
                  }}
                >
                  <div
                    style={trendBar(
                      (point.totalCostCents / maxTrendCost) * 100,
                    )}
                  />
                </div>
                <div style={trendLabel}>{point.periodLabel}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {data.topWastedProducts.length === 0 &&
        data.byReason.length === 0 && (
          <p
            style={{
              color: "#737373",
              fontSize: 13,
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            {t("waste.noData", {
              defaultValue:
                "No waste data yet. Use 'Log Waste' to start tracking.",
            })}
          </p>
        )}
    </div>
  );
}
