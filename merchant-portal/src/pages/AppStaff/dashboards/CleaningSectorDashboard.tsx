/**
 * CleaningSectorDashboard — Dashboard de Setor: Limpeza (nível 2).
 *
 * Pergunta que esta tela responde:
 * "A limpeza do restaurante está sob controle hoje?"
 *
 * Dados: StaffContext (tasks filtradas por limpeza).
 * Navegação: OwnerHome → aqui → ferramenta (via "Mais").
 */

import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import {
  SectorDashboardLayout,
  type SectorLevel,
} from "./SectorDashboardLayout";

export function CleaningSectorDashboard() {
  const { tasks } = useStaff();

  // Tarefas de limpeza
  const cleaningTasks = tasks.filter(
    (t) =>
      t.context === "floor" ||
      t.type === "maintenance" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["cleaning", "worker"].includes(t.assigneeRole)),
  );
  const total = cleaningTasks.length;
  const done = cleaningTasks.filter((t) => t.status === "done");
  const pending = cleaningTasks.filter((t) => t.status !== "done");
  const critical = pending.filter((t) => t.priority === "critical");

  // Status do setor
  let level: SectorLevel = "normal";
  let label = "LIMPEZA EM DIA";
  if (critical.length > 0) {
    level = "critical";
    label = "LIMPEZA CRÍTICA";
  } else if (pending.length > 0) {
    level = "attention";
    label = "ATENÇÃO NA LIMPEZA";
  }

  // Exceções
  const exceptions: string[] = [];
  if (critical.length > 0)
    exceptions.push(
      `${critical.length} tarefa${critical.length !== 1 ? "s" : ""} crítica${
        critical.length !== 1 ? "s" : ""
      }`,
    );
  if (pending.length >= 3) exceptions.push("Limpeza acumulada");

  // Histórico recente (últimas 3–4 executadas)
  const recentDone = done
    .sort(
      (a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt),
    )
    .slice(0, 3);
  const recentPending = pending.slice(0, 1);

  return (
    <SectorDashboardLayout
      sectorName="LIMPEZA"
      status={{ level, label }}
      summary={
        <>
          <SummaryLine>
            {total} tarefa{total !== 1 ? "s" : ""} planejada
            {total !== 1 ? "s" : ""}
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
        recentDone.length > 0 || recentPending.length > 0 ? (
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
              ÚLTIMAS EXECUÇÕES
            </span>
            {recentDone.map((t) => (
              <HistoryItem key={t.id} label={t.title} done />
            ))}
            {recentPending.map((t) => (
              <HistoryItem key={t.id} label={t.title} done={false} />
            ))}
          </div>
        ) : undefined
      }
      exceptions={exceptions}
      actions={[
        { label: "Ver tarefas de limpeza", to: "/app/staff/mode/tasks" },
      ]}
    />
  );
}

/* ── Micro-componentes internos ── */

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

function HistoryItem({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      style={{
        fontSize: 14,
        color: colors.text.primary,
        fontWeight: 500,
      }}
    >
      • {label} {done ? "✔️" : "(pendente)"}
    </span>
  );
}
