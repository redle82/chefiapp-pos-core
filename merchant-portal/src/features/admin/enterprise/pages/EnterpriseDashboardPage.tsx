import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../../../../core/tenant/TenantContext";
import { CONFIG } from "../../../../config";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import {
  GlobalEmptyView,
  GlobalErrorView,
} from "../../../../ui/design-system/components";
import { OrgStatusHeader } from "../components/OrgStatusHeader";
import { OrgLocationsTable } from "../components/OrgLocationsTable";
import { OrgDiscrepancyHeatmap } from "../components/OrgDiscrepancyHeatmap";
import { BackendMissingInstructions } from "../components/BackendMissingInstructions";
import { FinancialRiskScoreCard } from "../components/FinancialRiskScoreCard";
import { HighRiskBanner } from "../components/HighRiskBanner";
import { EnterpriseHealthBanner } from "../components/EnterpriseHealthBanner";
import { RevenueTrendMiniChart } from "../components/RevenueTrendMiniChart";
import { EnterpriseUpsellCTA } from "../components/EnterpriseUpsellCTA";
import { useOrgConsolidation } from "../useOrgConsolidation";
import {
  trackEnterprisePageView,
  trackEnterpriseDateChange,
  trackEnterpriseHeatmapToggle,
  trackEnterpriseHeatmapDayClick,
  trackEnterpriseExportClick,
  trackEnterpriseBackendMissing,
  trackEnterpriseRiskView,
  trackEnterpriseRiskHigh,
  trackEnterpriseTrendDetected,
  trackEnterpriseHealthBannerView,
  trackEnterpriseTrendView,
  trackEnterpriseUpsellView,
  trackEnterpriseUpsellClick,
} from "../enterpriseTracking";
import { isLeadHot } from "../../../../commercial/tracking/leadScoring";
import type { OrgLocationWeekData } from "../useOrgConsolidation";
import type { OrgDailyConsolidation } from "../../../../core/finance/orgConsolidationApi";
import {
  calculateOrgRiskScore,
  analyzeTrends,
} from "../../../../core/enterprise/riskEngine";

