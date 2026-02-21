/**
 * TPVMobileTablesView — Mobile table map view
 *
 * Simplified table map for mobile:
 * - Grid of cards instead of canvas
 * - Status indicators (free, occupied, reserved)
 * - Tap to select table → start order
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

interface TableData {
  id: string;
  number: number;
  label: string;
  seats: number;
  status: "free" | "occupied" | "reserved" | "billing";
  current_order_id?: string;
  occupancy_time?: number; // minutes
}

interface TPVMobileTablesViewProps {
  restaurantId: string;
  onSelectTable: (tableId: string, tableNumber: number) => void;
}

export function TPVMobileTablesView({
  restaurantId,
  onSelectTable,
}: TPVMobileTablesViewProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "occupied">("all");

  useEffect(() => {
    if (!restaurantId) return;

    const fetchTables = async () => {
      setLoading(true);

      const { data: tablesData } = await dockerCoreClient
        .from("gm_tables")
        .select("id, number, qr_code, status")
        .eq("restaurant_id", restaurantId)
        .order("number", { ascending: true });

      if (tablesData && Array.isArray(tablesData)) {
        setTables(
          tablesData.map((t: Record<string, unknown>) => ({
            id: t.id as string,
            number: t.number as number,
            label: `Mesa ${t.number}`,
            seats: 4, // Default - column not in schema
            status: ((t.status as string) === "closed"
              ? "free"
              : (t.status as string) ?? "free") as TableData["status"],
            current_order_id: undefined, // Column not in schema
          })),
        );
      }

      setLoading(false);
    };

    fetchTables();
    const interval = setInterval(fetchTables, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [restaurantId]);

  const filteredTables = tables.filter((t) => {
    if (filter === "free") return t.status === "free";
    if (filter === "occupied")
      return t.status === "occupied" || t.status === "billing";
    return true;
  });

  const statusLabel = (status: TableData["status"]) => {
    switch (status) {
      case "free":
        return "Livre";
      case "occupied":
        return "Ocupada";
      case "reserved":
        return "Reservada";
      case "billing":
        return "A pagar";
      default:
        return status;
    }
  };

  return (
    <div className="tpvm-tables-view">
      {/* Filter buttons */}
      <div className="tpvm-tables-filter">
        {(["all", "free", "occupied"] as const).map((f) => (
          <button
            key={f}
            className={`tpvm-tables-filter__btn ${
              filter === f ? "tpvm-tables-filter__btn--active" : ""
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "all" && "Todas"}
            {f === "free" && "🟢 Livres"}
            {f === "occupied" && "🟡 Ocupadas"}
          </button>
        ))}
      </div>

      {/* Tables grid */}
      {loading ? (
        <div className="tpvm-tables-loading">A carregar mesas...</div>
      ) : filteredTables.length === 0 ? (
        <div className="tpvm-tables-empty">
          <span className="tpvm-tables-empty__icon">🪑</span>
          <span>Nenhuma mesa encontrada</span>
        </div>
      ) : (
        <div className="tpvm-tables-grid">
          {filteredTables.map((table) => (
            <button
              key={table.id}
              className={`tpvm-table-card tpvm-table-card--${table.status}`}
              onClick={() => onSelectTable(table.id, table.number)}
            >
              <div className="tpvm-table-card__number">{table.number}</div>
              <div className="tpvm-table-card__label">{table.label}</div>
              <div className="tpvm-table-card__info">
                <span>👥 {table.seats}</span>
                <span
                  className={`tpvm-table-card__status tpvm-table-card__status--${table.status}`}
                >
                  {statusLabel(table.status)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
