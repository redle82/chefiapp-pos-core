/**
 * AlertsDashboardPage — Dashboard de Alertas
 *
 * Mostra alertas ativos e críticos.
 * Visual: VPC (escuro, botões grandes, espaçamento generoso).
 */

import { useEffect, useState } from "react";
import { AlertCard } from "../../components/Alerts/AlertCard";
import { DataModeBanner } from "../../components/DataModeBanner";
import { alertEngine, type Alert, type AlertCategory, type AlertSeverity } from "../../core/alerts/AlertEngine";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";

const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 24,
  spaceLg: 32,
  btnMinHeight: 48,
  fontSizeBase: 16,
  fontSizeLarge: 20,
  lineHeight: 1.6,
} as const;

export function AlertsDashboardPage() {
  const { runtime } = useRestaurantRuntime();
  const { restaurantId, loading: loadingRestaurantId } = useRestaurantId();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "critical">("all");
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    const fetchAlerts = async () => {
      try {
        const [all, critical] = await Promise.all([
          alertEngine.getActive(restaurantId),
          alertEngine.getCritical(restaurantId),
        ]);
        setAlerts(all);
        setCriticalAlerts(critical);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [restaurantId]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertEngine.updateStatus(alertId, "acknowledged");
      window.location.reload();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      alert("Erro ao reconhecer alerta");
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await alertEngine.updateStatus(alertId, "resolved");
      window.location.reload();
    } catch (error) {
      console.error("Error resolving alert:", error);
      alert("Erro ao resolver alerta");
    }
  };

  if (loading || loadingRestaurantId || !restaurantId) {
    return (
      <GlobalLoadingView
        message="A carregar alertas..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  const baseAlerts = filter === "critical" ? criticalAlerts : alerts;
  const byCategory =
    categoryFilter === "all"
      ? baseAlerts
      : baseAlerts.filter((a) => a.category === categoryFilter);
  const displayAlerts =
    severityFilter === "all"
      ? byCategory
      : byCategory.filter((a) => a.severity === severityFilter);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: VPC.bg,
        fontFamily: "Inter, system-ui, sans-serif",
        color: VPC.text,
        lineHeight: VPC.lineHeight,
        padding: VPC.spaceLg,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <DataModeBanner dataMode={runtime.dataMode} />
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: VPC.space,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h1
            style={{
              fontSize: VPC.fontSizeLarge,
              fontWeight: 700,
              margin: 0,
              color: VPC.text,
              letterSpacing: "-0.02em",
            }}
          >
            Alertas
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              style={{
                minHeight: VPC.btnMinHeight,
                padding: "12px 24px",
                fontSize: VPC.fontSizeBase,
                fontWeight: filter === "all" ? 700 : 400,
                backgroundColor: filter === "all" ? VPC.accent : "transparent",
                color: filter === "all" ? "#fff" : VPC.textMuted,
                border: filter === "all" ? "none" : `1px solid ${VPC.border}`,
                borderRadius: VPC.radius,
                cursor: "pointer",
              }}
            >
              Todos ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("critical")}
              style={{
                minHeight: VPC.btnMinHeight,
                padding: "12px 24px",
                fontSize: VPC.fontSizeBase,
                fontWeight: filter === "critical" ? 700 : 400,
                backgroundColor: filter === "critical" ? "#f87171" : "transparent",
                color: filter === "critical" ? "#fff" : VPC.textMuted,
                border: filter === "critical" ? "none" : `1px solid ${VPC.border}`,
                borderRadius: VPC.radius,
                cursor: "pointer",
              }}
            >
              Críticos ({criticalAlerts.length})
            </button>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as AlertCategory | "all")}
              style={{
                minHeight: VPC.btnMinHeight,
                padding: "12px 16px",
                fontSize: VPC.fontSizeBase,
                backgroundColor: VPC.surface,
                color: VPC.text,
                border: `1px solid ${VPC.border}`,
                borderRadius: VPC.radius,
                cursor: "pointer",
              }}
              aria-label="Filtrar por categoria"
            >
              <option value="all">Categoria: Todas</option>
              <option value="operational">Operacional</option>
              <option value="financial">Financeiro</option>
              <option value="compliance">Compliance</option>
              <option value="human">Humano</option>
              <option value="system">Sistema</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | "all")}
              style={{
                minHeight: VPC.btnMinHeight,
                padding: "12px 16px",
                fontSize: VPC.fontSizeBase,
                backgroundColor: VPC.surface,
                color: VPC.text,
                border: `1px solid ${VPC.border}`,
                borderRadius: VPC.radius,
                cursor: "pointer",
              }}
              aria-label="Filtrar por severidade"
            >
              <option value="all">Severidade: Todas</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
        </header>

        {displayAlerts.length === 0 ? (
          <div
            style={{
              padding: VPC.spaceLg,
              textAlign: "center",
              backgroundColor: VPC.surface,
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              color: VPC.textMuted,
              fontSize: VPC.fontSizeBase,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16, color: VPC.accent }}>✅</div>
            <p style={{ margin: 0 }}>
              Nenhum alerta {filter === "critical" ? "crítico" : "ativo"}
              {categoryFilter !== "all" ? ` na categoria "${categoryFilter}"` : ""}
              {severityFilter !== "all" ? ` com severidade "${severityFilter}"` : ""}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => handleAcknowledge(alert.id)}
                onResolve={() => handleResolve(alert.id)}
                variant="dark"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
