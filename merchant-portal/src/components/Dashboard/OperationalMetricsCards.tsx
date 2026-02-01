/**
 * OperationalMetricsCards - Visibilidade mínima por tenant (G4 Onda 3)
 *
 * Chama get_operational_metrics(restaurantId, startOfDay, endOfDay) e exibe
 * cards: pedidos do dia, receita, turnos ativos, export requested.
 * Ver docs/ops/DASHBOARD_METRICS.md.
 */

import React from "react";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import { useOperationalMetrics } from "../../hooks/useOperationalMetrics";
import { GlobalLoadingView } from "../../ui/design-system/components";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function OperationalMetricsCards() {
  const { restaurantId, loading: loadingRestaurant } = useRestaurantId();
  const { data, loading, error, refresh } = useOperationalMetrics(restaurantId);

  if (loadingRestaurant || !restaurantId) {
    return null;
  }

  if (loading && !data) {
    return (
      <GlobalLoadingView
        message="A carregar métricas do dia..."
        layout="portal"
        variant="fullscreen"
      />
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
          Não foi possível carregar as métricas do dia.
        </p>
        <p style={{ fontSize: "13px", color: "#b91c1c" }}>{error}</p>
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
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: 4 }}>
              {icon} {label}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
