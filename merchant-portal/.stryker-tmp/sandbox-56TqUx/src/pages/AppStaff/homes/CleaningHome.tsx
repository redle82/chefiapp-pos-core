/**
 * CleaningHome — Home de AÇÃO da Limpeza.
 *
 * Pergunta-chave: "O que eu limpo agora?"
 * Mostra tarefas de limpeza atribuídas.
 * ❌ NÃO mostra botões de navegação (já estão no rodapé).
 */
// @ts-nocheck


import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

export function CleaningHome() {
  const { tasks } = useStaff();

  const cleaningTasks = tasks.filter(
    (t) =>
      t.context === "floor" ||
      t.type === "maintenance" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["cleaning", "worker"].includes(t.assigneeRole)),
  );
  const pending = cleaningTasks.filter((t) => t.status !== "done");
  const statusLabel =
    pending.length === 0 ? "OK" : `${pending.length} pendente(s)`;

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
        LIMPEZA
      </h2>
      <p style={{ fontSize: 13, color: colors.text.secondary, margin: 0 }}>
        Status geral: {statusLabel}
      </p>
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
        {cleaningTasks.length === 0 ? (
          <>
            <li style={{ padding: "8px 0", color: colors.text.secondary }}>
              ☐ Mesa 3
            </li>
            <li style={{ padding: "8px 0", color: colors.text.secondary }}>
              ☐ WC
            </li>
            <li style={{ padding: "8px 0", color: colors.text.secondary }}>
              ☐ Área externa
            </li>
          </>
        ) : (
          cleaningTasks.slice(0, 10).map((t) => (
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
