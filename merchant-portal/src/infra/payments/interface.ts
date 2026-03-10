/**
 * Payment Provider Interface
 *
 * Interface comum para todos os providers de pagamento.
 * Permite trocar providers sem alterar a UI.
 */

import type {
  Currency,
  PaymentMethod,
  PaymentRegion,
} from "../../domain/payment/types";

/** Parâmetros para criar um pagamento */
export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  currency: Currency;
  restaurantId: string;
  description?: string;
  operatorId?: string;
  cashRegisterId?: string;
  returnUrl?: string;
}

/** Resultado de criação de pagamento */
export interface CreatePaymentResult {
  success: boolean;
  paymentId: string | null;
  checkoutId?: string;
  checkoutUrl?: string;
  qrCodeUrl?: string;
  clientSecret?: string;
  expiresAt?: string;
  error?: string;
}

/** Resultado de consulta de status */
export interface PaymentStatusResult {
  success: boolean;
  status: "pending" | "processing" | "completed" | "failed" | "expired";
  paymentId?: string;
  amount?: number;
  currency?: Currency;
  error?: string;
  raw?: unknown;
}

/** Resultado de cancelamento */
export interface CancelPaymentResult {
  success: boolean;
  error?: string;
}

/** Resultado de reembolso */
export interface RefundPaymentResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}

/**
 * Interface do Provider de Pagamento
 *
 * Cada provider (Stripe, SumUp, Pix, etc.) implementa esta interface.
 */
export interface PaymentProvider {
  /** Identificador do método */
  readonly id: PaymentMethod;

  /** Nome do provider para logs */
  readonly name: string;

  /** Regiões onde o provider está disponível */
  readonly supportedRegions: PaymentRegion[];

  /** Moedas suportadas */
  readonly supportedCurrencies: Currency[];

  /**
   * Cria um pagamento/checkout.
   * Retorna dados necessários para completar o pagamento (URL, QR, clientSecret, etc.)
   */
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;

  /**
   * Consulta o status de um pagamento.
   */
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResult>;

  /**
   * Cancela um pagamento pendente.
   */
  cancelPayment(paymentId: string): Promise<CancelPaymentResult>;

  /**
   * Reembolsa um pagamento completado.
   */
  refundPayment(
    paymentId: string,
    amount?: number,
  ): Promise<RefundPaymentResult>;

  /**
   * Verifica se o provider está disponível/configurado.
   */
  isAvailable(): boolean;
}

/**
 * Configuração de um provider
 */
export interface PaymentProviderConfig {
  enabled: boolean;
  apiKey?: string;
  merchantCode?: string;
  webhookSecret?: string;
}
