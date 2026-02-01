/**
 * MenuSection - Seção de Cardápio
 * Configuração básica de cardápio (pode ser expandida depois)
 */

import React, { useEffect } from 'react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useRestaurantRuntime } from '../../../context/RestaurantRuntimeContext';

export function MenuSection() {
  const { updateSectionStatus } = useOnboarding();
  const { runtime, updateSetupStatus } = useRestaurantRuntime();

  useEffect(() => {
    // Por enquanto, marca como completo (cardápio pode ser configurado depois)
    // A implementação completa de cardápio requer integração com o Menu Builder
    updateSectionStatus('menu', 'COMPLETE');
    
    // Atualizar RestaurantRuntimeContext (persistência real)
    if (runtime.restaurant_id) {
      updateSetupStatus('menu', true).catch((error) => {
        console.error('[MenuSection] Erro ao atualizar setup_status:', error);
      });
    }
  }, [updateSectionStatus, runtime.restaurant_id, updateSetupStatus]);

  return (
    <div style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        🍽️ Cardápio
      </h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        O cardápio pode ser configurado após a publicação do restaurante.
        Por enquanto, esta seção está marcada como completa para não bloquear o onboarding.
      </p>
      <div style={{ padding: '16px', backgroundColor: '#e7f3ff', borderRadius: '8px', fontSize: '14px', color: '#666' }}>
        💡 <strong>Dica:</strong> Após publicar, você poderá criar produtos, categorias e receitas na seção de Cardápio ou Menu Builder.
      </div>
    </div>
  );
}
