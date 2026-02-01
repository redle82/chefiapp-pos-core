/**
 * MentorDashboardPage - Dashboard de Mentoria IA
 * 
 * Mostra sugestões, recomendações e insights da IA
 */

import React, { useEffect } from 'react';
import { MentorProvider, useMentor } from '../../context/MentorContext';
import { MentorSuggestions } from '../../components/Mentor/MentorSuggestions';
import { MentorRecommendations } from '../../components/Mentor/MentorRecommendations';
import { MentorInsights } from '../../components/Mentor/MentorInsights';
import { useRestaurantId } from '../../core/hooks/useRestaurantId';

function MentorDashboardContent() {
  const { loading, analyzeSystem } = useMentor();

  useEffect(() => {
    // Analisar sistema ao carregar
    if (analyzeSystem) {
      analyzeSystem().catch(console.error);
    }
  }, [analyzeSystem]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
        <p style={{ color: '#666' }}>Carregando mentoria...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Mentoria IA</h1>
        <button
          onClick={() => analyzeSystem && analyzeSystem()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🔍 Analisar Sistema
        </button>
      </div>

      {/* Insights */}
      <MentorInsights />

      {/* Recomendações */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Recomendações</h2>
        <MentorRecommendations />
      </div>

      {/* Sugestões */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Sugestões</h2>
        <MentorSuggestions />
      </div>
    </div>
  );
}

export function MentorDashboardPage() {
  const { restaurantId, loading: loadingRestaurantId } = useRestaurantId();

  if (loadingRestaurantId || !restaurantId) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#666' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <MentorProvider restaurantId={restaurantId}>
      <MentorDashboardContent />
    </MentorProvider>
  );
}
