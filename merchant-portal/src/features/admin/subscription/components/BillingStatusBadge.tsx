/**
 * BillingStatusBadge — Visual badge for subscription status.
 *
 * Maps SubscriptionStatus → color-coded Badge from design system.
 * Replaces raw text / inline styled spans across billing pages.
 *
 * Status → Visual mapping:
 *   active     → success (green)  + checkmark
 *   trialing   → info (blue)     + clock / trial end date
 *   past_due   → warning (amber) + alert
 *   canceled   → neutral (gray)  + x-circle
 *   incomplete → warning (amber) + alert
 *   paused     → neutral (gray)  + pause
 */

import React from "react";
import { useTranslation } from "react-i18next";
import type { SubscriptionStatus } from "../../../../../../billing-core/types";
import type {
  BadgeStatus,
  BadgeVariant,
} from "../../../../ui/design-system/primitives/Badge";
import { Badge } from "../../../../ui/design-system/primitives/Badge";
import { useTrialCountdown } from "../hooks/useTrialCountdown";
import "./BillingStatusBadge.css";

type BadgeSize = "sm" | "md";

interface BillingStatusBadgeProps {
  status: SubscriptionStatus;
  trialEndsAt?: string | null;
  size?: BadgeSize;
  /** Show trial end date inline when trialing. */
  showTrialDate?: boolean;
}

interface StatusConfig {
  badgeStatus: BadgeStatus;
  badgeVariant: BadgeVariant;
  i18nKey: string;
}

const STATUS_MAP: Record<SubscriptionStatus, StatusConfig> = {
  active: {
    badgeStatus: "success",
    badgeVariant: "soft",
    i18nKey: "common:billing.subscriptionStatus.active",
  },
  trialing: {
    badgeStatus: "info",
    badgeVariant: "soft",
    i18nKey: "common:billing.subscriptionStatus.trialing",
  },
  past_due: {
    badgeStatus: "warning",
    badgeVariant: "outline",
    i18nKey: "common:billing.subscriptionStatus.past_due",
  },
  past_due_limited: {
    badgeStatus: "warning",
    badgeVariant: "outline",
    i18nKey: "common:billing.subscriptionStatus.past_due_limited",
  },
  past_due_readonly: {
    badgeStatus: "warning",
    badgeVariant: "outline",
    i18nKey: "common:billing.subscriptionStatus.past_due_readonly",
  },
  canceled: {
    badgeStatus: "neutral",
    badgeVariant: "outline",
    i18nKey: "common:billing.subscriptionStatus.canceled",
  },
  incomplete: {
    badgeStatus: "warning",
    badgeVariant: "outline",
    i18nKey: "common:billing.subscriptionStatus.incomplete",
  },
  paused: {
    badgeStatus: "neutral",
    badgeVariant: "ghost",
    i18nKey: "common:billing.subscriptionStatus.paused",
  },
};

export const BillingStatusBadge: React.FC<BillingStatusBadgeProps> = ({
  status,
  trialEndsAt,
  size = "md",
  showTrialDate = true,
}) => {
  const { t } = useTranslation();
  const trial = useTrialCountdown(trialEndsAt);
  const config = STATUS_MAP[status] ?? STATUS_MAP.active;

  const label = t(config.i18nKey);

  // For trialing: append countdown or end date
  const trialSuffix =
    status === "trialing" && showTrialDate && trial.daysRemaining !== null
      ? ` · ${trial.formattedEndDate}`
      : "";

  const urgencyClass =
    status === "trialing" && trial.isUrgent
      ? "billing-status-badge--urgent"
      : status === "past_due"
      ? "billing-status-badge--attention"
      : "";

  return (
    <span className={`billing-status-badge ${urgencyClass}`}>
      <Badge
        status={config.badgeStatus}
        variant={config.badgeVariant}
        label={`${label}${trialSuffix}`}
        size={size}
      />
    </span>
  );
};

export default BillingStatusBadge;
