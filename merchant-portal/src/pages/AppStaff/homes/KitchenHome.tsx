/**
 * KitchenHome — HOME DA COZINHA (inspirado em Fresh KDS + Toast KDS).
 *
 * Pergunta-chave: "O que eu produzo agora?"
 *
 * Layout:
 *   1. Barra de status (pedidos na fila + tempo médio + turno)
 *   2. StaffMiniKDS (componente KDS compacto — flex: 1)
 *
 * KDS e Chat estão no bottom nav.
 * Interface mínima — foco total na produção.
 */

import { colors } from "../../../ui/design-system/tokens/colors";
import { ShiftTaskSummary } from "../components/ShiftTaskSummary";
import { useStaff } from "../context/StaffContext";
import { StaffMiniKDS } from "../components/StaffMiniKDS";

const theme = colors.modes.dashboard;

export function KitchenHome() {
  const { tasks, shiftState } = useStaff();

  const orderTasks = tasks.filter(
    (t) => t.type === "order" && t.status !== "done",
  );
  const completedToday = tasks.filter(
    (t) =>
      t.type === "order" &&
      t.status === "done" &&
      t.completedAt &&
      isToday(t.completedAt),
  ).length;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* ── STATUS BAR COMPACTA ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 14px",
          backgroundColor: theme.surface.layer1,
          borderBottom: `1px solid ${colors.border.subtle}`,
          flexShrink: 0,
        }}
      >
        <StatusPill
          value={orderTasks.length.toString()}
          label="na fila"
          alert={orderTasks.length >= 5}
        />
        <StatusPill value={completedToday.toString()} label="prontos" />
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color:
              shiftState === "active"
                ? theme.success.base
                : theme.text.tertiary,
            padding: "3px 8px",
            borderRadius: 999,
            backgroundColor:
              shiftState === "active"
                ? `${theme.success.base}15`
                : `${theme.text.tertiary}15`,
          }}
        >
          {shiftState === "active" ? "ATIVO" : "—"}
        </span>
      </div>

      {/* ── HACCP & PREP CHECKLIST ── */}
      <div style={{ padding: "8px 14px", flexShrink: 0 }}>
        <ShiftTaskSummary compact maxVisible={3} title="HACCP & Prep" />
      </div>

      {/* ── KDS PRINCIPAL ── */}
      <StaffMiniKDS />
    </div>
  );
}

function StatusPill({
  value,
  label,
  alert,
}: {
  value: string;
  label: string;
  alert?: boolean;
}) {
  return (
    <span style={{ fontSize: 12, color: theme.text.secondary }}>
      <strong
        style={{
          color: alert ? theme.destructive.base : theme.text.primary,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {value}
      </strong>{" "}
      {label}
    </span>
  );
}

function isToday(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
