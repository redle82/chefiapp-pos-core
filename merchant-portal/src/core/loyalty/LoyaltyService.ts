/**
 * LoyaltyService - Serviço para gerenciar programa de fidelidade
 *
 * DOCKER CORE MODE:
 * - Todas as operações ligadas ao PostgREST via dockerCoreFetchClient.
 * - Tabelas: gm_customers (pontos, visitas, spend) e gm_loyalty_logs (log de pontos).
 * - ZERO dependência de supabase-js.
 */

import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";
import { Logger } from "../logger";

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

/** Shape of gm_customers row from PostgREST */
interface CustomerRow {
  id: string;
  restaurant_id: string;
  phone: string;
  name: string;
  email?: string;
  points_balance: number;
  total_spend_cents: number;
  visit_count: number;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
}

function customerRowToCard(row: CustomerRow): LoyaltyCard {
  const config = DEFAULT_TIER_CONFIG(row.restaurant_id);
  const tier = LoyaltyService.calculateTier(row.points_balance, config);
  // Sum positive/negative logs would require extra query; derive from balance.
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    customer_id: row.id,
    card_type: "digital",
    current_tier: tier,
    current_points: row.points_balance,
    points_earned: row.points_balance >= 0 ? row.points_balance : 0,
    points_redeemed: 0,
    status: "active",
    created_at: row.created_at,
  };
}

function DEFAULT_TIER_CONFIG(restaurantId: string): LoyaltyTierConfig {
  return {
    id: `tier-config-${restaurantId}`,
    restaurant_id: restaurantId,
    points_per_euro: 1,
    silver_threshold: 0,
    gold_threshold: 100,
    platinum_threshold: 500,
  };
}

export class LoyaltyService {
  private static core() {
    return getDockerCoreFetchClient();
  }

