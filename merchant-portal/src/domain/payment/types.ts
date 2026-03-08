/**
 * Payment Domain Types
 *
 * Tipos finitos para o domínio de pagamentos.
 * Sem dependências de React ou infraestrutura.
 */

/** Métodos de pagamento suportados */
export type PaymentMethod =
  | "cash"
  | "card"
  | "mbway"
  | "pix"
  | "sumup_eur"
  | "loyalty";

/** Regiões de pagamento (determinam métodos disponíveis) */
export type PaymentRegion =
  | "BR"
  | "PT"
  | "ES"
  | "EU"
  | "US"
  | "GB"
  | "MX"
  | "CA"
  | "AU"
  | "DEFAULT";

/** Estados do fluxo de pagamento (FSM) */
export type PaymentStep =
  | "idle"
  | "creating"
  | "ready"
  | "polling"
  | "completed"
  | "failed"
  | "expired";

/** Estados específicos do fluxo Pix */
export type PixStep =
  | "idle"
  | "creating"
  | "qr-ready"
  | "polling"
  | "completed"
  | "expired";

/** Estados específicos do fluxo SumUp */
export type SumUpStep =
  | "idle"
  | "creating"
  | "redirect"
  | "polling"
  | "completed"
  | "failed";

/** Estados específicos do fluxo Card/Stripe */
export type CardStep = "idle" | "creating-intent" | "ready";

/** Moedas suportadas (aligned with CurrencyService) */
export type Currency = "BRL" | "EUR" | "USD" | "GBP" | "MXN" | "CAD" | "AUD";

/** Opção de método de pagamento para UI */
export interface PaymentMethodOption {
  id: PaymentMethod;
  labelKey: string;
  descKey: string;
  icon: string;
}

/** Estado consolidado do pagamento */
export interface PaymentState {
  method: PaymentMethod | null;
  step: PaymentStep;
  processing: boolean;
  error: string | null;
  tipCents: number;
  grandTotal: number;
}

/** Resultado de criação de checkout */
export interface CheckoutResult {
  success: boolean;
  checkoutId: string | null;
  checkoutUrl: string | null;
  qrCodeUrl: string | null;
  error: string | null;
}

/** Parâmetros para criar um pagamento */
export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  currency: Currency;
  restaurantId: string;
  description?: string;
}

/** Resultado de confirmação de pagamento */
export interface PaymentConfirmResult {
  success: boolean;
  paymentId: string | null;
  error: string | null;
}
