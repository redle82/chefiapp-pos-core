// @ts-nocheck
import React from 'react';
import { cn } from './tokens';
import { TruthBadge } from './TruthBadge';
import './TopBar.css';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  state?: 'ghost' | 'live';
  showTruthBadge?: boolean;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * TopBar: Application header
 * - Title + optional subtitle
 * - TruthBadge for ghost/live state
 * - Left/right action slots
 * - Touch-friendly height (56px)
 */
export const TopBar: React.FC<TopBarProps> = ({
  title = 'ChefIApp',
  subtitle,
  state,
  showTruthBadge = false,
  leftAction,
  rightAction,
  className,
}) => {
  return (
    <header className={cn('topbar', className)}>
      <div className="topbar__left">
        {leftAction || (
          <div className="topbar__logo">
            <span className="topbar__logo-icon">🍳</span>
          </div>
        )}
      </div>

      <div className="topbar__center">
        <h1 className="topbar__title">{title}</h1>
        {subtitle && <p className="topbar__subtitle">{subtitle}</p>}
      </div>

      <div className="topbar__right">
        {showTruthBadge && state && (
          <TruthBadge state={state} showLabel />
        )}
        {rightAction}
      </div>
    </header>
  );
};

export default TopBar;
