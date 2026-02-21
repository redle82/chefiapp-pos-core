/**
 * InventorySection - Seção de Estoque
 * Configuração básica de estoque (pode ser expandida depois)
 */
// @ts-nocheck


import { useEffect } from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
import styles from "./InventorySection.module.css";

export function InventorySection() {
  const { updateSectionStatus } = useOnboarding();

  useEffect(() => {
    // Por enquanto, marca como completo (estoque pode ser configurado depois)
    // A implementação completa de estoque requer integração com o sistema de inventário
    updateSectionStatus("inventory", "COMPLETE");
  }, [updateSectionStatus]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📦 Estoque</h1>
      <p className={styles.subtitle}>
        O estoque pode ser configurado após a publicação do restaurante. Por
        enquanto, esta seção está marcada como completa para não bloquear o
        onboarding.
      </p>
      <div className={styles.tip}>
        💡 <strong>Dica:</strong> Após publicar, você poderá configurar
        ingredientes, quantidades mínimas e alertas de estoque na seção de
        Estoque.
      </div>
    </div>
  );
}
