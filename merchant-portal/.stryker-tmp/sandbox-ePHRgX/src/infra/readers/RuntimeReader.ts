/**
 * RUNTIME READER — Lê estado do restaurante do Core (PostgREST)
 *
 * Fonte de verdade: docker-core (gm_restaurants, installed_modules, restaurant_setup_status).
 * Usado por RestaurantRuntimeContext quando backend é Docker.
 *
 * PERFORMANCE: Cache TTL 10s em fetchRestaurant e fetchRestaurantForIdentity
 * para reduzir rajadas de requests gm_restaurants.
 */
// @ts-nocheck


import { assertValidRestaurantId } from "../../core/kernel/RuntimeContext";
import { Logger } from "../../core/logger";
import {
  removeTabIsolated,
  setTabIsolated,
} from "../../core/storage/TabIsolatedStorage";
import { dockerCoreClient } from "../docker-core/connection";

const RESTAURANT_CACHE_TTL_MS = 10_000; // 10 segundos
let restaurantCache: {
  key: string;
  data: CoreRestaurantRow | null;
  ts: number;
} | null = null;
let identityCache: {
  key: string;
  data: CoreRestaurantIdentityRow | null;
  ts: number;
} | null = null;

export type CoreProductMode = "trial" | "pilot" | "live";

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
  /** Fim do período de trial (14 dias a partir da criação). */
  trial_ends_at?: string | null;
  /** Campos de identidade estendida (opcionais pois dependem do select) */
  country?: string | null;
  timezone?: string | null;
  currency?: string | null;
  locale?: string | null;
  type?: string | null;
  /** URL do logo do restaurante. Ver RESTAURANT_LOGO_IDENTITY_CONTRACT.md */
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Linha expandida para identidade (colunas de onboarding quando existem). */
export interface CoreRestaurantIdentityRow extends CoreRestaurantRow {
  type?: string | null;
  city?: string | null;
  address?: string | null;
  description?: string | null;
  logo_url?: string | null;
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

/** IDs placeholder que não existem no Core; nunca devolver para evitar 404 e loops. */
const INVALID_OR_SEED_RESTAURANT_IDS = new Set([
  "00000000-0000-0000-0000-000000000100",
  "10000000-0000-0000-0000-000000000000",
]);

/**
 * Verifica se o restaurante existe no Core (só DB; ignora mock e cache).
 * Usado em getOrCreateRestaurantId para validar o ID guardado.
 */
export async function restaurantExistsInCore(
  restaurantId: string,
): Promise<boolean> {
  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select("id")
    .eq("id", restaurantId)
    .maybeSingle();
  if (error) return false;
  return data != null;
}

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
    Logger.warn("[RuntimeReader] fetchFirstRestaurantId", {
      error: error.message,
    });
    return null;
  }
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const first = rows[0] as { id: string } | undefined;
  return first?.id ?? null;
}

/**
 * Busca restaurante por id. Cache TTL 10s.
 * Pilot: devolve mock quando restaurante foi criado por bypass (chefiapp_pilot_mock_restaurant).
 */
export async function fetchRestaurant(
  restaurantId: string,
): Promise<CoreRestaurantRow | null> {
  const now = Date.now();
  if (
    restaurantCache?.key === restaurantId &&
    now - restaurantCache.ts < RESTAURANT_CACHE_TTL_MS
  ) {
    return restaurantCache.data;
  }

  if (typeof window !== "undefined") {
    const pilotMock = localStorage.getItem("chefiapp_pilot_mock_restaurant");
    if (pilotMock) {
      try {
        const row = JSON.parse(pilotMock) as { id: string };
        if (row.id === restaurantId) {
          const trialEndsAt =
            (row as { trial_ends_at?: string }).trial_ends_at ??
            new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
          const mock: CoreRestaurantRow = {
            id: row.id,
            name: "Restaurante (Pilot)",
            slug: "pilot",
            status: "active",
            tenant_id: null,
            product_mode: "pilot",
            billing_status: "trial",
            trial_ends_at: trialEndsAt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          restaurantCache = { key: restaurantId, data: mock, ts: now };
          return mock;
        }
      } catch {
        // ignore
      }
    }
  }

  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select(
      "id,name,slug,status,tenant_id,product_mode,billing_status,trial_ends_at,country,timezone,currency,locale,type,logo_url,created_at,updated_at",
    )
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    Logger.warn("[RuntimeReader] fetchRestaurant FAILED", {
      restaurant_id: restaurantId,
      error: error.message,
      details: error.details,
      hint: (error as any).hint,
    });
    return null;
  }
  const result = data as CoreRestaurantRow | null;
  restaurantCache = { key: restaurantId, data: result, ts: now };
  return result;
}

/**
 * Busca restaurante por id com colunas de identidade (name, city, type, slug).
 * Usado por useRestaurantIdentity quando backend é Docker. Cache TTL 10s.
 * Pilot: devolve mock quando chefiapp_pilot_mock_restaurant.
 */
