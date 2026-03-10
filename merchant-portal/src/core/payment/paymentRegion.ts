/**
 * Região de pagamento por moeda:
 * - Brasil (BRL) → PIX + idioma pt-BR
 * - Europa (EUR) → SumUp
 * - Resto do mundo → Stripe
 */

import type { PaymentMethod } from "../../domain/payment/types";
import type { CurrencyCode } from "../currency/CurrencyService";

export type PaymentRegion = "br" | "europe" | "rest";

/**
 * Região de pagamento a partir da moeda do restaurante.
 * Brasil = PIX; Europa (EUR) = SumUp; Resto = Stripe.
 */
export function getPaymentRegion(currency: CurrencyCode): PaymentRegion {
  if (currency === "BRL") return "br";
  if (currency === "EUR") return "europe";
  return "rest";
}

/**
 * IDs dos métodos de pagamento disponíveis por região.
 * Dinheiro (cash) sempre disponível; depois: br = PIX, europe = SumUp, rest = Stripe (card).
 */
export function getPaymentMethodIdsForRegion(
  region: PaymentRegion,
): PaymentMethod[] {
  switch (region) {
    case "br":
      return ["cash", "pix"];
    case "europe":
      return ["cash", "sumup_eur"];
    case "rest":
      return ["cash", "card"];
    default:
      return ["cash", "card"];
  }
}
