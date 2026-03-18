/**
 * StockStatusService — Tracks product availability in real-time.
 *
 * Data sources:
 * - gm_products.available field (primary)
 * - gm_stock_levels table (ingredient-level stock)
 * - gm_product_bom (bill of materials: product -> ingredients)
 * - IndexedDB fallback for manual 86'd tracking
 *
 * "86'd" = restaurant industry term for an item that's no longer available.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";

// ─── Types ───

export interface ProductStockStatus {
  productId: string;
  productName: string;
  available: boolean;
  currentStock: number | null;
  minStock: number | null;
  isLowStock: boolean;
  reason?: string;
}

interface EightySixRecord {
  key: string;
  restaurantId: string;
  productId: string;
  reason: string;
  createdAt: string;
}

// ─── IndexedDB helpers for manual 86'd tracking ───

const IDB_NAME = "chefiapp_stock_86d";
const IDB_STORE = "unavailable_products";
const IDB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<EightySixRecord | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as EightySixRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(record: EightySixRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAllForRestaurant(restaurantId: string): Promise<EightySixRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result ?? []) as EightySixRecord[];
      resolve(all.filter((r) => r.restaurantId === restaurantId));
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── BOM types ───

interface BomRow {
  product_id: string;
  ingredient_id: string;
  qty_per_unit: number;
}

interface StockRow {
  ingredient_id: string;
  qty: number;
  min_qty: number;
}

interface ProductRow {
  id: string;
  name: string;
  available?: boolean;
}

// ─── Service ───

export class StockStatusService {
  /**
   * Get stock status for all products of a restaurant.
   */
  async getStockStatuses(restaurantId: string): Promise<ProductStockStatus[]> {
    // Fetch products, BOM, stock levels, and manual 86'd records in parallel
    const [products, bom, stockLevels, manual86d] = await Promise.all([
      this.fetchProducts(restaurantId),
      this.fetchBom(restaurantId),
      this.fetchStockLevels(restaurantId),
      idbGetAllForRestaurant(restaurantId).catch(() => [] as EightySixRecord[]),
    ]);

    const manual86dSet = new Map(
      manual86d.map((r) => [r.productId, r.reason]),
    );

    // Build ingredient stock map
    const ingredientStock = new Map<string, { qty: number; minQty: number }>();
    for (const sl of stockLevels) {
      const existing = ingredientStock.get(sl.ingredient_id);
      if (existing) {
        existing.qty += Number(sl.qty);
        existing.minQty = Math.max(existing.minQty, Number(sl.min_qty));
      } else {
        ingredientStock.set(sl.ingredient_id, {
          qty: Number(sl.qty),
          minQty: Number(sl.min_qty),
        });
      }
    }

    // Build product -> ingredients map from BOM
    const productIngredients = new Map<string, BomRow[]>();
    for (const row of bom) {
      const list = productIngredients.get(row.product_id) ?? [];
      list.push(row);
      productIngredients.set(row.product_id, list);
    }

    return products.map((product): ProductStockStatus => {
      const bomRows = productIngredients.get(product.id);
      let currentStock: number | null = null;
      let minStock: number | null = null;
      let isLowStock = false;

      if (bomRows && bomRows.length > 0) {
        // Calculate how many servings we can make from ingredient stock
        let minServings = Infinity;
        let lowestMinQty = 0;

        for (const bomRow of bomRows) {
          const stock = ingredientStock.get(bomRow.ingredient_id);
          if (!stock) {
            minServings = 0;
            break;
          }
          const servings =
            bomRow.qty_per_unit > 0
              ? Math.floor(stock.qty / bomRow.qty_per_unit)
              : Infinity;
          minServings = Math.min(minServings, servings);
          if (stock.minQty > 0) {
            const minServingsThreshold =
              bomRow.qty_per_unit > 0
                ? Math.floor(stock.minQty / bomRow.qty_per_unit)
                : 0;
            lowestMinQty = Math.max(lowestMinQty, minServingsThreshold);
          }
        }

        currentStock = minServings === Infinity ? null : minServings;
        minStock = lowestMinQty > 0 ? lowestMinQty : null;
        isLowStock =
          currentStock !== null && minStock !== null && currentStock <= minStock;
      }

      // Determine availability
      const manualReason = manual86dSet.get(product.id);
      const isManual86d = manualReason !== undefined;
      const isDbUnavailable = product.available === false;
      const isOutOfStock = currentStock !== null && currentStock <= 0;

      const available = !isManual86d && !isDbUnavailable && !isOutOfStock;

      let reason: string | undefined;
      if (isManual86d) {
        reason = manualReason || "Desativado manualmente";
      } else if (isDbUnavailable) {
        reason = "Desativado manualmente";
      } else if (isOutOfStock) {
        reason = "Esgotado";
      } else if (isLowStock) {
        reason = "Stock minimo atingido";
      }

      return {
        productId: product.id,
        productName: product.name,
        available,
        currentStock,
        minStock,
        isLowStock,
        reason,
      };
    });
  }

  /**
   * Mark a product as 86'd (unavailable).
   */
  async markUnavailable(
    restaurantId: string,
    productId: string,
    reason?: string,
  ): Promise<void> {
    const key = `${restaurantId}_${productId}`;
    await idbPut({
      key,
      restaurantId,
      productId,
      reason: reason ?? "Desativado manualmente",
      createdAt: new Date().toISOString(),
    });

    // Also try to set available=false in DB (best effort)
    try {
      await dockerCoreClient
        .from("gm_products")
        .update({ available: false })
        .eq("id", productId)
        .eq("restaurant_id", restaurantId);
    } catch {
      // IndexedDB is the source of truth for manual 86'd
    }
  }

  /**
   * Mark a product as available again.
   */
  async markAvailable(
    restaurantId: string,
    productId: string,
  ): Promise<void> {
    const key = `${restaurantId}_${productId}`;
    await idbDelete(key);

    // Also try to set available=true in DB (best effort)
    try {
      await dockerCoreClient
        .from("gm_products")
        .update({ available: true })
        .eq("id", productId)
        .eq("restaurant_id", restaurantId);
    } catch {
      // IndexedDB is the source of truth
    }
  }

  /**
   * Get products with low stock alerts.
   */
  async getLowStockAlerts(
    restaurantId: string,
  ): Promise<ProductStockStatus[]> {
    const statuses = await this.getStockStatuses(restaurantId);
    return statuses.filter((s) => s.isLowStock || !s.available);
  }

  /**
   * Decrement stock after order (called by OrderEngine integration).
   * Decrements ingredient stock based on product BOM.
   */
  async decrementStock(
    restaurantId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    const bom = await this.fetchBom(restaurantId);
    const productBom = new Map<string, BomRow[]>();
    for (const row of bom) {
      const list = productBom.get(row.product_id) ?? [];
      list.push(row);
      productBom.set(row.product_id, list);
    }

    for (const item of items) {
      const bomRows = productBom.get(item.productId);
      if (!bomRows) continue;

      for (const bomRow of bomRows) {
        const decrementQty = bomRow.qty_per_unit * item.quantity;
        if (decrementQty <= 0) continue;

        // Decrement via raw SQL RPC or direct update
        // Using direct update: subtract from first matching stock level
        try {
          const { data: levels } = await dockerCoreClient
            .from("gm_stock_levels")
            .select("id, qty")
            .eq("restaurant_id", restaurantId)
            .eq("ingredient_id", bomRow.ingredient_id)
            .order("qty", { ascending: false })
            .limit(1);

          if (levels && levels.length > 0) {
            const level = levels[0] as { id: string; qty: number };
            const newQty = Math.max(0, Number(level.qty) - decrementQty);
            await dockerCoreClient
              .from("gm_stock_levels")
              .update({ qty: newQty })
              .eq("id", level.id);
          }
        } catch (err) {
          console.error("[StockStatusService] decrementStock failed", err);
        }
      }
    }
  }

  // ─── Private helpers ───

  private async fetchProducts(restaurantId: string): Promise<ProductRow[]> {
    const { data, error } = await dockerCoreClient
      .from("gm_products")
      .select("id, name, available")
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as ProductRow[];
  }

  private async fetchBom(restaurantId: string): Promise<BomRow[]> {
    const { data, error } = await dockerCoreClient
      .from("gm_product_bom")
      .select("product_id, ingredient_id, qty_per_unit")
      .eq("restaurant_id", restaurantId);
    if (error) return [];
    return (data ?? []) as BomRow[];
  }

  private async fetchStockLevels(restaurantId: string): Promise<StockRow[]> {
    const { data, error } = await dockerCoreClient
      .from("gm_stock_levels")
      .select("ingredient_id, qty, min_qty")
      .eq("restaurant_id", restaurantId);
    if (error) return [];
    return (data ?? []) as StockRow[];
  }
}

/** Singleton instance */
export const stockStatusService = new StockStatusService();
