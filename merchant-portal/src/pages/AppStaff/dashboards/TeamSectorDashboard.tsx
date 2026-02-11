/**
 * TeamSectorDashboard — Dashboard de Setor: Equipe (nível 2).
 *
 * Pergunta que esta tela responde:
 * "A equipe está completa e funcional hoje?"
 *
 * Dados: StaffContext (activeStaffCount, shiftState).
 * Navegação: OwnerHome → aqui → gestão (via ações contextuais).
 */

import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import {
  SectorDashboardLayout,
  type SectorLevel,
} from "./SectorDashboardLayout";

export function TeamSectorDashboard() {
  const { activeStaffCount, shiftState, tasks } = useStaff();

  // Tarefas atribuídas a pessoas
  const assignedTasks = tasks.filter(
    (t) => t.status !== "done" && t.assigneeRole,
  );

  // Status do setor
  let level: SectorLevel = "normal";
  let label = "EQUIPE COMPLETA";
  if (activeStaffCount === 0 && shiftState === "active") {
    level = "critical";
    label = "SEM EQUIPE ATIVA";
  } else if (activeStaffCount <= 1 && shiftState === "active") {
    level = "attention";
    label = "EQUIPE REDUZIDA";
  } else if (shiftState !== "active") {
    level = "attention";
    label = "TURNO INATIVO";
  }

  // Exceções
  const exceptions: string[] = [];
  if (activeStaffCount === 0 && shiftState === "active")
    exceptions.push("Nenhum colaborador ativo no turno");
  if (activeStaffCount <= 1 && activeStaffCount > 0 && shiftState === "active")
    exceptions.push("Apenas 1 colaborador ativo");
  if (shiftState === "closing") exceptions.push("Turno a encerrar");
  if (shiftState !== "active" && shiftState !== "closing")
    exceptions.push("Sem turno aberto");

  const shiftLabel =
    shiftState === "active"
      ? "Ativo"
      : shiftState === "closing"
      ? "A encerrar"
      : "Inativo";

  return (
    <SectorDashboardLayout
      sectorName="EQUIPE"
      question="Tem gente suficiente e certa?"
      status={{ level, label }}
      summary={
        <>
          <SummaryLine>
            {activeStaffCount} colaborador{activeStaffCount !== 1 ? "es" : ""}{" "}
            ativo{activeStaffCount !== 1 ? "s" : ""}
          </SummaryLine>
          <SummaryLine>Turno: {shiftLabel}</SummaryLine>
          <SummaryLine>
            {assignedTasks.length} tarefa{assignedTasks.length !== 1 ? "s" : ""}{" "}
            atribuída{assignedTasks.length !== 1 ? "s" : ""}
          </SummaryLine>
        </>
      }
      exceptions={exceptions}
      actions={[{ label: "Ver equipe em turno", to: "/app/staff/mode/team" }]}
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
