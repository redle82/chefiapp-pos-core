/**
 * usePlanModuleGate — Connect billing-core featureFlags to current subscription
 *
 * Bridges useSubscription() ↔ billing-core/featureFlags.isModuleEnabled().
 * Returns gating decisions for any ModuleKey based on the restaurant's active plan.
 *
 * Phase 3 — Enterprise Hardening (Module Enforcement).
 */

import { useMemo } from "react";
import {
  getEnabledModules,
  getMinimumTier,
  isModuleEnabled,
  type ModuleKey,
} from "../../../../billing-core/featureFlags";
import type { PlanTier } from "../../../../billing-core/types";
import { useSubscription } from "../useSubscription";

export interface ModuleGateResult {
  /** Whether the module is enabled for the current plan */
  allowed: boolean;
  /** Current plan tier (null when subscription not loaded) */
  currentTier: PlanTier | null;
  /** Minimum tier needed to access this module */
  requiredTier: PlanTier | null;
  /** Whether the subscription data is still loading */
  loading: boolean;
  /** All modules enabled for the current plan */
  enabledModules: readonly ModuleKey[];
}

/**
 * Hook: check if a specific module is enabled for the current restaurant's plan.
 *
 * Usage:
 *   const { allowed, requiredTier, loading } = usePlanModuleGate("analytics_pro");
 *   if (!allowed) return <UpgradePrompt requiredTier={requiredTier} />;
 */
export function usePlanModuleGate(moduleKey: ModuleKey): ModuleGateResult {
  const { subscription, loading } = useSubscription();

  return useMemo(() => {
    if (loading || !subscription) {
      return {
        allowed: false,
        currentTier: null,
        requiredTier: getMinimumTier(moduleKey),
        loading,
        enabledModules: [],
      };
    }

    const tier = subscription.plan_tier;
    const allowed = isModuleEnabled(tier, moduleKey);
    const enabledModules = getEnabledModules(tier);
    const requiredTier = allowed ? null : getMinimumTier(moduleKey);

    return {
      allowed,
      currentTier: tier,
      requiredTier,
      loading: false,
      enabledModules,
    };
  }, [subscription, loading, moduleKey]);
}

/**
 * Hook: get all enabled modules for the current plan.
 *
 * Usage:
 *   const { enabledModules, currentTier } = usePlanModules();
 */
export function usePlanModules(): {
  enabledModules: readonly ModuleKey[];
  currentTier: PlanTier | null;
  loading: boolean;
} {
  const { subscription, loading } = useSubscription();

  return useMemo(() => {
    if (loading || !subscription) {
      return { enabledModules: [], currentTier: null, loading };
    }

    return {
      enabledModules: getEnabledModules(subscription.plan_tier),
      currentTier: subscription.plan_tier,
      loading: false,
    };
  }, [subscription, loading]);
}
