/**
 * OperationalMetricsCards - Visibilidade mínima por tenant (G4 Onda 3)
 *
 * FASE D: SETUP → "Configure o restaurante para começar."; TRIAL sem dados →
 * "Ainda não há pedidos. Abra o TPV para a primeira venda."; ACTIVE → métricas reais.
 */

import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { currencyService } from "../../core/currency/CurrencyService";
import { getFormatLocale } from "../../core/i18n/regionLocaleConfig";
import { useOperationalMetrics } from "../../hooks/useOperationalMetrics";
import { useRestaurantId } from "../../ui/hooks/useRestaurantId";

function formatCents(cents: number): string {
  return new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: currencyService.getDefaultCurrency(),
  }).format(cents / 100);
}

export function OperationalMetricsCards() {
  const { restaurantId, loading: loadingRestaurant } = useRestaurantId();
  const { runtime } = useRestaurantRuntime();
  const systemState = runtime.systemState ?? "SETUP";
  const { data, loading, error, refresh } = useOperationalMetrics(
    restaurantId,
    systemState,
  );

  if (loadingRestaurant || !restaurantId) {
    return (
      <section
        style={{
          marginTop: "24px",
          padding: "20px 24px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
        }}
      >
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Configure o restaurante para ver as métricas do dia.
        </p>
      </section>
    );
  }

  if (systemState === "SETUP") {
    return (
      <section
        style={{
          marginTop: "24px",
          padding: "20px 24px",
          backgroundColor: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: 14,
        }}
      >
        <p style={{ fontSize: "14px", color: "#92400e", margin: 0 }}>
          Configure o restaurante para começar.
        </p>
      </section>
    );
  }

  // Nunca gate de render: mostrar secção inline (não fullscreen) para não bloquear a web de configuração.
  if (loading && !data) {
    return (
      <section
        style={{
          marginTop: "24px",
          padding: "20px 24px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
        }}
      >
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          A carregar métricas do dia...
        </p>
      </section>
    );
  }

  if (
    (systemState === "TRIAL" || systemState === "ACTIVE") &&
    !data &&
    !loading
  ) {
    return (
      <section
        style={{
          marginTop: "24px",
          padding: "20px 24px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 14,
        }}
      >
        <p style={{ fontSize: "14px", color: "#166534", margin: 0 }}>
          Ainda sem vendas hoje. Abra um turno e use o TPV para a primeira
          venda.
        </p>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section
        style={{
          marginTop: "24px",
          padding: "20px 24px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 14,
        }}
      >
        <p style={{ fontSize: "14px", color: "#991b1b", marginBottom: "8px" }}>
          Não foi possível carregar as métricas do dia. Verifique a ligação ao
          servidor e tente novamente.
        </p>
        <button
          type="button"
          onClick={refresh}
          style={{
            marginTop: 12,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "#dc2626",
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

  const m = data;
  const cards = [
    {
      label: "Pedidos (hoje)",
      value: m?.daily_orders_count ?? 0,
      icon: "📦",
    },
    {
      label: "Receita (hoje)",
      value: m ? formatCents(m.daily_revenue_cents) : "—",
      icon: "💰",
    },
    {
      label: "Turnos ativos",
      value: m?.active_shifts_count ?? 0,
      icon: "👥",
    },
    {
      label: "Export pedidos",
      value: m?.export_requested_count ?? 0,
      icon: "📤",
    },
  ];
  const allZero =
    m &&
    (m.daily_orders_count ?? 0) === 0 &&
    (m.daily_revenue_cents ?? 0) === 0 &&
    (m.active_shifts_count ?? 0) === 0;

  return (
    <section
      style={{
        marginTop: "24px",
        padding: "24px",
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
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1a1a1a",
            margin: 0,
          }}
        >
          📊 Operacional (hoje)
        </h2>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            color: "#666",
            backgroundColor: "transparent",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "A atualizar…" : "Atualizar"}
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {cards.map(({ label, value, icon }) => (
          <div
            key={label}
            style={{
              padding: "14px 16px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
            }}
          >
            <div
              style={{ fontSize: "12px", color: "#64748b", marginBottom: 4 }}
            >
              {icon} {label}
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      {allZero && (
        <p
          style={{
            marginTop: 12,
            marginBottom: 0,
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          Ainda sem vendas hoje. As métricas preenchem-se após a primeira venda
          no TPV.
        </p>
      )}
    </section>
  );
}
