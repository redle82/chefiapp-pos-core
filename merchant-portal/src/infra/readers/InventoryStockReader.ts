/**
 * InventoryStockReader — Leituras de inventário e estoque do Core.
 * gm_locations, gm_equipment, gm_ingredients, gm_stock_levels, gm_product_bom.
 */

import { dockerCoreClient } from "../docker-core/connection";

export interface CoreLocation {
  id: string;
  restaurant_id: string;
  name: string;
  kind: string;
  created_at?: string;
  updated_at?: string;
}

export interface CoreEquipment {
  id: string;
  restaurant_id: string;
  location_id?: string | null;
  name: string;
  kind: string;
  capacity_note?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CoreIngredient {
  id: string;
  restaurant_id: string;
  name: string;
  unit: "g" | "kg" | "ml" | "l" | "unit";
  created_at?: string;
  updated_at?: string;
}

export interface StockLevelRow {
  id: string;
  restaurant_id: string;
  location_id: string;
  ingredient_id: string;
  qty: number;
  min_qty: number;
  updated_at?: string;
}

export interface StockAlertRow {
  id: string;
  restaurant_id: string;
  location_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  location_name?: string;
  qty: number;
  min_qty: number;
  updated_at?: string;
}

export async function readLocations(restaurantId: string): Promise<CoreLocation[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_locations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as CoreLocation[];
}

export async function readEquipment(restaurantId: string): Promise<CoreEquipment[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_equipment")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as CoreEquipment[];
}

export async function readIngredients(restaurantId: string): Promise<CoreIngredient[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_ingredients")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as CoreIngredient[];
}

export async function readStockLevels(restaurantId: string): Promise<StockLevelRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_stock_levels")
    .select("*")
    .eq("restaurant_id", restaurantId);
  if (error) return [];
  return (data ?? []) as StockLevelRow[];
}

export async function readProductBOM(restaurantId: string): Promise<unknown[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_product_bom")
    .select("*")
    .eq("restaurant_id", restaurantId);
  if (error) return [];
  return (data ?? []) as unknown[];
}

/**
 * Alertas de estoque (qty <= min_qty e min_qty > 0).
 */
export async function readStockAlerts(restaurantId: string): Promise<StockAlertRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_stock_levels")
    .select("id, restaurant_id, location_id, ingredient_id, qty, min_qty, updated_at")
    .eq("restaurant_id", restaurantId)
    .filter("min_qty", "gt", 0);
  if (error) return [];
  const rows = (data ?? []) as StockLevelRow[];
  const low = rows.filter((r) => Number(r.qty) <= Number(r.min_qty));
  const ingredients = await readIngredients(restaurantId);
  const locations = await readLocations(restaurantId);
  const ingMap = new Map(ingredients.map((i) => [i.id, i.name]));
  const locMap = new Map(locations.map((l) => [l.id, l.name]));
  return low.map((r) => ({
    ...r,
    ingredient_name: ingMap.get(r.ingredient_id),
    location_name: locMap.get(r.location_id),
  })) as StockAlertRow[];
}
