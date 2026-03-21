import React from "react";
import { OrgSummaryCard } from "../OrgSummaryCard";
import type { OrgDailyConsolidation } from "../../../core/finance/orgConsolidationApi";

function formatCents(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

interface OrgStatusHeaderProps {
  data: OrgDailyConsolidation;
}

export function OrgStatusHeader({ data }: OrgStatusHeaderProps) {
  const status = data.overall_status;
  const isRed = status === "red";
  const isYellow = status === "yellow";

  const statusLabel =
    status === "green" ? "✓ OK" : status === "yellow" ? "⚠ Atenção" : "✗ Crítico";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {isRed && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: "rgba(239, 83, 80, 0.15)",
            borderLeft: "4px solid #c62828",
          }}
        >
          <strong>Alerta:</strong> Existe discrepância crítica. Revise os locais
          com estado vermelho.
        </div>
      )}
      {isYellow && !isRed && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: "rgba(255, 152, 0, 0.15)",
            borderLeft: "4px solid #e65100",
          }}
        >
          <strong>Atenção:</strong> Discrepância menor. Verifique os locais com
          estado amarelo.
        </div>
      )}
      {status === "green" && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: "rgba(76, 175, 80, 0.12)",
            borderLeft: "4px solid #2e7d32",
          }}
        >
          <strong>Estado:</strong> Consolidação OK.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        <OrgSummaryCard
          label="Total Locais"
          value={data.total_locations}
          state="healthy"
        />
        <OrgSummaryCard
          label="Receita Total"
          value={formatCents(data.total_revenue_cents)}
          state="healthy"
        />
        <OrgSummaryCard
          label="Discrepância"
          value={formatCents(data.total_discrepancy_cents)}
          state={data.overall_status}
        />
        <OrgSummaryCard
          label="Estado"
          value={statusLabel}
          state={data.overall_status}
        />
      </div>
    </div>
  );
}
