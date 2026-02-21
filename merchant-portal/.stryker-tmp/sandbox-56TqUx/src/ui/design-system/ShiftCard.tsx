// @ts-nocheck
import React from 'react';
import { cn } from '../../ui/design-system/tokens';
import './ShiftCard.css';

interface ShiftCardProps {
  shiftId: string;
  workerName: string;
  role: 'garcom' | 'cozinheiro' | 'gerente' | 'dono';
  status: 'pending' | 'active' | 'completed' | 'absent';
  startTime: Date;
  endTime?: Date;
  riskLevel?: string; // Loosened from 'low' | 'medium' | 'high' | 'critical'
  activeTaskCount?: number;
  complianceStatus?: 'ok' | 'warning' | 'alert';
  onClick?: () => void;
  onAction?: (action: 'start' | 'end' | 'close' | 'view_details') => void;
  compact?: boolean;
}

/**
 * ShiftCard: Display worker shift for manager/owner
 * Status: pending → active → completed
 * Risk Level: low (green) → medium (orange) → high (red)
 * Shows worker status, active tasks, compliance alerts
 */
export const ShiftCard: React.FC<ShiftCardProps> = ({
  workerName,
  role,
  status,
  startTime,
  endTime,
  riskLevel = 'low',
  activeTaskCount = 0,
  complianceStatus = 'ok',
  onClick,
  onAction,
  compact = false,
}) => {
  const statusLabels = {
    pending: 'Agendada',
    active: 'Em Turno',
    completed: 'Encerrada',
    absent: 'Ausente',
  };

  const roleLabels: Record<string, string> = {
    garcom: '🍽️ Garçom',
    cozinheiro: '👨‍🍳 Cozinheiro',
    gerente: '📋 Gerente',
    dono: '👑 Dono',
  };

  const riskColors: Record<string, string> = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#EF5350',
    critical: '#D32F2F',
  };

  const complianceIcons = {
    ok: '✓',
    warning: '⚠',
    alert: '🚨',
  };

  const getElapsedTime = (start: Date, end?: Date) => {
    const now = end || new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const currentRiskColor = riskColors[riskLevel] || riskColors.low;

  return (
    <div
      className={cn(
        'shift-card',
        `shift-card--${status}`,
        `shift-card--${riskLevel}`,
        compact ? 'shift-card--compact' : ''
      )}
      onClick={onClick}
      style={{
        borderLeftColor: currentRiskColor,
      }}
    >
      {/* Header */}
      <div className="shift-card__header">
        <div className="shift-card__worker-info">
          <h4 className="shift-card__worker-name">{workerName}</h4>
          <span className="shift-card__role">{roleLabels[role] || role}</span>
        </div>
        <div className="shift-card__badges">
          <span className="shift-card__status" style={{ backgroundColor: currentRiskColor }}>
            {statusLabels[status]}
          </span>
          {complianceStatus !== 'ok' && (
            <span className={cn('shift-card__compliance', `shift-card__compliance--${complianceStatus}`)}>
              {complianceIcons[complianceStatus]}
            </span>
          )}
        </div>
      </div>

      {/* Shift Time */}
      {!compact && (
        <div className="shift-card__time-info">
          <div className="shift-card__time-item">
            <span className="shift-card__time-label">Início</span>
            <span className="shift-card__time-value">{formatTime(startTime)}</span>
          </div>
          {endTime && (
            <div className="shift-card__time-item">
              <span className="shift-card__time-label">Fim</span>
              <span className="shift-card__time-value">{formatTime(endTime)}</span>
            </div>
          )}
          {status === 'active' && (
            <div className="shift-card__time-item shift-card__time-item--elapsed">
              <span className="shift-card__time-label">Decorrido</span>
              <span className="shift-card__time-value">{getElapsedTime(startTime)}</span>
            </div>
          )}
        </div>
      )}

      {/* Active Tasks */}
      {activeTaskCount > 0 && !compact && (
        <div className="shift-card__tasks">
          <span className="shift-card__tasks-label">Tarefas Ativas</span>
          <span className="shift-card__tasks-count">{activeTaskCount}</span>
        </div>
      )}

      {/* Risk/Compliance Alert */}
      {(riskLevel !== 'low' || complianceStatus !== 'ok') && !compact && (
        <div className={cn('shift-card__alert', `shift-card__alert--${riskLevel || complianceStatus}`)}>
          {riskLevel === 'high' && '⚠ Risco Alto'}
          {riskLevel === 'medium' && '⚠ Risco Médio'}
          {riskLevel === 'critical' && '⚠ Risco Crítico'}
          {complianceStatus === 'alert' && '🚨 Conformidade Crítica'}
          {complianceStatus === 'warning' && '⚠ Conformidade em Revisão'}
        </div>
      )}

      {/* Actions */}
      {onAction && !compact && (
        <div className="shift-card__actions">
          {status === 'pending' && (
            <button
              className="shift-card__action-btn shift-card__action-btn--start"
              onClick={(e) => {
                e.stopPropagation();
                onAction('start');
              }}
            >
              Iniciar Turno
            </button>
          )}
          {status === 'active' && (
            <button
              className="shift-card__action-btn shift-card__action-btn--end"
              onClick={(e) => {
                e.stopPropagation();
                onAction('end');
              }}
            >
              Encerrar Turno
            </button>
          )}
          {status === 'completed' && (
            <button
              className="shift-card__action-btn shift-card__action-btn--close"
              onClick={(e) => {
                e.stopPropagation();
                onAction('close');
              }}
            >
              Fechar Turno
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ShiftCard;
