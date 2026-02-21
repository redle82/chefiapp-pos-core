/**
 * Menu cache (IndexedDB) — snapshot do menu por restaurante para uso offline.
 * Quando online: ao carregar menu, gravar cópia. Quando offline: ler do cache.
 */
// @ts-nocheck


const DB_NAME = "chefiapp_menu_cache";
const STORE_NAME = "menu";
const DB_VERSION = 1;

export interface MenuCacheEntry {
  restaurant_id: string;
  snapshot: unknown;
  updated_at: number;
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
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: MenuCacheEntry = {
        restaurant_id: restaurantId,
        snapshot,
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
