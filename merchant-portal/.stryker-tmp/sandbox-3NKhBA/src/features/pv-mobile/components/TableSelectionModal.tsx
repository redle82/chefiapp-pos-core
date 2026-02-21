/**
 * TableSelectionModal — Fullscreen modal for table selection
 *
 * Displayed when Dine In is selected and no table is chosen.
 * Features:
 * - 2-column grid of tables
 * - Real-time status (free/occupied/reserved)
 * - Filter buttons (All, Free, Occupied)
 * - Touch-friendly 56px+ targets
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

interface TableData {
  id: string;
  number: number;
  status: "free" | "occupied" | "reserved" | "billing" | "closed";
}

interface TableSelectionModalProps {
  isOpen: boolean;
  restaurantId: string;
  onSelectTable: (tableId: string, tableNumber: number) => void;
  onClose: () => void;
}

export function TableSelectionModal({
  isOpen,
  restaurantId,
  onSelectTable,
  onClose,
}: TableSelectionModalProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "occupied">("all");

  useEffect(() => {
    if (!isOpen || !restaurantId) return;

    const fetchTables = async () => {
      setLoading(true);

      const { data } = await dockerCoreClient
        .from("gm_tables")
        .select("id, number, status")
        .eq("restaurant_id", restaurantId)
        .order("number", { ascending: true });

      if (data && Array.isArray(data)) {
        setTables(
          data.map((t: Record<string, unknown>) => ({
            id: t.id as string,
            number: t.number as number,
            // Map "closed" to "free" for display
            status: ((t.status as string) === "closed"
              ? "free"
              : (t.status as string) ?? "free") as TableData["status"],
          })),
        );
      }

      setLoading(false);
    };

    fetchTables();
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [isOpen, restaurantId]);

  if (!isOpen) return null;

  const filteredTables = tables.filter((t) => {
    if (filter === "free") return t.status === "free";
    if (filter === "occupied")
      return t.status === "occupied" || t.status === "billing";
    return true;
  });

  const handleSelectTable = (table: TableData) => {
    if (table.status !== "free") {
      // Can't select occupied table for new order
      return;
    }
    onSelectTable(table.id, table.number);
  };

  if (!isOpen) return null;

  return (
    <div className="tsm-overlay">
      <div className="tsm-modal">
        {/* Header */}
        <div className="tsm-header">
          <button className="tsm-header__back" onClick={onClose}>
            ← Voltar
          </button>
          <h2 className="tsm-header__title">Selecionar Mesa</h2>
        </div>

        {/* Filter buttons */}
        <div className="tsm-filters">
          {(["all", "free", "occupied"] as const).map((f) => (
            <button
              key={f}
              className={`tsm-filters__btn ${
                filter === f ? "tsm-filters__btn--active" : ""
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
        <div className="tsm-grid-container">
          {loading ? (
            <div className="tsm-loading">A carregar mesas...</div>
          ) : filteredTables.length === 0 ? (
            <div className="tsm-empty">
              <span className="tsm-empty__icon">🪑</span>
              <span>Nenhuma mesa disponível</span>
            </div>
          ) : (
            <div className="tsm-grid">
              {filteredTables.map((table) => (
                <button
                  key={table.id}
                  className={`tsm-table ${
                    table.status === "free"
                      ? "tsm-table--free"
                      : "tsm-table--occupied"
                  }`}
                  onClick={() => handleSelectTable(table)}
                  disabled={table.status !== "free"}
                >
                  <div className="tsm-table__number">{table.number}</div>
                  <div className="tsm-table__status">
                    {table.status === "free" && "🟢 Livre"}
                    {table.status === "occupied" && "🟡 Ocupada"}
                    {table.status === "reserved" && "🔵 Reservada"}
                    {table.status === "billing" && "🟠 A pagar"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
