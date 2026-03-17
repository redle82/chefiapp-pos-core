import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  TABLE_STATE_COLORS,
  TABLE_STATUS_LABELS,
} from "../../core/operational/tableStates";
import { TableMapPanel } from "../../ui/design-system/domain/TableMapPanel";
import { TableProvider, useTables } from "../TPV/context/TableContext";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

export function TPVTablesPage() {
  const restaurantId = useTPVRestaurantId();

  return (
    <TableProvider restaurantId={restaurantId}>
      <TPVTablesContent />
    </TableProvider>
  );
}

const ACTION_BTN = {
  primary: {
    padding: "12px 16px",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
  },
  secondary: {
    padding: "12px 16px",
    background: "#27272a",
    border: "1px solid #3f3f46",
    borderRadius: 10,
    color: "#e4e4e7",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
  },
} as const;

function TPVTablesContent() {
  const { t } = useTranslation(["operational", "common"]);
  const { tables, loading, updateTableStatus, updateTablePosition } =
    useTables();
  const navigate = useNavigate();
  const [actionTableId, setActionTableId] = useState<string | null>(null);

  const mapTables = tables.map((table) => ({
    ...table,
    seats: table.seats ?? 4,
    seatedAt: table.seated_at ?? null,
    lastStateChangeAt: table.last_state_change_at ?? null,
  }));

  const handleSelectTable = useCallback(
    (tableId: string) => {
      // Any click opens the action menu
      setActionTableId(tableId);
    },
    [],
  );

  const handleCreateOrder = useCallback(
    (tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      if (table.status === "free") {
        updateTableStatus(tableId, "occupied");
      }
      navigate(`/op/tpv?table=${table.number}&tableId=${table.id}`);
    },
    [tables, updateTableStatus, navigate],
  );

  const handleTableAction = useCallback((tableId: string) => {
    setActionTableId(tableId);
  }, []);

  const handleCloseAction = useCallback(() => {
    setActionTableId(null);
  }, []);

  const doAction = useCallback(
    (tableId: string, action: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      switch (action) {
        case "free":
          updateTableStatus(tableId, "free");
          break;
        case "occupy":
          updateTableStatus(tableId, "occupied");
          break;
        case "reserve":
          updateTableStatus(tableId, "reserved");
          break;
        case "cleaning":
          updateTableStatus(tableId, "cleaning");
          break;
        case "block":
          updateTableStatus(tableId, "blocked");
          break;
        case "pos":
          navigate(`/op/tpv?table=${table.number}&tableId=${table.id}`);
          break;
      }
      setActionTableId(null);
    },
    [tables, updateTableStatus, navigate],
  );

  const actionTable = actionTableId
    ? tables.find((t) => t.id === actionTableId)
    : null;

  // Contextual actions per state
  const getActionsForState = (status: string) => {
    switch (status) {
      case "free":
        return [
          { action: "pos", label: t("tables.actionOpenBill"), bg: "#6366f1" },
          { action: "reserve", label: t("tables.actionReserve"), bg: TABLE_STATE_COLORS.reserved },
          { action: "block", label: t("tables.actionBlock"), bg: TABLE_STATE_COLORS.blocked },
        ];
      case "reserved":
        return [
          { action: "occupy", label: t("tables.actionSeat"), bg: TABLE_STATE_COLORS.occupied },
          { action: "free", label: t("tables.actionCancelReservation"), bg: TABLE_STATE_COLORS.free },
        ];
      case "occupied":
        return [
          { action: "pos", label: t("tables.actionGoToPOS"), bg: "#6366f1" },
          { action: "free", label: t("tables.actionFreeTable"), bg: TABLE_STATE_COLORS.free },
        ];
      case "in_prep":
        return [
          { action: "pos", label: t("tables.actionGoToPOS"), bg: "#6366f1" },
        ];
      case "ready_to_serve":
        return [
          { action: "occupy", label: t("tables.actionMarkServed"), bg: TABLE_STATE_COLORS.occupied },
          { action: "pos", label: t("tables.actionGoToPOS"), bg: "#6366f1" },
        ];
      case "bill_requested":
        return [
          { action: "pos", label: t("tables.actionProcessPayment"), bg: "#6366f1" },
        ];
      case "cleaning":
        return [
          { action: "free", label: t("tables.actionMarkClean"), bg: TABLE_STATE_COLORS.free },
        ];
      case "blocked":
        return [
          { action: "free", label: t("tables.actionUnblock"), bg: TABLE_STATE_COLORS.free },
        ];
      default:
        return [
          { action: "free", label: t("tables.actionFreeTable"), bg: TABLE_STATE_COLORS.free },
        ];
    }
  };

  return (
    <div style={{ padding: 16, height: "100%" }}>
      <div style={{ marginBottom: 12 }}>
        <h1
          style={{
            color: "var(--text-primary)",
            margin: "4px 0 0",
            fontSize: 22,
          }}
        >
          {t("tables.mapTitle")}
        </h1>
        <p style={{ color: "var(--text-tertiary, #737373)", fontSize: 13 }}>
          {t("tables.mapHint")}
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)" }}>
          {t("tables.loading")}
        </div>
      ) : (
        <div style={{ height: "calc(100vh - 240px)" }}>
          <TableMapPanel
            tables={mapTables}
            onSelectTable={handleSelectTable}
            onCreateOrder={handleCreateOrder}
            onUpdatePosition={updateTablePosition}
            onTableAction={handleTableAction}
          />
        </div>
      )}

      {/* Quick action overlay — contextual per state */}
      {actionTable && (
        <div
          onClick={handleCloseAction}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#18181b",
              border: `1px solid ${TABLE_STATE_COLORS[actionTable.status] ?? "#27272a"}40`,
              borderRadius: 16,
              padding: 24,
              minWidth: 280,
              maxWidth: 320,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h3
              style={{
                color: "#fff",
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {t("tables.tableNumber", { n: actionTable.number })}
            </h3>
            <p style={{ color: "#a1a1aa", margin: 0, fontSize: 13 }}>
              {t("tables.state")}{" "}
              <strong style={{ color: TABLE_STATE_COLORS[actionTable.status] ?? "#e4e4e7" }}>
                {t(TABLE_STATUS_LABELS[actionTable.status] ?? actionTable.status)}
              </strong>
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}
            >
              {getActionsForState(actionTable.status).map(({ action, label, bg }) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => doAction(actionTableId!, action)}
                  style={{
                    ...ACTION_BTN.primary,
                    background: bg,
                  }}
                >
                  {label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleCloseAction}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: "none",
                  color: "#71717a",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {t("common:cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
