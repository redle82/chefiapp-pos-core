/**
 * Hook para buscar menu items do Core (gm_products, gm_menu_categories).
 * ANTI-SUPABASE §4: Menu read ONLY via Core (reader/API). No Supabase domain. Fail explicit if Core unavailable.
 */

import { useEffect, useState } from "react";
import {
  readMenuCategories,
  readProducts,
} from "../infra/readers/RestaurantReader";
import { isDebugMode } from "../core/debugMode";
import { BackendType, getBackendType } from "../core/infra/backendAdapter";

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

export function useMenuItems(restaurantId: string | null) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    let retryCount = 0;
    let isMounted = true;

    const loadMenuItems = async () => {
      if (!isMounted) return;
      try {
        // ANTI-SUPABASE §4: Menu read ONLY via Core. Fail explicit if not Docker.
        if (getBackendType() !== BackendType.docker) {
          throw new Error(
            "Core indisponível. Configure o Docker Core para carregar o menu."
          );
        }

        const [categoriesData, itemsData] = await Promise.all([
          readMenuCategories(restaurantId),
          readProducts(restaurantId),
        ]);

        if (itemsData && itemsData.length > 0 && isMounted) {
          console.log("[useMenuItems] First Item (Core):", itemsData[0]);
        }

        const categoryMap = new Map(
          (categoriesData || []).map((cat) => [cat.id, cat.name])
        );

        const mappedItems: MenuItem[] = (itemsData || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? undefined,
          priceCents: item.price_cents,
          category:
            (item.category_id && categoryMap.get(item.category_id)) || "Outros",
          photoUrl: item.photo_url ?? undefined,
          trackStock: undefined,
          stockQuantity: undefined,
          visibility: undefined,
        }));

        if (isMounted) setItems(mappedItems);
      } catch (err) {
        console.error("[useMenuItems] Error (Core):", err);
        if (isMounted) {
          setError(err as Error);
          const msg = err instanceof Error ? err.message : String(err);
          const isConnectionRefused =
            msg.includes("Failed to fetch") ||
            msg.includes("ERR_CONNECTION_REFUSED") ||
            msg.includes("NetworkError") ||
            msg.includes("Core indisponível");
          if (isConnectionRefused) {
            setLoading(false);
            return;
          }
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
    items:
      items.length === 0 && isDebugMode()
        ? ([
            {
              id: "mock-1",
              name: "Mock Burger",
              priceCents: 1200,
              category: "Burgers",
              description: "Delicious mock burger",
            },
            {
              id: "mock-2",
              name: "Mock Cola",
              priceCents: 300,
              category: "Drinks",
              description: "Cold mock cola",
            },
          ] as MenuItem[])
        : items,
    loading,
    error,
  };
}
