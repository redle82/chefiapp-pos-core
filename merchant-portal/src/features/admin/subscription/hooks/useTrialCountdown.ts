/**
 * useTrialCountdown — Reusable trial countdown logic.
 *
 * Extracts the days-remaining calculation from useSidebarBanner
 * into a single source of truth for trial date math.
 *
 * Used by: BillingStatusBadge, BillingAlertBanner, SidebarContextBanner.
 */

import { useMemo } from "react";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type TrialUrgency =
  | "relaxed"
  | "approaching"
  | "urgent"
  | "lastDay"
  | "expired";

export interface TrialCountdownState {
  /** Days remaining (0 = last day, negative if past). Null if no trial date. */
  daysRemaining: number | null;
  /** Urgency tier for visual escalation. */
  urgency: TrialUrgency;
  /** Whether trial has expired. */
  isExpired: boolean;
  /** Whether trial is in last 3 days. */
  isUrgent: boolean;
  /** Whether this is the last day. */
  isLastDay: boolean;
  /** ISO string trial end date (pass-through). */
  trialEndsAt: string | null;
  /** Localized end date string. */
  formattedEndDate: string | null;
}

function computeDaysRemaining(
  trialEndsAt: string | null | undefined,
): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (isNaN(end)) return null;
  const now = Date.now();
  return Math.ceil((end - now) / MS_PER_DAY);
}

function computeUrgency(days: number | null): TrialUrgency {
  if (days === null) return "relaxed";
  if (days < 0) return "expired";
  if (days === 0) return "lastDay";
  if (days <= 2) return "urgent";
  if (days <= 5) return "approaching";
  return "relaxed";
}

/**
 * Hook-free pure computation for use outside React components (e.g., tests).
 */
export function computeTrialCountdown(
  trialEndsAt: string | null | undefined,
  locale?: string,
): TrialCountdownState {
  const days = computeDaysRemaining(trialEndsAt);
  const urgency = computeUrgency(days);

  let formattedEndDate: string | null = null;
  if (trialEndsAt) {
    try {
      formattedEndDate = new Date(trialEndsAt).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
      });
    } catch {
      formattedEndDate = trialEndsAt;
    }
  }

  return {
    daysRemaining: days,
    urgency,
    isExpired: urgency === "expired",
    isUrgent: urgency === "urgent" || urgency === "lastDay",
    isLastDay: urgency === "lastDay",
    trialEndsAt: trialEndsAt ?? null,
    formattedEndDate,
  };
}

/**
 * React hook version — memoized, recalculates when trialEndsAt changes.
 */
export function useTrialCountdown(
  trialEndsAt: string | null | undefined,
  locale?: string,
): TrialCountdownState {
  return useMemo(
    () => computeTrialCountdown(trialEndsAt, locale),
    [trialEndsAt, locale],
  );
}
