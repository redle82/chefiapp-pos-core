/**
 * Shift Domain Helpers
 *
 * Funções puras para regras de turnos.
 * Sem dependências de React ou infraestrutura.
 */

import type { Shift, ShiftStatus } from "./types";

/**
 * Verifica se o turno está ativo (não cancelado).
 */
export function isShiftActive(shift: Shift): boolean {
  return shift.status !== "CANCELLED";
}

/**
 * Verifica se o turno está confirmado.
 */
export function isShiftConfirmed(shift: Shift): boolean {
  return shift.status === "CONFIRMED";
}

/**
 * Verifica se um dado momento está dentro do intervalo do turno.
 *
 * @param shift - Turno
 * @param at - Data/hora em ISO (opcional; default = agora)
 */
export function isShiftInProgress(
  shift: Shift,
  at: string = new Date().toISOString(),
): boolean {
  if (!isShiftActive(shift)) return false;
  const t = new Date(at).getTime();
  const start = new Date(shift.start_time).getTime();
  const end = new Date(shift.end_time).getTime();
  return t >= start && t <= end;
}

/**
 * Verifica se o turno já terminou.
 */
export function isShiftEnded(shift: Shift, at?: string): boolean {
  const t = at ? new Date(at).getTime() : Date.now();
  return new Date(shift.end_time).getTime() < t;
}

/**
 * Verifica se uma transição de status do turno é válida.
 */
export function isValidShiftStatusTransition(
  from: ShiftStatus,
  to: ShiftStatus,
): boolean {
  if (from === to) return true;
  const allowed: Record<ShiftStatus, ShiftStatus[]> = {
    SCHEDULED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CANCELLED"],
    CANCELLED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

/**
 * Duração do turno em minutos.
 */
export function shiftDurationMinutes(shift: Shift): number {
  const start = new Date(shift.start_time).getTime();
  const end = new Date(shift.end_time).getTime();
  return Math.round((end - start) / (60 * 1000));
}
