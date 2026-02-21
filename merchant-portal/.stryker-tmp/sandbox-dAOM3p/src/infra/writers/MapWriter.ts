/**
 * MapWriter — Escrita de mesas e zonas (gm_tables, gm_locations).
 */
// @ts-nocheck


import type { CoreRestaurantTable, CoreRestaurantZone } from "../docker-core/types";
import { dockerCoreClient } from "../docker-core/connection";

export async function upsertTable(
  restaurantId: string,
  table: Partial<CoreRestaurantTable> & { number: number }
): Promise<CoreRestaurantTable> {
  const row = {
    restaurant_id: restaurantId,
    number: table.number,
    qr_code: table.qr_code ?? null,
    status: table.status ?? "closed",
  };
  const { data, error } = await dockerCoreClient
    .from("gm_tables")
    .upsert(row, { onConflict: "restaurant_id,number" })
    .select("*")
    .single();
  if (error) throw new Error(error.message ?? "Falha ao guardar mesa");
  return data as CoreRestaurantTable;
}

export async function upsertZone(
  restaurantId: string,
  zone: Partial<CoreRestaurantZone> & { name: string; code?: string }
): Promise<CoreRestaurantZone> {
  const row = {
    restaurant_id: restaurantId,
    name: zone.name.trim(),
    kind: zone.code ?? zone.kind ?? "OTHER",
  };
  const { data, error } = await dockerCoreClient
    .from("gm_locations")
    .upsert(row, { onConflict: "restaurant_id,name" })
    .select("id, restaurant_id, name, kind")
    .single();
  if (error) throw new Error(error.message ?? "Falha ao guardar zona");
  return { ...data, code: (data as { kind?: string }).kind } as CoreRestaurantZone;
}

export async function deactivateTable(
  _restaurantId: string,
  tableId: string
): Promise<void> {
  const { error } = await dockerCoreClient
    .from("gm_tables")
    .update({ status: "closed" })
    .eq("id", tableId);
  if (error) throw new Error(error.message ?? "Falha ao desativar mesa");
}

export async function deactivateZone(
  _restaurantId: string,
  _zoneId: string
): Promise<void> {
  // gm_locations não tem "active"; opcionalmente não listar na UI
}
