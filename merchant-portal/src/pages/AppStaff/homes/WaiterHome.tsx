/**
 * WaiterHome — Home por papel: Garçom.
 * Foco: Mesas (grid), Pedidos, Chamados (Alertas). Obrigatórios: Tarefas, Turno.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import { useAppStaffTables } from "../hooks/useAppStaffTables";

export function WaiterHome() {
  const { restaurantId } = useStaff();
  const { tables, loading } = useAppStaffTables(restaurantId);
  const navigate = useNavigate();

  const handleTableClick = (tableId: string) => {
    navigate("/app/staff/mode/tpv", { state: { tableId } });
  };

  const sortedTables = [...tables].sort((a, b) => a.number - b.number);

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
        GARÇOM
      </h2>
      {/* Mesas = grid; toque numa mesa → TPV com essa mesa */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          alignContent: "start",
        }}
      >
        {loading ? (
          <span style={{ gridColumn: "1 / -1", color: colors.text.tertiary }}>A carregar...</span>
        ) : sortedTables.length === 0 ? (
          Array.from({ length: 12 }, (_, i) => (
            <TableTile key={i} number={i + 1} status="free" onClick={() => {}} />
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
      {/* Foco: Mesas, Pedidos, Chamados (Alertas). Obrigatórios: Tarefas, Turno */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          style={{
            flex: "1 1 0",
            minWidth: 0,
            padding: "12px",
            background: colors.surface.layer2,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "default",
          }}
        >
          🍽️ Mesas
        </button>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/tpv")}
          style={{
            flex: "1 1 0",
            minWidth: 0,
            padding: "12px",
            background: colors.surface.layer1,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "pointer",
          }}
        >
          🧾 Pedidos
        </button>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/alerts")}
          style={{
            flex: "1 1 0",
            minWidth: 0,
            padding: "12px",
            background: colors.surface.layer1,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "pointer",
          }}
        >
          ⚠️ Chamados
        </button>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/tasks")}
          style={{
            flex: "1 1 0",
            minWidth: 0,
            padding: "12px",
            background: colors.surface.layer1,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "pointer",
          }}
        >
          🧹 Tarefas
        </button>
        <button
          type="button"
          onClick={() => navigate("/app/staff/mode/turn")}
          style={{
            flex: "1 1 0",
            minWidth: 0,
            padding: "12px",
            background: colors.surface.layer1,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            color: colors.text.primary,
            cursor: "pointer",
          }}
        >
          ⏱️ Turno
        </button>
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
      ? colors.action.base
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
