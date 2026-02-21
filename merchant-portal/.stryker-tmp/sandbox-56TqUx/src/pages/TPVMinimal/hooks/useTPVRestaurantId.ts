/**
 * useTPVRestaurantId — Shared hook for resolving the restaurant ID inside TPV context.
 *
 * Priority: installed device > runtime context > Docker Core seed.
 * Used by all TPV HUB tabs (POS, Kitchen, Tasks, Reservations) to avoid duplication.
 */
// @ts-nocheck


import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { isDockerBackend } from "../../../core/infra/backendAdapter";
import { getTpvRestaurantId } from "../../../core/storage/installedDeviceStorage";

/** Docker Core seed restaurant (06-seed-enterprise). */
const DOCKER_SEED_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

const DEFAULT_RESTAURANT_ID = isDockerBackend()
  ? DOCKER_SEED_RESTAURANT_ID
  : DOCKER_SEED_RESTAURANT_ID;

export function useTPVRestaurantId(): string {
  const { runtime } = useRestaurantRuntime();

  const installedRestaurantId = getTpvRestaurantId();
  const runtimeRestaurantId = runtime?.restaurant_id ?? null;

  return installedRestaurantId ?? runtimeRestaurantId ?? DEFAULT_RESTAURANT_ID;
}
