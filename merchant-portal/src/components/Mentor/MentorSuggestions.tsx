/**
 * MentorSuggestions - Lista de Sugestões da IA
 */

import React from 'react';
import { useMentor } from '../../context/MentorContext';
import { SuggestionCard } from './SuggestionCard';

export function MentorSuggestions() {
  const { suggestions } = useMentor();

  if (suggestions.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <p>Nenhuma sugestão pendente</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {suggestions.map((suggestion) => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
}
