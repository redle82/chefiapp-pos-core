/**
 * Tipos de domínio para relatórios do ChefIApp.
 *
 * Estes tipos são intencionalmente agnósticos de país, com campos
 * de extensão para regras específicas de PT/ES quando necessário.
 */

import type { Currency } from "../../domain/payment/types";

/** @deprecated Use Currency from domain/payment/types directly */
export type CurrencyCode = Currency | string;

export type PaymentMethod =
  | "cash"
  | "card"
  | "pix"
  | "mixed"
  | "voucher"
  | "other"
  | string;

export interface TimeRange {
  from: number; // epoch millis (inclusive)
  to: number; // epoch millis (exclusive)
}

// ─────────────────────────────────────────────────────────────
// SALES SUMMARY
// ─────────────────────────────────────────────────────────────

export interface SalesSummary {
  restaurantId: string;
  period: TimeRange;
  currency: CurrencyCode;

  ordersCount: number;
  cancelledOrdersCount: number;

  grossTotalCents: number;
  netTotalCents?: number;
  taxTotalCents?: number;

  paymentsByMethod: Record<PaymentMethod, number>;

  averageTicketCents: number;
}

// ─────────────────────────────────────────────────────────────
// OPERATIONAL ACTIVITY
// ─────────────────────────────────────────────────────────────

/**
 * Bucket de atividade por hora.
 *
 * Ex.: key "2026-02-05T14:00:00.000Z" representa o intervalo [14:00, 15:00).
 */
export interface OperationalActivityBucket {
  bucketStart: number; // epoch millis
  bucketLabel: string; // para gráficos (ex.: "14:00")

  ordersOpened: number;
  ordersClosed: number;
  ordersCancelled: number;

  /**
   * Duração média das contas fechadas neste bucket (em segundos).
   * A duração é calculada com base em createdAt -> completedAt/paidAt.
   */
  averageDurationSeconds: number | null;
}

export interface OperationalActivity {
  restaurantId: string;
  period: TimeRange;
  buckets: OperationalActivityBucket[];
}

// ─────────────────────────────────────────────────────────────
// CANCELLATION STATS
// ─────────────────────────────────────────────────────────────

export interface CancellationStatsBreakdown {
  totalCancelledOrders: number;
  /**
   * Para v1, só distinguimos "simples" vs "outros".
   * Em versões futuras, podemos expandir para:
   * - before_kitchen
   * - after_kitchen
   * - after_billing
   */
  simpleCancellations: number;
  otherCancellations: number;
}

export interface CancellationStats {
  restaurantId: string;
  period: TimeRange;
  breakdown: CancellationStatsBreakdown;
}

// ─────────────────────────────────────────────────────────────
// GAMIFICATION IMPACT
// ─────────────────────────────────────────────────────────────

export interface GamificationImpactPoint {
  /**
   * Início da janela (ex.: dia) que está sendo comparada.
   */
  windowStart: number;
  windowLabel: string; // ex.: "Antes", "Depois", "Dia 1", ...

  ordersCount: number;
  averageTicketCents: number;
}

export interface GamificationImpact {
  restaurantId: string;
  /**
   * Identificador da campanha/missão (quando aplicável).
   */
  campaignId?: string;
  metricWindow: TimeRange;
  points: GamificationImpactPoint[];
}
