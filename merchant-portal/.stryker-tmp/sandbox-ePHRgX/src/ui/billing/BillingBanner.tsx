// @ts-nocheck
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import styles from "./BillingBanner.module.css";

function daysUntil(endAt: string | null | undefined): number | null {
  if (!endAt) return null;
  const end = new Date(endAt);
  const now = new Date();
  if (end <= now) return 0;
  const ms = end.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function BillingBanner() {
  const { t } = useTranslation("billing");
  const { billingStatus, isBillingBlocked } = useGlobalUIState();
  const { runtime } = useRestaurantRuntime();
  const trialEndsAt = runtime.trial_ends_at;
  const daysLeft = daysUntil(trialEndsAt);

  if (isBillingBlocked) return null;

  const trialMessage =
    daysLeft != null && daysLeft > 0
      ? t("trialEndsIn", { count: daysLeft })
      : t("trialActive");

  const config = {
    past_due: {
      message: t("paymentPending"),
      className: styles.bannerPastDue,
    },
    trial: {
      message: trialMessage,
      className: styles.bannerTrial,
    },
  };

  const current = config[billingStatus as keyof typeof config];
  if (!current) return null;

  return (
    <div className={`${styles.banner} ${current.className}`}>
      <span className={styles.message}>{current.message}</span>
      <Link to="/app/billing" className={styles.ctaLink}>
        {t("choosePlan")}
      </Link>
    </div>
  );
}
