/**
 * Diagnóstico da Operação (/app/staff/mode/operation).
 *
 * Pergunta: "POR QUE a operação está ok / em risco?"
 *
 * Regra de produto:
 * - Explica CAUSAS, não resultados
 * - NÃO abre apps (TPV, KDS, Tarefas) — navegação é exclusiva do Shell
 * - Observa, avisa, prioriza
 * - Opcionalmente oferece um único deep-link contextual de "Ver detalhe"
 * UI: scroll é do Shell; sem dashboard/portal; sem duplicar layout.
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCoreHealth } from "../../core/health/useCoreHealth";
import { Card } from "../../ui/design-system/primitives/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import { usePulse } from "../../ui/hooks/usePulse";
import { useStaff } from "./context/StaffContext";

export const ManagerDashboard: React.FC = () => {
  const { tasks, shiftState, specDrifts } = useStaff();
  const { isAlive } = usePulse();
  const { status: coreStatus } = useCoreHealth();

  const criticalTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== "done" &&
          (t.priority === "urgent" || t.priority === "critical"),
      ),
    [tasks],
  );

  const hasTurnIssue = shiftState !== "active";
  const hasCriticalTasks = criticalTasks.length > 0;
  const hasSpecDrifts = specDrifts.length > 0;
  const hasCoreIssue = coreStatus !== "UP" || !isAlive;

  const getHealthStatus = (): {
    status: "ready" | "warning" | "error";
    label: string;
    icon: string;
  } => {
    if (hasCoreIssue || hasCriticalTasks) {
      return { status: "error", label: "Operação crítica", icon: "🔴" };
    }
    if (hasSpecDrifts || hasTurnIssue) {
      return { status: "warning", label: "Operação em atenção", icon: "🟡" };
    }
    return { status: "ready", label: "Operação estável", icon: "🟢" };
  };

  const health = getHealthStatus();

  const insights: { id: string; label: string }[] = [];

  if (!hasCriticalTasks && !hasTurnIssue && !hasSpecDrifts && !hasCoreIssue) {
    insights.push({
      id: "all-good",
      label: "Turno estável, sem exceções e sem tarefas críticas.",
    });
  } else {
    if (hasCoreIssue) {
      insights.push({
        id: "core",
        label: "Causa: sistema instável ou sem pulso confirmado.",
      });
    }
    if (hasCriticalTasks) {
      insights.push({
        id: "critical-tasks",
        label: `Causa: ${criticalTasks.length} tarefa(s) crítica(s) em aberto.`,
      });
    }
    if (hasTurnIssue) {
      insights.push({
        id: "turn",
        label:
          shiftState === "offline"
            ? "Causa: turno offline."
            : shiftState === "closing"
            ? "Causa: turno em encerramento."
            : "Causa: turno fechado.",
      });
    }
    if (hasSpecDrifts) {
      insights.push({
        id: "spec-drifts",
        label: `Causa: ${specDrifts.length} exceção(ões) operacional(is) recente(s).`,
      });
    }
  }

  let detailLink: string | null = null;
  if (hasCriticalTasks) {
    detailLink = "/app/staff/mode/tasks";
  } else if (hasSpecDrifts) {
    detailLink = "/app/staff/mode/alerts";
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Indicador único de saúde — foco visual dominante */}
        <Card
          surface="layer1"
          padding="xl"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 20,
            padding: "48px 32px",
            minHeight: 220,
            border: isAlive
              ? `2px solid ${colors.success.base}`
              : `1px solid ${colors.border.subtle}`,
            transition: "all 0.5s ease",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              fontSize: 64,
              lineHeight: 1,
              filter: isAlive
                ? "drop-shadow(0 0 16px rgba(34, 197, 94, 0.4))"
                : "none",
            }}
          >
            {health.icon}
          </div>
          <div>
            <Text
              size="2xl"
              weight="black"
              color="primary"
              style={{ letterSpacing: "-0.02em" }}
            >
              {health.label}
            </Text>
          </div>
        </Card>

        {/* Insights passivos sobre o estado da operação */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Text
            size="xs"
            weight="bold"
            color="tertiary"
            style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Diagnóstico
          </Text>
          <Card surface="layer1" padding="md">
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {insights.map((item) => (
                <li
                  key={item.id}
                  style={{
                    fontSize: 13,
                    color: colors.text.secondary,
                  }}
                >
                  {item.label}
                </li>
              ))}
            </ul>
            {detailLink && (
              <div style={{ marginTop: 12 }}>
                <Link
                  to={detailLink}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.action.base,
                    textDecoration: "none",
                  }}
                >
                  Ver detalhe →
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
