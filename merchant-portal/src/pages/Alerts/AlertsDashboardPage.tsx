/**
 * AlertsDashboardPage — Dashboard de Alertas
 *
 * Mostra alertas ativos e críticos.
 * Visual: VPC (escuro, botões grandes, espaçamento generoso).
 */

import { useEffect, useState } from "react";
import { AlertCard } from "../../components/Alerts/AlertCard";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  alertEngine,
  type Alert,
  type AlertCategory,
  type AlertSeverity,
} from "../../core/alerts/AlertEngine";
import { useRestaurantId } from "../../ui/hooks/useRestaurantId";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./AlertsDashboardPage.module.css";

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
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | "all">(
    "all",
  );
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">(
    "all",
  );

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
    <div className={styles.container}>
      <div className={styles.maxWidthWrapper}>
        <DataModeBanner dataMode={runtime.dataMode} />
        <header className={styles.header}>
          <h1 className={styles.title}>Alertas</h1>
          <div className={styles.filtersContainer}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={styles.filterButton}
              data-active={filter === "all"}
            >
              Todos ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("critical")}
              className={styles.filterButton}
              data-variant="critical"
              data-active={filter === "critical"}
            >
              Críticos ({criticalAlerts.length})
            </button>
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as AlertCategory | "all")
              }
              className={styles.filterSelect}
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
              onChange={(e) =>
                setSeverityFilter(e.target.value as AlertSeverity | "all")
              }
              className={styles.filterSelect}
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
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✅</div>
            <p className={styles.emptyMessage}>
              Nenhum alerta {filter === "critical" ? "crítico" : "ativo"}
              {categoryFilter !== "all"
                ? ` na categoria "${categoryFilter}"`
                : ""}
              {severityFilter !== "all"
                ? ` com severidade "${severityFilter}"`
                : ""}
            </p>
          </div>
        ) : (
          <div className={styles.alertsList}>
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
