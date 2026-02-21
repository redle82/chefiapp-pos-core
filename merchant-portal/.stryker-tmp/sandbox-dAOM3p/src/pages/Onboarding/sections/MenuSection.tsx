/**
 * MenuSection - Seção de Cardápio
 * Configuração básica de cardápio (pode ser expandida depois)
 */
// @ts-nocheck


import { useEffect } from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import styles from "./MenuSection.module.css";

export function MenuSection() {
  const { updateSectionStatus } = useOnboarding();
  const { runtime, updateSetupStatus } = useRestaurantRuntime();

  useEffect(() => {
    // Por enquanto, marca como completo (cardápio pode ser configurado depois)
    // A implementação completa de cardápio requer integração com o Menu Builder
    updateSectionStatus("menu", "COMPLETE");

    // Atualizar RestaurantRuntimeContext (persistência real)
    if (runtime.restaurant_id) {
      updateSetupStatus("menu", true).catch((error) => {
        console.error("[MenuSection] Erro ao atualizar setup_status:", error);
      });
    }
  }, [updateSectionStatus, runtime.restaurant_id, updateSetupStatus]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🍽️ Cardápio</h1>
      <p className={styles.subtitle}>
        O cardápio pode ser configurado após a publicação do restaurante. Por
        enquanto, esta seção está marcada como completa para não bloquear o
        onboarding.
      </p>
      <div className={styles.tip}>
        💡 <strong>Dica:</strong> Após publicar, você poderá criar produtos,
        categorias e receitas na seção de Cardápio ou Menu Builder.
      </div>
    </div>
  );
}
