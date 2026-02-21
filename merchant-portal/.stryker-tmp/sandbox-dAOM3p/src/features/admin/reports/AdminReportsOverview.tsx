/**
 * AdminReportsOverview — Página de overview de Relatórios (apenas leitura / histórico).
 *
 * Sem estado operacional em tempo real: sem Mapa do sistema, OperacaoCard,
 * indicadores de TPV/KDS/turno ao vivo. Apenas KPIs em snapshot e links
 * para relatórios. Ref: reports_only_no_dashboard plan.
 */
// @ts-nocheck


import { useState } from "react";
import { Link } from "react-router-dom";
import { WelcomeOverlay } from "../../../components/onboarding/WelcomeOverlay";
import { shouldShowWelcome } from "../../../components/onboarding/welcomeUtils";
import { useRestaurantId } from "../../../ui/hooks/useRestaurantId";
import { GlobalLoadingView } from "../../../ui/design-system/components";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import { useDashboardOverview } from "../dashboard/hooks/useDashboardOverview";

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg-on-dark, var(--surface-elevated))",
  borderRadius: 8,
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  border: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
};

const linkGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 12,
  marginTop: 16,
};

const linkStyle: React.CSSProperties = {
  color: "var(--color-primary, var(--color-info))",
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
      <AdminPageHeader
        title="Relatórios"
        subtitle="Histórico e análise. Aceda aos relatórios detalhados por período, equipa e desempenho."
      />

      <div style={cardStyle}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 12px 0",
            color: "var(--text-primary)",
          }}
        >
          KPIs (snapshot)
        </h2>
        {loadingOverview ? (
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>A carregar…</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Faturado hoje
              </span>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
                {formatEur(revenueToday)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Pedidos hoje
              </span>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>{billsToday}</div>
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
            color: "var(--text-primary)",
          }}
        >
          Relatórios
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
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
