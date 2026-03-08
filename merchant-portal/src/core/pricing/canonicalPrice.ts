/**
 * Fonte única de verdade para o preço canónico exibido ao visitante.
 * Ref: docs/contracts/CONTRATO_LANDING_CANONICA.md — preço canónico 79 (local currency).
 */

import { getCurrencySymbol } from "@/core/currency/CurrencyService";

export const CANONICAL_MONTHLY_PRICE_EUR = 79;
export const CANONICAL_MONTHLY_PRICE_LABEL = `79 ${getCurrencySymbol()}/mês`;
/** Texto para overlay/modal (ex. trial TPV): preço + período grátis. */
export const CANONICAL_MONTHLY_PRICE_OVERLAY = `79 ${getCurrencySymbol()}/mês após 14 dias grátis`;
