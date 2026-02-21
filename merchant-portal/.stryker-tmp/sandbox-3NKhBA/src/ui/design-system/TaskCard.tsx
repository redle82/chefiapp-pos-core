// @ts-nocheck
import React from 'react';
import { cn } from '../../ui/design-system/tokens';
import './TaskCard.css';

interface TaskCardProps {
  taskId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignedTo?: string;
  assignedAt?: Date;
  dueAt?: Date;
  requiresValidation?: boolean;
  validatedBy?: string;
  notes?: string;
  onClick?: () => void;
  onAction?: (action: 'start' | 'complete' | 'validate') => void;
  compact?: boolean;
}

/**
 * TaskCard: Display individual task for worker/manager
 * Status: pending → in-progress → completed
 * Priority: low (blue) → medium (orange) → critical (red)
 * Critical tasks require double validation
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  title,
  description,
  status,
  priority = 'medium',
  assignedTo,
  assignedAt: _assignedAt,
  dueAt,
  requiresValidation,
  validatedBy,
  notes,
  onClick,
  onAction,
  compact = false,
}) => {
  const statusLabels = {
    pending: 'Pendente',
    'in-progress': 'Em Progresso',
    completed: 'Concluída',
    overdue: 'Atrasada',
  };

  const priorityColors = {
    low: '#2196F3',
    medium: '#FF9800',
    high: '#FFC107', // Added high
    critical: '#EF5350',
  };

  const getDueTimeString = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return '⚠ Atrasada';
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div
      className={cn(
        'task-card',
        `task-card--${status}`,
        `task-card--${priority}`,
        compact ? 'task-card--compact' : '',
        priority === 'critical' ? 'task-card--critical' : ''
      )}
      onClick={onClick}
      style={{
        borderLeftColor: priorityColors[priority],
      }}
    >
      {/* Header */}
      <div className="task-card__header">
        <div className="task-card__title-priority">
          <h4 className="task-card__title">{title}</h4>
          {priority === 'critical' && (
            <span className="task-card__critical-badge">CRÍTICA</span>
          )}
        </div>
        <span className="task-card__status" style={{ backgroundColor: priorityColors[priority] }}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Description */}
      {description && !compact && (
        <p className="task-card__description">{description}</p>
      )}

      {/* Metadata */}
      {!compact && (
        <div className="task-card__meta">
          {assignedTo && (
            <div className="task-card__meta-item">
              <span className="task-card__meta-label">Atribuído a</span>
              <span className="task-card__meta-value">{assignedTo}</span>
            </div>
          )}
          {dueAt && (
            <div className="task-card__meta-item">
              <span className="task-card__meta-label">Vencimento</span>
              <span className="task-card__meta-value">{getDueTimeString(dueAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {notes && !compact && (
        <div className="task-card__notes">
          <span className="task-card__notes-label">Observações:</span>
          <span className="task-card__notes-text">{notes}</span>
        </div>
      )}

      {/* Validation Status */}
      {requiresValidation && !compact && (
        <div className="task-card__validation">
          {validatedBy ? (
            <span className="task-card__validated">
              ✓ Validada por {validatedBy}
            </span>
          ) : (
            <span className="task-card__pending-validation">
              ⚠ Aguardando validação (dupla)
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {onAction && !compact && (
        <div className="task-card__actions">
          {status === 'pending' && (
            <button
              className="task-card__action-btn task-card__action-btn--start"
              onClick={(e) => {
                e.stopPropagation();
                onAction('start');
              }}
            >
              Iniciar
            </button>
          )}
          {status === 'in-progress' && (
            <button
              className="task-card__action-btn task-card__action-btn--complete"
              onClick={(e) => {
                e.stopPropagation();
                onAction('complete');
              }}
            >
              Concluir
            </button>
          )}
          {status === 'in-progress' && priority === 'critical' && requiresValidation && (
            <button
              className="task-card__action-btn task-card__action-btn--validate"
              onClick={(e) => {
                e.stopPropagation();
                onAction('validate');
              }}
            >
              Validar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
