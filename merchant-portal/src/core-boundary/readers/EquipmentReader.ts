/**
 * EQUIPMENT READER — Lista equipamento TPV/KDS por restaurante (gm_equipment)
 *
 * Usado para sidebar Operar: terminais com nome e estado Online/Offline.
 * Contrato: TERMINAL_INSTALLATION_RITUAL.md
 */

import { dockerCoreClient } from "../docker-core/connection";
import { Logger } from "../../core/logger";

export type TerminalEquipmentKind = "TPV" | "KDS";

export interface TerminalEquipmentRow {
  id: string;
  name: string;
  kind: TerminalEquipmentKind;
  is_active: boolean;
}

/**
 * Lista equipamento (TPV/KDS) do restaurante.
 */
export async function listEquipmentByRestaurant(
  restaurantId: string
): Promise<TerminalEquipmentRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_equipment")
    .select("id, name, kind, is_active")
    .eq("restaurant_id", restaurantId)
    .in("kind", ["TPV", "KDS"])
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) return [];
    Logger.warn("[EquipmentReader] listEquipmentByRestaurant", {
      restaurant_id: restaurantId,
      error: error.message,
    });
    return [];
  }
  return (data || []) as TerminalEquipmentRow[];
}

function isMissingTableError(error: { message?: string; code?: string; details?: string }): boolean {
  const msg = [error?.message, error?.details].filter(Boolean).join(" ").toLowerCase();
  return (
    msg.includes("does not exist") ||
    (msg.includes("relation") && msg.includes("exist")) ||
    error?.code === "42P01"
  );
}

/** Linha gm_terminals (heartbeat). */
export interface TerminalHeartbeatRow {
  id: string;
  restaurant_id: string;
  type: string;
  name: string;
  last_heartbeat_at: string | null;
}

/**
 * Lista terminais (heartbeats) do restaurante para estado Online/Offline.
 */
export async function listTerminalsHeartbeatsByRestaurant(
  restaurantId: string
): Promise<TerminalHeartbeatRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_terminals")
    .select("id, restaurant_id, type, name, last_heartbeat_at")
    .eq("restaurant_id", restaurantId)
    .order("last_heartbeat_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    Logger.warn("[EquipmentReader] listTerminalsHeartbeatsByRestaurant", {
      restaurant_id: restaurantId,
      error: error.message,
    });
    return [];
  }
  return (data || []) as TerminalHeartbeatRow[];
}
