/**
 * RESTAURANT READER — Leitura de dados do restaurante (read-only)
 *
 * FASE 7: Página Web Pública (Read-Only)
 *
 * REGRAS:
 * - Apenas leitura
 * - Usa fetch direto (bypass Supabase client)
 * - Retorna dados do restaurante e menu
 *
 * PERFORMANCE: Cache TTL 10s em readMenuCategories e readProducts
 * para reduzir rajadas de gm_menu_categories e gm_products.
 */

import { CONFIG } from "../../config";

const DOCKER_CORE_URL = CONFIG.SUPABASE_URL;
const DOCKER_CORE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

export interface CoreRestaurant {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
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

/**
 * Lê restaurante por slug.
 */
export async function readRestaurantBySlug(
  slug: string,
): Promise<CoreRestaurant | null> {
  const url = `${DOCKER_CORE_URL}/gm_restaurants?select=*&slug=eq.${slug}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(
      `Failed to read restaurant: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    return null;
  }

  return data[0] as CoreRestaurant;
}

/**
 * Lê restaurante por ID.
 */
export async function readRestaurantById(
  restaurantId: string,
): Promise<CoreRestaurant | null> {
  const url = `${DOCKER_CORE_URL}/gm_restaurants?select=*&id=eq.${restaurantId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text();
    throw new Error(
      `Failed to read restaurant: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }
  const data = await response.json();
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

  const url = `${DOCKER_CORE_URL}/gm_menu_categories?select=*&restaurant_id=eq.${restaurantId}&order=sort_order.asc,created_at.asc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to read menu categories: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
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

  const url = `${DOCKER_CORE_URL}/gm_products?select=*&restaurant_id=eq.${restaurantId}&available=eq.true&order=created_at.asc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to read products: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
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
  const url = `${DOCKER_CORE_URL}/gm_tables?select=*&restaurant_id=eq.${restaurantId}&number=eq.${tableNumber}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(
      `Failed to read table: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    return null;
  }

  return data[0] as CoreTable;
}
