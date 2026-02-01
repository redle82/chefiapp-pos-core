/**
 * RUNTIME READER — Lê estado do restaurante do Core (PostgREST)
 *
 * Fonte de verdade: docker-core (gm_restaurants, installed_modules, restaurant_setup_status).
 * Usado por RestaurantRuntimeContext quando backend é Docker.
 *
 * PERFORMANCE: Cache TTL 10s em fetchRestaurant e fetchRestaurantForIdentity
 * para reduzir rajadas de requests gm_restaurants.
 */

import { dockerCoreClient } from "../docker-core/connection";

const RESTAURANT_CACHE_TTL_MS = 10_000; // 10 segundos
let restaurantCache: { key: string; data: CoreRestaurantRow | null; ts: number } | null = null;
let identityCache: { key: string; data: CoreRestaurantIdentityRow | null; ts: number } | null = null;

export type CoreProductMode = "demo" | "pilot" | "live";

/** billing_status: trial | active | past_due | canceled (SaaS). Fonte = gm_restaurants. */
export type CoreBillingStatus = "trial" | "active" | "past_due" | "canceled";

export interface CoreRestaurantRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  tenant_id: string | null;
  product_mode?: CoreProductMode | null;
  /** Estado de faturação SaaS (gm_restaurants.billing_status). */
  billing_status?: CoreBillingStatus | null;
  created_at?: string;
  updated_at?: string;
}

/** Linha expandida para identidade (colunas de onboarding quando existem). */
export interface CoreRestaurantIdentityRow extends CoreRestaurantRow {
  type?: string | null;
  city?: string | null;
  address?: string | null;
  description?: string | null;
}

export interface CoreInstalledModuleRow {
  id: string;
  restaurant_id: string;
  module_id: string;
  module_name: string;
  status: string;
}

export interface CoreSetupStatusRow {
  restaurant_id: string;
  sections: Record<string, boolean>;
  updated_at?: string;
}

const SEED_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

/**
 * Retorna o primeiro restaurante do Core (para dev / get-or-create).
 */
export async function fetchFirstRestaurantId(): Promise<string | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select("id")
    .limit(1)
    .order("created_at", { ascending: true });

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[RuntimeReader] fetchFirstRestaurantId:", error.message);
    }
    return null;
  }
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const first = rows[0] as { id: string } | undefined;
  return first?.id ?? null;
}

/**
 * Busca restaurante por id. Cache TTL 10s.
 */
export async function fetchRestaurant(
  restaurantId: string,
): Promise<CoreRestaurantRow | null> {
  const now = Date.now();
  if (restaurantCache?.key === restaurantId && now - restaurantCache.ts < RESTAURANT_CACHE_TTL_MS) {
    return restaurantCache.data;
  }

  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select("id,name,slug,status,tenant_id,product_mode,billing_status,created_at,updated_at")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[RuntimeReader] fetchRestaurant:", error.message);
    }
    return null;
  }
  const result = data as CoreRestaurantRow | null;
  restaurantCache = { key: restaurantId, data: result, ts: now };
  return result;
}

/**
 * Busca restaurante por id com colunas de identidade (name, city, type, slug).
 * Usado por useRestaurantIdentity quando backend é Docker. Cache TTL 10s.
 */
export async function fetchRestaurantForIdentity(
  restaurantId: string,
): Promise<CoreRestaurantIdentityRow | null> {
  const now = Date.now();
  if (identityCache?.key === restaurantId && now - identityCache.ts < RESTAURANT_CACHE_TTL_MS) {
    return identityCache.data;
  }

  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select(
      "id,name,slug,status,tenant_id,type,city,address,description,created_at,updated_at",
    )
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) {
      console.warn(
        "[RuntimeReader] fetchRestaurantForIdentity:",
        error.message,
      );
    }
    return null;
  }
  const result = data as CoreRestaurantIdentityRow | null;
  identityCache = { key: restaurantId, data: result, ts: now };
  return result;
}

/**
 * Lista módulos instalados (status = active) para o restaurante.
 */
export async function fetchInstalledModules(
  restaurantId: string,
): Promise<string[]> {
  const { data, error } = await dockerCoreClient
    .from("installed_modules")
    .select("module_id")
    .eq("restaurant_id", restaurantId)
    .eq("status", "active");

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[RuntimeReader] fetchInstalledModules:", error.message);
    }
    return [];
  }
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: { module_id: string }) => r.module_id);
}

/**
 * Busca status do onboarding (sections) do Core.
 */
export async function fetchSetupStatus(
  restaurantId: string,
): Promise<Record<string, boolean>> {
  const { data, error } = await dockerCoreClient
    .from("restaurant_setup_status")
    .select("sections")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error || !data) {
    return {};
  }
  const sections = (data as CoreSetupStatusRow).sections;
  return typeof sections === "object" && sections !== null ? sections : {};
}

/**
 * Get-or-create: retorna id do localStorage, ou primeiro restaurante do Core, ou seed id (dev).
 */
export async function getOrCreateRestaurantId(): Promise<string | null> {
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem("chefiapp_restaurant_id")
      : null;
  if (stored) return stored;

  const firstId = await fetchFirstRestaurantId();
  if (firstId) {
    if (typeof window !== "undefined") {
      localStorage.setItem("chefiapp_restaurant_id", firstId);
    }
    return firstId;
  }

  if (import.meta.env.DEV) {
    if (typeof window !== "undefined") {
      localStorage.setItem("chefiapp_restaurant_id", SEED_RESTAURANT_ID);
    }
    return SEED_RESTAURANT_ID;
  }
  return null;
}
