/**
 * ShiftChecklistWriter — Marcar/desmarcar itens do checklist de turno.
 */

/**
 * Marca item do checklist como concluído (stub até existir tabela no Core).
 */
export async function completeShiftChecklistItem(
  _sessionId: string,
  _templateId: string,
  _itemId: string,
  _userId?: string | null
): Promise<void> {}

/**
 * Desmarca item do checklist (stub até existir tabela no Core).
 */
export async function uncompleteShiftChecklistItem(
  _sessionId: string,
  _templateId: string,
  _itemId: string
): Promise<void> {}
