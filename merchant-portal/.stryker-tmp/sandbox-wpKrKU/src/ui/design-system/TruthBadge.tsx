import React from 'react';
import { cn } from './tokens';
import './TruthBadge.css';

interface TruthBadgeProps {
  state: 'ghost' | 'live';
  showLabel?: boolean;
  className?: string;
}

/**
 * TruthBadge: Visual indicator of publication state
 * - ghost: unpublished (red)
 * - live: published/active (green)
 */
export const TruthBadge: React.FC<TruthBadgeProps> = ({
  state,
  showLabel = true,
  className,
}) => {
  const label = state === 'ghost' ? 'Em Setup' : 'Publicado';
  const icon = state === 'ghost' ? '⭕' : '✓';

  return (
    <div
      className={cn(
        'truth-badge',
        `truth-badge--${state}`,
        className
      )}
      title={state === 'ghost' ? 'Não publicado (em setup)' : 'Publicado e ativo'}
    >
      <span className="truth-badge__icon">{icon}</span>
      {showLabel && <span className="truth-badge__label">{label}</span>}
    </div>
  );
};

export default TruthBadge;
