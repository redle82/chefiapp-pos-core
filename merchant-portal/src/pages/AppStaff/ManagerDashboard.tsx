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
import { Card } from "../../ui/design-system/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { usePulse } from "../../ui/hooks/usePulse";
import { useStaff } from "./context/StaffContext";
import styles from "./ManagerDashboard.module.css";

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
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Indicador único de saúde — foco visual dominante */}
        <Card
          surface="layer1"
          padding="xl"
          className={styles.healthCard}
          data-alive={String(isAlive)}
        >
          <div className={styles.healthIcon} data-alive={String(isAlive)}>
            {health.icon}
          </div>
          <div>
            <Text
              size="2xl"
              weight="black"
              color="primary"
              className={styles.healthLabel}
            >
              {health.label}
            </Text>
          </div>
        </Card>

        {/* Insights passivos sobre o estado da operação */}
        <div className={styles.insightsSection}>
          <Text
            size="xs"
            weight="bold"
            color="tertiary"
            className={styles.insightsTitle}
          >
            Diagnóstico
          </Text>
          <Card surface="layer1" padding="md">
            <ul className={styles.insightsList}>
              {insights.map((item) => (
                <li key={item.id} className={styles.insightItem}>
                  {item.label}
                </li>
              ))}
            </ul>
            {detailLink && (
              <div className={styles.detailLinkWrapper}>
                <Link to={detailLink} className={styles.detailLink}>
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
