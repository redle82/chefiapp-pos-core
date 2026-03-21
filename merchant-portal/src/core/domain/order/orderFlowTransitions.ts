/**
 * FASE 1 — Contrato de transições de estado do pedido (FLUXO_DE_PEDIDO_OPERACIONAL).
 *
 * Matriz canónica TPV → KDS. O Core (RPC update_order_status) rejeita transições
 * inválidas; esta é a fonte única de verdade para a aplicação.
 *
 * Relação com orderStatusHelpers: orderStatusHelpers tem isValidStatusTransition
 * com matriz diferente (inclui PREPARING, mais transições). Esse é UI/legacy.
 * Este módulo é o contrato Core — use isAllowedTransition antes de chamar update_order_status.
 */

export const VALID_STATUSES = [
  "OPEN",
  "IN_PREP",
  "READY",
  "CLOSED",
  "CANCELLED",
] as const;

export type OrderFlowStatus = (typeof VALID_STATUSES)[number];

/** Transições permitidas no fluxo canónico TPV → KDS (Fase 1). */
export const ALLOWED_TRANSITIONS: Record<OrderFlowStatus, OrderFlowStatus[]> = {
  OPEN: ["IN_PREP", "CANCELLED"],
  IN_PREP: ["READY", "CANCELLED"],
  READY: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

/**
 * Verifica se uma transição de status é permitida (contrato Core).
 */
export function isAllowedTransition(
  from: OrderFlowStatus,
  to: OrderFlowStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
