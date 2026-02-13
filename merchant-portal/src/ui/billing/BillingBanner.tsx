import { Link } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import styles from "./BillingBanner.module.css";

const CTA_ESCOLHER_PLANO = "Escolher plano";

function daysUntil(endAt: string | null | undefined): number | null {
  if (!endAt) return null;
  const end = new Date(endAt);
  const now = new Date();
  if (end <= now) return 0;
  const ms = end.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function BillingBanner() {
  const { billingStatus, isBillingBlocked } = useGlobalUIState();
  const { runtime } = useRestaurantRuntime();
  const trialEndsAt = runtime.trial_ends_at;
  const daysLeft = daysUntil(trialEndsAt);

  if (isBillingBlocked) return null;

  const config = {
    past_due: {
      message:
        "Pagamento pendente. Regularize para evitar a suspensão do serviço.",
      className: styles.bannerPastDue,
    },
    trial: {
      message:
        daysLeft != null && daysLeft > 0
          ? `Trial termina em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}. Escolha o seu plano para continuar.`
          : "Trial ativo. Escolha o seu plano para continuar após o período de teste.",
      className: styles.bannerTrial,
    },
  };

  const current = config[billingStatus as keyof typeof config];
  if (!current) return null;

  return (
    <div className={`${styles.banner} ${current.className}`}>
      <span className={styles.message}>{current.message}</span>
      <Link to="/app/billing" className={styles.ctaLink}>
        {CTA_ESCOLHER_PLANO}
      </Link>
    </div>
  );
}
