/**
 * WaiterHome — Home de AÇÃO do Garçom.
 *
 * Pergunta-chave: "O que eu faço agora?"
 *
 * Mostra:
 *   • Estado do turno
 *   • Mesas ativas (grid interativo)
 *   • Tarefas atribuídas (resumo)
 *
 * ❌ NÃO mostra botões de navegação (TPV, Tarefas, Turno — já estão no rodapé).
 */

import { useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import { useAppStaffTables } from "../hooks/useAppStaffTables";

/** Design Contract v1: mesma cor de acção (dourado) que o dashboard. */
const actionAccent = colors.modes.dashboard.action;

export function WaiterHome() {
  const { restaurantId, tasks, shiftState } = useStaff();
  const { tables, loading } = useAppStaffTables(restaurantId);
  const navigate = useNavigate();

  const handleTableClick = (tableId: string) => {
    navigate("/app/staff/mode/tpv", { state: { tableId } });
  };

  const sortedTables = [...tables].sort((a, b) => a.number - b.number);
  const myTasks = tasks.filter(
    (t) =>
      t.status !== "done" &&
      (t.assigneeRole === "waiter" ||
        t.type === "reactive" ||
        (!t.assigneeRole && t.context !== "floor")),
  );
  const occupiedCount = tables.filter(
    (t) => t.status === "occupied" || t.status === "reserved",
  ).length;

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
      {/* ── Estado rápido ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 12,
          color: colors.text.secondary,
        }}
      >
        <span>
          Turno:{" "}
          <strong style={{ color: colors.text.primary }}>
            {shiftState === "active" ? "ATIVO" : "—"}
          </strong>
        </span>
        <span>
          <strong style={{ color: colors.text.primary }}>
            {occupiedCount}
          </strong>{" "}
          mesa{occupiedCount !== 1 ? "s" : ""} ativa
          {occupiedCount !== 1 ? "s" : ""}
        </span>
        {myTasks.length > 0 && (
          <span style={{ color: "#f59e0b", fontWeight: 600 }}>
            {myTasks.length} tarefa{myTasks.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Mesas (grid) — toque → TPV com essa mesa ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          alignContent: "start",
          overflow: "auto",
        }}
      >
        {loading ? (
          <span style={{ gridColumn: "1 / -1", color: colors.text.tertiary }}>
            A carregar…
          </span>
        ) : sortedTables.length === 0 ? (
          Array.from({ length: 12 }, (_, i) => (
            <TableTile
              key={i}
              number={i + 1}
              status="free"
              onClick={() => {}}
            />
          ))
        ) : (
          sortedTables.map((t) => (
            <TableTile
              key={t.id}
              number={t.number}
              status={t.status}
              onClick={() => handleTableClick(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TableTile({
  number,
  status,
  onClick,
}: {
  number: number;
  status: string;
  onClick: () => void;
}) {
  const borderColor =
    status === "occupied" || status === "reserved"
      ? actionAccent.base
      : colors.border.subtle;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        aspectRatio: "1/1",
        borderRadius: 12,
        border: `2px solid ${borderColor}`,
        background: status === "free" ? "transparent" : `${borderColor}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 18,
        color: status === "free" ? colors.text.tertiary : colors.text.primary,
      }}
    >
      {number}
    </button>
  );
}
