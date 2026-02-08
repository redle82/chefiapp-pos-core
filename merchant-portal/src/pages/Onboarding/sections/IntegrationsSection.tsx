/**
 * IntegrationsSection - Seção de Integrações
 * Placeholder para implementação futura
 */

import React from "react";
import { useOnboarding } from "../../../context/OnboardingContext";

export function IntegrationsSection() {
  const { updateSectionStatus } = useOnboarding();

  React.useEffect(() => {
    // Por enquanto, marca como completo para não bloquear
    updateSectionStatus("integrations", "COMPLETE");
  }, [updateSectionStatus]);

  return (
    <div style={{ padding: "48px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
        🔌 Integrações
      </h1>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "32px" }}>
        Configure integrações (funcionalidade não ativa)
      </p>
    </div>
  );
}
