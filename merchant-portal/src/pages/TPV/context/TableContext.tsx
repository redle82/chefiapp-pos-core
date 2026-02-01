import React, { createContext, useContext, useEffect, useState } from "react";
// DOCKER CORE: Removida dependência do Kernel - acesso direto ao Core
// import { useKernel } from '../../../core/kernel/KernelContext'; // REMOVIDO
import { dockerCoreClient } from "../../../core-boundary/docker-core/connection";
import { isDevStableMode } from "../../../core/runtime/devStableMode";

export interface Table {
  id: string;
  restaurant_id: string;
  number: number;
  status: "free" | "occupied" | "reserved";
  seats: number;
  x?: number;
  y?: number;
}

interface TableContextType {
  tables: Table[];
  loading: boolean;
  refreshTables: () => Promise<void>;
  updateTableStatus: (
    tableId: string,
    status: "free" | "occupied" | "reserved",
  ) => Promise<void>;
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
        setTables(data as Table[]);
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (
    tableId: string,
    status: "free" | "occupied" | "reserved",
  ) => {
    // Optimistic update
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t)),
    );

    try {
      // DOCKER CORE: Atualizar status da mesa diretamente via PostgREST
      const { error } = await dockerCoreClient
        .from("gm_tables")
        .update({ status })
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

  useEffect(() => {
    fetchTables();

    // DEV_STABLE_MODE: do not start realtime subscription while stabilizing Gate/Auth/Tenant.
    if (isDevStableMode()) {
      return;
    }

    // DOCKER CORE: Realtime desabilitado temporariamente (mesmo problema do KDS)
    // Por enquanto, usar apenas polling ou atualização manual
    // TODO: Configurar proxy reverso para Realtime funcionar
    // if (restaurantId) {
    //     const channel = dockerCoreClient
    //         .channel('public:gm_tables')
    //         .on('postgres_changes', {
    //             event: '*',
    //             schema: 'public',
    //             table: 'gm_tables',
    //             filter: `restaurant_id=eq.${restaurantId}`
    //         }, (payload) => {
    //             fetchTables();
    //         })
    //         .subscribe();
    //
    //     return () => {
    //         dockerCoreClient.removeChannel(channel);
    //     };
    // }
  }, [restaurantId]);

  return (
    <TableContext.Provider
      value={{ tables, loading, refreshTables: fetchTables, updateTableStatus }}
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
