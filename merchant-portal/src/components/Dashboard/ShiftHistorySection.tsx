/**
 * ShiftHistorySection - Histórico por turno (Onda 5 O5.6, FASE 2.3)
 *
 * Exibe lista de turnos: abertura, fecho, vendas, vendas por método,
 * total esperado vs declarado e diferença (só leitura). Dashboard nunca fecha caixa;
 * link "Fechar no TPV" para o ritual de fecho. Ref.: docs/plans/FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import {
  type CashRegister,
  CashRegisterEngine,
} from "../../core/tpv/CashRegister";
import { useShiftHistory } from "../../hooks/useShiftHistory";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { ShiftCard } from "../../ui/design-system/ShiftCard";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  other: "Outro",
};

export function ShiftHistorySection() {
  const { restaurantId, loading: loadingRestaurant } = useRestaurantId();

  const { data, loading, error, refresh } = useShiftHistory(restaurantId, {
    daysBack: 7,
  });
  const [activeShift, setActiveShift] = useState<CashRegister | null>(null);
  const [loadingActive, setLoadingActive] = useState(false);

  // Fetch active shift on mount/restaurant change
  useEffect(() => {
    if (!restaurantId) return;
    setLoadingActive(true);
    CashRegisterEngine.getOpenCashRegister(restaurantId)
      .then((shift) => setActiveShift(shift))
      .catch((err) => console.error("Failed to fetch active shift:", err))
      .finally(() => setLoadingActive(false));
  }, [restaurantId]);

  // FASE 2.3: Dashboard não fecha caixa; apenas link para TPV
  const navigate = useNavigate();
  const tpvPath = "/tpv";

  if (loadingRestaurant || !restaurantId) {
    return (
      <section
        style={{
          marginTop: "24px",
          padding: "20px 24px",
          backgroundColor: "#f8fafc",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
        }}
      >
        <h2
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 8,
          }}
        >
          Histórico por turno
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Configure o restaurante para ver o histórico por turno.
        </p>
      </section>
    );
  }

  if (loading && data.length === 0) {
    return (
      <section
        style={{
          marginTop: "24px",
          padding: "20px 24px",
          backgroundColor: "#fff",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 12,
          }}
        >
          Histórico por turno
        </h2>
        <GlobalLoadingView
          message="A carregar..."
          layout="portal"
          variant="inline"
        />
      </section>
    );
  }

  if (error && data.length === 0) {
    return (
      <section
        style={{
          marginTop: "24px",
          padding: "16px 24px",
          backgroundColor: "#fff",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 8,
          }}
        >
          Histórico por turno
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: 12 }}>
          Não foi possível carregar o histórico de turnos. Verifique a ligação e
          tente novamente.
        </p>
        <button
          type="button"
          onClick={refresh}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "#3b82f6",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: "24px",
        padding: "20px 24px",
        backgroundColor: "#fff",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Histórico por turno (últimos 7 dias)
        </h2>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            color: "#64748b",
            backgroundColor: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "…" : "Atualizar"}
        </button>
      </div>

      {/* ACTIVE SHIFT CARD — FASE 2.3: fechar só no TPV */}
      {activeShift && (
        <div style={{ marginBottom: 24 }}>
          <ShiftCard
            shiftId={activeShift.id}
            workerName={activeShift.openedBy || "Operador"}
            role="gerente"
            status="active"
            startTime={activeShift.openedAt || new Date()}
            activeTaskCount={0}
            onAction={(action) => {
              if (action === "end") navigate(tpvPath);
            }}
          />
        </div>
      )}

      {data.length === 0 ? (
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Ainda não há turnos. Abra um turno no TPV para começar a vender.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 8px 8px 0",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Abertura
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 8,
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Fecho
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: 8,
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Vendas
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 8,
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Por método
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: 8,
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Pedidos
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: 8,
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Esperado / Declarado
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "8px 0 8px 8px",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Diferença
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const opening = row.opening_balance_cents ?? 0;
                const expectedCents = opening + row.total_sales_cents;
                const declaredCents = row.closed_at
                  ? (row.closing_balance_cents ?? 0)
                  : null;
                const differenceCents =
                  declaredCents !== null
                    ? declaredCents - expectedCents
                    : null;
                const salesByMethod = row.sales_by_method ?? {};
                const methodParts = Object.entries(salesByMethod)
                  .filter(([, c]) => c > 0)
                  .map(
                    ([m, c]) =>
                      `${METHOD_LABELS[m] ?? m}: ${formatCents(Number(c))}`
                  );
                return (
                  <tr
                    key={row.shift_id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "8px 8px 8px 0", color: "#1e293b" }}>
                      {formatDateTime(row.opened_at)}
                    </td>
                    <td style={{ padding: 8, color: "#1e293b" }}>
                      {formatDateTime(row.closed_at)}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: "right",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {formatCents(row.total_sales_cents)}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 12,
                        color: "#475569",
                      }}
                    >
                      {methodParts.length > 0
                        ? methodParts.join(" · ")
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: "right",
                        color: "#1e293b",
                      }}
                    >
                      {row.orders_count}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: "right",
                        fontSize: 12,
                        color: "#475569",
                      }}
                    >
                      {row.closed_at
                        ? `${formatCents(expectedCents)} / ${formatCents(declaredCents ?? 0)}`
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px 0 8px 8px",
                        textAlign: "right",
                        fontWeight: 500,
                        color:
                          differenceCents === null
                            ? "#64748b"
                            : differenceCents === 0
                              ? "#15803d"
                              : "#b45309",
                      }}
                    >
                      {differenceCents === null
                        ? "—"
                        : differenceCents === 0
                          ? "0 €"
                          : `${differenceCents > 0 ? "+" : ""}${formatCents(differenceCents)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
