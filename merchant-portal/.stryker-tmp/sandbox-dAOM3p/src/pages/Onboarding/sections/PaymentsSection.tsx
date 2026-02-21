/**
 * PaymentsSection - Seção de Pagamentos
 * Placeholder para implementação futura
 */
// @ts-nocheck


import React from "react";
import { useOnboarding } from "../../../context/OnboardingContext";

export function PaymentsSection() {
  const { updateSectionStatus } = useOnboarding();

  React.useEffect(() => {
    // Por enquanto, marca como completo para não bloquear
    updateSectionStatus("payments", "COMPLETE");
  }, [updateSectionStatus]);

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "800px",
        margin: 0,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>💳</span>
        <span style={{ fontSize: "15px", color: "#64748b", fontWeight: 500 }}>
          Em breve: ativar/desativar métodos (dinheiro, cartão, MB Way) e ligar
          terminais.
        </span>
      </div>
      <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
        Não precisa de fazer nada aqui por agora. O TPV continua a aceitar
        pagamentos conforme configurado na operação.
      </p>
    </div>
  );
}
