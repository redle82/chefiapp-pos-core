/**
 * AlertCard - Card de Alerta Individual
 * O5.10: alertas críticos incluem link "Ver runbook" (ALERT_ACTION_CONTRACT).
 */

import React from 'react';
import type { Alert } from '../../core/alerts/AlertEngine';
import { getRunbookUrl } from '../../core/alerts/alertRunbooks';

interface Props {
  alert: Alert;
  onAcknowledge: () => void;
  onResolve: () => void;
  variant?: 'light' | 'dark';
}

const VPC_DARK = { surface: '#141414', border: '#262626', text: '#fafafa', textMuted: '#a3a3a3', radius: 8 };

export function AlertCard({ alert, onAcknowledge, onResolve, variant = 'light' }: Props) {
  const isDark = variant === 'dark';
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📌';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'operational': return '⚙️';
      case 'financial': return '💰';
      case 'human': return '👥';
      case 'system': return '🖥️';
      case 'compliance': return '📋';
      default: return '📌';
    }
  };

  return (
    <div
      style={{
        border: isDark ? `1px solid ${VPC_DARK.border}` : `2px solid ${getSeverityColor(alert.severity)}`,
        borderRadius: isDark ? VPC_DARK.radius : 8,
        padding: 16,
        backgroundColor: isDark ? VPC_DARK.surface : '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{getSeverityIcon(alert.severity)}</span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: isDark ? VPC_DARK.text : undefined }}>
              {alert.title}
            </h3>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: getSeverityColor(alert.severity),
                color: 'white',
              }}
            >
              {alert.severity.toUpperCase()}
            </span>
            <span style={{ fontSize: 16 }}>{getCategoryIcon(alert.category)}</span>
          </div>
          <p style={{ margin: '8px 0', fontSize: 14, color: isDark ? VPC_DARK.textMuted : '#666' }}>
            {alert.message}
          </p>
          <div style={{ fontSize: 12, color: isDark ? VPC_DARK.textMuted : '#999', marginTop: 8 }}>
            Criado em: {alert.createdAt.toLocaleString()}
            {alert.escalationLevel > 0 && (
              <span style={{ color: '#f87171', marginLeft: 12 }}>
                Escalado {alert.escalationLevel}x
              </span>
            )}
            {alert.severity === 'critical' && (
              <span style={{ marginLeft: 12 }}>
                <a
                  href={getRunbookUrl(alert.alertType)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                >
                  Ver runbook
                </a>
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {alert.status === 'active' && (
            <>
              <button
                type="button"
                onClick={onAcknowledge}
                style={{
                  minHeight: 40,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: isDark ? VPC_DARK.radius : 4,
                  cursor: 'pointer',
                }}
              >
                Reconhecer
              </button>
              <button
                type="button"
                onClick={onResolve}
                style={{
                  minHeight: 40,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: isDark ? VPC_DARK.radius : 4,
                  cursor: 'pointer',
                }}
              >
                Resolver
              </button>
            </>
          )}
          {alert.status === 'acknowledged' && (
            <button
              type="button"
              onClick={onResolve}
              style={{
                minHeight: 40,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: isDark ? VPC_DARK.radius : 4,
                cursor: 'pointer',
              }}
            >
              Resolver
            </button>
          )}
          {alert.status === 'resolved' && (
            <span
              style={{
                padding: '8px 16px',
                minHeight: 40,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#22c55e',
                color: 'white',
                borderRadius: isDark ? VPC_DARK.radius : 4,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Resolvido
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
