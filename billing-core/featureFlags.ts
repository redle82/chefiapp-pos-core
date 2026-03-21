/**
 * Feature Flags — Module Gating by Plan Tier and Billing Status
 *
 * Maps billing PlanTier + BillingStatus → enabled platform modules.
 * Used by the frontend to conditionally render module UIs
 * and by the backend to gate API access.
 *
 * Architecture:
 *   billing-core/types.ts   → PlanTier definition
 *   billing-core/featureFlags.ts → this file (module gating logic)
 *   merchant-portal/...     → UI consumers via useFeatureFlags hook
 */

import type { BillingState } from "./billingStateMachine";
import {
  ACTIVE_STATES,
  BLOCKED_STATES,
  LIMITED_STATES,
  READONLY_STATES,
  WARNING_STATES,
} from "./billingStateMachine";
import type { PlanTier } from "./types";

/**
 * BillingStatus — re-exported alias from the central billing state machine.
 * @see billing-core/billingStateMachine.ts (single source of truth)
 */
export type BillingStatus = BillingState;

// ─── Module Keys ────────────────────────────────────────

/**
 * Every sellable module in the platform.
 * Maps 1:1 to a feature area that can be enabled/disabled.
 */
export type ModuleKey =
  | "core_pos" // Orders, payments, tables, fiscal
  | "core_kds" // Kitchen Display System
  | "team_management" // Shifts, attendance, schedule
  | "team_pulse" // Pulse readings, gamification
  | "team_tasks" // Task system, recurring tasks
  | "analytics_basic" // Basic dashboard, daily stats
  | "analytics_pro" // Advanced reports, heatmaps, pulse analytics
  | "billing_management" // Subscription management, plan changes
  | "inventory" // Inventory / stock tracking
  | "marketing_crm" // CRM, campaigns (future)
  | "exports" // CSV/PDF export of reports
  | "audit_dashboard" // Audit log viewer, orchestrator logs
  | "compliance"; // Fiscal compliance, AT certification

// ─── Plan → Module Matrix ───────────────────────────────

const PLAN_MODULES: Record<PlanTier, readonly ModuleKey[]> = {
  free: ["core_pos", "analytics_basic"],
  trial: [
    "core_pos",
    "core_kds",
    "team_management",
    "team_pulse",
    "team_tasks",
    "analytics_basic",
    "analytics_pro",
    "billing_management",
    "inventory",
    "exports",
    "audit_dashboard",
  ],
  starter: [
    "core_pos",
    "core_kds",
    "team_management",
    "analytics_basic",
    "billing_management",
    "exports",
  ],
  pro: [
    "core_pos",
    "core_kds",
    "team_management",
    "team_pulse",
    "team_tasks",
    "analytics_basic",
    "analytics_pro",
    "billing_management",
    "inventory",
    "exports",
    "audit_dashboard",
  ],
  enterprise: [
    "core_pos",
    "core_kds",
    "team_management",
    "team_pulse",
    "team_tasks",
    "analytics_basic",
    "analytics_pro",
    "billing_management",
    "inventory",
    "marketing_crm",
    "exports",
    "audit_dashboard",
    "compliance",
  ],
};

// ─── Public API ─────────────────────────────────────────

/**
 * Check if a specific module is enabled for the given plan tier.
 */
export function isModuleEnabled(tier: PlanTier, module: ModuleKey): boolean {
  return PLAN_MODULES[tier]?.includes(module) ?? false;
}

/**
 * Get all enabled modules for a plan tier.
 */
export function getEnabledModules(tier: PlanTier): readonly ModuleKey[] {
  return PLAN_MODULES[tier] ?? [];
}

/**
 * Get the minimum plan tier required for a given module.
 * Returns null if no plan includes this module.
 */
export function getMinimumTier(module: ModuleKey): PlanTier | null {
  const tierOrder: PlanTier[] = [
    "free",
    "trial",
    "starter",
    "pro",
    "enterprise",
  ];
  for (const tier of tierOrder) {
    if (PLAN_MODULES[tier]?.includes(module)) return tier;
  }
  return null;
}

/**
 * Get modules that would be unlocked by upgrading from one tier to another.
 */
export function getUpgradeModules(
  currentTier: PlanTier,
  targetTier: PlanTier,
): readonly ModuleKey[] {
  const current = new Set(PLAN_MODULES[currentTier] ?? []);
  return (PLAN_MODULES[targetTier] ?? []).filter((m) => !current.has(m));
}

// ─── Billing Status → Module Resolution ─────────────────

/** Core readonly modules (POS, KDS, exports) for degraded billing states. */
const CORE_READONLY_MODULES: readonly ModuleKey[] = [
  "core_pos",
  "core_kds",
  "analytics_basic",
  "exports",
];

/**
 * Resolve active modules from billing status + plan.
 * Uses state groups from billingStateMachine as source of truth.
 *
 *   ACTIVE_STATES (trial, active) → plan modules
 *   WARNING_STATES (past_due)     → core readonly
 *   LIMITED/READONLY/BLOCKED      → core readonly or empty
 *   trial_expired                 → empty (blocked)
 */
export function resolveActiveModules(
  billingStatus: BillingStatus,
  plan: PlanTier,
): ModuleKey[] {
  const [trialExpiredState] = BLOCKED_STATES;

  // trial_expired → block everything
  if (billingStatus === trialExpiredState) {
    return [];
  }
  // BLOCKED_STATES (canceled, incomplete, paused) → core readonly only
  if ((BLOCKED_STATES as readonly string[]).includes(billingStatus)) {
    return [...CORE_READONLY_MODULES];
  }
  // WARNING_STATES (past_due) + LIMITED/READONLY → core readonly
  if (
    (WARNING_STATES as readonly string[]).includes(billingStatus) ||
    (LIMITED_STATES as readonly string[]).includes(billingStatus) ||
    (READONLY_STATES as readonly string[]).includes(billingStatus)
  ) {
    return [...CORE_READONLY_MODULES];
  }
  // ACTIVE_STATES: trial → starter modules; active → plan modules
  if ((ACTIVE_STATES as readonly string[]).includes(billingStatus)) {
    if (billingStatus === "trial") {
      return [...(PLAN_MODULES.starter ?? [])];
    }
    return [...(PLAN_MODULES[plan] ?? PLAN_MODULES.starter ?? [])];
  }
  return [...(PLAN_MODULES.starter ?? [])];
}

/**
 * Check if a module is enabled given billing status + plan.
 * Connects resolveActiveModules with isModuleEnabled: use this when
 * billing status affects access (e.g. trial_expired blocks all).
 */
export function isModuleEnabledForBilling(
  billingStatus: BillingStatus,
  plan: PlanTier,
  module: ModuleKey,
): boolean {
  return resolveActiveModules(billingStatus, plan).includes(module);
}
