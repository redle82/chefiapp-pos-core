import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function TPVTablesContent() {
  const { tables, loading, updateTableStatus, updateTablePosition } =
    useTables();
  const navigate = useNavigate();
  const [actionTableId, setActionTableId] = useState<string | null>(null);

  const mapTables = tables.map((table) => {
    const raw = table as typeof table & {
      pos_x?: number;
      pos_y?: number;
      zone?: string;
    };
    return {
      ...table,
      x: raw.pos_x ?? table.x,
      y: raw.pos_y ?? table.y,
      seats: table.seats ?? 4,
      zone: raw.zone,
      seatedAt: table.seated_at ?? null,
    };
  });

  const handleSelectTable = useCallback(
    (tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;

      if (table.status === "free") {
        // Free table → mark as occupied
        updateTableStatus(tableId, "occupied");
      } else if (table.status === "occupied") {
        // Occupied table → show action menu
        setActionTableId(tableId);
      } else if (table.status === "reserved") {
        // Reserved → seat them (mark occupied)
        updateTableStatus(tableId, "occupied");
      }
    },
    [tables, updateTableStatus],
  );

  const handleCreateOrder = useCallback(
    (tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;

      // Mark table as occupied and navigate to POS
      if (table.status === "free") {
        updateTableStatus(tableId, "occupied");
      }
      navigate(`/op/tpv?table=${table.number}`);
    },
    [tables, updateTableStatus, navigate],
  );

  const handleTableAction = useCallback((tableId: string) => {
    setActionTableId(tableId);
  }, []);

  const handleCloseAction = useCallback(() => {
    setActionTableId(null);
  }, []);

  const handleFreeTable = useCallback(
    (tableId: string) => {
      updateTableStatus(tableId, "free");
      setActionTableId(null);
    },
    [updateTableStatus],
  );

  const handleReserveTable = useCallback(
    (tableId: string) => {
      updateTableStatus(tableId, "reserved");
      setActionTableId(null);
    },
    [updateTableStatus],
  );

  const actionTable = actionTableId
    ? tables.find((t) => t.id === actionTableId)
    : null;

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
          Mapa de Mesas
        </h1>
        <p style={{ color: "var(--text-tertiary, #737373)", fontSize: 13 }}>
          Toque numa mesa para alterar o estado. Duplo-clique para abrir conta.
          Use o modo Planta para arrastar mesas.
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)" }}>
          A carregar mesas...
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

      {/* Quick action overlay for occupied/reserved tables */}
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
              border: "1px solid #27272a",
              borderRadius: 16,
              padding: 24,
              minWidth: 280,
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
              Mesa {actionTable.number}
            </h3>
            <p style={{ color: "#a1a1aa", margin: 0, fontSize: 13 }}>
              Estado atual:{" "}
              <strong style={{ color: "#e4e4e7" }}>
                {actionTable.status === "free"
                  ? "Livre"
                  : actionTable.status === "occupied"
                    ? "Ocupada"
                    : "Reservada"}
              </strong>
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}
            >
              {actionTable.status !== "free" && (
                <button
                  type="button"
                  onClick={() => handleFreeTable(actionTableId!)}
                  style={{
                    padding: "12px 16px",
                    background: "#10b981",
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Libertar mesa
                </button>
              )}
              {actionTable.status === "free" && (
                <button
                  type="button"
                  onClick={() => handleCreateOrder(actionTableId!)}
                  style={{
                    padding: "12px 16px",
                    background: "#6366f1",
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Abrir conta
                </button>
              )}
              {actionTable.status !== "reserved" && (
                <button
                  type="button"
                  onClick={() => handleReserveTable(actionTableId!)}
                  style={{
                    padding: "12px 16px",
                    background: "#27272a",
                    border: "1px solid #3f3f46",
                    borderRadius: 10,
                    color: "#e4e4e7",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Marcar como reservada
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(`/op/tpv?table=${actionTable.number}`)}
                style={{
                  padding: "12px 16px",
                  background: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: 10,
                  color: "#e4e4e7",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Ir para POS
              </button>
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
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
