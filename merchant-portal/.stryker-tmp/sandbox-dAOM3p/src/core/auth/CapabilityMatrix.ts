/**
 * Capability Matrix — Commercial façade over featureGating.ts
 *
 * This module maps the **commercial plan names** (Standard, Pro, Premium, Enterprise)
 * to the **canonical PlanTier** (free, starter, pro, enterprise) defined in featureGating.
 *
 * featureGating.ts remains the SINGLE SOURCE OF TRUTH for feature entitlements and limits.
 * This file provides backward-compatible `PlanType`, `Capability` and `CapabilityEngine`
 * used by PlanContext.tsx and UpgradeLock.tsx.
 *
 * ┌──────────────┐     maps to     ┌──────────────┐
 * │  PlanType     │ ──────────────▸ │  PlanTier    │  (billing-core/types)
 * │  Capability   │ ──────────────▸ │  PlanFeature │  (featureGating)
 * └──────────────┘                  └──────────────┘
 */
// @ts-nocheck


import type { PlanTier } from "../../../../billing-core/types";
import { hasFeature, type PlanFeature } from "../billing/featureGating";

// Re-export canonical types for downstream convenience
export type { PlanFeature, PlanTier };

// ============================================================================
// COMMERCIAL PLAN TYPES  (UI / Marketing naming)
// ============================================================================

export type PlanType = "STANDARD" | "PRO" | "PREMIUM" | "ENTERPRISE";

/** Map commercial name → canonical tier */
export const PLAN_TYPE_TO_TIER: Record<PlanType, PlanTier> = {
  STANDARD: "starter",
  PRO: "pro",
  PREMIUM: "pro", // Premium shares pro tier with higher limits (custom)
  ENTERPRISE: "enterprise",
};

/** Map canonical tier → commercial name (for display) */
export const TIER_TO_PLAN_TYPE: Record<PlanTier, PlanType> = {
  free: "STANDARD",
  trial: "STANDARD",
  starter: "STANDARD",
  pro: "PRO",
  enterprise: "ENTERPRISE",
};

// ============================================================================
// COMMERCIAL CAPABILITIES  (kept for backward compat)
// ============================================================================

export type Capability =
  // --- CORE POS ---
  | "pos.basic_sales"
  | "pos.table_management"

  // --- WEB & ONLINE ---
  | "web.public_page"
  | "web.custom_domain"
  | "web.remove_branding"
  | "web.themes"

  // --- INTEGRATIONS ---
  | "integration.gloriafood"
  | "integration.ifood"
  | "integration.webhooks"

  // --- INTELLIGENCE ---
  | "analytics.basic"
  | "analytics.historical"
  | "analytics.forecasting"

  // --- STAFF ---
  | "staff.roles"
  | "staff.tasks"
  | "staff.gamification"

  // --- MONETIZATION ---
  | "adtech.supplier_banners";

/**
 * Map commercial Capability → operational PlanFeature.
 * Capabilities that have no direct PlanFeature mapping resolve via the matrix below.
 */
const CAPABILITY_TO_FEATURE: Partial<Record<Capability, PlanFeature>> = {
  "pos.basic_sales": "tpv",
  "pos.table_management": "tpv",
  "integration.gloriafood": "delivery_integration",
  "integration.ifood": "delivery_integration",
  "integration.webhooks": "api_webhooks",
  "analytics.historical": "advanced_reports",
  "analytics.forecasting": "advanced_reports",
  "staff.roles": "appstaff",
  "staff.tasks": "shift_management",
  "staff.gamification": "gamification",
};

// ============================================================================
// LEGACY CAPABILITY MATRIX  (still used for capabilities without PlanFeature mapping)
// ============================================================================

const CAPABILITY_MATRIX: Record<PlanType, Capability[]> = {
  STANDARD: [
    "pos.basic_sales",
    "pos.table_management",
    "web.public_page",
    "staff.roles",
    "analytics.basic",
  ],
  PRO: [
    "pos.basic_sales",
    "pos.table_management",
    "web.public_page",
    "staff.roles",
    "analytics.basic",
    "web.custom_domain",
    "integration.gloriafood",
    "analytics.historical",
    "staff.tasks",
  ],
  PREMIUM: [
    "pos.basic_sales",
    "pos.table_management",
    "web.public_page",
    "staff.roles",
    "analytics.basic",
    "web.custom_domain",
    "integration.gloriafood",
    "analytics.historical",
    "staff.tasks",
    "integration.ifood",
    "web.remove_branding",
    "web.themes",
    "analytics.forecasting",
    "staff.gamification",
    "adtech.supplier_banners",
  ],
  ENTERPRISE: [
    "pos.basic_sales",
    "pos.table_management",
    "web.public_page",
    "staff.roles",
    "analytics.basic",
    "web.custom_domain",
    "integration.gloriafood",
    "analytics.historical",
    "staff.tasks",
    "integration.ifood",
    "web.remove_branding",
    "web.themes",
    "analytics.forecasting",
    "staff.gamification",
    "adtech.supplier_banners",
    "integration.webhooks",
  ],
};

// ============================================================================
// ENGINE  (backward-compatible API, delegates to featureGating when possible)
// ============================================================================

export class CapabilityEngine {
  static getCapabilities(plan: PlanType): Capability[] {
    return CAPABILITY_MATRIX[plan] || CAPABILITY_MATRIX.STANDARD;
  }

  /**
   * Check if a commercial plan has a given capability.
   * Tries featureGating first (canonical); falls back to local matrix.
   */
  static has(plan: PlanType, capability: Capability): boolean {
    const feature = CAPABILITY_TO_FEATURE[capability];
    if (feature) {
      const tier = PLAN_TYPE_TO_TIER[plan];
      return hasFeature(tier, feature);
    }
    // Fallback to local matrix for capabilities without PlanFeature mapping
    return this.getCapabilities(plan).includes(capability);
  }

  /**
   * Minimum commercial plan required for a capability (for "Upgrade to Unlock" UX).
   */
  static requiredPlanFor(capability: Capability): PlanType {
    if (CAPABILITY_MATRIX.STANDARD.includes(capability)) return "STANDARD";
    if (CAPABILITY_MATRIX.PRO.includes(capability)) return "PRO";
    if (CAPABILITY_MATRIX.PREMIUM.includes(capability)) return "PREMIUM";
    return "ENTERPRISE";
  }

  /** Convert a PlanType to its canonical PlanTier. */
  static toTier(plan: PlanType): PlanTier {
    return PLAN_TYPE_TO_TIER[plan];
  }

  /** Convert a PlanTier to its commercial PlanType. */
  static toPlanType(tier: PlanTier): PlanType {
    return TIER_TO_PLAN_TYPE[tier];
  }
}
