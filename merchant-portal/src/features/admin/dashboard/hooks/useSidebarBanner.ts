/**
 * useSidebarBanner — Context-aware banner state for the Admin sidebar.
 *
 * Derives what the sidebar should communicate based on SystemState:
 *   SETUP     → setup progress + next step CTA
 *   TRIAL     → days remaining + upgrade CTA
 *   ACTIVE    → quiet "plan active" badge (dismissible)
 *   SUSPENDED → urgent payment-required warning
 *
 * Phase 5: Contextual Banner — Admin Panel Restructuring.
 */

import { useMemo } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import type { SystemState } from "../../../../core/lifecycle/LifecycleState";

export type BannerVariant = "setup" | "trial" | "active" | "suspended";

export interface SidebarBannerState {
  /** Which variant to render (maps to visual style). */
  variant: BannerVariant;
  /** i18n key for the banner headline. */
  headlineKey: string;
  /** i18n key for the banner body text. */
  bodyKey: string;
  /** i18n interpolation params (e.g. {{days}}, {{done}}/{{total}}). */
  params: Record<string, string | number>;
  /** Primary CTA label i18n key (null = no CTA). */
  ctaKey: string | null;
  /** Primary CTA navigation target. */
  ctaTo: string | null;
  /** For SETUP variant: fraction completed (0-1). */
  progress: number | null;
}

/** Critical setup nodes that count towards progress. */
const CRITICAL_SETUP_KEYS = [
  "identity",
  "location",
  "menu",
  "publish",
] as const;

/** Maps setup keys → recommended config path for the CTA. */
const SETUP_KEY_TO_PATH: Record<string, string> = {
  identity: "/admin/config/general",
  location: "/admin/config/locations",
  menu: "/menu-builder",
  publish: "/admin/home",
};

function computeSetupProgress(setupStatus: Record<string, boolean>): {
  done: number;
  total: number;
  nextPath: string;
} {
  let done = 0;
  let nextPath = "/admin/config/general";
  let foundIncomplete = false;

  for (const key of CRITICAL_SETUP_KEYS) {
    if (setupStatus[key]) {
      done++;
    } else if (!foundIncomplete) {
      nextPath = SETUP_KEY_TO_PATH[key] ?? "/admin/config/general";
      foundIncomplete = true;
    }
  }

  return { done, total: CRITICAL_SETUP_KEYS.length, nextPath };
}

function computeTrialDaysLeft(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 14; // Assume full trial if not set
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function variantFromSystemState(state: SystemState): BannerVariant {
  switch (state) {
    case "SETUP":
      return "setup";
    case "TRIAL":
      return "trial";
    case "ACTIVE":
      return "active";
    case "SUSPENDED":
      return "suspended";
  }
}

export function useSidebarBanner(): SidebarBannerState {
  const { runtime } = useRestaurantRuntime();

  return useMemo(() => {
    const variant = variantFromSystemState(runtime.systemState);

    switch (variant) {
      case "setup": {
        const { done, total, nextPath } = computeSetupProgress(
          runtime.setup_status,
        );
        return {
          variant,
          headlineKey: "banner.setup.headline",
          bodyKey: "banner.setup.body",
          params: { done, total },
          ctaKey: "banner.setup.cta",
          ctaTo: nextPath,
          progress: total > 0 ? done / total : 0,
        };
      }

      case "trial": {
        const days = computeTrialDaysLeft(runtime.trial_ends_at);
        return {
          variant,
          headlineKey:
            days <= 3 ? "banner.trial.headlineUrgent" : "banner.trial.headline",
          bodyKey: "banner.trial.body",
          params: { days },
          ctaKey: "banner.trial.cta",
          ctaTo: "/admin/config/subscription",
          progress: null,
        };
      }

      case "active":
        return {
          variant,
          headlineKey: "banner.active.headline",
          bodyKey: "banner.active.body",
          params: { plan: runtime.plan },
          ctaKey: null,
          ctaTo: null,
          progress: null,
        };

      case "suspended":
        return {
          variant,
          headlineKey: "banner.suspended.headline",
          bodyKey: "banner.suspended.body",
          params: {},
          ctaKey: "banner.suspended.cta",
          ctaTo: "/admin/config/subscription",
          progress: null,
        };
    }
  }, [
    runtime.systemState,
    runtime.setup_status,
    runtime.trial_ends_at,
    runtime.plan,
  ]);
}
