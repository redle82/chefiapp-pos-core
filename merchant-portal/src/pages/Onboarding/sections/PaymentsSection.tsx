/**
 * PaymentsSection - Seção de Pagamentos
 * Placeholder para implementação futura
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "../../../context/OnboardingContext";
import styles from "./PaymentsSection.module.css";

export function PaymentsSection() {
  const { t } = useTranslation("onboarding");
  const { updateSectionStatus } = useOnboarding();

  React.useEffect(() => {
    // Por enquanto, marca como completo para não bloquear
    updateSectionStatus("payments", "COMPLETE");
  }, [updateSectionStatus]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <span className={styles.icon}>💳</span>
        <span className={styles.helperText}>{t("payments.comingSoon")}</span>
      </div>
      <p className={styles.description}>{t("payments.description")}</p>
    </div>
  );
}
