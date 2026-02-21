/**
 * DYNAMIC MENU REACT HOOK
 *
 * React hook for consuming dynamic menu in TPV and MiniPOS.
 * Handles real-time updates, click tracking, and favorites.
 */
// @ts-nocheck


import { useCallback, useEffect, useState } from "react";
import {
  getPilotProducts,
  type PilotProductStored,
} from "../../../../infra/menuPilotFallback";
import { MenuCache } from "../../../sync/MenuCache";
import { DynamicMenuService } from "../DynamicMenuService";
import type {
  CategoryWithProducts,
  DynamicMenuResponse,
  ProductWithScore,
} from "../types";

interface UseDynamicMenuOptions {
  restaurantId: string;
  contextualLimit?: number;
  mode?: "tpv" | "minipos";
  autoRefresh?: boolean; // Refresh every 5 minutes
  coreReachable?: boolean;
}

interface UseDynamicMenuReturn {
  menu: DynamicMenuResponse | null;
  loading: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
  trackClick: (productId: string) => Promise<void>;
  toggleFavorite: (productId: string, isFavorite: boolean) => Promise<void>;
}

export function useDynamicMenu(
  options: UseDynamicMenuOptions
): UseDynamicMenuReturn {
  const {
    restaurantId,
    contextualLimit = 12,
    mode = "tpv",
    autoRefresh = true,
    coreReachable = true,
  } = options;

  const [menu, setMenu] = useState<DynamicMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMenu = useCallback(async () => {
    try {
      if (!restaurantId) return;

      setLoading(true);
      setError(null);

      // Offline / Core unreachable: try menu cache first, then pilot
      const isOffline =
        typeof navigator !== "undefined" && !navigator.onLine;
      if (coreReachable === false || isOffline) {
        const cached = await MenuCache.get(restaurantId);
        if (cached && typeof cached === "object" && "fullCatalog" in cached) {
          setMenu(cached as DynamicMenuResponse);
          return;
        }
        console.warn(
          "[useDynamicMenu] Core unreachable or offline, using pilot fallback",
        );
        const pilot = getPilotProducts(restaurantId);
        const mapped: ProductWithScore[] = pilot.map(
          (p: PilotProductStored) => ({
            id: p.id,
            name: p.name,
            category: "Geral", // Default category for fallback
            price_cents: p.price_cents,
            available: true,
            score: 0,
            is_favorite: false,
          })
        );

        const fullCatalog: CategoryWithProducts[] = [
          {
            id: "geral",
            name: "Geral",
            products: mapped,
          },
        ];

        setMenu({
          contextual: mapped,
          favorites: [],
          fullCatalog,
        });
        return;
      }

      const limit = mode === "tpv" ? 12 : 8; // TPV shows more contextual items

      const result = await DynamicMenuService.getDynamicMenu(restaurantId, {
        contextualLimit: contextualLimit || limit,
      });

      setMenu(result);
      try {
        await MenuCache.put(restaurantId, result);
      } catch (e) {
        console.warn("[useDynamicMenu] Menu cache write failed:", e);
      }
    } catch (err) {
      setError(err as Error);
      console.error("[useDynamicMenu] Load failed:", err);

      // Try menu cache on network failure
      const cached = await MenuCache.get(restaurantId).catch(() => null);
      if (cached && typeof cached === "object" && "fullCatalog" in cached) {
        setMenu(cached as DynamicMenuResponse);
        return;
      }

      // Guardrail FK: só usar pilot products quando Core está unreachable (evitar 409)
      if (coreReachable === false) {
        const pilot = getPilotProducts(restaurantId);
        if (pilot.length > 0) {
          const mapped: ProductWithScore[] = pilot.map(
            (p: PilotProductStored) => ({
              id: p.id,
              name: p.name,
              category: "Contingência",
              price_cents: p.price_cents,
              available: true,
              score: 0,
              is_favorite: false,
            })
          );
          setMenu({
            contextual: mapped,
            favorites: [],
            fullCatalog: [
              { id: "contingencia", name: "Contingência", products: mapped },
            ],
          });
        }
      } else {
        setMenu(null);
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId, contextualLimit, mode, coreReachable]);

  const trackClick = useCallback(
    async (productId: string) => {
      try {
        await DynamicMenuService.trackClick(restaurantId, productId);

        // Optimistically update score (approximate)
        setMenu((prev) => {
          if (!prev) return prev;

          const updateScore = (product: ProductWithScore) => {
            if (product.id === productId) {
              return { ...product, score: product.score + 20 }; // Click boost
            }
            return product;
          };

          return {
            ...prev,
            contextual: prev.contextual.map(updateScore),
            favorites: prev.favorites.map(updateScore),
          };
        });

        // Refresh after 100ms to get real score
        setTimeout(loadMenu, 100);
      } catch (err) {
        console.error("[useDynamicMenu] Track click failed:", err);
      }
    },
    [restaurantId, loadMenu]
  );

  const toggleFavorite = useCallback(
    async (productId: string, isFavorite: boolean) => {
      try {
        await DynamicMenuService.toggleFavorite(
          restaurantId,
          productId,
          isFavorite
        );

        // Immediately refresh to reflect change
        await loadMenu();
      } catch (err) {
        console.error("[useDynamicMenu] Toggle favorite failed:", err);
        throw err;
      }
    },
    [restaurantId, loadMenu]
  );

  // Initial load
  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log("[useDynamicMenu] Auto-refreshing menu...");
      loadMenu();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, loadMenu]);

  return {
    menu,
    loading,
    error,
    refresh: loadMenu,
    trackClick,
    toggleFavorite,
  };
}
