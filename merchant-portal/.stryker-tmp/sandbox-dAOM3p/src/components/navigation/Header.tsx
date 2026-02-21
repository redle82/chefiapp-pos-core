/**
 * Header - Cabeçalho reutilizável
 */
// @ts-nocheck


import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
}

export function Header({ title, subtitle, actions, onBack }: Props) {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ←
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title}</h1>
          {subtitle && (
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
