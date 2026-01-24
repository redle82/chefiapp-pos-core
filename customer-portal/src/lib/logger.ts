/**
 * Logger Service - Customer Portal
 * 
 * Lightweight logging with Sentry integration for error tracking.
 */

import * as Sentry from '@sentry/react';

// ============================================================================
// SENTRY INITIALIZATION
// ============================================================================

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry(): void {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      debug: import.meta.env.DEV,
      tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
    });
  }
}

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  restaurantSlug?: string;
  userId?: string;
  orderId?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Log an error
 */
export function logError(error: Error | string, context?: LogContext): void {
  const message = error instanceof Error ? error.message : error;
  
  console.error('[ERROR]', message, context);
  
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('error_context', context);
        if (context.restaurantSlug) {
          scope.setTag('restaurant_slug', context.restaurantSlug);
        }
      }
      
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    });
  }
}

/**
 * Log a warning
 */
export function logWarning(message: string, context?: LogContext): void {
  console.warn('[WARN]', message, context);
  
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, 'warning');
  }
}

/**
 * Log info (only in dev)
 */
export function logInfo(message: string, data?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.log('[INFO]', message, data);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>
): void {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category: category || 'navigation',
      data,
      level: 'info',
    });
  }
}

/**
 * Set user context
 */
export function setUserContext(userId?: string, restaurantSlug?: string): void {
  if (SENTRY_DSN) {
    if (userId) {
      Sentry.setUser({ id: userId });
    }
    if (restaurantSlug) {
      Sentry.setTag('restaurant_slug', restaurantSlug);
    }
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

// Re-export Sentry for advanced use
export { Sentry };
