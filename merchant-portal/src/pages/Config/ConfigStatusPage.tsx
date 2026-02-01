/**
 * ConfigStatusPage - Status e Publicação
 * 
 * Mostra status do restaurante e permite republicar/desativar.
 */

import React from 'react';
import { PublishSection } from '../Onboarding/sections/PublishSection';

export function ConfigStatusPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, marginBottom: '8px' }}>
          Estado do Restaurante
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Visualize o status atual e gerencie a publicação do restaurante.
        </p>
      </div>

      {/* Reutiliza a mesma seção do onboarding */}
      <PublishSection />
    </div>
  );
}
