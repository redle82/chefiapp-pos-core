/**
 * CleaningHome — HOME DA LIMPEZA (inspirado em Lightspeed Tasks + checklists).
 *
 * Pergunta-chave: "O que eu limpo agora?"
 *
 * Layout:
 *   1. Progresso do dia (barra + contagem)
 *   2. Lista de tarefas com checkbox interativo
 *   3. Estado de progresso visual
 *
 * Tarefas e Chat estão no bottom nav.
 */

import { colors } from "../../../ui/design-system/tokens/colors";
import { ShiftTaskSummary } from "../components/ShiftTaskSummary";
import { useStaff } from "../context/StaffContext";

const theme = colors.modes.dashboard;

export function CleaningHome() {
  const { tasks } = useStaff();

  const cleaningTasks = tasks.filter(
    (t) =>
      t.context === "floor" ||
      t.type === "maintenance" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["cleaning", "worker"].includes(t.assigneeRole)),
  );
  const done = cleaningTasks.filter((t) => t.status === "done").length;
  const total = cleaningTasks.length;
  const pending = cleaningTasks.filter((t) => t.status !== "done");
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: "16px",
        backgroundColor: colors.surface.base,
        gap: 14,
      }}
    >
      {/* ── PROGRESSO DO DIA ── */}
      <div
        style={{
          padding: "16px",
          borderRadius: 14,
          backgroundColor: theme.surface.layer1,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: theme.text.primary,
            }}
          >
            {pending.length === 0
              ? "Tudo limpo!"
              : `${pending.length} pendente${pending.length !== 1 ? "s" : ""}`}
          </span>
          <span
            style={{
              fontSize: 12,
              color: theme.text.secondary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {done}/{total}
          </span>
        </div>
        {/* Progress bar */}
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: `${theme.text.tertiary}20`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 3,
              backgroundColor:
                progress === 100
                  ? theme.success.base
                  : progress >= 50
                  ? theme.action.base
                  : "#f59e0b",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* ── ROLE TASK CHECKLIST (primary content) ── */}
      <ShiftTaskSummary showProgress />

      {/* ── LISTA DE TAREFAS ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          paddingBottom: 80,
        }}
      >
        {cleaningTasks.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: theme.text.tertiary,
              fontSize: 14,
            }}
          >
            Sem tarefas de limpeza hoje
          </div>
        ) : (
          cleaningTasks.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 10,
                backgroundColor: theme.surface.layer1,
                border: `1px solid ${
                  t.priority === "critical"
                    ? `${theme.destructive.base}30`
                    : colors.border.subtle
                }`,
                opacity: t.status === "done" ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>
                {t.status === "done" ? "✅" : "⬜"}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: theme.text.primary,
                  textDecoration:
                    t.status === "done" ? "line-through" : "none",
                }}
              >
                {t.title}
              </span>
              {t.priority === "critical" && t.status !== "done" && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: theme.destructive.base,
                    padding: "2px 6px",
                    borderRadius: 999,
                    backgroundColor: `${theme.destructive.base}15`,
                  }}
                >
                  URGENTE
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
