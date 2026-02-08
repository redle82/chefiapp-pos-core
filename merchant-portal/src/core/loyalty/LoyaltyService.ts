/**
 * LoyaltyService - Serviço para gerenciar programa de fidelidade
 *
 * PURE DOCKER MODE (FASE 1):
 * - Remove dependência direta de Supabase.
 * - Mantém o contrato de tipos e métodos públicos.
 * - As operações ainda não estão ligadas ao Core Docker e retornam
 *   valores seguros/dummy, sempre marcando [CORE TODO][Loyalty] no console.
 *
 * FUTURO:
 * - Implementar chamadas reais ao Core (PostgREST/RPC) sem reintroduzir
 *   supabase-js neste módulo.
 */

export interface LoyaltyCard {
  id: string;
  restaurant_id: string;
  customer_id?: string;
  card_type: "physical" | "digital";
  current_tier: "silver" | "gold" | "platinum";
  current_points: number;
  points_earned: number;
  points_redeemed: number;
  status: "active" | "suspended" | "expired";
  created_at: string;
  tier_upgraded_at?: string;
  expires_at?: string;
}

export interface LoyaltyTierConfig {
  id: string;
  restaurant_id: string;
  points_per_euro: number;
  silver_threshold: number;
  gold_threshold: number;
  platinum_threshold: number;
}

export class LoyaltyService {
  /**
   * Buscar ou criar cartão de fidelidade
   */
  static async findOrCreateCard(
    restaurantId: string,
    customerId?: string,
    phone?: string,
    email?: string,
  ): Promise<LoyaltyCard> {
    console.warn(
      "[CORE TODO][Loyalty] findOrCreateCard ainda não está ligado ao Core. Retornando cartão dummy.",
      {
        restaurantId,
        customerId,
        phone,
        email,
      },
    );

    const now = new Date().toISOString();
    return {
      id: "CORETODO-LOYALTY-CARD",
      restaurant_id: restaurantId,
      customer_id: customerId,
      card_type: "digital",
      current_tier: "silver",
      current_points: 0,
      points_earned: 0,
      points_redeemed: 0,
      status: "active",
      created_at: now,
      tier_upgraded_at: undefined,
      expires_at: undefined,
    };
  }

  /**
   * Obter configuração de tiers
   */
  static async getTierConfig(restaurantId: string): Promise<LoyaltyTierConfig> {
    console.warn(
      "[CORE TODO][Loyalty] getTierConfig ainda não está ligado ao Core. Retornando configuração padrão.",
      { restaurantId },
    );

    return {
      id: "CORETODO-TIER-CONFIG",
      restaurant_id: restaurantId,
      points_per_euro: 1,
      silver_threshold: 0,
      gold_threshold: 100,
      platinum_threshold: 500,
    };
  }

  /**
   * Adicionar pontos após pedido
   */
  static async awardPointsForOrder(
    restaurantId: string,
    orderId: string,
    orderTotalCents: number,
    customerId?: string,
    phone?: string,
    email?: string,
  ): Promise<{ pointsAwarded: number; newTotal: number; tier: string }> {
    console.warn(
      "[CORE TODO][Loyalty] awardPointsForOrder ainda não está ligado ao Core. Calculando pontos apenas em memória.",
      { restaurantId, orderId, orderTotalCents, customerId },
    );

    const config = await this.getTierConfig(restaurantId);
    const orderTotalEuros = orderTotalCents / 100;
    const pointsEarned = Math.floor(orderTotalEuros * config.points_per_euro);

    // Como não persistimos, assumimos que o novo total é apenas os pontos desta compra
    const newPoints = pointsEarned;
    const tier = this.calculateTier(newPoints, config);

    return {
      pointsAwarded: pointsEarned,
      newTotal: newPoints,
      tier,
    };
  }

  /**
   * Calcular tier baseado em pontos
   */
  private static calculateTier(
    points: number,
    config: LoyaltyTierConfig,
  ): "silver" | "gold" | "platinum" {
    if (points >= config.platinum_threshold) return "platinum";
    if (points >= config.gold_threshold) return "gold";
    return "silver";
  }

  /**
   * Obter cartão do cliente
   */
  static async getCustomerCard(
    restaurantId: string,
    customerId: string,
  ): Promise<LoyaltyCard | null> {
    console.warn(
      "[CORE TODO][Loyalty] getCustomerCard ainda não está ligado ao Core. Retornando null.",
      { restaurantId, customerId },
    );
    return null;
  }

  /**
   * Get available rewards for a restaurant
   */
  static async getAvailableRewards(restaurantId: string): Promise<any[]> {
    console.warn(
      "[CORE TODO][Loyalty] getAvailableRewards ainda não está ligado ao Core. Retornando lista vazia.",
      { restaurantId },
    );
    return [];
  }

  /**
   * Redeem points for a reward
   */
  static async redeemPoints(
    restaurantId: string,
    customerId: string,
    rewardId: string,
    pointsCost: number,
    orderId?: string,
  ): Promise<{ success: boolean; redemptionId?: string; error?: string }> {
    console.warn(
      "[CORE TODO][Loyalty] redeemPoints ainda não está ligado ao Core. Operação de resgate desabilitada no modo TODO.",
      { restaurantId, customerId, rewardId, pointsCost, orderId },
    );

    return {
      success: false,
      error: "Programa de fidelidade ainda não está ativado neste ambiente.",
    };
  }
}
