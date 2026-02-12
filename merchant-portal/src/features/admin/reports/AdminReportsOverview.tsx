/**
 * AdminReportsOverview — Página de overview de Relatórios (apenas leitura / histórico).
 *
 * Sem estado operacional em tempo real: sem Mapa do sistema, OperacaoCard,
 * indicadores de TPV/KDS/turno ao vivo. Apenas KPIs em snapshot e links
 * para relatórios. Ref: reports_only_no_dashboard plan.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { WelcomeOverlay } from "../../../components/onboarding/WelcomeOverlay";
import { shouldShowWelcome } from "../../../components/onboarding/welcomeUtils";
import { useRestaurantId } from "../../../core/hooks/useRestaurantId";
import { GlobalLoadingView } from "../../../ui/design-system/components";
import { useDashboardOverview } from "../dashboard/hooks/useDashboardOverview";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const linkGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 12,
  marginTop: 16,
};

const linkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 500,
  fontSize: 15,
};

function formatEur(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function AdminReportsOverview() {
  const [showWelcome, setShowWelcome] = useState(shouldShowWelcome);
  const { restaurantId, loading: loadingRestaurant } = useRestaurantId();
  const { data: overview, loading: loadingOverview } =
    useDashboardOverview(restaurantId);

  if (loadingRestaurant || !restaurantId) {
    return <GlobalLoadingView />;
  }

  const revenueToday =
    overview?.revenueByHour?.reduce((s, h) => s + h.amount, 0) ?? 0;
  const billsToday = overview?.stats?.totalBills ?? 0;

  return (
    <section aria-label="Relatórios">
      {showWelcome && (
        <WelcomeOverlay onDismiss={() => setShowWelcome(false)} />
      )}
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px 0",
            color: "#111827",
          }}
        >
          Relatórios
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#6b7280",
            margin: 0,
          }}
        >
          Histórico e análise
        </p>
      </header>

      <div style={cardStyle}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 12px 0",
            color: "#374151",
          }}
        >
          KPIs (snapshot)
        </h2>
        {loadingOverview ? (
          <p style={{ color: "#6b7280", margin: 0 }}>A carregar…</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <div>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                Faturado hoje
              </span>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {formatEur(revenueToday)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                Pedidos hoje
              </span>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{billsToday}</div>
            </div>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 8px 0",
            color: "#374151",
          }}
        >
          Relatórios
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#6b7280",
            margin: "0 0 8px 0",
          }}
        >
          Aceda aos relatórios detalhados para análise por período, equipa e
          desempenho.
        </p>
        <nav style={linkGridStyle} aria-label="Relatórios disponíveis">
          <Link to="/admin/reports/sales" style={linkStyle}>
            Vendas
          </Link>
          <Link to="/admin/reports/operations" style={linkStyle}>
            Atividade operacional (histórico)
          </Link>
          <Link to="/admin/reports/multiunit" style={linkStyle}>
            Multi‑unidade (olhar de dono)
          </Link>
          <Link to="/admin/reports/staff" style={linkStyle}>
            Staff
          </Link>
          <Link to="/admin/reports/human-performance" style={linkStyle}>
            Performance humana
          </Link>
        </nav>
      </div>
    </section>
  );
}
