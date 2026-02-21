import React from 'react';
import { cn } from './tokens';
import './RiskChip.css';

interface RiskChipProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  value?: number;
  label?: string;
  className?: string;
}

/**
 * RiskChip: Visual indicator for risk levels
 * Used in AppStaff for task and worker risk display
 */
export const RiskChip: React.FC<RiskChipProps> = ({
  level,
  value,
  label,
  className,
}) => {
  const labels: Record<string, string> = {
    LOW: 'Baixo',
    MEDIUM: 'Médio',
    HIGH: 'Alto',
  };

  const icons: Record<string, string> = {
    LOW: '✓',
    MEDIUM: '⚠',
    HIGH: '!',
  };

  const displayLabel = label || labels[level];

  return (
    <div
      className={cn(
        'risk-chip',
        `risk-chip--${level.toLowerCase()}`,
        className
      )}
    >
      <span className="risk-chip__icon">{icons[level]}</span>
      <span className="risk-chip__label">{displayLabel}</span>
      {value !== undefined && <span className="risk-chip__value">{value}</span>}
    </div>
  );
};

export default RiskChip;
