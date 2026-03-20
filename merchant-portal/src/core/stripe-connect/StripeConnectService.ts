/**
 * Stripe Connect Service — Marketplace model for ChefIApp.
 *
 * Each restaurant is a Connected Account. ChefIApp takes a platform fee
 * on every transaction. Restaurants receive payouts directly from Stripe.
 *
 * Flow:
 * 1. Restaurant signs up → creates Stripe Connected Account (Express)
 * 2. Restaurant completes onboarding via Stripe-hosted form
 * 3. On each payment: ChefIApp creates PaymentIntent with application_fee
 * 4. Stripe splits: restaurant gets payment minus fee, ChefIApp gets fee
 */

import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

export interface ConnectedAccount {
  id: string;
  restaurant_id: string;
  stripe_account_id: string;
  status: "pending" | "active" | "restricted" | "disabled";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  onboarding_url?: string;
  created_at: string;
}

export interface PlatformFeeConfig {
  feePercent: number; // e.g., 2.5 = 2.5%
  fixedFeeCents: number; // e.g., 30 = €0.30 per transaction
  minFeeCents: number; // minimum fee per transaction
}

const DEFAULT_FEE: PlatformFeeConfig = {
  feePercent: 2.5,
  fixedFeeCents: 0,
  minFeeCents: 10, // €0.10 minimum
};

/**
 * Create a Stripe Connected Account for a restaurant.
 * Returns the onboarding URL for the restaurant owner to complete.
 */
export async function createConnectedAccount(
  restaurantId: string,
  restaurantEmail: string,
  countryCode: string = "PT"
): Promise<{ accountId: string; onboardingUrl: string } | null> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db.rpc("stripe_connect_create_account", {
      p_restaurant_id: restaurantId,
      p_email: restaurantEmail,
      p_country: countryCode,
    });

    if (!data) return null;

    return {
      accountId: data.stripe_account_id,
      onboardingUrl: data.onboarding_url,
    };
  } catch {
    return null;
  }
}

/**
 * Get the Connected Account status for a restaurant.
 */
export async function getConnectedAccount(
  restaurantId: string
): Promise<ConnectedAccount | null> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_stripe_connect_accounts")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    return data as ConnectedAccount | null;
  } catch {
    return null;
  }
}

/**
 * Refresh the onboarding link if the restaurant hasn't completed setup.
 */
export async function refreshOnboardingLink(
  restaurantId: string
): Promise<string | null> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db.rpc("stripe_connect_refresh_onboarding", {
      p_restaurant_id: restaurantId,
    });
    return data?.onboarding_url ?? null;
  } catch {
    return null;
  }
}

/**
 * Calculate the platform fee for a transaction.
 */
export function calculatePlatformFee(
  amountCents: number,
  config: PlatformFeeConfig = DEFAULT_FEE
): number {
  const percentFee = Math.round(amountCents * (config.feePercent / 100));
  const totalFee = percentFee + config.fixedFeeCents;
  return Math.max(totalFee, config.minFeeCents);
}

/**
 * Create a payment with platform fee split.
 * The payment goes to the Connected Account minus the application fee.
 */
export async function createConnectedPayment(
  restaurantId: string,
  amountCents: number,
  currency: string,
  paymentMethodId: string,
  metadata: Record<string, string> = {}
): Promise<{ paymentIntentId: string; fee: number } | null> {
  const account = await getConnectedAccount(restaurantId);
  if (!account || !account.charges_enabled) return null;

  const fee = calculatePlatformFee(amountCents);

  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db.rpc("stripe_connect_create_payment", {
      p_stripe_account_id: account.stripe_account_id,
      p_amount: amountCents,
      p_currency: currency,
      p_payment_method: paymentMethodId,
      p_application_fee: fee,
      p_metadata: metadata,
    });

    if (!data) return null;
    return { paymentIntentId: data.payment_intent_id, fee };
  } catch {
    return null;
  }
}

/**
 * Get payout history for a Connected Account.
 */
export async function getPayoutHistory(
  restaurantId: string,
  limit: number = 20
): Promise<{ id: string; amount: number; currency: string; arrival_date: string; status: string }[]> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db.rpc("stripe_connect_list_payouts", {
      p_restaurant_id: restaurantId,
      p_limit: limit,
    });
    return (data || []) as { id: string; amount: number; currency: string; arrival_date: string; status: string }[];
  } catch {
    return [];
  }
}

/**
 * Get platform revenue summary (ChefIApp's earnings from fees).
 */
export async function getPlatformRevenue(
  dateFrom: string,
  dateTo: string
): Promise<{ totalFeeCents: number; transactionCount: number; avgFeeCents: number }> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db.rpc("stripe_connect_platform_revenue", {
      p_date_from: dateFrom,
      p_date_to: dateTo,
    });
    return data || { totalFeeCents: 0, transactionCount: 0, avgFeeCents: 0 };
  } catch {
    return { totalFeeCents: 0, transactionCount: 0, avgFeeCents: 0 };
  }
}

/**
 * Get the fee configuration for a restaurant.
 * Allows per-restaurant fee overrides (e.g., VIP pricing).
 */
export function getFeeConfig(restaurantId: string): PlatformFeeConfig {
  try {
    const stored = localStorage.getItem(`chefiapp_fee_${restaurantId}`);
    return stored ? { ...DEFAULT_FEE, ...JSON.parse(stored) } : DEFAULT_FEE;
  } catch {
    return DEFAULT_FEE;
  }
}

export function setFeeConfig(restaurantId: string, config: Partial<PlatformFeeConfig>): void {
  const current = getFeeConfig(restaurantId);
  localStorage.setItem(`chefiapp_fee_${restaurantId}`, JSON.stringify({ ...current, ...config }));
}
