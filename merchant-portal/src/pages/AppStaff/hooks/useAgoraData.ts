import { useCallback, useEffect, useState } from "react";
import type { CoreTask } from "../../../core-boundary/docker-core/types";
import type { ActiveOrderRow } from "../../../core-boundary/readers/OrderReader";
import { readReadyOrders } from "../../../core-boundary/readers/OrderReader";
import { readPendingTasksForAgora } from "../../../core-boundary/readers/TaskReader";

export interface AgoraData {
  pendingTasks: CoreTask[];
  readyOrders: ActiveOrderRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook: dados para a tela "Agora" — tarefas pendentes (OPEN/ACKNOWLEDGED) + pedidos READY.
 */
export function useAgoraData(
  restaurantId: string | undefined | null,
  _userId?: string | null,
  station?: "BAR" | "KITCHEN" | "SERVICE" | null
): AgoraData {
  const [pendingTasks, setPendingTasks] = useState<CoreTask[]>([]);
  const [readyOrders, setReadyOrders] = useState<ActiveOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) {
      setPendingTasks([]);
      setReadyOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [tasks, orders] = await Promise.all([
        readPendingTasksForAgora(restaurantId, station ?? undefined),
        readReadyOrders(restaurantId),
      ]);
      setPendingTasks(tasks);
      setReadyOrders(orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPendingTasks([]);
      setReadyOrders([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, station]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pendingTasks, readyOrders, loading, error, refresh };
}
