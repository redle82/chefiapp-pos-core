/**
 * WaiterHome — HOME DE AÇÃO DO GARÇOM (inspirado em Square Floor Plan + Toast).
 *
 * Pergunta-chave: "O que eu faço agora?"
 *
 * Layout:
 *   1. Status do turno + mesas ocupadas + tarefas pendentes (barra compacta)
 *   2. Grid de mesas (4 colunas, interativo — toque abre TPV para a mesa)
 *   3. Tarefas pendentes (lista compacta, máx. 3)
 *
 * TPV e Chat estão no bottom nav — não precisam de atalho aqui.
 * O garçom precisa de:
 *   - Ver QUAIS mesas estão ocupadas (floor plan simplificado)
 *   - Abrir um pedido com 1 toque (table → TPV)
 *   - Ver se tem tarefas urgentes
 */

import { useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";
import { ShiftTaskSummary } from "../components/ShiftTaskSummary";
import { useStaff } from "../context/StaffContext";
import { useAppStaffTables } from "../hooks/useAppStaffTables";

const theme = colors.modes.dashboard;

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
  const urgentTasks = myTasks.filter(
    (t) => t.priority === "critical" || t.priority === "urgent",
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: "12px 16px",
        backgroundColor: colors.surface.base,
        gap: 12,
      }}
    >
      {/* ── STATUS BAR ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderRadius: 12,
          backgroundColor: theme.surface.layer1,
        }}
      >
        <StatusChip
          label={shiftState === "active" ? "ATIVO" : "—"}
          color={
            shiftState === "active" ? theme.success.base : theme.text.tertiary
          }
        />
        <span style={{ fontSize: 13, color: theme.text.secondary }}>
          <strong style={{ color: theme.text.primary }}>{occupiedCount}</strong>{" "}
          mesa{occupiedCount !== 1 ? "s" : ""}
        </span>
        {myTasks.length > 0 && (
          <span
            style={{
              fontSize: 13,
              color: urgentTasks.length > 0 ? theme.destructive.base : "#f59e0b",
              fontWeight: 600,
              marginLeft: "auto",
            }}
          >
            {myTasks.length} tarefa{myTasks.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── CHECKLIST ── */}
      <ShiftTaskSummary compact maxVisible={4} />

      {/* ── MESAS (Square floor plan pattern) ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 8,
          alignContent: "start",
          overflow: "auto",
          paddingBottom: 8,
        }}
      >
        {loading ? (
          <span
            style={{
              gridColumn: "1 / -1",
              color: theme.text.tertiary,
              textAlign: "center",
              padding: "40px 0",
              fontSize: 13,
            }}
          >
            A carregar mesas…
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

      {/* ── TAREFAS PENDENTES (máx. 3) ── */}
      {myTasks.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            borderTop: `1px solid ${colors.border.subtle}`,
            paddingTop: 10,
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
                fontSize: 10,
                fontWeight: 700,
                color: theme.text.tertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Tarefas
            </span>
            {myTasks.length > 3 && (
              <button
                type="button"
                onClick={() => navigate("/app/staff/mode/tasks")}
                style={{
                  fontSize: 11,
                  color: theme.action.base,
                  fontWeight: 600,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Ver todas →
              </button>
            )}
          </div>
          {myTasks.slice(0, 3).map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                backgroundColor: theme.surface.layer1,
                fontSize: 13,
                color: theme.text.primary,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor:
                    t.priority === "critical"
                      ? theme.destructive.base
                      : t.priority === "urgent"
                      ? "#f59e0b"
                      : theme.text.tertiary,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChip({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        letterSpacing: "0.05em",
        padding: "3px 8px",
        borderRadius: 999,
        backgroundColor: `${color}15`,
      }}
    >
      {label}
    </span>
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
  const isOccupied = status === "occupied" || status === "reserved";
  const accentColor = colors.modes.dashboard.action.base;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        aspectRatio: "1/1",
        borderRadius: 12,
        border: `2px solid ${isOccupied ? accentColor : colors.border.subtle}`,
        background: isOccupied ? `${accentColor}15` : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 18,
        color: isOccupied ? theme.text.primary : theme.text.tertiary,
        transition: "all 0.15s ease",
      }}
    >
      {number}
    </button>
  );
}
