/**
 * MentorRecommendations - Lista de Recomendações da IA
 */

import React from 'react';
import { useMentor } from '../../context/MentorContext';
import { RecommendationCard } from './RecommendationCard';

export function MentorRecommendations() {
  const { recommendations } = useMentor();

  if (recommendations.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <p>Nenhuma recomendação pendente</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {recommendations.map((recommendation) => (
        <RecommendationCard key={recommendation.id} recommendation={recommendation} />
      ))}
    </div>
  );
}
