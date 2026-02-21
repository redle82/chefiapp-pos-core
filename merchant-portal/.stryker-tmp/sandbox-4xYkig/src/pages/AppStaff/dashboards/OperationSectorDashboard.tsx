/**
 * OperationSectorDashboard — Dashboard de Setor: Operação (nível 2).
 *
 * Pergunta que esta tela responde:
 * "A operação está saudável neste momento?"
 *
 * Dados: StaffContext + useCoreHealth.
 * Navegação: OwnerHome → aqui → visão operacional (via ações contextuais).
 */

import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import {
  SectorDashboardLayout,
  type SectorLevel,
} from "./SectorDashboardLayout";

export function OperationSectorDashboard() {
  const { specDrifts, shiftState, activeStaffCount, tasks } = useStaff();
  const { status: coreStatus } = useCoreHealth();

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const criticalAlerts = specDrifts.filter(
    (d) =>
      (d as unknown as { severity?: string }).severity === "critical" ||
      (d as unknown as { severity?: string }).severity === "high",
  );

  // Status do setor
  let level: SectorLevel = "normal";
  let label = "OPERAÇÃO NORMAL";
  if (coreStatus !== "UP" || criticalAlerts.length > 0) {
    level = "critical";
    label = "OPERAÇÃO CRÍTICA";
  } else if (
    specDrifts.length > 0 ||
    pendingTasks.length >= 5 ||
    shiftState !== "active" ||
    activeStaffCount === 0
  ) {
    level = "attention";
    label = "OPERAÇÃO EM ATENÇÃO";
  }

  // Exceções
  const exceptions: string[] = [];
  if (coreStatus !== "UP")
    exceptions.push("Core indisponível — verifique a ligação ao servidor");
  if (criticalAlerts.length > 0)
    exceptions.push(
      `${criticalAlerts.length} alerta${
        criticalAlerts.length !== 1 ? "s" : ""
      } crítico${criticalAlerts.length !== 1 ? "s" : ""}`,
    );
  if (shiftState !== "active" && shiftState !== "closing")
    exceptions.push("Turno inativo");
  if (shiftState === "closing") exceptions.push("Turno a encerrar");
  if (activeStaffCount === 0 && shiftState === "active")
    exceptions.push("Sem equipe ativa");

  const shiftLabel =
    shiftState === "active"
      ? "Ativo"
      : shiftState === "closing"
      ? "A encerrar"
      : "Inativo";

  return (
    <SectorDashboardLayout
      sectorName="OPERAÇÃO"
      question="O sistema está saudável agora?"
      status={{ level, label }}
      summary={
        <>
          <SummaryLine>Turno: {shiftLabel}</SummaryLine>
          <SummaryLine>
            {activeStaffCount} colaborador{activeStaffCount !== 1 ? "es" : ""}{" "}
            ativo{activeStaffCount !== 1 ? "s" : ""}
          </SummaryLine>
          <SummaryLine>
            {specDrifts.length} alerta{specDrifts.length !== 1 ? "s" : ""}
          </SummaryLine>
          <SummaryLine>
            {pendingTasks.length} tarefa{pendingTasks.length !== 1 ? "s" : ""}{" "}
            pendente{pendingTasks.length !== 1 ? "s" : ""}
          </SummaryLine>
          <SummaryLine>Caixa: —</SummaryLine>
        </>
      }
      exceptions={exceptions}
      actions={[
        { label: "Ver visão operacional", to: "/app/staff/mode/operation" },
        { label: "Ver exceções", to: "/app/staff/mode/alerts" },
      ]}
    />
  );
}

/* ── Micro-componente ── */

function SummaryLine({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 14,
        color: colors.text.primary,
        fontWeight: 500,
      }}
    >
      • {children}
    </span>
  );
}
