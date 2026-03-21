/**
 * BillingAlertBanner — Contextual alert banner for billing states.
 *
 * Shows actionable, non-frightening alerts based on subscription status:
 *   past_due   → warning: "Update payment to avoid disruption" + CTA
 *   canceled   → info: "Reactivate to continue" + CTA
 *   trialing   → progressive urgency based on days remaining
 *   active     → null (no banner needed)
 *
 * Wraps InlineAlert from design system. Fully i18n'd.
 */

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { SubscriptionStatus } from "../../../../../../billing-core/types";
import { InlineAlert } from "../../../../ui/design-system/InlineAlert";
import {
  useTrialCountdown,
  type TrialUrgency,
} from "../hooks/useTrialCountdown";
import "./BillingAlertBanner.css";

interface BillingAlertBannerProps {
  status: SubscriptionStatus;
  trialEndsAt?: string | null;
  onManagePayment?: () => void;
  onChangePlan?: () => void;
  className?: string;
}

interface BannerConfig {
  type: "success" | "error" | "warning" | "info";
  titleKey: string;
  messageKey: string;
  actionLabelKey?: string;
  actionTarget?: "payment" | "plans";
}

function getTrialBannerConfig(
  urgency: TrialUrgency,
  _days: number,
): BannerConfig | null {
  switch (urgency) {
    case "lastDay":
      return {
        type: "warning",
        titleKey: "common:billing.alert.trialLastDayTitle",
        messageKey: "common:billing.alert.trialLastDayMessage",
        actionLabelKey: "common:billing.alert.choosePlanNow",
        actionTarget: "plans",
      };
    case "urgent":
      return {
        type: "warning",
        titleKey: "common:billing.alert.trialUrgentTitle",
        messageKey: "common:billing.alert.trialUrgentMessage",
        actionLabelKey: "common:billing.alert.choosePlanNow",
        actionTarget: "plans",
      };
    case "approaching":
      return {
        type: "info",
        titleKey: "common:billing.alert.trialApproachingTitle",
        messageKey: "common:billing.alert.trialApproachingMessage",
        actionLabelKey: "common:billing.alert.viewPlans",
        actionTarget: "plans",
      };
    case "expired":
      return {
        type: "warning",
        titleKey: "common:billing.alert.trialExpiredTitle",
        messageKey: "common:billing.alert.trialExpiredMessage",
        actionLabelKey: "common:billing.alert.choosePlanNow",
        actionTarget: "plans",
      };
    default:
      return null; // relaxed: no banner
  }
}

function getStatusBannerConfig(
  status: SubscriptionStatus,
): BannerConfig | null {
  switch (status) {
    case "past_due":
      return {
        type: "warning",
        titleKey: "common:billing.alert.pastDueTitle",
        messageKey: "common:billing.alert.pastDueMessage",
        actionLabelKey: "common:billing.alert.updatePayment",
        actionTarget: "payment",
      };
    case "canceled":
      return {
        type: "info",
        titleKey: "common:billing.alert.canceledTitle",
        messageKey: "common:billing.alert.canceledMessage",
        actionLabelKey: "common:billing.alert.reactivatePlan",
        actionTarget: "plans",
      };
    case "incomplete":
      return {
        type: "warning",
        titleKey: "common:billing.alert.incompleteTitle",
        messageKey: "common:billing.alert.incompleteMessage",
        actionLabelKey: "common:billing.alert.updatePayment",
        actionTarget: "payment",
      };
    case "paused":
      return {
        type: "info",
        titleKey: "common:billing.alert.pausedTitle",
        messageKey: "common:billing.alert.pausedMessage",
        actionLabelKey: "common:billing.alert.reactivatePlan",
        actionTarget: "plans",
      };
    default:
      return null;
  }
}

export const BillingAlertBanner: React.FC<BillingAlertBannerProps> = ({
  status,
  trialEndsAt,
  onManagePayment,
  onChangePlan,
  className,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const trial = useTrialCountdown(trialEndsAt);

  // Determine which banner to show
  let config: BannerConfig | null = null;
  let interpolationParams: Record<string, string | number> = {};

  if (status === "trialing" && trial.daysRemaining !== null) {
    config = getTrialBannerConfig(trial.urgency, trial.daysRemaining);
    interpolationParams = {
      days: Math.max(0, trial.daysRemaining),
      date: trial.formattedEndDate ?? "",
    };
  } else if (status !== "active") {
    config = getStatusBannerConfig(status);
  }

  const handleAction = useCallback(() => {
    if (!config) return;
    if (config.actionTarget === "payment" && onManagePayment) {
      onManagePayment();
    } else if (config.actionTarget === "plans" && onChangePlan) {
      onChangePlan();
    } else {
      // Fallback: navigate to subscription page
      navigate("/admin/config/subscription");
    }
  }, [config, onManagePayment, onChangePlan, navigate]);

  if (!config) return null;

  const title = t(config.titleKey, interpolationParams);
  const message = t(config.messageKey, interpolationParams);
  const actionLabel = config.actionLabelKey
    ? t(config.actionLabelKey)
    : undefined;

  return (
    <div
      className={`billing-alert-banner billing-alert-banner--enter ${
        className ?? ""
      }`}
    >
      <InlineAlert
        type={config.type}
        title={title}
        message={message}
        action={
          actionLabel
            ? { label: actionLabel, onClick: handleAction }
            : undefined
        }
      />
    </div>
  );
};

export default BillingAlertBanner;
