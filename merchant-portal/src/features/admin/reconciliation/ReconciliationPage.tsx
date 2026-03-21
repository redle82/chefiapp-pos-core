import React, { useCallback, useState } from "react";
import { useRestaurantId } from "../../../ui/hooks/useRestaurantId";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import { GlobalEmptyView, GlobalErrorView } from "../../../ui/design-system/components";
import { ReconciliationSummaryCard } from "./ReconciliationSummaryCard";
import { ReconciliationTable } from "./ReconciliationTable";
import { ReconciliationHeatmap } from "./ReconciliationHeatmap";
import { useReconciliation } from "./useReconciliation";

function formatCents(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function getStatusState(
  report: { mismatched_orders: number; total_order_amount: number; total_receipt_amount: number }
): "healthy" | "warning" | "critical" {
  const diff = Math.abs(report.total_order_amount - report.total_receipt_amount);
  if (diff === 0 && report.mismatched_orders === 0) return "healthy";
  if (diff < 100 || report.mismatched_orders === 0) return "warning";
  return "critical";
}

export function ReconciliationPage() {
  const restaurantId = useRestaurantId();
  const {
    report,
    loading,
    error,
    date,
    setDate,
    refetch,
    weekData,
    loadingWeek,
    fetchWeek,
  } = useReconciliation(restaurantId);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapLoaded, setHeatmapLoaded] = useState(false);

  const handleToggleHeatmap = useCallback(async () => {
    const next = !showHeatmap;
    setShowHeatmap(next);
    if (next && !heatmapLoaded) {
      await fetchWeek();
      setHeatmapLoaded(true);
    }
  }, [showHeatmap, heatmapLoaded, fetchWeek]);

  const handleDayClick = useCallback(
    (d: string) => {
      setDate(d);
    },
    [setDate]
  );

  if (loading && !report) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Reconciliação financeira" subtitle="Carregando..." />
        <div style={{ padding: 48, textAlign: "center" }}>
          <span>Carregando dados...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader title="Reconciliação financeira" />
        <GlobalErrorView
          title="Erro ao carregar"
          message={error}
          action={{ label: "Tentar novamente", onClick: () => void refetch() }}
        />
      </section>
    );
  }

  const isEmpty = !report || (report.total_orders === 0 && report.total_receipts === 0);

  if (isEmpty) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader
          title="Reconciliação financeira"
          subtitle="Integridade financeira por dia"
        />
        <GlobalEmptyView
          title="Sem dados"
          message="Não há ordens nem recibos para a data selecionada."
        />
      </section>
    );
  }

  const statusState = getStatusState(report);
  const discrepancyCents = report.total_order_amount - report.total_receipt_amount;

  return (
    <section style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <AdminPageHeader
        title="Reconciliação financeira"
        subtitle="Integridade financeira por dia"
        actions={
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-default, #e5e7eb)",
                fontSize: "0.875rem",
              }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem" }}>
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={handleToggleHeatmap}
                disabled={loadingWeek}
              />
              Ver heatmap semanal
            </label>
          </div>
        }
      />

      {/* Status indicator */}
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor:
            statusState === "healthy"
              ? "rgba(76, 175, 80, 0.1)"
              : statusState === "warning"
                ? "rgba(255, 152, 0, 0.1)"
                : "rgba(239, 83, 80, 0.1)",
          borderLeft: `4px solid ${
            statusState === "healthy"
              ? "#4CAF50"
              : statusState === "warning"
                ? "#FF9800"
                : "#EF5350"
          }`,
        }}
      >
        {statusState === "healthy" && "✓ Sem discrepâncias"}
        {statusState === "warning" && "⚠ Discrepância menor"}
        {statusState === "critical" && "✗ Discrepância crítica"}
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        <ReconciliationSummaryCard
          label="Total Ordens"
          value={report.total_orders}
          state="healthy"
        />
        <ReconciliationSummaryCard
          label="Total Recibos"
          value={report.total_receipts}
          state="healthy"
        />
        <ReconciliationSummaryCard
          label="Receita"
          value={formatCents(report.total_order_amount)}
          state="healthy"
        />
        <ReconciliationSummaryCard
          label="Discrepância"
          value={formatCents(discrepancyCents)}
          state={statusState}
        />
      </div>

      {/* Heatmap */}
      {showHeatmap && (
        <div
          style={{
            border: "1px solid var(--border-default, #e5e7eb)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", fontWeight: 600, fontSize: "0.875rem" }}>
            Heatmap semanal (intensidade por discrepância)
          </div>
          {loadingWeek ? (
            <div style={{ padding: 48, textAlign: "center" }}>Carregando...</div>
          ) : (
            <ReconciliationHeatmap weekData={weekData} onDayClick={handleDayClick} />
          )}
        </div>
      )}

      {/* Table */}
      {report.discrepancies.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 12, fontSize: "1rem", fontWeight: 600 }}>
            Discrepâncias
          </h3>
          <ReconciliationTable
            discrepancies={report.discrepancies}
            formatCents={formatCents}
          />
        </div>
      )}
    </section>
  );
}
