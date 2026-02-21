/**
 * ShiftChecklistReader — Leitura de checklist de turno (sessão ativa, templates, conclusões).
 */
// @ts-nocheck


const STORAGE_KEY_TURN_SESSION = "chefiapp_active_turn_session_id";

export interface ShiftChecklistTemplate {
  id: string;
  restaurant_id: string;
  name: string;
  items?: { id: string; label: string; order?: number }[];
  created_at?: string;
}

export interface ShiftChecklistCompletion {
  id: string;
  template_id: string;
  item_id: string;
  session_id: string;
  completed_at: string;
  completed_by?: string | null;
}

/**
 * ID da sessão de turno ativa (localStorage). Usado para filtrar tarefas/checklist por turno.
 */
export function getActiveTurnSessionIdFromStorage(): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY_TURN_SESSION);
  } catch {
    return null;
  }
}

/**
 * Templates de checklist de turno (stub: vazio até existir tabela no Core).
 */
export async function readShiftChecklistTemplates(
  _restaurantId: string
): Promise<ShiftChecklistTemplate[]> {
  return [];
}

/**
 * Conclusões de checklist por sessão de turno (stub: vazio até existir tabela no Core).
 */
export async function readShiftChecklistCompletions(
  _sessionId: string
): Promise<ShiftChecklistCompletion[]> {
  return [];
}
