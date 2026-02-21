/**
 * ProductReader — Leituras de produtos (gm_products) com categoria.
 */
// @ts-nocheck


import {
  readMenuCategories,
  readProducts,
  type CoreMenuCategory,
  type CoreProduct,
} from "./RestaurantReader";

export type { CoreProduct };

export interface CoreProductWithCategory extends CoreProduct {
  category_name?: string | null;
  gm_menu_categories?: CoreMenuCategory | null;
}

/**
 * Produtos do restaurante, opcionalmente com nome da categoria.
 */
export async function readProductsByRestaurant(
  restaurantId: string,
  _includeInactive?: boolean,
  _includeAll?: boolean
): Promise<CoreProductWithCategory[]> {
  const [products, categories] = await Promise.all([
    readProducts(restaurantId),
    readMenuCategories(restaurantId),
  ]);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  return products.map((p) => ({
    ...p,
    category_name: p.category_id ? catMap.get(p.category_id)?.name ?? null : null,
    gm_menu_categories: p.category_id ? catMap.get(p.category_id) ?? null : null,
  })) as CoreProductWithCategory[];
}
