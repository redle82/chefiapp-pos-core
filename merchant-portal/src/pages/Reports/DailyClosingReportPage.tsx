/**
 * DailyClosingReportPage — Relatório Fecho diário (FASE 5 Passo 4)
 *
 * Mostra histórico por turno (abertura, fecho, vendas, pedidos).
 * Fonte: useShiftHistory → RPC get_shift_history.
 * Ref.: docs/implementation/FASE_5_RELATORIOS.md
 */

import { DataModeBanner } from "../../components/DataModeBanner";
import { ShiftHistorySection } from "../../components/Dashboard/ShiftHistorySection";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";

export function DailyClosingReportPage() {
  const { runtime } = useRestaurantRuntime();
  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <h1
        style={{
          fontSize: "20px",
          fontWeight: 700,
          marginBottom: 16,
          color: "#0f172a",
        }}
      >
        Fecho diário
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "#64748b",
          marginBottom: 24,
          marginTop: 0,
        }}
      >
        Histórico de turnos (abertura, fecho, vendas e pedidos) dos últimos 7 dias.
      </p>
      <ShiftHistorySection />
    </div>
  );
}
