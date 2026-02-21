// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { GlobalBlockedView, GlobalLoadingView } from "../../ui/design-system/components";
import { getTabIsolated } from "../storage/TabIsolatedStorage";
import { getBillingStatusWithTrial, type BillingStatus } from "./coreBillingApi";

interface PaymentGuardProps {
  children: React.ReactNode;
}

export const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
  const { t } = useTranslation("billing");
  const [status, setStatus] = useState<BillingStatus | "loading">("loading");
  const [trialExpired, setTrialExpired] = useState(false);
  const location = useLocation();

  const checkBilling = async () => {
    try {
      const rId = getTabIsolated("chefiapp_restaurant_id");
      if (!rId) {
        setStatus("active");
        setTrialExpired(false);
        return;
      }

      const withTrial = await getBillingStatusWithTrial(rId);

      if (withTrial == null) {
        console.warn(
          "[PaymentGuard] Failed to check status, defaulting to safe (trial).",
        );
        setStatus("trial");
        setTrialExpired(false);
        return;
      }

      setStatus(withTrial.trial_expired ? "past_due" : withTrial.status);
      setTrialExpired(withTrial.trial_expired);
    } catch (err) {
      console.error("[PaymentGuard] Critical Check Error:", err);
      setStatus("active");
      setTrialExpired(false);
    }
  };

  useEffect(() => {
    // Initial Check
    checkBilling();

    // Polling (Every 5 minutes)
    const interval = setInterval(checkBilling, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (status === "loading") {
    return (
      <GlobalLoadingView
        message={t("checkingSubscription")}
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  // 2. The Rules (Law)

  // Safe Harbor (Law #5): Allow Console/Billing even if canceled
  if (
    location.pathname.startsWith("/app/console") ||
    location.pathname.startsWith("/app/setup") ||
    location.pathname.startsWith("/app/billing")
  ) {
    return <>{children}</>;
  }

  if (status === "canceled") {
    return (
      <GlobalBlockedView
        title={t("subscriptionRequired")}
        description={t("canceledDescription")}
        action={{ label: t("reactivatePlan"), to: "/app/billing" }}
      />
    );
  }

  if (status === "past_due" && trialExpired) {
    return (
      <GlobalBlockedView
        title={t("trialEndedTitle")}
        description={t("trialEndedDescription")}
        action={{ label: t("choosePlan"), to: "/app/billing" }}
      />
    );
  }

  if (status === "past_due") {
    return (
      <>
        <div className="w-full bg-amber-600 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-3 flex-wrap">
          <span>⚠️ {t("paymentPending")}</span>
          <a
            href="/app/billing"
            className="underline font-semibold hover:opacity-90"
          >
            {t("choosePlan")}
          </a>
        </div>
        {children}
      </>
    );
  }

  // Active / Trial -> Pass
  return <>{children}</>;
};
