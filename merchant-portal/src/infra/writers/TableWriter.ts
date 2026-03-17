/**
 * TableWriter — Operações de escrita em mesas (gm_tables).
 *
 * Funções partilhadas por todas as origens (TPV, AppStaff, QR_MESA).
 * Regra canónica: qualquer pedido com mesa ocupa a mesa, independentemente da origem.
 *
 * Todas as transições são fire-and-forget (non-blocking, best-effort).
 * Actualizam sempre `last_state_change_at` para tracking de tempo no estado.
 */

import { dockerCoreClient } from "../docker-core/connection";
import type { TableStatus } from "../../core/operational/tableStates";

// ---------------------------------------------------------------------------
// Generic transition (internal)
// ---------------------------------------------------------------------------

async function transitionTable(
  tableId: string,
  restaurantId: string,
  newStatus: TableStatus,
  extraFields?: Record<string, unknown>,
): Promise<void> {
  try {
    await dockerCoreClient
      .from("gm_tables")
      .update({
        status: newStatus,
        last_state_change_at: new Date().toISOString(),
        ...extraFields,
      })
      .eq("id", tableId)
      .eq("restaurant_id", restaurantId);
  } catch (err) {
    console.warn(`[TABLE_TRANSITION] ${newStatus} failed:`, tableId, err);
  }
}

// ---------------------------------------------------------------------------
// Public transition functions
// ---------------------------------------------------------------------------

/**
 * Marca mesa como "occupied" com seated_at. Idempotente — se já ocupada, não faz nada.
 * Chamada após criação de pedido com mesa.
 */
export async function occupyTableForOrder(
  tableId: string,
  restaurantId: string,
): Promise<void> {
  try {
    await dockerCoreClient
      .from("gm_tables")
      .update({
        status: "occupied",
        seated_at: new Date().toISOString(),
        last_state_change_at: new Date().toISOString(),
      })
      .eq("id", tableId)
      .eq("restaurant_id", restaurantId)
      .neq("status", "occupied");
  } catch (err) {
    console.warn("[TABLE_OCCUPY] Failed to occupy table:", tableId, err);
  }
}

/** Pedido enviado à cozinha → mesa em preparo. */
export function markTableInPrep(
  tableId: string,
  restaurantId: string,
): Promise<void> {
  return transitionTable(tableId, restaurantId, "in_prep");
}

/** Todos os itens prontos → pronta para servir. */
export function markTableReadyToServe(
  tableId: string,
  restaurantId: string,
): Promise<void> {
  return transitionTable(tableId, restaurantId, "ready_to_serve");
}

/** Cliente pediu a conta. */
export function markTableBillRequested(
  tableId: string,
  restaurantId: string,
): Promise<void> {
  return transitionTable(tableId, restaurantId, "bill_requested");
}

/** Mesa precisa de limpeza (após pagamento ou liberação manual). */
export function markTableCleaning(
  tableId: string,
  restaurantId: string,
): Promise<void> {
  return transitionTable(tableId, restaurantId, "cleaning");
}

/** Bloquear mesa (fora de uso — admin). */
export function blockTable(
  tableId: string,
  restaurantId: string,
): Promise<void> {
  return transitionTable(tableId, restaurantId, "blocked");
}

/**
 * Liberta mesa (status → "free", seated_at → null).
 * Chamada manualmente pelo operador ou após limpeza.
 */
export async function freeTable(
  tableId: string,
  restaurantId: string,
): Promise<void> {
  try {
    await dockerCoreClient
      .from("gm_tables")
      .update({
        status: "free",
        seated_at: null,
        last_state_change_at: new Date().toISOString(),
      })
      .eq("id", tableId)
      .eq("restaurant_id", restaurantId);
  } catch (err) {
    console.warn("[TABLE_FREE] Failed to free table:", tableId, err);
  }
}
