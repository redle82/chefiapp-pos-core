/**
 * PaymentsSection - Seção de Pagamentos
 * Placeholder para implementação futura
 */

import React from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
import styles from "./PaymentsSection.module.css";

export function PaymentsSection() {
  const { updateSectionStatus } = useOnboarding();

  React.useEffect(() => {
    // Por enquanto, marca como completo para não bloquear
    updateSectionStatus("payments", "COMPLETE");
  }, [updateSectionStatus]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <span className={styles.icon}>💳</span>
        <span className={styles.helperText}>
          Em breve: ativar/desativar métodos (dinheiro, cartão, MB Way) e ligar
          terminais.
        </span>
      </div>
      <p className={styles.description}>
        Não precisa de fazer nada aqui por agora. O TPV continua a aceitar
        pagamentos conforme configurado na operação.
      </p>
    </div>
  );
}
