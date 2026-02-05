/**
 * SHIFT CHECKLIST READER
 *
 * FASE 3 Passo 2: Lê templates e conclusões do checklist do turno.
 */

import { CONFIG } from "../../config";
import { dockerCoreClient } from "../docker-core/connection";

export interface ShiftChecklistTemplate {
  id: string;
  restaurant_id: string;
  label: string;
  sort_order: number;
  kind: "opening" | "closing" | "general";
  created_at: string;
  updated_at: string;
}

export interface ShiftChecklistCompletion {
  id: string;
  turn_session_id: string;
  template_id: string;
  completed_at: string;
  completed_by: string | null;
}

const TURN_SESSION_STORAGE_KEY = "chefiapp_turn_session_id";

/**
 * Obtém o ID da sessão de turno ativa a partir do localStorage (definido após start_turn).
 */
export function getActiveTurnSessionIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TURN_SESSION_STORAGE_KEY);
}

/** 404 ou tabela inexistente = Core não expõe a tabela; devolver lista vazia (API_ERROR_CONTRACT). */
function isTableUnavailableError(
  error: { message?: string; code?: string } | null,
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = String(error.code ?? "").toLowerCase();
  return (
    code === "pgrst116" ||
    code === "42p01" ||
    code === "404" ||
    msg.includes("not found") ||
    msg.includes("does not exist") ||
    msg.includes("relation")
  );
}

/**
 * Lista templates de checklist do restaurante.
 * Se a tabela não existir no Core (404), devolve [] — API_ERROR_CONTRACT.
 */
export async function readShiftChecklistTemplates(
  restaurantId: string,
): Promise<ShiftChecklistTemplate[]> {
  // P0 FIX: Em Docker Core, retornar vazio para evitar 404 se a tabela não existir
  const isDocker =
    CONFIG.CORE_URL.includes("localhost") ||
    CONFIG.CORE_URL.includes("127.0.0.1") ||
    CONFIG.CORE_URL.includes("/rest") ||
    CONFIG.CORE_URL.includes("3001");
  if (isDocker) {
    return [];
  }

  const { data, error } = await dockerCoreClient
    .from("gm_shift_checklist_templates")
    .select(
      "id, restaurant_id, label, sort_order, kind, created_at, updated_at",
    )
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true })
    .order("kind", { ascending: true });

  if (error && !isTableUnavailableError(error)) {
    throw new Error(`readShiftChecklistTemplates: ${error.message}`);
  }
  if (error && isTableUnavailableError(error)) {
    return [];
  }
  return (data ?? []) as ShiftChecklistTemplate[];
}

/**
 * Lista conclusões do checklist para um turno.
 * Se a tabela não existir no Core (404), devolve [] — API_ERROR_CONTRACT.
 */
export async function readShiftChecklistCompletions(
  turnSessionId: string,
): Promise<ShiftChecklistCompletion[]> {
  // P0 FIX: Em Docker Core, retornar vazio para evitar 404
  const isDocker =
    CONFIG.CORE_URL.includes("localhost") ||
    CONFIG.CORE_URL.includes("127.0.0.1") ||
    CONFIG.CORE_URL.includes("/rest") ||
    CONFIG.CORE_URL.includes("3001");
  if (isDocker) {
    return [];
  }

  const { data, error } = await dockerCoreClient
    .from("gm_shift_checklist_completions")
    .select("id, turn_session_id, template_id, completed_at, completed_by")
    .eq("turn_session_id", turnSessionId);

  if (error && !isTableUnavailableError(error)) {
    throw new Error(`readShiftChecklistCompletions: ${error.message}`);
  }
  if (error && isTableUnavailableError(error)) {
    return [];
  }
  return (data ?? []) as ShiftChecklistCompletion[];
}
