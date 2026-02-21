/**
 * 🔒 Feature Gating — Plan-based feature access control
 *
 * SOVEREIGNTY: This module is the SINGLE SOURCE OF TRUTH for feature entitlements.
 *
 * Usage:
 *   import { hasFeature, getMaxDevices, PLAN_LIMITS } from '../core/billing/featureGating';
 *
 *   if (hasFeature(planTier, 'kds'))         → show KDS module
 *   if (hasFeature(planTier, 'multi_unit'))   → show multi-unit reports
 *   const max = getMaxDevices(planTier);      → enforce device limit
 *
 * ⚠️ RULES:
 *  - Feature flags are ADDITIVE per tier (each tier inherits from the previous)
 *  - Unknown tiers fail-closed (no features)
 *  - This is a client-side convenience — server enforces limits via DB constraints
 */
// @ts-nocheck


import type { PlanTier } from "../../../../billing-core/types";

// ============================================================================
// FEATURE CATALOG
// ============================================================================

/**
 * All gateable features in the system.
 * Each maps to a specific UI module, functionality, or limit.
 */
export type PlanFeature =
  | "tpv" // Software TPV (Point of Sale)
  | "kds" // Kitchen Display System
  | "qr_ordering" // QR table ordering
  | "reservations" // Reservation management
  | "delivery_integration" // Third-party delivery integration
  | "multi_unit" // Multi-unit / multi-restaurant management
  | "virtual_brands" // Virtual brand support
  | "advanced_reports" // Advanced analytics & reports
  | "shift_management" // Shift management & scheduling
  | "api_webhooks" // Outbound webhooks / API access
  | "priority_support" // Priority support SLA
  | "custom_integrations" // Custom integrations beyond standard
  | "appstaff" // AppStaff mobile app for employees
  | "saft_export" // SAF-T export for fiscal compliance
  | "inventory" // Inventory & stock management
  | "gamification"; // Employee gamification features

// ============================================================================
// PLAN FEATURE MATRIX
// ============================================================================

/**
 * Features included in each plan tier.
 * Higher tiers inherit ALL features from lower tiers.
 */
const TIER_FEATURES: Record<PlanTier, readonly PlanFeature[]> = {
  free: ["tpv", "appstaff"],
  trial: [
    "tpv",
    "kds",
    "appstaff",
    "reservations",
    "shift_management",
    "inventory",
    "saft_export",
  ],
  starter: [
    "tpv",
    "kds",
    "appstaff",
    "reservations",
    "shift_management",
    "inventory",
    "saft_export",
  ],
  pro: [
    "tpv",
    "kds",
    "appstaff",
    "qr_ordering",
    "reservations",
    "delivery_integration",
    "shift_management",
    "advanced_reports",
    "inventory",
    "saft_export",
    "api_webhooks",
    "gamification",
  ],
  enterprise: [
    "tpv",
    "kds",
    "appstaff",
    "qr_ordering",
    "reservations",
    "delivery_integration",
    "multi_unit",
    "virtual_brands",
    "advanced_reports",
    "shift_management",
    "api_webhooks",
    "priority_support",
    "custom_integrations",
    "inventory",
    "saft_export",
    "gamification",
  ],
};

// ============================================================================
// PLAN LIMITS
// ============================================================================

export interface PlanLimits {
  max_devices: number;
  max_restaurants: number;
  max_integrations: number;
  max_delivery_orders: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    max_devices: 1,
    max_restaurants: 1,
    max_integrations: 0,
    max_delivery_orders: 0,
  },
  trial: {
    max_devices: 2,
    max_restaurants: 1,
    max_integrations: 1,
    max_delivery_orders: 50,
  },
  starter: {
    max_devices: 1,
    max_restaurants: 1,
    max_integrations: 0,
    max_delivery_orders: 0,
  },
  pro: {
    max_devices: 2,
    max_restaurants: 1,
    max_integrations: 3,
    max_delivery_orders: 200,
  },
  enterprise: {
    max_devices: 4,
    max_restaurants: 10,
    max_integrations: 6,
    max_delivery_orders: 550,
  },
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check if a plan tier has access to a specific feature.
 * Fail-closed: unknown tier = no access.
 */
export function hasFeature(
  tier: PlanTier | null | undefined,
  feature: PlanFeature,
): boolean {
  if (!tier) return false;
  const features = TIER_FEATURES[tier];
  if (!features) return false;
  return features.includes(feature);
}

/**
 * Get all features available for a plan tier.
 */
export function getPlanFeatures(
  tier: PlanTier | null | undefined,
): readonly PlanFeature[] {
  if (!tier) return [];
  return TIER_FEATURES[tier] ?? [];
}

/**
 * Get the maximum number of devices allowed for a plan tier.
 */
export function getMaxDevices(tier: PlanTier | null | undefined): number {
  if (!tier) return 0;
  return PLAN_LIMITS[tier]?.max_devices ?? 0;
}

/**
 * Get the maximum number of restaurants allowed for a plan tier.
 */
export function getMaxRestaurants(tier: PlanTier | null | undefined): number {
  if (!tier) return 0;
  return PLAN_LIMITS[tier]?.max_restaurants ?? 0;
}

/**
 * Get all limits for a plan tier.
 */
export function getPlanLimits(tier: PlanTier | null | undefined): PlanLimits {
  if (!tier) return PLAN_LIMITS.free;
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free;
}

/**
 * Check if the current device count is at or over the plan limit.
 * Use this before allowing device provisioning.
 */
export function isDeviceLimitReached(
  tier: PlanTier | null | undefined,
  currentDeviceCount: number,
): boolean {
  const max = getMaxDevices(tier);
  return currentDeviceCount >= max;
}

/**
 * Human-readable plan name for UI display.
 */
export function getPlanDisplayName(tier: PlanTier | null | undefined): string {
  const names: Record<PlanTier, string> = {
    free: "Free",
    trial: "Trial",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };
  return tier ? names[tier] ?? "Desconhecido" : "Sem plano";
}
