/**
 * Módulo de Promoções — tipos base.
 * Preparado para integração futura com engine de fidelidade, gm_orders e gm_customers.
 */
// @ts-nocheck


export type DiscountType = "PERCENTAGE" | "FIXED";

export type PromotionChannel = "WEB" | "QR" | "DELIVERY";

export interface LoyaltyConfig {
  /** Pontos ganhos por cada euro gasto. */
  pointsPerEuro: number;
  /** Pontos fixos atribuídos por cada conta/mesa fechada. */
  pointsPerOrder: number;
}

export interface Discount {
  id: string;
  name: string;
  description?: string;
  type: DiscountType;
  /** Valor do desconto — percentual (0–100) ou valor absoluto em EUR, dependendo de `type`. */
  value: number;
  active: boolean;
}

export interface AutoPromotion {
  id: string;
  channel: PromotionChannel;
  /** Identificador do desconto associado a este canal. */
  discountId: string;
}

/** Payload para criação/edição de desconto via UI. */
export interface NewDiscountInput {
  id?: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  active?: boolean;
}

