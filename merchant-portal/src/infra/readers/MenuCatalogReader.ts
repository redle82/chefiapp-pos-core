/**
 * MenuCatalogReader — Catálogo visual do menu (restaurante + categorias com itens).
 */

import {
  readRestaurantById,
  readMenu,
  type CoreProduct,
  type CoreMenuCategory,
  type CoreRestaurant,
} from "./RestaurantReader";
import type { CatalogCategory, MenuRestaurant, CatalogItem } from "../../pages/MenuCatalog/types";

export interface MenuCatalogData {
  restaurant: MenuRestaurant | null;
  categories: CatalogCategory[];
}

function mapRestaurant(r: CoreRestaurant | null): MenuRestaurant | null {
  if (!r) return null;
  return {
    name: r.name,
    logoUrl: (r as { logo_url?: string }).logo_url ?? undefined,
    tagline: r.description ?? undefined,
  };
}

function mapProductToCatalogItem(p: CoreProduct): CatalogItem {
  return {
    id: p.id,
    title: p.name,
    description: p.description ?? "",
    priceCents: p.price_cents,
    imageUrl: (p as { photo_url?: string }).photo_url ?? "",
    allergens: [],
  };
}

/**
 * Carrega catálogo do menu (restaurante + categorias com itens) do Core.
 */
export async function readMenuCatalog(
  restaurantId: string
): Promise<MenuCatalogData | null> {
  const [restaurant, menu] = await Promise.all([
    readRestaurantById(restaurantId),
    readMenu(restaurantId),
  ]);
  const categories: CatalogCategory[] = menu.categories.map((cat: CoreMenuCategory) => ({
    id: cat.id,
    title: cat.name,
    items: menu.products
      .filter((p: CoreProduct) => p.category_id === cat.id)
      .map(mapProductToCatalogItem),
  }));
  return {
    restaurant: mapRestaurant(restaurant),
    categories,
  };
}
