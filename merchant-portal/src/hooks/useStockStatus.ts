/**
 * useStockStatus — Real-time product stock status hook.
 *
 * Polls every 60 seconds. Provides 86'd management and low-stock alerts.
 * Integrates with StockStatusService (IndexedDB + Core DB).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  stockStatusService,
  type ProductStockStatus,
} from "../core/inventory/StockStatusService";

const POLL_INTERVAL_MS = 60_000;

export function useStockStatus(restaurantId: string) {
  const [statuses, setStatuses] = useState<Map<string, ProductStockStatus>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatuses = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const results =
        await stockStatusService.getStockStatuses(restaurantId);
      if (!mountedRef.current) return;
      const map = new Map<string, ProductStockStatus>();
      for (const s of results) {
        map.set(s.productId, s);
      }
      setStatuses(map);
    } catch (err) {
      console.error("[useStockStatus] fetch failed", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchStatuses();

    timerRef.current = setInterval(fetchStatuses, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchStatuses]);

  const lowStockProducts = Array.from(statuses.values()).filter(
    (s) => s.isLowStock && s.available,
  );

  const unavailableProducts = Array.from(statuses.values()).filter(
    (s) => !s.available,
  );

  const isProductAvailable = useCallback(
    (productId: string): boolean => {
      const status = statuses.get(productId);
      return status?.available !== false;
    },
    [statuses],
  );

  const mark86d = useCallback(
    async (productId: string, reason?: string) => {
      await stockStatusService.markUnavailable(restaurantId, productId, reason);
      await fetchStatuses();
    },
    [restaurantId, fetchStatuses],
  );

  const unmark86d = useCallback(
    async (productId: string) => {
      await stockStatusService.markAvailable(restaurantId, productId);
      await fetchStatuses();
    },
    [restaurantId, fetchStatuses],
  );

  return {
    statuses,
    lowStockProducts,
    unavailableProducts,
    isProductAvailable,
    mark86d,
    unmark86d,
    refresh: fetchStatuses,
    loading,
  };
}
