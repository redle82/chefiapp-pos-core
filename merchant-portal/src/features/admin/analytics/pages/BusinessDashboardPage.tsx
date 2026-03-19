/**
 * BusinessDashboardPage — Executive analytics dashboard at /admin/analytics.
 *
 * KPI cards, revenue trend mini-chart, payment breakdown, top products,
 * busiest hours, and week-over-week comparison. All CSS-based visuals.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ExportButtons } from "../../../../components/common/ExportButtons";
import type { DashboardKPIs } from "../../../../core/analytics/AdvancedAnalyticsService";
import { getDashboardKPIs } from "../../../../core/analytics/AdvancedAnalyticsService";
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

const kpiGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 12,
  marginBottom: 20,
};

const kpiCardStyle: React.CSSProperties = {
  ...cardStyle,
  marginBottom: 0,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 4,
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

const valueText: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "var(--text-primary)",
};

const linkStyle: React.CSSProperties = {
  color: "var(--color-primary, #60a5fa)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 500,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtCents(cents: number): string {
  return currencyService.formatAmount(cents);
}

function fmtPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function ChangeArrow({ value }: { value: number }) {
  if (value > 0) return <span style={{ color: "#22c55e", fontWeight: 600 }}>{fmtPercent(value)}</span>;
  if (value < 0) return <span style={{ color: "#ef4444", fontWeight: 600 }}>{fmtPercent(value)}</span>;
  return <span style={{ color: "var(--text-secondary)" }}>0%</span>;
}

/* ------------------------------------------------------------------ */
/*  Mini bar chart (CSS only)                                           */
/* ------------------------------------------------------------------ */

