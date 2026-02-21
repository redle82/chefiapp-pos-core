/**
 * WorkerHome — Home de AÇÃO do Trabalhador.
 *
 * Pergunta-chave: "O que eu faço agora?"
 * Mostra tarefas atribuídas. Nada mais.
 * ❌ NÃO mostra botões de navegação (já estão no rodapé).
 */
// @ts-nocheck


import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

export function WorkerHome() {
  const { tasks } = useStaff();

  const myTasks = tasks.filter(
    (t) =>
      t.assigneeRole === "worker" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["worker", "waiter"].includes(t.assigneeRole)),
  );
  const pending = myTasks.filter((t) => t.status !== "done");
  const statusLabel =
    pending.length === 0 ? "Tudo em dia" : `${pending.length} pendente(s)`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: "16px",
        backgroundColor: colors.surface.base,
        gap: 12,
      }}
    >
      <h2
        style={{
          fontSize: 14,
          fontWeight: 700,
          margin: 0,
          color: colors.text.tertiary,
          letterSpacing: "0.04em",
        }}
      >
        TRABALHADOR
      </h2>
      <p style={{ fontSize: 13, color: colors.text.secondary, margin: 0 }}>
        {statusLabel}
      </p>

      {/* Lista de tarefas atribuídas */}
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {myTasks.length === 0 ? (
          <li
            style={{
              padding: "12px 0",
              color: colors.text.secondary,
              textAlign: "center",
            }}
          >
            Nenhuma tarefa atribuída
          </li>
        ) : (
          myTasks.slice(0, 10).map((t) => (
            <li
              key={t.id}
              style={{
                padding: "10px 12px",
                background: colors.surface.layer1,
                borderRadius: 8,
                border: `1px solid ${colors.border.subtle}`,
                color: colors.text.primary,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{t.status === "done" ? "☑" : "☐"}</span>
              <span>{t.title}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
