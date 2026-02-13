import { Link } from "react-router-dom";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import styles from "./BillingBanner.module.css";

const CTA_ESCOLHER_PLANO = "Escolher plano";

export function BillingBanner() {
  const { billingStatus, isBillingBlocked } = useGlobalUIState();

  if (isBillingBlocked) return null;

  const config = {
    past_due: {
      message:
        "Pagamento pendente. Regularize para evitar a suspensão do serviço.",
      className: styles.bannerPastDue,
    },
    trial: {
      message:
        "Trial ativo. Escolha o seu plano para continuar após o período de teste.",
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
