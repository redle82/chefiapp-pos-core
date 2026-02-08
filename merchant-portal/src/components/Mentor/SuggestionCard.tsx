/**
 * SuggestionCard - Card de Sugestão Individual
 */

import React from 'react';
import { useMentor } from '../../context/MentorContext';
import type { MentorSuggestion } from '../../core/mentor/MentorEngine';

interface Props {
  suggestion: MentorSuggestion;
}

export function SuggestionCard({ suggestion }: Props) {
  const { acknowledgeSuggestion, applySuggestion, dismissSuggestion } = useMentor();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'operational': return '⚙️';
      case 'financial': return '💰';
      case 'human': return '👥';
      case 'system': return '🖥️';
      case 'growth': return '📈';
      default: return '📌';
    }
  };

  return (
    <div
      style={{
        border: `2px solid ${getPriorityColor(suggestion.priority)}`,
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>{getCategoryIcon(suggestion.category)}</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              {suggestion.title}
            </h3>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: getPriorityColor(suggestion.priority),
                color: 'white',
              }}
            >
              {suggestion.priority.toUpperCase()}
            </span>
          </div>
          <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
            {suggestion.message}
          </p>
          {suggestion.reasoning && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
              <strong>Por quê:</strong> {suggestion.reasoning}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            Criado em: {suggestion.createdAt.toLocaleString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {suggestion.status === 'pending' && (
            <>
              <button
                onClick={() => acknowledgeSuggestion(suggestion.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Reconhecer
              </button>
              <button
                onClick={() => applySuggestion(suggestion.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Aplicar
              </button>
              <button
                onClick={() => dismissSuggestion(suggestion.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Dispensar
              </button>
            </>
          )}
          {suggestion.status === 'acknowledged' && (
            <button
              onClick={() => applySuggestion(suggestion.id)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Aplicar
            </button>
          )}
          {suggestion.status === 'applied' && (
            <span style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
              Aplicada
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