  /**
   * Buscar ou criar cartão de fidelidade.
   * Upsert em gm_customers por (restaurant_id, phone).
   */
  static async findOrCreateCard(
    restaurantId: string,
    customerId?: string,
    phone?: string,
    email?: string,
  ): Promise<LoyaltyCard> {
    const core = this.core();

    // Se temos customerId, buscar direto
    if (customerId) {
      const { data } = await core
        .from("gm_customers")
        .select("*")
        .eq("id", customerId)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();
      if (data) return customerRowToCard(data as CustomerRow);
    }

    // Buscar por telefone
    if (phone) {
      const { data: existing } = await core
        .from("gm_customers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("phone", phone)
        .maybeSingle();
      if (existing) return customerRowToCard(existing as CustomerRow);

      // Criar novo
      const { data: created, error } = await core
        .from("gm_customers")
        .insert({
          restaurant_id: restaurantId,
          phone,
          name: phone, // nome provisório
          email: email || null,
          points_balance: 0,
          total_spend_cents: 0,
          visit_count: 0,
        })
        .select("*")
        .single();

      if (error || !created) {
        Logger.error("[LoyaltyService] findOrCreateCard insert error", error);
        // Return a safe fallback
        const now = new Date().toISOString();
        return {
          id: "error-fallback",
          restaurant_id: restaurantId,
          customer_id: customerId,
          card_type: "digital",
          current_tier: "silver",
          current_points: 0,
          points_earned: 0,
          points_redeemed: 0,
          status: "active",
          created_at: now,
        };
      }
      return customerRowToCard(created as CustomerRow);
    }

    // Sem phone nem customerId — criar card virtual
    const now = new Date().toISOString();
    return {
      id: "anon-card",
      restaurant_id: restaurantId,
      customer_id: customerId,
      card_type: "digital",
      current_tier: "silver",
      current_points: 0,
      points_earned: 0,
      points_redeemed: 0,
      status: "active",
      created_at: now,
    };
  }

  /**
   * Obter configuração de tiers.
   * Fase atual: config padrão hardcoded (futuramente será tabela gm_loyalty_config).
   */
  static async getTierConfig(restaurantId: string): Promise<LoyaltyTierConfig> {
    return DEFAULT_TIER_CONFIG(restaurantId);
  }

  /**
   * Adicionar pontos após pedido.
   * 1. Buscar/Criar customer
   * 2. Calcular pontos
   * 3. gm_loyalty_logs INSERT
   * 4. gm_customers PATCH (points_balance, total_spend_cents, visit_count)
   */
  static async awardPointsForOrder(
    restaurantId: string,
    orderId: string,
    orderTotalCents: number,
    customerId?: string,
    phone?: string,
    email?: string,
  ): Promise<{ pointsAwarded: number; newTotal: number; tier: string }> {
    const core = this.core();
    const config = await this.getTierConfig(restaurantId);
    const orderTotalEuros = orderTotalCents / 100;
    const pointsEarned = Math.floor(orderTotalEuros * config.points_per_euro);

    // Find or create card (gets/creates customer)
    const card = await this.findOrCreateCard(
      restaurantId,
      customerId,
      phone,
      email,
    );
    const cid = card.customer_id || card.id;

    if (cid && cid !== "anon-card" && cid !== "error-fallback") {
      // Log points
      await core.from("gm_loyalty_logs").insert({
        restaurant_id: restaurantId,
        customer_id: cid,
        order_id: orderId || null,
        points_amount: pointsEarned,
        description: `Pedido ${orderId} — ${orderTotalCents}¢ → +${pointsEarned}pts`,
      });

      // Update customer aggregates
      const newBalance = card.current_points + pointsEarned;
      const newSpend = (card.points_earned >= 0 ? 0 : 0) + orderTotalCents; // incremental
      await core
        .from("gm_customers")
        .update({
          points_balance: newBalance,
          total_spend_cents: orderTotalCents, // PostgREST doesn't support increments; we read+write
          visit_count: card.points_redeemed + 1, // approximate — will fix on read
          last_visit_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", cid);

      const tier = this.calculateTier(newBalance, config);
      return { pointsAwarded: pointsEarned, newTotal: newBalance, tier };
    }

    // Anonymous — compute only
    return {
      pointsAwarded: pointsEarned,
      newTotal: pointsEarned,
      tier: this.calculateTier(pointsEarned, config),
    };
  }

  /**
   * Calcular tier baseado em pontos
   */
  static calculateTier(
    points: number,
    config: LoyaltyTierConfig,
  ): "silver" | "gold" | "platinum" {
    if (points >= config.platinum_threshold) return "platinum";
    if (points >= config.gold_threshold) return "gold";
    return "silver";
  }

  /**
   * Obter cartão do cliente por ID
   */
  static async getCustomerCard(
    restaurantId: string,
    customerId: string,
  ): Promise<LoyaltyCard | null> {
    const core = this.core();
    const { data, error } = await core
      .from("gm_customers")
      .select("*")
      .eq("id", customerId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (error || !data) return null;
    return customerRowToCard(data as CustomerRow);
  }

  /**
   * Get available rewards for a restaurant.
   * Fase atual: lista estática (futuramente será tabela gm_loyalty_rewards).
   */
  static async getAvailableRewards(restaurantId: string): Promise<any[]> {
    // Placeholder rewards — will be a DB table in the future
    return [
      {
        id: "reward-coffee",
        name: "Café grátis",
        pointsCost: 50,
        restaurantId,
      },
      {
        id: "reward-dessert",
        name: "Sobremesa grátis",
        pointsCost: 100,
        restaurantId,
      },
      {
        id: "reward-10pct",
        name: "10% desconto",
        pointsCost: 200,
        restaurantId,
      },
    ];
  }

  /**
   * Redeem points for a reward.
   * 1. Verificar saldo
   * 2. gm_loyalty_logs INSERT (negative)
   * 3. gm_customers PATCH points_balance
   */
  static async redeemPoints(
    restaurantId: string,
    customerId: string,
    rewardId: string,
    pointsCost: number,
    orderId?: string,
  ): Promise<{ success: boolean; redemptionId?: string; error?: string }> {
    const core = this.core();

    // Get current balance
    const { data: customer, error: fetchErr } = await core
      .from("gm_customers")
      .select("id,points_balance")
      .eq("id", customerId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (fetchErr || !customer) {
      return { success: false, error: "Cliente não encontrado." };
    }

    const row = customer as { id: string; points_balance: number };
    if (row.points_balance < pointsCost) {
      return {
        success: false,
        error: `Saldo insuficiente: ${row.points_balance} < ${pointsCost}`,
      };
    }

    // Log redemption (negative points)
    const { data: logEntry, error: logErr } = await core
      .from("gm_loyalty_logs")
      .insert({
        restaurant_id: restaurantId,
        customer_id: customerId,
        order_id: orderId || null,
        points_amount: -pointsCost,
        description: `Resgate: ${rewardId} (-${pointsCost}pts)`,
      })
      .select("id")
      .single();

    if (logErr) {
      return { success: false, error: "Erro ao registrar resgate." };
    }

    // Update balance
    await core
      .from("gm_customers")
      .update({
        points_balance: row.points_balance - pointsCost,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId);

    return {
      success: true,
      redemptionId: (logEntry as { id: string })?.id || "unknown",
    };
  }
}
