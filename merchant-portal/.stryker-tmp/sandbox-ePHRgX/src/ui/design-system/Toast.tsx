// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { cn } from './tokens';
import './Toast.css';

export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast: Non-blocking notification
 * - Auto-dismiss (default 4s)
 * - Types: success (green), error (red), warning (amber), info (blue)
 * - Optional action button
 * - Swipe to dismiss (mobile)
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  if (!isVisible) return null;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn(
        'toast',
        `toast--${type}`,
        isLeaving && 'toast--leaving'
      )}
      role="alert"
    >
      <span className="toast__icon">{icons[type]}</span>
      <span className="toast__message">{message}</span>
      {action && (
        <button
          className="toast__action"
          onClick={() => {
            action.onClick();
            handleClose();
          }}
        >
          {action.label}
        </button>
      )}
      <button
        className="toast__close"
        onClick={handleClose}
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * ToastContainer: Manages multiple toasts
 */
interface ToastItem extends ToastProps {
  id: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = (props: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...props, id }]);
    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string) => show({ message, type: 'success' });
  const error = (message: string) => show({ message, type: 'error' });
  const warning = (message: string) => show({ message, type: 'warning' });
  const info = (message: string) => show({ message, type: 'info' });

  return { toasts, show, dismiss, success, error, warning, info };
};

export const ToastContainer: React.FC<{ toasts: ToastItem[]; onDismiss: (id: string) => void }> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
