/**
 * MenuWriter — Escrita de itens do menu (gm_products) no Core.
 */
// @ts-nocheck


import type { MenuItemInput } from "../../core/contracts/Menu";
import { dockerCoreClient } from "../docker-core/connection";

export async function createMenuItem(
  restaurantId: string,
  input: MenuItemInput
): Promise<{ id: string }> {
  const prepTimeSeconds = (input.prep_time_minutes ?? 5) * 60;
  const row = {
    restaurant_id: restaurantId,
    category_id: input.category_id ?? null,
    name: input.name.trim(),
    description: input.description ?? null,
    price_cents: input.price_cents,
    available: input.available ?? true,
    station: input.station ?? "KITCHEN",
    prep_time_seconds: prepTimeSeconds,
    prep_category: input.prep_category ?? "main",
  };
  const { data, error } = await dockerCoreClient
    .from("gm_products")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(error.message ?? "Falha ao criar item");
  return { id: (data as { id: string }).id };
}

export async function updateMenuItem(
  id: string,
  _restaurantId: string,
  input: MenuItemInput
): Promise<void> {
  const prepTimeSeconds = (input.prep_time_minutes ?? 5) * 60;
  const row = {
    name: input.name.trim(),
    description: input.description ?? null,
    price_cents: input.price_cents,
    available: input.available ?? true,
    station: input.station ?? "KITCHEN",
    prep_time_seconds: prepTimeSeconds,
    prep_category: input.prep_category ?? "main",
    category_id: input.category_id ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await dockerCoreClient
    .from("gm_products")
    .update(row)
    .eq("id", id);
  if (error) throw new Error(error.message ?? "Falha ao atualizar item");
}

export async function deleteMenuItem(id: string, _restaurantId: string): Promise<void> {
  const { error } = await dockerCoreClient.from("gm_products").delete().eq("id", id);
  if (error) throw new Error(error.message ?? "Falha ao remover item");
}
