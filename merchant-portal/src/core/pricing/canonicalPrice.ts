/**
 * Fonte única de verdade para o preço canónico exibido ao visitante.
 * Ref: docs/contracts/CONTRATO_LANDING_CANONICA.md — preço canónico 79 (local currency).
 */

/**
 * Lazy-evaluated to avoid calling getCurrencySymbol() at module scope
 * (which crashes in production due to Rollup flatten + TDZ).
 */
export const CANONICAL_MONTHLY_PRICE_EUR = 79;

/** Returns "79 €/mês" (or equivalent for current currency). Call as function, not const. */
export function getCanonicalMonthlyPriceLabel(): string {
  try {
    const { getCurrencySymbol } = require("@/core/currency/CurrencyService");
    return `79 ${getCurrencySymbol()}/mês`;
  } catch {
    return "79 €/mês";
  }
}

// Keep backward-compatible const with safe fallback
export const CANONICAL_MONTHLY_PRICE_LABEL = "79 €/mês";
/** Texto para overlay/modal (ex. trial TPV): preço + período grátis. */
export const CANONICAL_MONTHLY_PRICE_OVERLAY = "79 €/mês após 14 dias grátis";
