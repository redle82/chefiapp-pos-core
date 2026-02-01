/**
 * MentorInsights - Insights e Resumo da Mentoria
 */

import React from 'react';
import { useMentor } from '../../context/MentorContext';

export function MentorInsights() {
  const { suggestions, recommendations, config: _config } = useMentor();

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending').length;
  const criticalSuggestions = suggestions.filter(s => s.priority === 'critical').length;
  const pendingRecommendations = recommendations.filter(r => r.status === 'pending').length;
  const transformativeRecommendations = recommendations.filter(r => r.estimatedImpact === 'transformative').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#667eea', marginBottom: '8px' }}>
          {pendingSuggestions}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>Sugestões Pendentes</div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#dc3545', marginBottom: '8px' }}>
          {criticalSuggestions}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>Sugestões Críticas</div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#28a745', marginBottom: '8px' }}>
          {pendingRecommendations}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>Recomendações Pendentes</div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#9c27b0', marginBottom: '8px' }}>
          {transformativeRecommendations}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>Recomendações Transformadoras</div>
      </div>
    </div>
  );
}
