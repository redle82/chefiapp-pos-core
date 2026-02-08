/**
 * Visão Operacional (/manager/home).
 * Uma tela = uma responsabilidade: leitura rápida da saúde do sistema.
 *
 * Regra de produto:
 * - NÃO abre apps (TPV, KDS, Tarefas) — navegação é exclusiva do Launcher + BottomNav.
 * - Observa, avisa, prioriza.
 * - Opcionalmente oferece um único deep-link contextual de "Ver detalhe".
 * UI: scroll é do Shell; sem dashboard/portal; sem duplicar layout.
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../ui/design-system/primitives/Badge";
import { Card } from "../../ui/design-system/primitives/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import { usePulse } from "../../ui/hooks/usePulse";
import { useStaff } from "./context/StaffContext";

export const ManagerDashboard: React.FC = () => {
  const { currentRiskLevel, tasks, shiftState, activeRole, specDrifts } =
    useStaff();
  const { isAlive } = usePulse();

  const getHealthStatus = (
    risk: number,
  ): { status: "ready" | "warning" | "error"; label: string; icon: string } => {
    if (risk < 30)
      return { status: "ready", label: "Healthy Flow", icon: "🟢" };
    if (risk < 70)
      return { status: "warning", label: "High Tension", icon: "🟡" };
    return { status: "error", label: "Critical Risk", icon: "🔴" };
  };

  const health = getHealthStatus(currentRiskLevel);
  const isOwnerLike = activeRole === "owner" || activeRole === "manager";

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

  const insights: { id: string; label: string }[] = [];

  if (!hasCriticalTasks && !hasTurnIssue && !hasSpecDrifts) {
    insights.push({
      id: "all-good",
      label: "Nenhuma tarefa crítica, turno estável e sem exceções.",
    });
  } else {
    if (hasCriticalTasks) {
      insights.push({
        id: "critical-tasks",
        label: `${criticalTasks.length} tarefa(s) crítica(s) em aberto.`,
      });
    }
    if (hasTurnIssue) {
      insights.push({
        id: "turn",
        label:
          shiftState === "offline"
            ? "Turno offline."
            : shiftState === "closing"
            ? "Turno em encerramento"
            : "Turno fechado",
      });
    }
    if (hasSpecDrifts) {
      insights.push({
        id: "spec-drifts",
        label: `${specDrifts.length} exceção(ões) operacional(is) recente(s).`,
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
            <div style={{ marginTop: 10 }}>
              <Badge
                status={health.status}
                label={`RISK: ${currentRiskLevel.toFixed(1)}%`}
              />
            </div>
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
            Agora
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
