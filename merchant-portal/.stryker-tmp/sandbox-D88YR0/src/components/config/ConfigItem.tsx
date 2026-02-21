/**
 * ConfigItem - Item Individual da Sidebar de Configuração
 * 
 * Similar ao SetupItem, mas sem status (sempre "completo" após publicação)
 */

import React, { memo } from 'react';
import type { ConfigSectionConfig } from './types';

interface Props {
  config: ConfigSectionConfig;
  isActive: boolean;
  onClick: () => void;
  isChild?: boolean;
}

export const ConfigItem = memo(function ConfigItem({ 
  config, 
  isActive, 
  onClick,
  isChild = false 
}: Props) {
  const VPC = { surface: '#141414', border: '#262626', text: '#fafafa', textMuted: '#a3a3a3', accent: '#22c55e', radius: 8 };

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: isChild ? '8px 12px' : '12px 16px',
        backgroundColor: isActive ? VPC.surface : 'transparent',
        border: 'none',
        borderRadius: VPC.radius,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.2s ease',
        borderLeft: isActive ? `3px solid ${VPC.accent}` : '3px solid transparent',
        fontSize: isChild ? 13 : 14,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = VPC.surface;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div
        style={{
          fontSize: isChild ? 16 : 20,
          width: isChild ? 24 : 32,
          height: isChild ? 24 : 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          backgroundColor: isActive ? VPC.accent : VPC.surface,
          color: isActive ? '#fff' : VPC.textMuted,
        }}
      >
        {config.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: isChild ? 13 : 14,
            fontWeight: isActive ? 600 : 500,
            color: VPC.text,
            marginBottom: config.description && !isChild ? 2 : 0,
          }}
        >
          {config.label}
        </div>
        {config.description && !isChild && (
          <div
            style={{
              fontSize: 12,
              color: VPC.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {config.description}
          </div>
        )}
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  // Só re-renderizar se isActive mudar
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.config.id === nextProps.config.id &&
    prevProps.isChild === nextProps.isChild
  );
});
