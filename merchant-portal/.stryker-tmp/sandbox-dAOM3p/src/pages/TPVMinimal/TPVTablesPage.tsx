// @ts-nocheck
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
  const { tables, loading, updateTablePosition } = useTables();

  const mapTables = tables.map((table) => {
    const raw = table as typeof table & { pos_x?: number; pos_y?: number };
    return {
      ...table,
      x: raw.pos_x ?? table.x,
      y: raw.pos_y ?? table.y,
      seats: table.seats ?? 4,
    };
  });

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
          Arraste as mesas no modo canvas para desenhar o layout do seu espaco.
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
            onSelectTable={() => {}}
            onCreateOrder={() => {}}
            onUpdatePosition={updateTablePosition}
            onTableAction={() => {}}
          />
        </div>
      )}
    </div>
  );
}