function formatCents(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function generateCsv(
  data: OrgDailyConsolidation,
  date: string,
  weekDataPerLocation?: OrgLocationWeekData[]
): string {
  const ratio =
    data.total_revenue_cents > 0
      ? ((data.total_discrepancy_cents / data.total_revenue_cents) * 100).toFixed(2)
      : "0.00";

  const rows: string[] = [
    "Data,Total Locais,Receita (€),Discrepância (€),Ratio (%),Estado",
    [
      date,
      data.total_locations,
      (data.total_revenue_cents / 100).toFixed(2),
      (data.total_discrepancy_cents / 100).toFixed(2),
      ratio,
      data.overall_status,
    ].join(","),
    "",
    "Restaurante,Receita (€),Discrepância (€),Estado",
    ...data.locations.map((l) =>
      [
        `"${l.restaurant_name.replace(/"/g, '""')}"`,
        (l.revenue_cents / 100).toFixed(2),
        (l.discrepancy_cents / 100).toFixed(2),
        l.status,
      ].join(",")
    ),
  ];

  if (weekDataPerLocation && weekDataPerLocation.length > 0) {
    rows.push("", "Heatmap Semanal (discrepância por local e dia)", "");
    const dates = weekDataPerLocation[0]?.days.map((d) => d.date) ?? [];
    rows.push("Local," + dates.join(","));
    for (const loc of weekDataPerLocation) {
      const vals = loc.days.map((d) => (d.discrepancyCents / 100).toFixed(2));
      rows.push(`"${loc.restaurant_name.replace(/"/g, '""')}",${vals.join(",")}`);
    }
  }

  return rows.join("\n");
}

export function EnterpriseDashboardPage() {
  const navigate = useNavigate();
  const { organization } = useTenant();
  const orgId = organization?.id ?? null;
  const {
    data,
    loading,
    error,
    errorKind,
    date,
    setDate,
    refetch,
    weekDataPerLocation,
    weekRevenueByDate,
    loadingWeek,
    fetchWeek,
  } = useOrgConsolidation(orgId);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapLoaded, setHeatmapLoaded] = useState(false);
  const riskTrackedRef = useRef(false);
  const highRiskTrackedRef = useRef(false);
  const trendTrackedRef = useRef(false);
  const healthBannerTrackedRef = useRef(false);
  const trendViewTrackedRef = useRef(false);
  const upsellViewTrackedRef = useRef(false);

  const riskScore = useMemo(
    () => (data ? calculateOrgRiskScore(data) : null),
    [data]
  );
  const trends = useMemo(
    () => (weekDataPerLocation.length > 0 ? analyzeTrends(weekDataPerLocation) : null),
    [weekDataPerLocation]
  );

  useEffect(() => {
    trackEnterprisePageView();
  }, []);

  useEffect(() => {
    if (errorKind === "backend_missing") {
      trackEnterpriseBackendMissing();
    }
  }, [errorKind]);

  useEffect(() => {
    if (!riskScore) return;
    if (!riskTrackedRef.current) {
      trackEnterpriseRiskView();
      riskTrackedRef.current = true;
    }
    if (riskScore.level === "high_risk" && !highRiskTrackedRef.current) {
      trackEnterpriseRiskHigh();
      highRiskTrackedRef.current = true;
    }
  }, [riskScore]);

  useEffect(() => {
    if (!trends || trendTrackedRef.current) return;
    if (trends.hasTrendWarning || trends.hasEscalationNotice) {
      trackEnterpriseTrendDetected();
      trendTrackedRef.current = true;
    }
  }, [trends]);

  useEffect(() => {
    if (!data || healthBannerTrackedRef.current) return;
    trackEnterpriseHealthBannerView();
    healthBannerTrackedRef.current = true;
  }, [data]);

  useEffect(() => {
    if (weekRevenueByDate.length === 0 || trendViewTrackedRef.current) return;
    trackEnterpriseTrendView();
    trendViewTrackedRef.current = true;
  }, [weekRevenueByDate.length]);

  const handleDateChange = useCallback(
    (newDate: string) => {
      setDate(newDate);
      trackEnterpriseDateChange(newDate);
    },
    [setDate]
  );

  const handleToggleHeatmap = useCallback(async () => {
    const next = !showHeatmap;
    setShowHeatmap(next);
    trackEnterpriseHeatmapToggle(next);
    if (next && !heatmapLoaded) {
      await fetchWeek();
      setHeatmapLoaded(true);
    }
  }, [showHeatmap, heatmapLoaded, fetchWeek]);

  const handleDayClick = useCallback(
    (d: string) => {
      setDate(d);
      trackEnterpriseHeatmapDayClick(d);
    },
    [setDate]
  );

  const locationsTableRef = useRef<HTMLDivElement>(null);
  const handleReviewDiscrepancies = useCallback(() => {
    locationsTableRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleExport = useCallback(() => {
    if (!data) return;
    trackEnterpriseExportClick();
    const csv = generateCsv(data, date, showHeatmap ? weekDataPerLocation : undefined);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enterprise-consolidated-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, date, showHeatmap, weekDataPerLocation]);

  if (!CONFIG.ENTERPRISE_DASHBOARD_ENABLED) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Enterprise" />
        <GlobalEmptyView
          layout="portal"
          variant="inline"
          title="Dashboard Enterprise desativado"
          description="Este módulo está temporariamente desativado. Ative-o via VITE_ENTERPRISE_DASHBOARD_ENABLED para aceder."
        />
        <EnterpriseUpsellCTA />
      </section>
    );
  }

  if (loading && !data) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Enterprise" subtitle="Carregando..." />
        <div style={{ padding: 48, textAlign: "center" }}>
          <span>Carregando dados...</span>
        </div>
      </section>
    );
  }

  if (!orgId) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Enterprise" />
        <GlobalEmptyView
          layout="portal"
          variant="inline"
          title="No organization linked"
          description="É necessário estar associado a uma organização para ver o dashboard enterprise."
          action={{
            label: "Configurar módulos",
            onClick: () => navigate("/admin/modules"),
          }}
        />
      </section>
    );
  }

  if (errorKind === "backend_missing") {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Enterprise" />
        <GlobalEmptyView
          layout="portal"
          variant="inline"
          title="Enterprise backend not installed yet"
          description="Core migration required. A função get_org_daily_consolidation não está disponível no Core."
        />
        <EnterpriseUpsellCTA />
        <div style={{ marginTop: 24 }}>
          <BackendMissingInstructions />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Enterprise" />
        <GlobalErrorView
          layout="portal"
          variant="inline"
          title="Erro ao carregar"
          message={error}
          action={{ label: "Tentar novamente", onClick: () => void refetch() }}
        />
      </section>
    );
  }

  const isEmpty =
    !data ||
    (data.total_locations === 0 &&
      (!data.locations || data.locations.length === 0));

  if (isEmpty) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader
          title="Enterprise"
          subtitle="Comando central financeiro"
        />
        <GlobalEmptyView
          layout="portal"
          variant="inline"
          title="No consolidation data for this date"
          description="Não há locais consolidados para a data selecionada."
        />
        <div style={{ marginTop: 16 }}>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid var(--border-default, #e5e7eb)",
              fontSize: "0.875rem",
            }}
          />
        </div>
      </section>
    );
  }

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
        title="Enterprise"
        subtitle="Comando central financeiro consolidado"
        actions={
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-default, #e5e7eb)",
                fontSize: "0.875rem",
              }}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.875rem",
              }}
            >
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={handleToggleHeatmap}
                disabled={loadingWeek}
              />
              Ver heatmap semanal
            </label>
            <button
              type="button"
              onClick={handleExport}
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
              Export Consolidated CSV
            </button>
          </div>
        }
      />

      {isLeadHot() && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: "rgba(234, 179, 8, 0.15)",
            border: "1px solid rgba(234, 179, 8, 0.4)",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#92400e",
            display: "inline-block",
          }}
        >
          High Intent Organization
        </div>
      )}

      <EnterpriseHealthBanner
        data={data}
        onReviewDiscrepancies={handleReviewDiscrepancies}
      />

      <OrgStatusHeader data={data} />

      {riskScore && (
        <FinancialRiskScoreCard riskScore={riskScore} />
      )}

      {riskScore?.level === "high_risk" && <HighRiskBanner />}

      {showHeatmap && weekRevenueByDate.length > 0 && (
        <RevenueTrendMiniChart weekRevenueByDate={weekRevenueByDate} />
      )}

      {trends?.hasTrendWarning && (
        <div
          style={{
            padding: 12,
            borderRadius: 6,
            backgroundColor: "rgba(255, 152, 0, 0.12)",
            borderLeft: "4px solid #e65100",
          }}
        >
          <strong>Tendência:</strong> 3 ou mais dias consecutivos com discrepância
          moderada detectados. Verifique o heatmap.
        </div>
      )}
      {trends?.hasEscalationNotice && (
        <div
          style={{
            padding: 12,
            borderRadius: 6,
            backgroundColor: "rgba(239, 83, 80, 0.12)",
            borderLeft: "4px solid #c62828",
          }}
        >
          <strong>Escalação:</strong> Discrepância crítica em pelo menos um dia
          na última semana.
        </div>
      )}

      {data.locations && data.locations.length > 0 && (
        <div ref={locationsTableRef}>
          <h3 style={{ marginBottom: 12, fontSize: "1rem", fontWeight: 600 }}>
            Breakdown por local
          </h3>
          <OrgLocationsTable
            locations={data.locations}
            formatCents={formatCents}
          />
        </div>
      )}

      {showHeatmap && (
        <div
          style={{
            border: "1px solid var(--border-default, #e5e7eb)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            Heatmap semanal por local (intensidade por discrepância)
          </div>
          {loadingWeek ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              Carregando...
            </div>
          ) : (
            <OrgDiscrepancyHeatmap
              weekDataPerLocation={weekDataPerLocation}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      )}
    </section>
  );
}
