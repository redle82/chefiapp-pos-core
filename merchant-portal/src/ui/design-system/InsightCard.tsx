import React from 'react';
import { cn } from './tokens';
import './InsightCard.css';

interface InsightCardProps {
  type: 'warning' | 'opportunity' | 'insight' | 'action';
  title: string;
  description: string;
  metric?: string;
  icon?: string;
  onClick?: () => void;
}

/**
 * InsightCard: Actionable insights derived from TPV + AppStaff + Flow
 * Types: warning (fix now), opportunity (gain), insight (know), action (do)
 */
export const InsightCard: React.FC<InsightCardProps> = ({
  type,
  title,
  description,
  metric,
  icon,
  onClick,
}) => {
  const typeConfig = {
    warning: {
      icon: '⚠️',
      bg: 'rgba(239, 83, 80, 0.08)',
      border: '#ef5350',
      text: '#ef5350',
    },
    opportunity: {
      icon: '💡',
      bg: 'rgba(76, 175, 80, 0.08)',
      border: '#4caf50',
      text: '#4caf50',
    },
    insight: {
      icon: '📊',
      bg: 'rgba(33, 150, 243, 0.08)',
      border: '#2196f3',
      text: '#2196f3',
    },
    action: {
      icon: '→',
      bg: 'rgba(255, 152, 0, 0.08)',
      border: '#ff9800',
      text: '#ff9800',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={cn('insight-card', `insight-card--${type}`)}
      onClick={onClick}
      style={{
        backgroundColor: config.bg,
        borderLeftColor: config.border,
      }}
    >
      <div className="insight-card__header">
        <span className="insight-card__type-icon">{icon || config.icon}</span>
        <h4 className="insight-card__title" style={{ color: config.text }}>
          {title}
        </h4>
      </div>

      <p className="insight-card__description">{description}</p>

      {metric && (
        <div className="insight-card__metric" style={{ color: config.text }}>
          {metric}
        </div>
      )}

      <div className="insight-card__cta" style={{ color: config.text }}>
        Ver detalhes →
      </div>
    </div>
  );
};

export default InsightCard;
