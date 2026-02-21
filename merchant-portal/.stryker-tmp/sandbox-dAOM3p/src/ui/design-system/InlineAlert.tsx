// @ts-nocheck
import React from 'react';
import { cn } from './tokens';
import './InlineAlert.css';

interface InlineAlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

/**
 * InlineAlert: In-context notification
 * - Stays in document flow (not floating)
 * - Types: success, error, warning, info
 * - Optional title, action, dismiss
 * - Use for form errors, page notices
 */
export const InlineAlert: React.FC<InlineAlertProps> = ({
  type = 'info',
  title,
  message,
  action,
  onDismiss,
  className,
}) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn('inline-alert', `inline-alert--${type}`, className)}
      role="alert"
    >
      <span className="inline-alert__icon">{icons[type]}</span>

      <div className="inline-alert__content">
        {title && <strong className="inline-alert__title">{title}</strong>}
        <p className="inline-alert__message">{message}</p>

        {action && (
          <button className="inline-alert__action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          className="inline-alert__dismiss"
          onClick={onDismiss}
          aria-label="Fechar"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default InlineAlert;
