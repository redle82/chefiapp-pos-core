/**
 * EmptyState - Estado vazio reutilizável
 */
// @ts-nocheck


import React from 'react';

interface Props {
  title: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ title, message, action }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
        {title}
      </h2>
      {message && (
        <p style={{ margin: 0, fontSize: '14px', color: '#666', marginBottom: '24px' }}>
          {message}
        </p>
      )}
      {action && (
        <button
          onClick={action.onPress}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
