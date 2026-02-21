// @ts-nocheck
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import styles from "./BillingWarningBadge.module.css";

export function BillingWarningBadge() {
  const { billingStatus } = useGlobalUIState();

  if (billingStatus !== "past_due" && billingStatus !== "trial") return null;

  const config = {
    past_due: { label: "Atraso", className: styles.badgePastDue },
    trial: { label: "Trial", className: styles.badgeTrial },
  };

  const current = config[billingStatus as keyof typeof config];
  if (!current) return null;

  return (
    <span className={`${styles.badge} ${current.className}`}>
      {current.label}
    </span>
  );
}
