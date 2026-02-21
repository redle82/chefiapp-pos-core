// @ts-nocheck
import type { DashboardOverview } from "../types";
import { colors } from "../../../../ui/design-system/tokens/colors";
import { KpiCard } from "./KpiCard";

const theme = colors.modes.dashboard;

interface OperationStateCardProps {
  loading: boolean;
  operation: DashboardOverview["operation"] | undefined;
  onSeeAlerts?: () => void;
  onSeeTasks?: () => void;
}

export function OperationStateCard({
  loading,
  operation,
  onSeeAlerts,
  onSeeTasks,
}: OperationStateCardProps) {
  const op = operation ?? {
    activeStaffCount: 0,
    criticalTasksCount: 0,
    alertsCount: 0,
  };

  return (
    <div
      style={{
        backgroundColor: theme.surface.layer1,
        borderRadius: 12,
        border: `1px solid ${theme.border.subtle}`,
        padding: "18px 20px",
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
            fontSize: 14,
            fontWeight: 600,
            margin: 0,
            color: theme.text.primary,
          }}
        >
          Estado de la operación
        </h2>
        {(onSeeAlerts != null || onSeeTasks != null) && (
          <div style={{ display: "flex", gap: 8 }}>
            {onSeeAlerts != null && (
              <button
                type="button"
                onClick={onSeeAlerts}
                style={{
                  fontSize: 12,
                  color: theme.action.base,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Ver alertas
              </button>
            )}
            {onSeeTasks != null && (
              <button
                type="button"
                onClick={onSeeTasks}
                style={{
                  fontSize: 12,
                  color: theme.action.base,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Ver tareas
              </button>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        <KpiCard
          loading={loading}
          label="Funcionarios activos"
          value={op.activeStaffCount}
        />
        <KpiCard
          loading={loading}
          label="Tareas críticas pendientes"
          value={op.criticalTasksCount}
        />
        <KpiCard
          loading={loading}
          label="Alertas operacionales"
          value={op.alertsCount}
        />
      </div>
    </div>
  );
}
