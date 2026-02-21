/**
 * EquipmentReader — Leituras de equipamento (gm_equipment, gm_terminals).
 * TPV/KDS e dispositivos operacionais.
 */
// @ts-nocheck


import { dockerCoreClient } from "../docker-core/connection";

export interface TerminalEquipmentRow {
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

/**
 * Lista equipamento do restaurante (gm_equipment). Para device gate, filtrar por kind IN ('TPV','KDS').
 */
export async function listEquipmentByRestaurant(
  restaurantId: string
): Promise<TerminalEquipmentRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_equipment")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as TerminalEquipmentRow[];
}

/**
 * Lista heartbeats de terminais (gm_terminals) do restaurante.
 */
export async function listTerminalsHeartbeatsByRestaurant(
  restaurantId: string
): Promise<{ id: string; name: string; type: string; last_heartbeat_at: string | null }[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_terminals")
    .select("id, name, type, last_heartbeat_at")
    .eq("restaurant_id", restaurantId);
  if (error) return [];
  return (data ?? []) as { id: string; name: string; type: string; last_heartbeat_at: string | null }[];
}
