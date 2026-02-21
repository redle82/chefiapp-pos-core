/**
 * AlertCard - Card de alerta reutilizável
 * 
 * Usado para mostrar alertas prioritários com ação
 */
// @ts-nocheck


import React from 'react';

interface AlertCardProps {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function AlertCard({ severity, title, message, action }: AlertCardProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#667eea';
      default: return '#6c757d';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '16px',
        border: `2px solid ${getSeverityColor()}`,
      }}
    >
      <div style={{
        fontSize: '14px',
        fontWeight: 600,
        color: getSeverityColor(),
        marginBottom: '8px',
      }}>
        {getSeverityIcon()} {title}
      </div>
      <div style={{ fontSize: '14px', color: '#666', marginBottom: action ? '12px' : '0' }}>
        {message}
      </div>
      {action && (
        <button
          onClick={action.onPress}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: getSeverityColor(),
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
