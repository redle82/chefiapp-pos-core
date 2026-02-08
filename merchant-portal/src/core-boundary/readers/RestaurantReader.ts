/**
 * RESTAURANT READER — Leitura de dados do restaurante (read-only)
 *
 * FASE 7: Página Web Pública (Read-Only)
 *
 * REGRAS:
 * - Apenas leitura
 * - Usa fetch direto (Core PostgREST)
 * - Retorna dados do restaurante e menu
 *
 * PERFORMANCE: Cache TTL 10s em readMenuCategories e readProducts
 * para reduzir rajadas de gm_menu_categories e gm_products.
 */

import { CONFIG } from "../../config";

const DOCKER_CORE_URL = CONFIG.CORE_URL;
const DOCKER_CORE_ANON_KEY = CONFIG.CORE_ANON_KEY;

/** PostgREST base: nginx no Core espera /rest/v1/* */
const REST_V1 = `${DOCKER_CORE_URL}/rest/v1`;

export interface CoreRestaurant {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  /** gm_restaurants.status: 'active' = publicado (menu LIVE). MENU_OPERATIONAL_STATE. */
  status?: string;
  /** FASE 4: localização para a página pública */
  address_text?: string | null;
  /** FASE 4: horários em texto livre (ex: Seg-Sex 9h-18h) */
  opening_hours_text?: string | null;
}

export interface CoreMenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface CoreProduct {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  photo_url: string | null;
  available: boolean;
  created_at: string;
  updated_at: string;
}

const MENU_CACHE_TTL_MS = 10_000; // 10 segundos
let menuCategoriesCache: {
  key: string;
  data: CoreMenuCategory[];
  ts: number;
} | null = null;
let productsCache: { key: string; data: CoreProduct[]; ts: number } | null =
  null;

/** API_ERROR_CONTRACT: nunca parse de não-JSON (evita Unexpected token '<'). */
function parseJsonIfOk<T>(response: Response, text: string): T {
  const ct = response.headers.get("Content-Type") ?? "";
  if (!ct.includes("application/json")) {
    throw new Error("Backend indisponível");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Backend indisponível");
  }
}

/**
 * Lê restaurante por slug.
 */
export async function readRestaurantBySlug(
  slug: string,
): Promise<CoreRestaurant | null> {
  const url = `${REST_V1}/gm_restaurants?select=*&slug=eq.${slug}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(
      `Falha ao carregar restaurante (${response.status}). Tente novamente.`,
    );
  }
  const data = parseJsonIfOk<CoreRestaurant[]>(response, text);
  if (!data || data.length === 0) return null;
  return data[0] as CoreRestaurant;
}

/**
 * Lê restaurante por ID.
 */
export async function readRestaurantById(
  restaurantId: string,
): Promise<CoreRestaurant | null> {
  const url = `${REST_V1}/gm_restaurants?select=*&id=eq.${restaurantId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(
      `Falha ao carregar restaurante (${response.status}). Tente novamente.`,
    );
  }
  const data = parseJsonIfOk<CoreRestaurant[]>(response, text);
  if (!data || data.length === 0) return null;
  return data[0] as CoreRestaurant;
}

/**
 * Lê categorias do menu de um restaurante. Cache TTL 10s.
 */
export async function readMenuCategories(
  restaurantId: string,
): Promise<CoreMenuCategory[]> {
  const now = Date.now();
  if (
    menuCategoriesCache?.key === restaurantId &&
    now - menuCategoriesCache.ts < MENU_CACHE_TTL_MS
  ) {
    return menuCategoriesCache.data;
  }

  const url = `${REST_V1}/gm_menu_categories?select=*&restaurant_id=eq.${restaurantId}&order=sort_order.asc,created_at.asc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Falha ao carregar categorias (${response.status}). Tente novamente.`,
    );
  }
  const data = parseJsonIfOk<CoreMenuCategory[]>(response, text);
  const result = (data || []) as CoreMenuCategory[];
  menuCategoriesCache = { key: restaurantId, data: result, ts: now };
  return result;
}

/**
 * Lê produtos de um restaurante. Cache TTL 10s.
 */
export async function readProducts(
  restaurantId: string,
): Promise<CoreProduct[]> {
  const now = Date.now();
  if (
    productsCache?.key === restaurantId &&
    now - productsCache.ts < MENU_CACHE_TTL_MS
  ) {
    return productsCache.data;
  }

  const url = `${REST_V1}/gm_products?select=*&restaurant_id=eq.${restaurantId}&available=eq.true&order=created_at.asc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Falha ao carregar produtos (${response.status}). Tente novamente.`,
    );
  }
  const data = parseJsonIfOk<CoreProduct[]>(response, text);
  const result = (data || []) as CoreProduct[];
  productsCache = { key: restaurantId, data: result, ts: now };
  return result;
}

/**
 * Lê menu completo (categorias + produtos) de um restaurante.
 */
export async function readMenu(restaurantId: string): Promise<{
  categories: CoreMenuCategory[];
  products: CoreProduct[];
}> {
  const [categories, products] = await Promise.all([
    readMenuCategories(restaurantId),
    readProducts(restaurantId),
  ]);

  return { categories, products };
}

export interface CoreTable {
  id: string;
  restaurant_id: string;
  number: number;
  qr_code: string | null;
  status: string;
  created_at: string;
}

/**
 * Lê mesa por número do restaurante.
 */
export async function readTableByNumber(
  restaurantId: string,
  tableNumber: number,
): Promise<CoreTable | null> {
  const url = `${REST_V1}/gm_tables?select=*&restaurant_id=eq.${restaurantId}&number=eq.${tableNumber}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(
      `Falha ao carregar mesa (${response.status}). Tente novamente.`,
    );
  }
  const data = parseJsonIfOk<CoreTable[]>(response, text);
  if (!data || data.length === 0) return null;
  return data[0] as CoreTable;
}
