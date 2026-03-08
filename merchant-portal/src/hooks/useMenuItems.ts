/**
 * Hook para buscar menu items do Core (gm_products, gm_menu_categories).
 * ANTI-SUPABASE §4: Menu read ONLY via Core (reader/API). No Supabase domain. Fail explicit if Core unavailable.
 * Offline: on load success writes to MenuCache; on load failure tries MenuCache and sets fromCache.
 */

import { useEffect, useState } from "react";
import { BackendType, getBackendType } from "../core/infra/backendAdapter";
import { MenuCache, normalizeMenuCache } from "../core/sync/MenuCache";
import { resolveProductImageUrl } from "../core/products/resolveProductImageUrl";
import type { CoreMenuCategory, CoreProduct } from "../infra/readers/RestaurantReader";
import {
  readMenuCategories,
  readProducts,
} from "../infra/readers/RestaurantReader";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  category: string;
  photoUrl?: string;
  trackStock?: boolean;
  stockQuantity?: number;
  visibility?: { tpv: boolean; web: boolean; delivery: boolean };
}

interface MenuCacheSnapshot {
  categories: CoreMenuCategory[];
  products: CoreProduct[];
}

function mapToMenuItems(
  categoriesData: CoreMenuCategory[],
  itemsData: CoreProduct[],
): MenuItem[] {
  const categoryMap = new Map(
    (categoriesData || []).map((cat) => [cat.id, cat.name]),
  );
  return (itemsData || []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? undefined,
    priceCents: item.price_cents,
    category:
      (item.category_id && categoryMap.get(item.category_id)) || "Outros",
    photoUrl: resolveProductImageUrl(item) ?? undefined,
    trackStock: undefined,
    stockQuantity: undefined,
    visibility: undefined,
  }));
}

export function useMenuItems(restaurantId: string | null) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      setFromCache(false);
      return;
    }

    let retryCount = 0;
    let isMounted = true;
    setFromCache(false);

    const loadMenuItems = async () => {
      if (!isMounted) return;
      try {
        if (getBackendType() !== BackendType.docker) {
          const cached = await MenuCache.get(restaurantId);
          const snapshot = normalizeMenuCache(cached);
          if (snapshot.categories.length > 0 || snapshot.products.length > 0) {
            if (isMounted) {
              setItems(mapToMenuItems(snapshot.categories, snapshot.products));
              setFromCache(true);
              setError(null);
            }
          } else {
            throw new Error(
              "Core indisponível. Configure o Docker Core para carregar o menu.",
            );
          }
          return;
        }

        const [categoriesData, itemsData] = await Promise.all([
          readMenuCategories(restaurantId),
          readProducts(restaurantId),
        ]);

        if (itemsData && itemsData.length > 0 && isMounted) {
          console.log("[useMenuItems] First Item (Core):", itemsData[0]);
        }

        const mappedItems = mapToMenuItems(categoriesData || [], itemsData || []);

        if (isMounted) {
          setItems(mappedItems);
          setFromCache(false);
          setError(null);
          try {
            await MenuCache.put(restaurantId, {
              categories: categoriesData || [],
              products: itemsData || [],
            } as MenuCacheSnapshot);
          } catch (e) {
            console.warn("[useMenuItems] MenuCache.put failed", e);
          }
        }
      } catch (err) {
        console.error("[useMenuItems] Error (Core):", err);
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err);
          const isNetworkError =
            msg.includes("Failed to fetch") ||
            msg.includes("ERR_CONNECTION_REFUSED") ||
            msg.includes("NetworkError") ||
            msg.includes("Core indisponível");
          if (isNetworkError) {
            try {
              const cached = await MenuCache.get(restaurantId);
              const snapshot = normalizeMenuCache(cached);
              if ((snapshot.categories.length > 0 || snapshot.products.length > 0) && isMounted) {
                setItems(mapToMenuItems(snapshot.categories, snapshot.products));
                setFromCache(true);
                setError(null);
              } else {
                setError(err as Error);
              }
            } catch {
              setError(err as Error);
            }
            setLoading(false);
            return;
          }
          setError(err as Error);
          if (retryCount < 3) {
            retryCount++;
            console.log(`[useMenuItems] Retrying... (${retryCount})`);
            setTimeout(loadMenuItems, 2000);
            return;
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMenuItems();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  return {
    items,
    loading,
    error,
    fromCache,
  };
}
