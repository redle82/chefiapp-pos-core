/**
 * SetupItem - Item Individual da Sidebar
 * 
 * Mostra status visual (cinza/amarelo/verde) e é clicável
 */

import React, { memo } from 'react';
import { type SetupStatus } from '../../context/OnboardingContext';

export interface SetupSectionConfig {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

interface Props {
  config: SetupSectionConfig;
  status: SetupStatus;
  isActive: boolean;
  onClick: () => void;
}

export const SetupItem = memo(function SetupItem({ config, status, isActive, onClick }: Props) {
  const statusConfig = getStatusConfig(status);

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '12px 16px',
        backgroundColor: isActive ? '#e7f0ff' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s ease',
        borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Ícone */}
      <div
        style={{
          fontSize: '20px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          backgroundColor: statusConfig.badgeColor,
          color: statusConfig.badgeTextColor,
        }}
      >
        {config.icon}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: isActive ? 600 : 500,
            color: '#1a1a1a',
            marginBottom: '2px',
          }}
        >
          {config.label}
        </div>
        {config.description && (
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {config.description}
          </div>
        )}
      </div>

      {/* Badge de Status */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusConfig.badgeColor,
          flexShrink: 0,
        }}
        title={statusConfig.label}
      />
    </button>
  );
}, (prevProps, nextProps) => {
  // Só re-renderizar se status ou isActive mudarem
  return (
    prevProps.status === nextProps.status &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.config.id === nextProps.config.id
  );
});

function getStatusConfig(status: SetupStatus) {
  switch (status) {
    case 'NOT_STARTED':
      return {
        label: 'Não iniciado',
        badgeColor: '#e0e0e0',
        badgeTextColor: '#666',
      };
    case 'INCOMPLETE':
      return {
        label: 'Incompleto',
        badgeColor: '#ffc107',
        badgeTextColor: '#fff',
      };
    case 'COMPLETE':
      return {
        label: 'Completo',
        badgeColor: '#28a745',
        badgeTextColor: '#fff',
      };
  }
}
