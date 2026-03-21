import React, { useEffect, useRef } from "react";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import { GlobalErrorView } from "../../../ui/design-system/components";
import { useRevenueDashboard } from "./useRevenueDashboard";
import {
  trackAdminRevenueDashboardView,
  trackAdminRevenueMetricView,
  trackAdminRevenueGrowthFlag,
} from "./revenueTracking";

function formatEur(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type NrrState = "green" | "yellow" | "red" | null;

function MetricCard({
  label,
  value,
  metricKey,
  nrrState,
  onMetricHover,
}: {
  label: string;
  value: string | number;
  metricKey: string;
  nrrState?: NrrState;
  onMetricHover?: (metric: string) => void;
}) {
  const borderColor =
    nrrState === "green"
      ? "2px solid #22c55e"
      : nrrState === "yellow"
        ? "2px solid #eab308"
        : nrrState === "red"
          ? "2px solid #ef4444"
          : "1px solid var(--border-default, #e5e7eb)";
  return (
    <div
      role="group"
      onMouseEnter={() => onMetricHover?.(metricKey)}
      style={{
        padding: 16,
        borderRadius: 8,
        border: borderColor,
        backgroundColor: "var(--surface-subtle, #f9fafb)",
        cursor: onMetricHover ? "pointer" : undefined,
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function GrowthBadge() {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 6,
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        border: "1px solid rgba(34, 197, 94, 0.4)",
        fontSize: "0.85rem",
        fontWeight: 600,
        color: "#15803d",
      }}
    >
      Enterprise growth accelerating
    </div>
  );
}

export function RevenueDashboardPage() {
  const { data, loading, error, refresh } = useRevenueDashboard();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!data || trackedRef.current) return;
    trackAdminRevenueDashboardView();
    trackedRef.current = true;
  }, [data]);

  const growthFlagTrackedRef = useRef(false);
  const mrrGrowthForBadge = data ? (data.mrrGrowthMonthOverMonthPct ?? 0) : 0;
  const showGrowthForBadge = data
    ? mrrGrowthForBadge > 15 && (data.churnRatePct ?? 0) < 3
    : false;
  useEffect(() => {
    if (showGrowthForBadge && !growthFlagTrackedRef.current) {
      trackAdminRevenueGrowthFlag(mrrGrowthForBadge);
      growthFlagTrackedRef.current = true;
    }
  }, [showGrowthForBadge, mrrGrowthForBadge]);

  if (loading && !data) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Revenue" subtitle="Carregando..." />
        <div style={{ padding: 48, textAlign: "center" }}>
          Carregando métricas...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Revenue" />
        <GlobalErrorView
          layout="portal"
          variant="inline"
          title="Erro ao carregar"
          message={error}
          action={{ label: "Tentar novamente", onClick: refresh }}
        />
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const mrrGrowth = data.mrrGrowthMonthOverMonthPct ?? 0;
  const churn = data.churnRatePct ?? 0;
  const showGrowthBadge = mrrGrowth > 15 && churn < 3;

  const handleMetricHover = (metric: string) => {
    trackAdminRevenueMetricView(metric);
  };

  const nrrPct = data.nrrPct ?? null;
  const nrrState: NrrState =
    nrrPct === null ? null : nrrPct > 100 ? "green" : nrrPct >= 90 ? "yellow" : "red";

  return (
    <section
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <AdminPageHeader
        title="Revenue"
        subtitle="Métricas internas de receita e organizações"
        actions={
          <button
            type="button"
            onClick={refresh}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid var(--border-default, #e5e7eb)",
              backgroundColor: "var(--surface-subtle, #f9fafb)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        }
      />

      {showGrowthBadge && <GrowthBadge />}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Total MRR"
          value={formatEur(data.totalMrrCents)}
          metricKey="total_mrr"
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="Total ARR"
          value={formatEur(data.totalArrCents)}
          metricKey="total_arr"
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="Active Orgs"
          value={data.activeOrgs}
          metricKey="active_orgs"
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="Grace Orgs"
          value={data.graceOrgs}
          metricKey="grace_orgs"
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="Suspended Orgs"
          value={data.suspendedOrgs}
          metricKey="suspended_orgs"
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="Churn rate %"
          value={`${data.churnRatePct}%`}
          metricKey="churn_rate"
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="ARPU"
          value={data.arpuCents != null ? formatEur(data.arpuCents) : "—"}
          metricKey="arpu"
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="LTV"
          value={data.ltvCents != null ? formatEur(data.ltvCents) : "—"}
          metricKey="ltv"
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="Net Revenue Retention %"
          value={data.nrrPct != null ? `${data.nrrPct}%` : "—"}
          metricKey="nrr"
          nrrState={nrrState ?? undefined}
          onMetricHover={handleMetricHover}
        />
        <MetricCard
          label="ARR Growth YoY %"
          value={data.arrGrowthYoYPct != null ? `${data.arrGrowthYoYPct}%` : "—"}
          metricKey="arr_growth_yoy"
          onMetricHover={handleMetricHover}
        />
      </div>

      <div>
        <h3
          style={{
            marginBottom: 12,
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Revenue by country
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "2px solid var(--border-default, #e5e7eb)",
                }}
              >
                Country
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "10px 12px",
                  borderBottom: "2px solid var(--border-default, #e5e7eb)",
                }}
              >
                MRR
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "10px 12px",
                  borderBottom: "2px solid var(--border-default, #e5e7eb)",
                }}
              >
                Orgs
              </th>
            </tr>
          </thead>
          <tbody>
            {data.revenueByCountry.map((row) => (
              <tr key={row.country}>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--border-default, #e5e7eb)",
                  }}
                >
                  {row.country}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--border-default, #e5e7eb)",
                    textAlign: "right",
                  }}
                >
                  {formatEur(row.mrrCents)}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--border-default, #e5e7eb)",
                    textAlign: "right",
                  }}
                >
                  {row.orgCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
