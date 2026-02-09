/**
 * DailyClosingReportPage — Relatório Fecho diário (FASE 5 Passo 4)
 *
 * Mostra histórico por turno (abertura, fecho, vendas, pedidos).
 * Fonte: useShiftHistory → RPC get_shift_history.
 * Ref.: docs/implementation/FASE_5_RELATORIOS.md
 */

import { useCallback } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { ShiftHistorySection } from "../../components/Dashboard/ShiftHistorySection";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import { useShiftHistory } from "../../hooks/useShiftHistory";
import { exportCsv, centsToDecimal } from "../../core/reports/csvExport";

export function DailyClosingReportPage() {
  const { runtime } = useRestaurantRuntime();
  const { restaurantId } = useRestaurantId();
  const { data } = useShiftHistory(restaurantId, { daysBack: 7 });

  const handleExportCsv = useCallback(() => {
    if (!data || data.length === 0) return;
    exportCsv(
      ["Turno", "Abertura", "Fecho", "Vendas (€)", "Pedidos"],
      data.map((s) => [
        s.shift_id.slice(0, 8),
        s.opened_at ? new Date(s.opened_at).toLocaleString("pt-PT") : "—",
        s.closed_at ? new Date(s.closed_at).toLocaleString("pt-PT") : "Aberto",
        centsToDecimal(s.total_sales_cents),
        s.orders_count,
      ]),
      `fecho-diario-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }, [data]);

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            margin: 0,
            color: "#0f172a",
          }}
        >
          Fecho diário
        </h1>
        {data && data.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
              color: "#0f172a",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ⬇ Exportar CSV
          </button>
        )}
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "#64748b",
          marginBottom: 24,
          marginTop: 0,
        }}
      >
        Histórico de turnos (abertura, fecho, vendas e pedidos) dos últimos 7
        dias.
      </p>
      <ShiftHistorySection />
    </div>
  );
}
