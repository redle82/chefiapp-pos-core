import React, { createContext, useContext, useEffect, useState } from "react";
// DOCKER CORE: Removida dependência do Kernel - acesso direto ao Core
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { isDevStableMode } from "../../../core/runtime/devStableMode";
import {
  type TableStatus,
  normalizeTableStatus,
} from "../../../core/operational/tableStates";

export interface Table {
  id: string;
  restaurant_id: string;
  number: number;
  status: TableStatus;
  seats: number;
  seated_at?: string | null; // ISO timestamp from DB
  last_state_change_at?: string | null; // ISO timestamp — tempo no estado actual
  x?: number;
  y?: number;
}

interface TableContextType {
  tables: Table[];
  loading: boolean;
  refreshTables: () => Promise<void>;
  updateTableStatus: (
    tableId: string,
    status: TableStatus,
  ) => Promise<void>;
  updateTablePosition: (tableId: string, x: number, y: number) => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{
  children: React.ReactNode;
  restaurantId?: string;
}> = ({ children, restaurantId: propRestaurantId }) => {
  // DOCKER CORE: Removida dependência do Kernel - acesso direto ao Core
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const restaurantId = propRestaurantId || null;

  const fetchTables = async () => {
    if (!restaurantId) return;

    try {
      // DOCKER CORE: Buscar mesas diretamente via PostgREST
      const { data, error } = await dockerCoreClient
        .from("gm_tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("number", { ascending: true });

      if (error) {
        console.error("Error fetching tables:", error);
        return;
      }

      if (data) {
        // Normalize DB columns → Table interface
        const normalized = (data as Array<Record<string, unknown>>).map((row) => ({
          id: row.id as string,
          restaurant_id: row.restaurant_id as string,
          number: row.number as number,
          status: normalizeTableStatus((row.status as string) ?? "free"),
          seats: (row.seats as number) ?? 4,
          seated_at: (row.seated_at as string) ?? null,
          last_state_change_at: (row.last_state_change_at as string) ?? null,
          x: (row.pos_x as number) ?? 0,
          y: (row.pos_y as number) ?? 0,
        }));
        setTables(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (
    tableId: string,
    status: TableStatus,
  ) => {
    const now = new Date().toISOString();
    // Compute seated_at: set NOW on occupied, clear on free
    const seated_at = status === "occupied" ? now : (status === "free" ? null : undefined);

    // Optimistic update
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          status,
          last_state_change_at: now,
          ...(seated_at !== undefined ? { seated_at } : {}),
        };
      }),
    );

    try {
      const updatePayload: Record<string, unknown> = {
        status,
        last_state_change_at: now,
      };
      if (seated_at !== undefined) {
        updatePayload.seated_at = seated_at;
      }

      // DOCKER CORE: Atualizar status via PostgREST
      const { error } = await dockerCoreClient
        .from("gm_tables")
        .update(updatePayload)
        .eq("id", tableId)
        .eq("restaurant_id", restaurantId);

      if (error) {
        throw new Error(`Failed to update table status: ${error.message}`);
      }

      console.log("[TableContext] Table Status Updated:", tableId, status);
    } catch (err) {
      console.error("[TableContext] Update Failed:", err);
      // Revert on error
      await fetchTables();
    }
  };

  const updateTablePosition = async (tableId: string, x: number, y: number) => {
    // Optimistic update
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, x, y } : t)),
    );

    try {
      const { error: err } = await dockerCoreClient
        .from("gm_tables")
        .update({ pos_x: x, pos_y: y })
        .eq("id", tableId)
        .eq("restaurant_id", restaurantId);

      if (err) {
        throw new Error(`Failed to update table position: ${err.message}`);
      }

      console.log("[TableContext] Table Position Updated:", tableId, { x, y });
    } catch (err) {
      console.error("[TableContext] Position Update Failed:", err);
      await fetchTables();
    }
  };

  useEffect(() => {
    fetchTables();

    // DEV_STABLE_MODE: do not start realtime subscription while stabilizing Gate/Auth/Tenant.
    if (isDevStableMode()) {
      return;
    }

    // Polling 8s — cross-surface sync (qualquer origem pode ocupar/libertar mesa)
    // Substitui Realtime (desabilitado — proxy reverso necessário)
    if (restaurantId) {
      const interval = setInterval(fetchTables, 8_000);
      return () => clearInterval(interval);
    }
  }, [restaurantId]);

  return (
    <TableContext.Provider
      value={{
        tables,
        loading,
        refreshTables: fetchTables,
        updateTableStatus,
        updateTablePosition,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTables = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error("useTables must be used within a TableProvider");
  }
  return context;
};
