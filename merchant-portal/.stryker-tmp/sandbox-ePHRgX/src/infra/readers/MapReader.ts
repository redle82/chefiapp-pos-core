/**
 * MapReader — Leituras de mapa (mesas e zonas). gm_tables, gm_locations (como zonas).
 */
// @ts-nocheck


import type { CoreRestaurantTable, CoreRestaurantZone } from "../docker-core/types";
import { dockerCoreClient } from "../docker-core/connection";

export async function readTables(
  restaurantId: string
): Promise<CoreRestaurantTable[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("number", { ascending: true });
  if (error) return [];
  return (data ?? []) as CoreRestaurantTable[];
}

/**
 * Zonas: usa gm_locations (kind = KITCHEN, BAR, STORAGE, SERVICE, OTHER) como zonas do mapa.
 */
export async function readZones(
  restaurantId: string
): Promise<CoreRestaurantZone[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_locations")
    .select("id, restaurant_id, name, kind")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return ((data ?? []) as { id: string; restaurant_id: string; name: string; kind?: string }[]).map(
    (r) => ({ id: r.id, restaurant_id: r.restaurant_id, name: r.name, code: r.kind, kind: r.kind })
  ) as CoreRestaurantZone[];
}
