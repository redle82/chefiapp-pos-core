/**
 * Trial Activation Engine — Trial lifecycle (start, expire, convert).
 * Persists in gm_restaurants via Core (Docker).
 * Ref: docs/metrics/COMMERCIAL_METRICS_CONTRACT.md
 */

import {
  ACTIVE_STATES,
  BILLING_STATES,
} from "../../../../billing-core/billingStateMachine";
import { CONFIG } from "../../config";
import { onTrialStarted } from "../commercial/activationHooks";
import { DbWriteGate } from "../governance/DbWriteGate";
import {
  ensureStripeCustomerForRestaurant,
  getBillingStatusWithTrial,
} from "./coreBillingApi";

const DEFAULT_TRIAL_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const REST = (() => {
  const base = CONFIG.CORE_URL.replace(/\/+$/, "");
  if (base.endsWith("/rest/v1")) return base;
  if (base.endsWith("/rest")) return `${base}/v1`;
  return `${base}/rest/v1`;
})();

function coreHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    apikey: CONFIG.CORE_ANON_KEY,
    Authorization: `Bearer ${CONFIG.CORE_ANON_KEY}`,
  };
}

/**
 * Start trial for a restaurant.
 * Sets billing_status='trial' and trial_ends_at = created_at + 14 days.
 */
export async function startTrial(restaurantId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const [trialState] = ACTIVE_STATES;
  const row = await getRestaurantRow(restaurantId);
  if (!row) {
    return { ok: false, error: "Restaurant not found" };
  }
  const created = row.created_at ? new Date(row.created_at) : new Date();
  const trialEndsAt = new Date(
    created.getTime() + DEFAULT_TRIAL_DAYS * MS_PER_DAY,
  );

  const { error } = await DbWriteGate.update(
    "OnboardingQuick",
    "gm_restaurants",
    {
      billing_status: trialState,
      trial_ends_at: trialEndsAt.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { id: restaurantId },
    { tenantId: restaurantId },
  );
  if (error) {
    return {
      ok: false,
      error: (error as { message?: string })?.message ?? "Update failed",
    };
  }

  const customerResult = await ensureStripeCustomerForRestaurant(restaurantId);
  if (!customerResult.ok && import.meta.env.DEV) {
    console.warn("[trialEngine] Stripe customer provisioning failed", {
      restaurantId,
      error: customerResult.error,
    });
  }

  await onTrialStarted(restaurantId);
  return { ok: true };
}

async function getRestaurantRow(
  restaurantId: string,
): Promise<{ created_at: string | null } | null> {
  const res = await fetch(
    `${REST}/gm_restaurants?id=eq.${encodeURIComponent(
      restaurantId,
    )}&select=created_at&limit=1`,
    { method: "GET", headers: coreHeaders() },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return row;
}

/**
 * Whether trial has expired (status=trial and now > trial_ends_at).
 */
export async function isTrialExpired(restaurantId: string): Promise<boolean> {
  const withTrial = await getBillingStatusWithTrial(restaurantId);
  if (!withTrial) return false;
  return withTrial.trial_expired;
}

/**
 * Remaining trial days. Returns 0 if expired or not in trial.
 */
export async function getRemainingTrialDays(
  restaurantId: string,
): Promise<number> {
  const withTrial = await getBillingStatusWithTrial(restaurantId);
  if (!withTrial || withTrial.trial_expired) return 0;
  const endsAt = withTrial.trial_ends_at;
  if (!endsAt) return DEFAULT_TRIAL_DAYS;
  const now = Date.now();
  const end = new Date(endsAt).getTime();
  const remaining = Math.ceil((end - now) / MS_PER_DAY);
  return Math.max(0, remaining);
}

/**
 * Mark trial as converted (paid). Sets billing_status='active'.
 */
export async function markTrialConverted(restaurantId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const [, activeState] = ACTIVE_STATES;
  const { data, error } = await DbWriteGate.update(
    "OnboardingQuick",
    "gm_restaurants",
    {
      billing_status: activeState,
      updated_at: new Date().toISOString(),
    },
    { id: restaurantId },
    { tenantId: restaurantId },
  );
  if (error) {
    return {
      ok: false,
      error: (error as { message?: string })?.message ?? "Update failed",
    };
  }
  return { ok: true };
}

/**
 * Expire trial if past trial_ends_at. Sets billing_status='past_due'.
 */
export async function expireTrialIfNeeded(restaurantId: string): Promise<{
  expired: boolean;
  error?: string;
}> {
  const [trialState] = ACTIVE_STATES;
  const withTrial = await getBillingStatusWithTrial(restaurantId);
  if (
    !withTrial ||
    !withTrial.trial_expired ||
    withTrial.status !== trialState
  ) {
    return { expired: false };
  }
  const { error } = await DbWriteGate.update(
    "OnboardingQuick",
    "gm_restaurants",
    {
      billing_status: BILLING_STATES.PAST_DUE,
      updated_at: new Date().toISOString(),
    },
    { id: restaurantId },
    { tenantId: restaurantId },
  );
  if (error) {
    return { expired: false, error: (error as { message?: string })?.message };
  }
  return { expired: true };
}
