/**
 * Condição canónica de "restaurante válido para operação".
 *
 * Uma única fonte de verdade para "tenho um restaurante operacional?"
 * Evita dispersão de runtime.restaurant_id, identity?.name, TenantContext e IDs seed.
 *
 * @see docs/contracts/OPERATIONAL_NAVIGATION_SOVEREIGNTY.md
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";

/** IDs de seed/placeholder que não existem no Core; tratados como sem org para evitar 404. */
export const INVALID_OR_SEED_RESTAURANT_IDS = new Set<string>([
  "00000000-0000-0000-0000-000000000100",
  "10000000-0000-0000-0000-000000000000",
]);

/** Em Docker o seed 00000000-0000-0000-0000-000000000100 existe no Core (06-seed-enterprise). */
export const SEED_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

export interface OperationalRestaurantInput {
  restaurant_id: string | null;
  loading?: boolean;
}

/** Identity opcional para futuras regras (ex.: nome presente). */
export interface OperationalRestaurantIdentity {
  name?: string;
}

/**
 * Devolve true apenas se existe restaurant_id não vazio e não pertencente ao conjunto de IDs inválidos/seed.
 * Quando loading === true, pode devolver false para evitar decisões prematuras (uso opcional).
 * Em backend Docker, o restaurante de seed é considerado válido (existe no Core).
 */
export function hasOperationalRestaurant(
  runtime: OperationalRestaurantInput,
  _identity?: OperationalRestaurantIdentity | null
): boolean {
  if (runtime.loading) return false;
  const id = runtime.restaurant_id;
  if (!id || typeof id !== "string" || id.trim() === "") return false;
  if (getBackendType() === BackendType.docker && id === SEED_RESTAURANT_ID)
    return true;
  return !INVALID_OR_SEED_RESTAURANT_IDS.has(id);
}
