/**
 * Menu cache (IndexedDB) — snapshot do menu por restaurante para uso offline.
 * Fase 3: Formato canónico = { categories, products }. Escrita sempre normalizada; leitura aceita legado fullCatalog (deprecar).
 */

const DB_NAME = "chefiapp_menu_cache";
const STORE_NAME = "menu";
const DB_VERSION = 1;

export interface MenuCacheEntry {
  restaurant_id: string;
  snapshot: unknown;
  updated_at: number;
}

export interface NormalizedMenuSnapshot {
  categories: Array<{ id: string; name?: string; [k: string]: unknown }>;
  products: Array<{ id: string; name?: string; category_id?: string; price_cents?: number; [k: string]: unknown }>;
}

/**
 * Normaliza snapshot para formato canónico { categories, products }.
 * Aceita formato legado fullCatalog (array de categorias com produtos); mantido com TODO para remoção.
 */
export function normalizeMenuCache(snapshot: unknown): NormalizedMenuSnapshot {
  if (snapshot && typeof snapshot === "object") {
    const o = snapshot as Record<string, unknown>;
    if (Array.isArray(o.categories) && Array.isArray(o.products)) {
      return {
        categories: o.categories as NormalizedMenuSnapshot["categories"],
        products: o.products as NormalizedMenuSnapshot["products"],
      };
    }
    // TODO(2026-06): remover fallback fullCatalog quando todos os consumidores usarem { categories, products }
    if (Array.isArray(o.fullCatalog)) {
      const categories: NormalizedMenuSnapshot["categories"] = [];
      const products: NormalizedMenuSnapshot["products"] = [];
      for (const cat of o.fullCatalog as Array<{ id?: string; name?: string; products?: unknown[] }>) {
        if (cat?.id) {
          categories.push({ id: cat.id, name: cat.name });
          const prods = Array.isArray(cat.products) ? cat.products : [];
          for (const p of prods) {
            if (p && typeof p === "object" && "id" in p) {
              products.push({
                ...(p as Record<string, unknown>),
                category_id: cat.id,
              } as NormalizedMenuSnapshot["products"][0]);
            }
          }
        }
      }
      return { categories, products };
    }
  }
  return { categories: [], products: [] };
}

export const MenuCache = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "restaurant_id",
          });
          store.createIndex("updated_at", "updated_at", { unique: false });
        }
      };
    });
  },

  async put(restaurantId: string, snapshot: unknown): Promise<void> {
    const normalized = normalizeMenuCache(snapshot);
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: MenuCacheEntry = {
        restaurant_id: restaurantId,
        snapshot: normalized,
        updated_at: Date.now(),
      };
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async get(restaurantId: string): Promise<unknown | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(restaurantId);
      request.onsuccess = () => {
        const entry = request.result as MenuCacheEntry | undefined;
        resolve(entry?.snapshot ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  },
};
