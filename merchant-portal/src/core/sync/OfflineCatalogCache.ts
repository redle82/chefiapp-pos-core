/**
 * OfflineCatalogCache — Full catalog cache in IndexedDB for offline POS operation.
 *
 * Stores categories, products, and modifier groups per restaurant.
 * Supports freshness checks, invalidation, product lookup, and in-memory search.
 *
 * IndexedDB database: chefiapp_catalog_cache
 * Store: catalogs (keyPath: restaurantId)
 * Index: updatedAt
 */

import { openDB, type IDBPDatabase } from 'idb';
import { Logger } from '../logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CachedCategory {
  id: string;
  name: string;
  sortOrder?: number;
}

export interface CachedProduct {
  id: string;
  name: string;
  categoryId: string;
  priceCents: number;
  description?: string;
  imageUrl?: string | null;
  available: boolean;
  station: 'KITCHEN' | 'BAR' | 'NONE';
  modifierGroupIds: string[];
  taxRate: number;
  sku?: string;
}

export interface CachedModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: CachedModifier[];
}

export interface CachedModifier {
  id: string;
  name: string;
  priceCents: number;
}

export interface CachedCatalog {
  restaurantId: string;
  categories: CachedCategory[];
  products: CachedProduct[];
  modifierGroups: CachedModifierGroup[];
  updatedAt: number;
  version: string;
}

/**
 * Input snapshot from Core DB tables.
 * Accepts flexible shapes from PostgREST queries.
 */
export interface CatalogSnapshot {
  categories: Array<{
    id: string;
    name?: string;
    sort_order?: number;
    [k: string]: unknown;
  }>;
  products: Array<{
    id: string;
    name?: string;
    category_id?: string;
    price_cents?: number;
    price?: number;
    description?: string;
    image_url?: string | null;
    available?: boolean;
    is_available?: boolean;
    station?: string;
    modifier_group_ids?: string[];
    tax_rate?: number;
    sku?: string;
    [k: string]: unknown;
  }>;
  modifierGroups?: Array<{
    id: string;
    name?: string;
    required?: boolean;
    min_selections?: number;
    max_selections?: number;
    modifiers?: Array<{
      id: string;
      name?: string;
      price_cents?: number;
      [k: string]: unknown;
    }>;
    [k: string]: unknown;
  }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DB_NAME = 'chefiapp_catalog_cache';
const DB_VERSION = 1;
const STORE_NAME = 'catalogs';
const DEFAULT_FRESHNESS_MS = 5 * 60 * 1000; // 5 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates a simple hash string from catalog content for change detection.
 * Uses a fast djb2-style hash over a sorted JSON representation.
 */
function hashCatalog(snapshot: CatalogSnapshot): string {
  const ids = [
    ...snapshot.categories.map((c) => c.id),
    ...snapshot.products.map((p) => `${p.id}:${p.price_cents ?? p.price}`),
    ...(snapshot.modifierGroups ?? []).map((m) => m.id),
  ].sort();
  const raw = ids.join('|');
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Normalize a raw product from Core into CachedProduct shape.
 */
function normalizeProduct(raw: CatalogSnapshot['products'][number]): CachedProduct {
  const rawPrice = raw.price_cents ?? (raw.price != null ? Math.round(raw.price * 100) : 0);
  return {
    id: raw.id,
    name: raw.name ?? '',
    categoryId: raw.category_id ?? '',
    priceCents: rawPrice,
    description: raw.description,
    imageUrl: raw.image_url ?? null,
    available: raw.available ?? raw.is_available ?? true,
    station: normalizeStation(raw.station),
    modifierGroupIds: raw.modifier_group_ids ?? [],
    taxRate: raw.tax_rate ?? 0,
    sku: raw.sku,
  };
}

function normalizeStation(station?: string): 'KITCHEN' | 'BAR' | 'NONE' {
  if (!station) return 'NONE';
  const upper = station.toUpperCase();
  if (upper === 'KITCHEN' || upper === 'BAR') return upper;
  return 'NONE';
}

// ─── Database ────────────────────────────────────────────────────────────────

interface CatalogCacheDB {
  catalogs: {
    key: string;
    value: CachedCatalog;
    indexes: { updatedAt: number };
  };
}

async function getDB(): Promise<IDBPDatabase<CatalogCacheDB>> {
  return openDB<CatalogCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'restaurantId' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    },
    blocked() {
      Logger.warn('[OfflineCatalogCache] DB upgrade blocked by another tab');
    },
    blocking() {
      Logger.warn('[OfflineCatalogCache] This tab is blocking a DB upgrade');
    },
  });
}

