// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import {
  readStockAlerts,
  type StockAlertRow,
} from "../../../infra/readers/InventoryStockReader";

export interface StockAlertsData {
  alerts: StockAlertRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook: alertas de estoque (qty <= min_qty) para Inventory Lite.
 */
export function useStockAlerts(
  restaurantId: string | undefined | null
): StockAlertsData {
  const [alerts, setAlerts] = useState<StockAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await readStockAlerts(restaurantId);
      setAlerts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { alerts, loading, error, refresh };
}
