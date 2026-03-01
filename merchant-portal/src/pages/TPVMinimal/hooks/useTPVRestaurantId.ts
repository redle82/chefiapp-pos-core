/**
 * useTPVRestaurantId — Shared hook for resolving the restaurant ID inside TPV context.
 *
 * Priority: installed device > runtime context.
 * Returns null when no restaurant can be resolved — RequireOperational surface="TPV"
 * gate blocks rendering before child components mount.
 *
 * Used by all TPV HUB tabs (POS, Kitchen, Tasks, Reservations) to avoid duplication.
 */

import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { getTpvRestaurantId } from "../../../core/storage/installedDeviceStorage";

export function useTPVRestaurantId(): string | null {
  const { runtime } = useRestaurantRuntime();

  const installedRestaurantId = getTpvRestaurantId();
  const runtimeRestaurantId = runtime?.restaurant_id ?? null;

  return installedRestaurantId ?? runtimeRestaurantId ?? null;
}
