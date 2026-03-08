/**
 * Menu Domain Validation
 *
 * Funções puras para validação de menu.
 * Sem dependências de React ou infraestrutura.
 */

import type { MenuItemInput } from "./types";

export interface MenuValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valida um item do menu para criação/atualização.
 */
export function validateMenuItemInput(
  item: MenuItemInput,
): MenuValidationResult {
  const errors: string[] = [];

  if (!item.name || item.name.trim().length === 0) {
    errors.push("Nome é obrigatório");
  }

  if (item.price_cents < 0) {
    errors.push("Preço deve ser maior ou igual a zero");
  }

  if (!item.station || (item.station !== "BAR" && item.station !== "KITCHEN")) {
    errors.push("Estação é obrigatória (BAR ou KITCHEN)");
  }

  if (!item.prep_time_minutes || item.prep_time_minutes <= 0) {
    errors.push("Tempo de preparo é obrigatório e deve ser maior que zero");
  }

  if (item.prep_time_minutes && item.prep_time_minutes > 60) {
    errors.push("Tempo de preparo não pode ser maior que 60 minutos");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Converte prep_time_minutes para prep_time_seconds (regra pura).
 */
export function prepMinutesToSeconds(minutes: number): number {
  return Math.round(minutes * 60);
}
