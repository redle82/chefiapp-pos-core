// @ts-nocheck
import React from 'react';
import { cn } from './tokens';
import './KpiCard.css';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
    period: string;
  };
  state?: 'healthy' | 'warning' | 'critical';
  onClick?: () => void;
  layout?: 'vertical' | 'horizontal';
}

/**
 * KpiCard: Executive-level metric display
 * Shows single number with trend and state indicator
 * State: 🟢 healthy (green) → 🟡 warning (orange) → 🔴 critical (red)
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  state = 'healthy',
  onClick,
  layout = 'vertical',
}) => {
  const stateColors = {
    healthy: { bg: 'rgba(76, 175, 80, 0.08)', text: '#4CAF50', indicator: '🟢' },
    warning: { bg: 'rgba(255, 152, 0, 0.08)', text: '#FF9800', indicator: '🟡' },
    critical: { bg: 'rgba(239, 83, 80, 0.08)', text: '#EF5350', indicator: '🔴' },
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    flat: '→',
  };

  const trendColors = {
    up: '#4CAF50',
    down: '#EF5350',
    flat: '#FF9800',
  };

  return (
    <div
      className={cn(
        'kpi-card',
        `kpi-card--${state}`,
        `kpi-card--${layout}`
      )}
      onClick={onClick}
      style={{
        backgroundColor: stateColors[state].bg,
        borderLeftColor: stateColors[state].text,
      }}
    >
      {/* Icon + Label */}
      <div className="kpi-card__header">
        {icon && <span className="kpi-card__icon">{icon}</span>}
        <span className="kpi-card__label">{label}</span>
        {state && (
          <span className="kpi-card__state-indicator" title={state}>
            {stateColors[state].indicator}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="kpi-card__value-section">
        <span className="kpi-card__value">{value}</span>
      </div>

      {/* Trend */}
      {trend && (
        <div className="kpi-card__trend" style={{ color: trendColors[trend.direction] }}>
          <span className="kpi-card__trend-icon">{trendIcons[trend.direction]}</span>
          <span className="kpi-card__trend-text">
            {Math.abs(trend.percentage)}% {trend.period}
          </span>
        </div>
      )}

      {/* Subtext */}
      {subtext && <p className="kpi-card__subtext">{subtext}</p>}
    </div>
  );
};

export default KpiCard;
