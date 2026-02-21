/**
 * RestaurantReader — Leituras de restaurante, menu, mesas (gm_restaurants, gm_menu_categories, gm_products, gm_tables).
 */

import { dockerCoreClient } from "../docker-core/connection";

export interface CoreRestaurant {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  opening_hours_text?: string | null;
  address_text?: string | null;
  owner_id?: string | null;
  tenant_id?: string | null;
  /** URL do logo do restaurante. Ver RESTAURANT_LOGO_IDENTITY_CONTRACT.md */
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CoreMenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order?: number;
  created_at?: string;
}

export interface CoreProduct {
  id: string;
  restaurant_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price_cents: number;
  photo_url?: string | null;
  asset_id?: string | null;
  custom_image_url?: string | null;
  asset_image_url?: string | null;
  available?: boolean;
  /** Estação de preparo: BAR ou KITCHEN — usado no KDS e Menu Builder */
  station?: "BAR" | "KITCHEN" | null;
  prep_category?: string | null;
  prep_time_seconds?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CoreTable {
  id: string;
  restaurant_id: string;
  number: number;
  qr_code?: string | null;
  status?: string | null;
  created_at?: string;
}

export async function readRestaurantBySlug(
  slug: string,
): Promise<CoreRestaurant | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as CoreRestaurant;
}

export async function readRestaurantById(
  id: string,
): Promise<CoreRestaurant | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as CoreRestaurant;
}

export async function readMenuCategories(
  restaurantId: string,
): Promise<CoreMenuCategory[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_menu_categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as CoreMenuCategory[];
}

export async function readProducts(
  restaurantId: string,
): Promise<CoreProduct[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_products")
    .select("*, gm_product_assets(image_url)")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []).map((product) => {
    const { gm_product_assets, ...rest } = product as {
      gm_product_assets?: { image_url?: string | null } | null;
    } & CoreProduct;
    return {
      ...rest,
      asset_image_url: gm_product_assets?.image_url ?? null,
    } as CoreProduct;
  });
}

export async function readTableByNumber(
  restaurantId: string,
  tableNumber: number,
): Promise<CoreTable | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("number", tableNumber)
    .maybeSingle();
  if (error || !data) return null;
  return data as CoreTable;
}

export async function readMenu(restaurantId: string): Promise<{
  categories: CoreMenuCategory[];
  products: CoreProduct[];
}> {
  const [categories, products] = await Promise.all([
    readMenuCategories(restaurantId),
    readProducts(restaurantId),
  ]);
  return { categories, products };
}
