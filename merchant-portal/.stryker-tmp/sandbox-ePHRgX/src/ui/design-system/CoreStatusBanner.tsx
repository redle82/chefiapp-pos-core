// @ts-nocheck
import React from 'react';
import type { CoreHealthStatus } from '../../core/health';
import { cn } from './tokens';
import './CoreStatusBanner.css';

interface CoreStatusBannerProps {
  status: CoreHealthStatus;
  lastChecked?: number | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * CoreStatusBanner: Global system health indicator
 *
 * TRUTH LOCK: This banner NEVER lies about system status.
 * - Shows when system is DOWN or DEGRADED
 * - Hidden when UP (no noise)
 * - UNKNOWN shows checking state
 *
 * Position: Fixed at top of viewport, above all content
 */
export const CoreStatusBanner: React.FC<CoreStatusBannerProps> = ({
  status,
  lastChecked,
  onRetry,
  className,
}) => {
  // Don't render when system is UP
  if (status === 'UP') {
    return null;
  }

  const config = {
    DOWN: {
      type: 'error' as const,
      icon: '⚠',
      message: 'Sistema indisponível. Algumas funcionalidades podem estar limitadas.',
      showRetry: true,
    },
    DEGRADED: {
      type: 'warning' as const,
      icon: '⏱',
      message: 'Lentidão detectada. Operações podem demorar mais que o normal.',
      showRetry: false,
    },
    UNKNOWN: {
      type: 'info' as const,
      icon: '↻',
      message: 'A verificar estado do sistema...',
      showRetry: false,
    },
  };

  const currentConfig = config[status];

  const formatLastChecked = (timestamp: number | null | undefined): string => {
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `Verificado ha ${diff}s`;
    if (diff < 3600) return `Verificado ha ${Math.floor(diff / 60)}min`;
    return `Verificado ha ${Math.floor(diff / 3600)}h`;
  };

  return (
    <div
      className={cn(
        'core-status-banner',
        `core-status-banner--${currentConfig.type}`,
        status === 'UNKNOWN' && 'core-status-banner--checking',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="core-status-banner__content">
        <span className="core-status-banner__icon" aria-hidden="true">
          {currentConfig.icon}
        </span>

        <span className="core-status-banner__message">
          {currentConfig.message}
        </span>

        {lastChecked && status !== 'UNKNOWN' && (
          <span className="core-status-banner__time">
            {formatLastChecked(lastChecked)}
          </span>
        )}
      </div>

      {currentConfig.showRetry && onRetry && (
        <button
          className="core-status-banner__retry"
          onClick={onRetry}
          aria-label="Tentar novamente"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
};

export default CoreStatusBanner;
