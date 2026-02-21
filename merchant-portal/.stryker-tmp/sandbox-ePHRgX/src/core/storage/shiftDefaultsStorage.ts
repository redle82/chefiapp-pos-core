/**
 * shiftDefaultsStorage — Valor padrão sugerido para abertura de turnos (onboarding Tela 4).
 *
 * Regra-mãe: Configuração define padrões. Tela 4 persiste; Tela 8 (ritual) pré-preenche com este valor.
 * Chave: chefiapp_shift_default_opening_cents_${restaurantId}
 * Valor: cêntimos (number).
 */
// @ts-nocheck


const PREFIX = "chefiapp_shift_default_opening_cents_";

function key(restaurantId: string): string {
  return `${PREFIX}${restaurantId}`;
}

export function getDefaultOpeningCashCents(
  restaurantId: string | null
): number | null {
  if (!restaurantId || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(restaurantId));
    if (raw === null) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) || n < 0 ? null : n;
  } catch {
    return null;
  }
}

export function setDefaultOpeningCashCents(
  restaurantId: string | null,
  cents: number
): void {
  if (!restaurantId || typeof localStorage === "undefined") return;
  try {
    const value = Math.max(0, Math.round(cents));
    localStorage.setItem(key(restaurantId), String(value));
  } catch {
    // ignore
  }
}
