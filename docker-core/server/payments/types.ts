/**
 * Payment Provider Router — Domain Types
 *
 * Normalized types for payment intents, receipts, and errors across providers.
 * Provider: stripe (US/GB), sumup (ES), pix (BR).
 */

/** Supported payment providers */
export type Provider = "stripe" | "sumup" | "pix";

/** Payment method (normalized) */
export type PaymentMethod = "card" | "cash" | "pix";

/** Payment mode: POS (card present), online, manual */
export type PaymentMode = "pos" | "online" | "manual";

/** Supported country codes (BR, US, ES, GB) */
export type PaymentCountry = "BR" | "US" | "ES" | "GB";

/** Currency codes */
export type PaymentCurrency = "USD" | "GBP" | "EUR" | "BRL";

/** Payment intent status */
export type PaymentIntentStatus =
  | "created"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "expired";

/** Normalized payment intent */
export interface PaymentIntent {
  id: string;
  restaurant_id: string;
  order_id?: string | null;
  amount: number; // in cents
  currency: PaymentCurrency;
  provider: Provider;
  method: PaymentMethod;
  status: PaymentIntentStatus;
  provider_ref?: string | null;
  metadata?: Record<string, unknown>;
  /** Pix instructions when status=requires_action (manual assisted v1) */
  pix_instructions?: {
    qr_code?: string;
    copy_paste?: string;
    expires_at?: string;
  };
  created_at?: string;
}

/** Normalized payment receipt */
export interface PaymentReceipt {
  id: string;
  intent_id: string;
  provider: Provider;
  provider_ref: string;
  amount: number; // in cents
  currency: PaymentCurrency;
  captured_at: string; // ISO 8601
  raw?: Record<string, unknown>;
}

/** Normalized payment error */
export interface PaymentError {
  code: string;
  message: string;
  retryable: boolean;
  provider?: Provider;
  details?: Record<string, unknown>;
}