// ─── OfflineCatalogCache ─────────────────────────────────────────────────────

export class OfflineCatalogCache {
  private dbPromise: Promise<IDBPDatabase<CatalogCacheDB>> | null = null;

  /** Lazy-initialise the database connection. */
  private async db(): Promise<IDBPDatabase<CatalogCacheDB>> {
    if (!this.dbPromise) {
      this.dbPromise = getDB().catch((err) => {
        this.dbPromise = null;
        throw err;
      });
    }
    return this.dbPromise;
  }

  /**
   * Save a catalog snapshot for a given restaurant.
   * Normalizes the raw data into the cached format.
   *
   * @param restaurantId - Restaurant identifier
   * @param catalog - Raw catalog snapshot from Core
   */
  async saveCatalog(restaurantId: string, catalog: CatalogSnapshot): Promise<void> {
    try {
      const db = await this.db();

      const cached: CachedCatalog = {
        restaurantId,
        categories: catalog.categories.map((c) => ({
          id: c.id,
          name: c.name ?? '',
          sortOrder: c.sort_order ?? 0,
        })),
        products: catalog.products.map(normalizeProduct),
        modifierGroups: (catalog.modifierGroups ?? []).map((mg) => ({
          id: mg.id,
          name: mg.name ?? '',
          required: mg.required ?? false,
          minSelections: mg.min_selections ?? 0,
          maxSelections: mg.max_selections ?? 0,
          modifiers: (mg.modifiers ?? []).map((m) => ({
            id: m.id,
            name: m.name ?? '',
            priceCents: m.price_cents ?? 0,
          })),
        })),
        updatedAt: Date.now(),
        version: hashCatalog(catalog),
      };

      await db.put(STORE_NAME, cached);
      Logger.info(`[OfflineCatalogCache] Saved catalog for ${restaurantId} (${cached.products.length} products)`);
    } catch (err) {
      Logger.error('[OfflineCatalogCache] Failed to save catalog', err);
      throw err;
    }
  }

  /**
   * Retrieve the cached catalog for a restaurant.
   *
   * @param restaurantId - Restaurant identifier
   * @returns The cached catalog, or null if not found
   */
  async getCatalog(restaurantId: string): Promise<CachedCatalog | null> {
    try {
      const db = await this.db();
      const result = await db.get(STORE_NAME, restaurantId);
      return result ?? null;
    } catch (err) {
      Logger.error('[OfflineCatalogCache] Failed to get catalog', err);
      return null;
    }
  }

  /**
   * Check if the cached catalog is still fresh.
   *
   * @param restaurantId - Restaurant identifier
   * @param maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
   * @returns true if cache exists and is within the freshness window
   */
  async isFresh(restaurantId: string, maxAgeMs: number = DEFAULT_FRESHNESS_MS): Promise<boolean> {
    try {
      const catalog = await this.getCatalog(restaurantId);
      if (!catalog) return false;
      return Date.now() - catalog.updatedAt < maxAgeMs;
    } catch {
      return false;
    }
  }

  /**
   * Invalidate (delete) the cached catalog for a restaurant.
   *
   * @param restaurantId - Restaurant identifier
   */
  async invalidate(restaurantId: string): Promise<void> {
    try {
      const db = await this.db();
      await db.delete(STORE_NAME, restaurantId);
      Logger.info(`[OfflineCatalogCache] Invalidated catalog for ${restaurantId}`);
    } catch (err) {
      Logger.error('[OfflineCatalogCache] Failed to invalidate catalog', err);
    }
  }

  /**
   * Retrieve a single product by ID from the cached catalog.
   *
   * @param restaurantId - Restaurant identifier
   * @param productId - Product ID to find
   * @returns The product, or null if not found
   */
  async getProduct(restaurantId: string, productId: string): Promise<CachedProduct | null> {
    const catalog = await this.getCatalog(restaurantId);
    if (!catalog) return null;
    return catalog.products.find((p) => p.id === productId) ?? null;
  }

  /**
   * Search products by name within the cached catalog.
   * Performs a case-insensitive substring match.
   *
   * @param restaurantId - Restaurant identifier
   * @param query - Search query string
   * @returns Matching products (empty array if no cache or no matches)
   */
  async searchProducts(restaurantId: string, query: string): Promise<CachedProduct[]> {
    if (!query.trim()) return [];
    const catalog = await this.getCatalog(restaurantId);
    if (!catalog) return [];
    const lowerQuery = query.toLowerCase();
    return catalog.products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.sku && p.sku.toLowerCase().includes(lowerQuery)),
    );
  }
}
