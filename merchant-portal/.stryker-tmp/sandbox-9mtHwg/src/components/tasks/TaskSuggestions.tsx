/**
 * TaskSuggestions - Sugestões da IA para Tarefas
 */

import React from 'react';
import type { TaskSuggestion } from '../../core/tasks/TaskMentor';

interface Props {
  suggestions: TaskSuggestion[];
  variant?: 'light' | 'dark';
}

const VPC_DARK = { surface: '#141414', border: '#262626', text: '#fafafa', textMuted: '#a3a3a3', radius: 8 };

export function TaskSuggestions({ suggestions, variant = 'light' }: Props) {
  const isDark = variant === 'dark';
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return '⚠️';
      case 'optimization': return '🚀';
      case 'recommendation': return '💡';
      default: return '📌';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#ffc107';
      case 'normal': return '#007bff';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 12,
        color: isDark ? VPC_DARK.text : undefined,
      }}>
        💡 Sugestões da IA
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            style={{
              border: `1px solid ${isDark ? VPC_DARK.border : getPriorityColor(suggestion.priority)}`,
              borderRadius: isDark ? VPC_DARK.radius : 8,
              padding: 16,
              backgroundColor: isDark ? VPC_DARK.surface : '#f8f9fa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{getTypeIcon(suggestion.type)}</span>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isDark ? VPC_DARK.text : undefined }}>
                {suggestion.title}
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: isDark ? VPC_DARK.textMuted : '#666' }}>
              {suggestion.description}
            </p>
            {suggestion.action && (
              <button
                style={{
                  marginTop: 8,
                  padding: '8px 16px',
                  minHeight: 40,
                  backgroundColor: getPriorityColor(suggestion.priority),
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {suggestion.action}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
