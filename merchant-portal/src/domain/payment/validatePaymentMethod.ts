/**
 * Payment Method Validation Functions
 *
 * Funções puras para validação de métodos de pagamento.
 * Sem dependências de React ou infraestrutura.
 */

import type {
  CardStep,
  PaymentMethod,
  PixStep,
  SumUpStep,
} from "./types";

/**
 * Valida número de telefone MB Way (Portugal).
 * Formato: 9 dígitos começando com 9.
 *
 * @param phone - Número de telefone
 * @returns true se válido
 */
export function validateMBWayPhone(phone: string): boolean {
  return /^9\d{8}$/.test(phone);
}

/**
 * Valida se pode confirmar pagamento baseado no método e estado atual.
 *
 * @param method - Método de pagamento selecionado
 * @param cashCents - Valor em dinheiro entregue (para cash)
 * @param orderTotal - Total do pedido
 * @param mbwayPhone - Telefone MB Way
 * @param isTrialMode - Se está em modo trial
 * @param pixStep - Estado do fluxo Pix
 * @param sumupStep - Estado do fluxo SumUp
 * @param processing - Se está processando
 * @returns true se pode confirmar
 */
export function canConfirmPayment(
  method: PaymentMethod | null,
  cashCents: number,
  orderTotal: number,
  mbwayPhone: string,
  isTrialMode: boolean,
  pixStep: PixStep,
  sumupStep: SumUpStep,
  processing: boolean,
): boolean {
  if (!method || processing) return false;

  switch (method) {
    case "cash":
      return cashCents >= orderTotal;
    case "mbway":
      return validateMBWayPhone(mbwayPhone);
    case "card":
      return isTrialMode === true;
    case "pix":
      return pixStep === "idle";
    case "sumup_eur":
      return sumupStep === "idle" || sumupStep === "failed";
    default:
      return true;
  }
}

/**
 * Verifica se o método de pagamento requer Stripe.
 *
 * @param method - Método de pagamento
 * @returns true se requer Stripe
 */
export function requiresStripe(method: PaymentMethod | null): boolean {
  return method === "card";
}

/**
 * Verifica se o método de pagamento requer QR Code.
 *
 * @param method - Método de pagamento
 * @returns true se requer QR Code
 */
export function requiresQRCode(method: PaymentMethod | null): boolean {
  return method === "pix";
}

/**
 * Verifica se o método de pagamento requer redirect externo.
 *
 * @param method - Método de pagamento
 * @returns true se requer redirect
 */
export function requiresExternalRedirect(method: PaymentMethod | null): boolean {
  return method === "sumup_eur";
}

/**
 * Verifica se o fluxo de pagamento está em estado terminal.
 *
 * @param pixStep - Estado do fluxo Pix
 * @param sumupStep - Estado do fluxo SumUp
 * @param cardStep - Estado do fluxo Card
 * @returns true se está em estado terminal
 */
export function isPaymentTerminal(
  pixStep: PixStep,
  sumupStep: SumUpStep,
  cardStep: CardStep,
): boolean {
  return (
    pixStep === "completed" ||
    pixStep === "expired" ||
    sumupStep === "completed" ||
    sumupStep === "failed" ||
    cardStep === "ready"
  );
}

/**
 * Determina se deve mostrar o botão de confirmar.
 *
 * @param method - Método de pagamento
 * @param cardStep - Estado do fluxo Card
 * @param isTrialMode - Se está em modo trial
 * @returns true se deve mostrar botão
 */
export function shouldShowConfirmButton(
  method: PaymentMethod | null,
  cardStep: CardStep,
  isTrialMode: boolean,
): boolean {
  if (!method) return false;
  if (method === "card" && !isTrialMode && cardStep === "ready") {
    return false;
  }
  return true;
}
