/**
 * Billing Core Types (Stub)
 *
 * Minimal type definitions for the billing domain.
 * Used by merchant-portal hooks to manage subscriptions.
 */

export type PlanTier = "free" | "trial" | "starter" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "paused";

export interface BillingPlan {
  id: string;
  tier: PlanTier;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
}

export interface SubscriptionRecord {
  subscription_id: string;
  tenant_id: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  trial_end?: string; // ISO 8601
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}
