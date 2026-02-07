import type { DashboardOverview } from "../types";
import { KpiCard } from "./KpiCard";

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
        backgroundColor: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
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
            color: "#111827",
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
                  color: "#7c3aed",
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
                  color: "#7c3aed",
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
