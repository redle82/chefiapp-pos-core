/**
 * Loyalty Points Service — Earn, redeem, and manage loyalty points.
 */
import { getDockerCoreFetchClient } from "../../infra/dockerCoreFetchClient";

export type PointTransactionType = "EARN" | "REDEEM" | "EXPIRE" | "BONUS" | "REFUND_ADJUST";

export interface LoyaltyProgramConfig {
  enabled: boolean;
  earnRatio: number;
  redemptionValue: number;
  minRedeemBalance: number;
  maxRedeemPercentage: number;
  pointsExpireDays: number;
  welcomeBonus: number;
  birthdayBonus: number;
}

export interface PointTransaction {
  id: string;
  customer_id: string;
  restaurant_id: string;
  type: PointTransactionType;
  points: number;
  order_id?: string;
  description: string;
  created_at: string;
}

export interface LoyaltyBalance {
  customerId: string;
  totalEarned: number;
  totalRedeemed: number;
  totalExpired: number;
  currentBalance: number;
}

const DEFAULT_CONFIG: LoyaltyProgramConfig = {
  enabled: false,
  earnRatio: 1,
  redemptionValue: 1,
  minRedeemBalance: 100,
  maxRedeemPercentage: 50,
  pointsExpireDays: 365,
  welcomeBonus: 50,
  birthdayBonus: 100,
};

const CONFIG_KEY = "chefiapp_loyalty_config";

export function getProgramConfig(restaurantId: string): LoyaltyProgramConfig {
  try {
    const stored = localStorage.getItem(`${CONFIG_KEY}_${restaurantId}`);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function configureProgram(restaurantId: string, config: Partial<LoyaltyProgramConfig>): void {
  const current = getProgramConfig(restaurantId);
  localStorage.setItem(`${CONFIG_KEY}_${restaurantId}`, JSON.stringify({ ...current, ...config }));
}

export async function earnPoints(
  customerId: string,
  restaurantId: string,
  orderId: string,
  amountCents: number
): Promise<number> {
  const config = getProgramConfig(restaurantId);
  if (!config.enabled) return 0;
  const points = Math.floor((amountCents / 100) * config.earnRatio);
  if (points <= 0) return 0;

  try {
    const db = await getDockerCoreFetchClient();
    await db.from("gm_loyalty_points").insert({
      customer_id: customerId,
      restaurant_id: restaurantId,
      type: "EARN",
      points,
      order_id: orderId,
      description: `Earned from order`,
    });
  } catch { /* fire and forget */ }
  return points;
}

export async function redeemPoints(
  customerId: string,
  restaurantId: string,
  points: number,
  orderId: string
): Promise<{ success: boolean; discountCents: number }> {
  const config = getProgramConfig(restaurantId);
  const balance = await getBalance(customerId, restaurantId);

  if (balance.currentBalance < points || points < config.minRedeemBalance) {
    return { success: false, discountCents: 0 };
  }

  const discountCents = points * config.redemptionValue;

  try {
    const db = await getDockerCoreFetchClient();
    await db.from("gm_loyalty_points").insert({
      customer_id: customerId,
      restaurant_id: restaurantId,
      type: "REDEEM",
      points: -points,
      order_id: orderId,
      description: `Redeemed for €${(discountCents / 100).toFixed(2)} discount`,
    });
  } catch {
    return { success: false, discountCents: 0 };
  }

  return { success: true, discountCents };
}

export async function getBalance(customerId: string, restaurantId: string): Promise<LoyaltyBalance> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_loyalty_points")
      .select("type, points")
      .eq("customer_id", customerId)
      .eq("restaurant_id", restaurantId);

    const txns = (data || []) as { type: string; points: number }[];
    const totalEarned = txns.filter((t) => t.points > 0).reduce((s, t) => s + t.points, 0);
    const totalRedeemed = Math.abs(txns.filter((t) => t.type === "REDEEM").reduce((s, t) => s + t.points, 0));
    const totalExpired = Math.abs(txns.filter((t) => t.type === "EXPIRE").reduce((s, t) => s + t.points, 0));

    return {
      customerId,
      totalEarned,
      totalRedeemed,
      totalExpired,
      currentBalance: totalEarned - totalRedeemed - totalExpired,
    };
  } catch {
    return { customerId, totalEarned: 0, totalRedeemed: 0, totalExpired: 0, currentBalance: 0 };
  }
}

export async function getHistory(customerId: string, restaurantId: string, limit = 20): Promise<PointTransaction[]> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_loyalty_points")
      .select("*")
      .eq("customer_id", customerId)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || []) as PointTransaction[];
  } catch {
    return [];
  }
}

export async function getLeaderboard(restaurantId: string, limit = 10): Promise<{ customerId: string; name: string; points: number }[]> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db.rpc("loyalty_leaderboard", { p_restaurant_id: restaurantId, p_limit: limit });
    return (data || []) as { customerId: string; name: string; points: number }[];
  } catch {
    return [];
  }
}

export function calculatePointsToEarn(amountCents: number, restaurantId: string): number {
  const config = getProgramConfig(restaurantId);
  return Math.floor((amountCents / 100) * config.earnRatio);
}

export function calculateRedemptionValue(points: number, restaurantId: string): number {
  const config = getProgramConfig(restaurantId);
  return points * config.redemptionValue;
}
