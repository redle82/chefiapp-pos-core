/**
 * IntegrationsSection - Seção de Integrações
 * Placeholder para implementação futura
 */

import React from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
import styles from "./IntegrationsSection.module.css";

export function IntegrationsSection() {
  const { updateSectionStatus } = useOnboarding();

  React.useEffect(() => {
    // Por enquanto, marca como completo para não bloquear
    updateSectionStatus("integrations", "COMPLETE");
  }, [updateSectionStatus]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🔌 Integrações</h1>
      <p className={styles.subtitle}>
        Configure integrações (funcionalidade não ativa)
      </p>
    </div>
  );
}
