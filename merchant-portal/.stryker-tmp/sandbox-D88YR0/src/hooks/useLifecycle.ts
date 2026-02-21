import { useRestaurantRuntime } from "../context/RestaurantRuntimeContext";
import {
  deriveLifecycle,
  type RestaurantLifecycle,
} from "../core/lifecycle/Lifecycle";
import { useShift } from "../core/shift/ShiftContext";

/**
 * useLifecycle
 *
 * Centralized hook to consume the Restaurant Lifecycle Contract.
 * Provides the three canonical flags: configured, published, operational.
 */
export function useLifecycle(): RestaurantLifecycle {
  const { runtime } = useRestaurantRuntime();
  const { isShiftOpen } = useShift();

  return deriveLifecycle(
    runtime.restaurant_id,
    runtime.isPublished,
    isShiftOpen,
  );
}