function MiniBarChart({ data, height = 80 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div
            style={{
              width: "100%",
              maxWidth: 32,
              height: Math.max(2, (d.value / max) * (height - 18)),
              background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)",
              borderRadius: "4px 4px 0 0",
              transition: "height 0.3s ease",
            }}
            title={fmtCents(d.value)}
          />
          <span style={{ fontSize: 9, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal bar                                                      */
/* ------------------------------------------------------------------ */

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{fmtCents(value)}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 4,
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function BusinessDashboardPage() {
  const { t } = useTranslation("analytics");
  const { restaurantId, loading: loadingId } = useRestaurantId();
  const branding = useExportBranding();
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    setLoading(true);
    getDashboardKPIs(restaurantId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [restaurantId]);

  if (loadingId || !restaurantId) return <GlobalLoadingView />;
  if (loading) return <GlobalLoadingView message={t("loading")} />;

  const d = data;

  const paymentColors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const maxPaymentCents = d ? Math.max(...d.paymentBreakdown.map((p) => p.totalCents), 1) : 1;

  const trendData = d?.revenueTrend7d.map((point) => ({
    label: point.date.slice(5), // MM-DD
    value: point.revenueCents,
  })) ?? [];

  return (
    <section className="page-enter admin-content-page" aria-label={t("dashboard.title")}>
      <AdminPageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          d ? (
            <ExportButtons
              title={t("dashboard.title")}
              subtitle={t("dashboard.subtitle")}
              filename="business-dashboard"
              branding={branding}
              formats={["pdf", "csv"]}
              datasets={[
                {
                  name: t("dashboard.title"),
                  columns: [
                    { header: "KPI" },
                    { header: "Value", align: "right" },
                  ],
                  rows: [
                    [t("dashboard.revenueToday"), centsToDecimalStr(d.revenueTodayCents)],
                    [t("dashboard.revenueWeek"), centsToDecimalStr(d.revenueWeekCents)],
                    [t("dashboard.revenueMonth"), centsToDecimalStr(d.revenueMonthCents)],
                    [t("dashboard.ordersToday"), d.ordersTodayCount],
                    [t("dashboard.avgTicket"), centsToDecimalStr(d.avgTicketTodayCents)],
                  ],
                },
              ]}
            />
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div style={kpiGrid}>
        <div style={kpiCardStyle}>
          <span style={subText}>{t("dashboard.revenueToday")}</span>
          <span style={valueText}>{d ? fmtCents(d.revenueTodayCents) : "--"}</span>
        </div>
        <div style={kpiCardStyle}>
          <span style={subText}>{t("dashboard.revenueWeek")}</span>
          <span style={valueText}>{d ? fmtCents(d.revenueWeekCents) : "--"}</span>
          {d && (
            <span style={{ fontSize: 12 }}>
              <ChangeArrow value={d.weekOverWeekChange} />
              {" "}{t("dashboard.vsLastWeek")}
            </span>
          )}
        </div>
        <div style={kpiCardStyle}>
          <span style={subText}>{t("dashboard.revenueMonth")}</span>
          <span style={valueText}>{d ? fmtCents(d.revenueMonthCents) : "--"}</span>
        </div>
        <div style={kpiCardStyle}>
          <span style={subText}>{t("dashboard.ordersToday")}</span>
          <span style={valueText}>{d?.ordersTodayCount ?? "--"}</span>
        </div>
        <div style={kpiCardStyle}>
          <span style={subText}>{t("dashboard.avgTicket")}</span>
          <span style={valueText}>{d ? fmtCents(d.avgTicketTodayCents) : "--"}</span>
        </div>
        <div style={kpiCardStyle}>
          <span style={subText}>{t("dashboard.customerCount")}</span>
          <span style={valueText}>{d?.customerCountToday ?? "--"}</span>
        </div>
      </div>

      {/* Revenue Trend */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>{t("dashboard.revenueTrend")}</h3>
        {trendData.length > 0 ? (
          <MiniBarChart data={trendData} height={100} />
        ) : (
          <p style={subText}>{t("dashboard.noRevenue")}</p>
        )}
      </div>

      {/* Two-column layout: Payments + Top Products */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Payment Methods */}
        <div style={cardStyle}>
          <h3 style={sectionTitle}>{t("dashboard.paymentBreakdown")}</h3>
          {d && d.paymentBreakdown.length > 0 ? (
            d.paymentBreakdown.map((pm, i) => (
              <HorizontalBar
                key={pm.method}
                label={`${pm.method} (${pm.percentage}%)`}
                value={pm.totalCents}
                max={maxPaymentCents}
                color={paymentColors[i % paymentColors.length]}
              />
            ))
          ) : (
            <p style={subText}>{t("noData")}</p>
          )}
        </div>

        {/* Top Products */}
        <div style={cardStyle}>
          <h3 style={sectionTitle}>{t("dashboard.topProducts")}</h3>
          {d && d.topProducts.length > 0 ? (
            <div>
              {d.topProducts.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: i < d.topProducts.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                    fontSize: 13,
                    color: "var(--text-primary)",
                  }}
                >
                  <span>
                    <span style={{ fontWeight: 600, marginRight: 6, color: "var(--text-secondary)" }}>{i + 1}.</span>
                    {p.name}
                    <span style={{ color: "var(--text-secondary)", marginLeft: 6 }}>x{p.soldCount}</span>
                  </span>
                  <span style={{ fontWeight: 600 }}>{fmtCents(p.revenueCents)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={subText}>{t("noData")}</p>
          )}
        </div>
      </div>

      {/* Busiest Hours */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>{t("dashboard.busiestHours")}</h3>
        {d && d.busiestHoursToday.length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {d.busiestHoursToday.map((slot) => (
              <div
                key={slot.hour}
                style={{
                  ...kpiCardStyle,
                  padding: "10px 14px",
                  minWidth: 100,
                  flex: "0 0 auto",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                  {String(slot.hour).padStart(2, "0")}:00
                </span>
                <span style={subText}>{slot.ordersCount} orders</span>
                <span style={subText}>{fmtCents(slot.revenueCents)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={subText}>{t("noData")}</p>
        )}
      </div>

      {/* Navigation links to other analytics pages */}
      <div style={{ ...cardStyle, display: "flex", gap: 24 }}>
        <Link to="/admin/analytics/menu" style={linkStyle}>{t("sidebar.menuPerformance")}</Link>
        <Link to="/admin/analytics/heatmap" style={linkStyle}>{t("sidebar.heatmap")}</Link>
        <Link to="/admin/reports/overview" style={linkStyle}>{t("sidebar.analytics")} / Reports</Link>
      </div>
    </section>
  );
}
