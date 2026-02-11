/**
 * KitchenSectorDashboard — Dashboard de Setor: Cozinha (nível 2).
 *
 * Pergunta que esta tela responde:
 * "A cozinha está fluindo ou está virando gargalo?"
 *
 * Dados: StaffContext (tasks filtradas por cozinha).
 * Navegação: OwnerHome → aqui → KDS (via ações contextuais).
 */

import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import {
  SectorDashboardLayout,
  type SectorLevel,
} from "./SectorDashboardLayout";

export function KitchenSectorDashboard() {
  const { tasks } = useStaff();

  // Tarefas de cozinha
  const kitchenTasks = tasks.filter(
    (t) => t.assigneeRole === "kitchen" || t.context === "kitchen",
  );
  const total = kitchenTasks.length;
  const pending = kitchenTasks.filter((t) => t.status !== "done");
  const critical = pending.filter((t) => t.priority === "critical");

  // Status do setor
  let level: SectorLevel = "normal";
  let label = "COZINHA FLUINDO";
  if (critical.length > 0) {
    level = "critical";
    label = "COZINHA CRÍTICA";
  } else if (pending.length >= 3) {
    level = "attention";
    label = "COZINHA EM ATENÇÃO";
  }

  // Exceções
  const exceptions: string[] = [];
  if (critical.length > 0)
    exceptions.push(
      `${critical.length} pedido${critical.length !== 1 ? "s" : ""} crítico${
        critical.length !== 1 ? "s" : ""
      }`,
    );
  if (pending.length >= 5) exceptions.push("Fila acima do normal");

  return (
    <SectorDashboardLayout
      sectorName="COZINHA"
      question="A produção está fluindo?"
      status={{ level, label }}
      summary={
        <>
          <SummaryLine>
            {total} pedido{total !== 1 ? "s" : ""} processado
            {total !== 1 ? "s" : ""}
          </SummaryLine>
          <SummaryLine>{pending.length} em fila</SummaryLine>
          <SummaryLine>Tempo médio: —</SummaryLine>
        </>
      }
      detail={
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
            FILA ATUAL
          </span>
          <SummaryLine>
            {pending.length} pedido{pending.length !== 1 ? "s" : ""} ativo
            {pending.length !== 1 ? "s" : ""}
          </SummaryLine>
          <SummaryLine>Maior atraso: —</SummaryLine>
        </div>
      }
      exceptions={exceptions}
      actions={[{ label: "Ver KDS", to: "/app/staff/mode/kds" }]}
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
