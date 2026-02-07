/**
 * useMenuCatalog — Dados do catálogo visual (Core ou mock)
 * Contrato: MENU_VISUAL_RUNTIME_CONTRACT.md
 */

import { useEffect, useState } from "react";
import { readMenuCatalog } from "../../core-boundary/readers/MenuCatalogReader";
import type { CatalogCategory, MenuRestaurant } from "./types";

export interface UseMenuCatalogResult {
  restaurant: MenuRestaurant | null;
  categories: CatalogCategory[];
  loading: boolean;
  error: string | null;
  fromCore: boolean;
}

/**
 * Carrega o catálogo do menu para o restaurante. Se restaurantId for null ou o Core
 * não devolver dados, o caller deve usar mock (ex.: MenuCatalogPageV2).
 */
export function useMenuCatalog(
  restaurantId: string | null
): UseMenuCatalogResult {
  const [restaurant, setRestaurant] = useState<MenuRestaurant | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(Boolean(restaurantId));
  const [error, setError] = useState<string | null>(null);
  const [fromCore, setFromCore] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      setRestaurant(null);
      setCategories([]);
      setLoading(false);
      setError(null);
      setFromCore(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    readMenuCatalog(restaurantId)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setRestaurant(data.restaurant);
          setCategories(data.categories);
          setFromCore(true);
        } else {
          setRestaurant(null);
          setCategories([]);
          setFromCore(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message ?? "Erro ao carregar catálogo");
          setRestaurant(null);
          setCategories([]);
          setFromCore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return { restaurant, categories, loading, error, fromCore };
}
