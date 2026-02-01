/**
 * AlertsDashboardPage — Dashboard de Alertas
 *
 * Mostra alertas ativos e críticos.
 * Visual: VPC (escuro, botões grandes, espaçamento generoso).
 */

import { useEffect, useState } from "react";
import { AlertCard } from "../../components/Alerts/AlertCard";
import { alertEngine, type Alert } from "../../core/alerts/AlertEngine";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import { GlobalLoadingView } from "../../ui/design-system/components";

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
  const { restaurantId, loading: loadingRestaurantId } = useRestaurantId();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "critical">("all");

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

  const displayAlerts = filter === "critical" ? criticalAlerts : alerts;

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
          <div style={{ display: "flex", gap: 8 }}>
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
