/**
 * ManagerHome — Home OPERACIONAL do Gerente.
 *
 * Pergunta-chave: "O turno está saudável?"
 *
 * Mostra gargalos, alertas e equipe ativa.
 * ❌ NÃO mostra cards de ferramentas (já estão no rodapé/Mais).
 */

import { useNavigate } from "react-router-dom";
import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

export function ManagerHome() {
  const { specDrifts, tasks, shiftState, activeStaffCount } = useStaff();
  const { status: coreStatus } = useCoreHealth();
  const navigate = useNavigate();

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const criticalAlerts = specDrifts.filter(
    (d) => d.status === "new",
  );

  // Gargalos
  const bottlenecks: string[] = [];
  if (criticalAlerts.length > 0)
    bottlenecks.push(
      `${criticalAlerts.length} alerta${
        criticalAlerts.length !== 1 ? "s" : ""
      } crítico${criticalAlerts.length !== 1 ? "s" : ""}`,
    );
  if (pendingTasks.filter((t) => t.priority === "critical").length > 0)
    bottlenecks.push("Tarefas urgentes pendentes");
  if (activeStaffCount === 0 && shiftState === "active")
    bottlenecks.push("Sem equipe ativa");
  if (coreStatus !== "UP") bottlenecks.push("Sistema instável");

  // Shift summary
  const shiftLabel =
    shiftState === "active"
      ? "TURNO ATIVO"
      : shiftState === "closing"
      ? "A ENCERRAR"
      : "SEM TURNO";

  const isHealthy = bottlenecks.length === 0 && shiftState === "active";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: "20px 16px",
        backgroundColor: colors.surface.base,
        gap: 16,
      }}
    >
      {/* ── Status do turno ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderRadius: 14,
          backgroundColor: isHealthy
            ? "rgba(34, 197, 94, 0.10)"
            : "rgba(245, 158, 11, 0.10)",
        }}
      >
        <span style={{ fontSize: 24 }}>{isHealthy ? "🟢" : "🟡"}</span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: isHealthy ? colors.success.base : "#f59e0b",
            }}
          >
            {isHealthy ? "TURNO SAUDÁVEL" : "ATENÇÃO"}
          </span>
          <span style={{ fontSize: 12, color: colors.text.secondary }}>
            {shiftLabel} • {activeStaffCount} operador
            {activeStaffCount !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      {/* ── Gargalos ── */}
      {bottlenecks.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.text.tertiary,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            GARGALOS
          </span>
          {bottlenecks.map((b) => (
            <span
              key={b}
              style={{
                fontSize: 14,
                color: colors.text.primary,
                fontWeight: 500,
              }}
            >
              • {b}
            </span>
          ))}
        </div>
      )}

      {/* ── Resumo rápido ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {[
          {
            label: "Alertas",
            value: specDrifts.length,
            urgent: specDrifts.length > 0,
          },
          {
            label: "Tarefas",
            value: pendingTasks.length,
            urgent: pendingTasks.length > 5,
          },
          {
            label: "Equipe",
            value: activeStaffCount,
            urgent: activeStaffCount === 0,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "12px",
              borderRadius: 10,
              backgroundColor: colors.surface.layer1,
              border: `1px solid ${
                item.urgent
                  ? colors.destructive.base + "40"
                  : colors.border.subtle
              }`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: item.urgent
                  ? colors.destructive.base
                  : colors.text.primary,
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: colors.text.tertiary,
                fontWeight: 600,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Ações rápidas (contextual) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {specDrifts.length > 0 && (
          <button
            type="button"
            onClick={() => navigate("/app/staff/mode/alerts")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid ${colors.destructive.base}40`,
              background: colors.surface.layer1,
              color: colors.destructive.base,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ⚠️ Resolver alertas ({specDrifts.length})
          </button>
        )}
        {activeStaffCount === 0 && shiftState === "active" && (
          <button
            type="button"
            onClick={() => navigate("/app/staff/mode/team")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid ${colors.border.subtle}`,
              background: colors.surface.layer1,
              color: colors.text.primary,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            👥 Verificar equipe
          </button>
        )}
      </div>

      {/* ── Espaço vazio intencional ── */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
