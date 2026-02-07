/**
 * PulseProvider — Context provider for the Operational Pulse
 *
 * Sources live data (active orders, shift state), feeds them into usePulse,
 * and exposes the result via React context.
 *
 * Mount inside the authenticated provider tree, after ShiftProvider and
 * RestaurantRuntimeContext.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  PulseConfig,
  PulseInput,
  PulseSnapshot,
  PulseZone,
} from "../../../../core-engine/pulse";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { readActiveOrders } from "../../core-boundary/readers/OrderReader";
import { useShift } from "../shift/ShiftContext";
import type { UsePulseOptions } from "./usePulse";
import { usePulse } from "./usePulse";

// ---------------------------------------------------------------------------
// Context Value
// ---------------------------------------------------------------------------

export interface PulseContextValue {
  /** Current pulse snapshot (null if not yet calculated or shift closed) */
  snapshot: PulseSnapshot | null;
  /** Whether pulse is actively calculating */
  isActive: boolean;
  /** Previous zone (for transition animations) */
  previousZone: PulseZone | null;
  /** Whether zone just changed on last tick */
  zoneChanged: boolean;
  /** Number of active orders (last fetch) */
  activeOrderCount: number;
  /** Number of orders in last 30min (last fetch) */
  recentOrderCount: number;
  /** Force immediate recalculation */
  recalculate: () => PulseSnapshot | null;
}

const PulseContext = createContext<PulseContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface PulseProviderProps {
  children: React.ReactNode;
  /** Optional config overrides */
  config?: Partial<PulseConfig>;
}

/**
 * PulseProvider fetches order data and feeds it into the pulse calculator.
 * Only calculates when:
 * - A restaurant is loaded
 * - The shift (caixa) is open
 */
export const PulseProvider: React.FC<PulseProviderProps> = ({
  children,
  config,
}) => {
  const { runtime } = useRestaurantRuntime();
  const { isShiftOpen } = useShift();

  const restaurantId = runtime.restaurant_id ?? null;
  const enabled = !!restaurantId && isShiftOpen;

  // Order data state (fetched on each pulse tick via getInput)
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [recentOrderCount, setRecentOrderCount] = useState(0);

  // Track latest fetched order data in ref (avoids stale closure in getInput)
  const orderDataRef = useRef<{ active: number; recent: number }>({
    active: 0,
    recent: 0,
  });

  // Fetch interval to keep order data fresh (same cadence as pulse)
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  const fetchOrderData = useCallback(async () => {
    if (!restaurantId || fetchingRef.current) return;

    const now = Date.now();
    // Debounce: don't fetch more than once per 10s
    if (now - lastFetchRef.current < 10_000) return;

    fetchingRef.current = true;
    try {
      const orders = await readActiveOrders(restaurantId);
      const activeCount = orders.length;

      // Count orders created in the last 30 minutes
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const recentCount = orders.filter(
        (o) =>
          (o as { created_at?: string }).created_at &&
          (o as { created_at?: string }).created_at! >= thirtyMinAgo,
      ).length;

      orderDataRef.current = { active: activeCount, recent: recentCount };
      setActiveOrderCount(activeCount);
      setRecentOrderCount(recentCount);
      lastFetchRef.current = now;
    } catch (err) {
      // Non-fatal: pulse will use stale data
      console.warn("[PulseProvider] Failed to fetch orders:", err);
    } finally {
      fetchingRef.current = false;
    }
  }, [restaurantId]);

  // getInput callback for usePulse — fetches fresh data then returns input
  const getInput = useCallback((): PulseInput | null => {
    if (!enabled) return null;

    // Fire-and-forget fetch (won't block this tick, data available next tick)
    void fetchOrderData();

    const data = orderDataRef.current;
    return {
      activeOrders: data.active,
      ordersLast30min: data.recent,
      declaredCapacity: config?.defaultCapacity ?? 15,
      hourOfDay: new Date().getHours(),
    };
  }, [enabled, fetchOrderData, config?.defaultCapacity]);

  const pulseOptions: UsePulseOptions = useMemo(
    () => ({ config, enabled }),
    [config, enabled],
  );

  const { snapshot, isActive, previousZone, zoneChanged, recalculate } =
    usePulse(getInput, pulseOptions);

  const value = useMemo<PulseContextValue>(
    () => ({
      snapshot,
      isActive,
      previousZone,
      zoneChanged,
      activeOrderCount,
      recentOrderCount,
      recalculate,
    }),
    [
      snapshot,
      isActive,
      previousZone,
      zoneChanged,
      activeOrderCount,
      recentOrderCount,
      recalculate,
    ],
  );

  return (
    <PulseContext.Provider value={value}>{children}</PulseContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access pulse state from context.
 * Must be used within a PulseProvider.
 */
export function usePulseContext(): PulseContextValue {
  const ctx = useContext(PulseContext);
  if (!ctx) {
    throw new Error("usePulseContext must be used within a PulseProvider");
  }
  return ctx;
}

/**
 * Safe version that returns null outside of PulseProvider
 * (useful in components that may render in public/demo tree).
 */
export function usePulseOptional(): PulseContextValue | null {
  return useContext(PulseContext);
}