export async function fetchRestaurantForIdentity(
  restaurantId: string,
): Promise<CoreRestaurantIdentityRow | null> {
  const now = Date.now();
  if (
    identityCache?.key === restaurantId &&
    now - identityCache.ts < RESTAURANT_CACHE_TTL_MS
  ) {
    return identityCache.data;
  }

  if (typeof window !== "undefined") {
    const pilotMock = localStorage.getItem("chefiapp_pilot_mock_restaurant");
    if (pilotMock) {
      try {
        const row = JSON.parse(pilotMock) as {
          id: string;
          name?: string | null;
          type?: string | null;
          city?: string | null;
        };
        if (row.id === restaurantId) {
          const mock: CoreRestaurantIdentityRow = {
            id: row.id,
            name: row.name ?? "Restaurante (Pilot)",
            slug: "pilot",
            status: "active",
            tenant_id: null,
            type: row.type ?? "Restaurante",
            city: row.city ?? null,
            address: null,
            description: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          identityCache = { key: restaurantId, data: mock, ts: now };
          return mock;
        }
      } catch {
        // ignore
      }
    }
  }

  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select(
      "id,name,slug,status,tenant_id,type,city,address,description,logo_url,created_at,updated_at",
    )
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    Logger.warn("[RuntimeReader] fetchRestaurantForIdentity", {
      restaurant_id: restaurantId,
      error: error.message,
    });
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
    Logger.warn("[RuntimeReader] fetchInstalledModules", {
      restaurant_id: restaurantId,
      error: error.message,
    });
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get-or-create: retorna id do localStorage, ou primeiro restaurante do Core, ou seed id (dev).
 * Pilot: se stored for mock-* (UUID inválido), migra para id de chefiapp_pilot_mock_restaurant.
 */
export async function getOrCreateRestaurantId(): Promise<string | null> {
  let stored: string | null =
    typeof window !== "undefined"
      ? localStorage.getItem("chefiapp_restaurant_id")
      : null;
  // Em Docker o seed existe no Core (06-seed-enterprise); não limpar para Dashboard carregar
  if (
    stored &&
    INVALID_OR_SEED_RESTAURANT_IDS.has(stored) &&
    stored !== SEED_RESTAURANT_ID
  ) {
    if (typeof window !== "undefined") {
      removeTabIsolated("chefiapp_restaurant_id");
    }
    stored = null;
  }
  if (stored?.startsWith("mock-") && typeof window !== "undefined") {
    try {
      const pilotMock = localStorage.getItem("chefiapp_pilot_mock_restaurant");
      if (pilotMock) {
        const row = JSON.parse(pilotMock) as { id?: string };
        if (row.id && UUID_REGEX.test(row.id)) {
          localStorage.setItem("chefiapp_restaurant_id", row.id);
          setTabIsolated("chefiapp_restaurant_id", row.id);
          stored = row.id;
        } else {
          stored = null;
        }
      } else {
        stored = null;
      }
    } catch {
      stored = null;
    }
  }
  // Quando temos um ID guardado: validar que existe no Core (evita FK em gm_cash_registers etc.).
  // Usar restaurantExistsInCore (não fetchRestaurant) para ignorar mock de pilot.
  if (stored) {
    const existsInCore = await restaurantExistsInCore(stored);
    if (existsInCore) {
      // Production guard: crash if seed/mock ID is used in production mode
      assertValidRestaurantId(stored);
      return stored;
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("chefiapp_restaurant_id");
      removeTabIsolated("chefiapp_restaurant_id");
      // Limpar mock de pilot para este ID; evita que fetchRestaurant volte a devolver mock.
      try {
        const pilotMock = localStorage.getItem(
          "chefiapp_pilot_mock_restaurant",
        );
        if (pilotMock) {
          const row = JSON.parse(pilotMock) as { id?: string };
          if (row.id === stored) {
            localStorage.removeItem("chefiapp_pilot_mock_restaurant");
          }
        }
      } catch {
        // ignore
      }
    }
    stored = null;
  }

  const firstId = await fetchFirstRestaurantId();
  if (firstId) {
    // Production guard: ensure the resolved ID is not a seed/mock
    assertValidRestaurantId(firstId);
    if (typeof window !== "undefined") {
      localStorage.setItem("chefiapp_restaurant_id", firstId);
    }
    return firstId;
  }

  const isDev =
    (globalThis as any)?.import?.meta?.env?.DEV ??
    (typeof process !== "undefined"
      ? process.env.NODE_ENV === "development"
      : false);

  if (isDev) {
    if (typeof window !== "undefined") {
      localStorage.setItem("chefiapp_restaurant_id", SEED_RESTAURANT_ID);
    }
    return SEED_RESTAURANT_ID;
  }
  return null;
}
