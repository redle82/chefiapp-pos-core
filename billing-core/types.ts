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

// ============================================================================
// ORGANIZATION TYPES — SaaS Organizational Layer
// ============================================================================

export type OrgRole = "owner" | "admin" | "billing" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  billing_email: string | null;
  country: string;
  tax_id: string | null;
  logo_url: string | null;
  plan_tier: PlanTier;
  max_restaurants: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  updated_at: string;
}

export interface OrgMembership {
  org_id: string;
  org_name: string;
  org_slug: string;
  role: OrgRole;
  plan_tier: PlanTier;
}
