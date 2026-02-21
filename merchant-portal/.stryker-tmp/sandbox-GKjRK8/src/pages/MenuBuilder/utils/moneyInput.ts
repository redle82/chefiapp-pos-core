/**
 * Helpers para input de preço (digitação livre, vírgula/ponto, sem setas).
 * Usado no Menu Builder e onde for necessário input monetário.
 */

export interface ParseMoneyResult {
  rawSanitized: string;
  valueNumber: number | null;
}

/**
 * Sanitiza a string para exibição: permite dígitos e no máximo um separador decimal (, ou .).
 */
function sanitizeMoneyRaw(raw: string): string {
  let seenSep = false;
  let out = "";
  for (const c of raw.trim()) {
    if (/\d/.test(c)) out += c;
    else if ((c === "," || c === ".") && !seenSep) {
      out += c;
      seenSep = true;
    }
  }
  if (seenSep) {
    const i = out.search(/[.,]/);
    if (i !== -1) {
      const before = out.slice(0, i + 1);
      const after = out
        .slice(i + 1)
        .replace(/\D/g, "")
        .slice(0, 2);
      out = before + after;
    }
  }
  return out;
}

/**
 * Parse do valor digitado. Aceita vírgula e ponto como decimal.
 * Retorna string sanitizada para exibir e número ou null se inválido.
 */
export function parseMoneyInput(raw: string): ParseMoneyResult {
  const rawSanitized = sanitizeMoneyRaw(raw);
  if (rawSanitized === "" || rawSanitized === "." || rawSanitized === ",") {
    return { rawSanitized, valueNumber: null };
  }
  const normalized = rawSanitized.replace(",", ".");
  const valueNumber = parseFloat(normalized);
  if (Number.isNaN(valueNumber)) return { rawSanitized, valueNumber: null };
  return { rawSanitized, valueNumber };
}

/**
 * Formata número (em euros) para exibição, ex.: 2.5 -> "2,50"
 */
export function formatMoney(valueNumber: number): string {
  if (Number.isNaN(valueNumber) || valueNumber < 0) return "0,00";
  const fixed = valueNumber.toFixed(2);
  return fixed.replace(".", ",");
}
