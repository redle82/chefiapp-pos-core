/**
 * TasksSectorDashboard — Dashboard de Setor: Tarefas (nível 2).
 *
 * Pergunta que esta tela responde:
 * "As tarefas do restaurante estão sob controle hoje?"
 *
 * Dados: StaffContext (todas as tasks).
 * Navegação: OwnerHome → aqui → lista completa (via ações contextuais).
 */

import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import {
  SectorDashboardLayout,
  type SectorLevel,
} from "./SectorDashboardLayout";

export function TasksSectorDashboard() {
  const { tasks } = useStaff();

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done");
  const pending = tasks.filter((t) => t.status !== "done");
  const critical = pending.filter((t) => t.priority === "critical");
  const urgent = pending.filter((t) => t.priority === "urgent");

  // Status do setor
  let level: SectorLevel = "normal";
  let label = "TAREFAS EM DIA";
  if (critical.length > 0) {
    level = "critical";
    label = "TAREFAS CRÍTICAS";
  } else if (pending.length >= 5 || urgent.length > 0) {
    level = "attention";
    label = "ATENÇÃO NAS TAREFAS";
  }

  // Exceções
  const exceptions: string[] = [];
  if (critical.length > 0)
    exceptions.push(
      `${critical.length} tarefa${critical.length !== 1 ? "s" : ""} crítica${
        critical.length !== 1 ? "s" : ""
      }`,
    );
  if (urgent.length > 0)
    exceptions.push(
      `${urgent.length} tarefa${urgent.length !== 1 ? "s" : ""} urgente${
        urgent.length !== 1 ? "s" : ""
      }`,
    );
  if (pending.length >= 8) exceptions.push("Acúmulo de tarefas pendentes");

  // Últimas concluídas
  const recentDone = done
    .sort(
      (a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt),
    )
    .slice(0, 3);

  return (
    <SectorDashboardLayout
      sectorName="TAREFAS"
      question="Algo importante está atrasado?"
      status={{ level, label }}
      summary={
        <>
          <SummaryLine>
            {total} tarefa{total !== 1 ? "s" : ""} hoje
          </SummaryLine>
          <SummaryLine>
            {done.length} concluída{done.length !== 1 ? "s" : ""}
          </SummaryLine>
          <SummaryLine>
            {pending.length} pendente{pending.length !== 1 ? "s" : ""}
          </SummaryLine>
        </>
      }
      detail={
        recentDone.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.text.tertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              ÚLTIMAS CONCLUÍDAS
            </span>
            {recentDone.map((t) => (
              <span
                key={t.id}
                style={{
                  fontSize: 14,
                  color: colors.text.primary,
                  fontWeight: 500,
                }}
              >
                • {t.title} ✔️
              </span>
            ))}
          </div>
        ) : undefined
      }
      exceptions={exceptions}
      actions={[{ label: "Ver todas as tarefas", to: "/app/staff/mode/tasks" }]}
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
