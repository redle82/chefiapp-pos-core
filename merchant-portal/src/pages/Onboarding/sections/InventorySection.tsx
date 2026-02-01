/**
 * InventorySection - Seção de Estoque
 * Configuração básica de estoque (pode ser expandida depois)
 */

import React, { useEffect } from 'react';
import { useOnboarding } from '../../../context/OnboardingContext';

export function InventorySection() {
  const { updateSectionStatus } = useOnboarding();

  useEffect(() => {
    // Por enquanto, marca como completo (estoque pode ser configurado depois)
    // A implementação completa de estoque requer integração com o sistema de inventário
    updateSectionStatus('inventory', 'COMPLETE');
  }, [updateSectionStatus]);

  return (
    <div style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        📦 Estoque
      </h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        O estoque pode ser configurado após a publicação do restaurante.
        Por enquanto, esta seção está marcada como completa para não bloquear o onboarding.
      </p>
      <div style={{ padding: '16px', backgroundColor: '#e7f3ff', borderRadius: '8px', fontSize: '14px', color: '#666' }}>
        💡 <strong>Dica:</strong> Após publicar, você poderá configurar ingredientes, quantidades mínimas e alertas de estoque na seção de Estoque.
      </div>
    </div>
  );
}
