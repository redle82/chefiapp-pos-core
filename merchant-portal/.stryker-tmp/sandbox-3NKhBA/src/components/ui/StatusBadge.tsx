/**
 * StatusBadge - Badge de status reutilizável
 * 
 * Usado para mostrar status visual (sucesso, aviso, perigo, info)
 */
// @ts-nocheck


import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info';
  label: string;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, label, size = 'medium' }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      case 'info': return '#667eea';
      default: return '#6c757d';
    }
  };

  const fontSize = size === 'small' ? '12px' : '14px';
  const padding = size === 'small' ? '4px 8px' : '6px 12px';

  return (
    <span
      style={{
        fontSize,
        padding,
        borderRadius: '4px',
        backgroundColor: getStatusColor(),
        color: '#fff',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}
