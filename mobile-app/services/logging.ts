/**
 * Logging Service - Centralized error tracking and logging
 *
 * Uses Sentry for error tracking and structured logging
 * Provides consistent logging interface across the app
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Initialize Sentry if DSN is configured
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn ||
                   process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // enableInExpoDevelopment: false, removed in v7, handle via environment logic if needed
    debug: __DEV__, // Enable debug in development
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in prod
    beforeSend(event, hint) {
      // Filter out known non-critical errors in development
      if (__DEV__) {
        // You can add filters here if needed
      }
      return event;
    },
  });
}

// ============================================================================
// TYPES
// ============================================================================

export interface LogContext {
  userId?: string;
  restaurantId?: string;
  orderId?: string;
  tableId?: string;
  action?: string;
  [key: string]: any; // Allow additional context
}

export interface LogEvent {
  name: string;
  metadata?: Record<string, any>;
  level?: 'info' | 'warning' | 'error' | 'debug';
}

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log an error with context
 * @param error - Error object or message
 * @param context - Additional context about the error
 */
export async function logError(error: Error | string, context?: LogContext): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log to console in development
  if (__DEV__) {
    console.error('[ERROR]', errorMessage, context || '');
    if (errorStack) {
      console.error('[STACK]', errorStack);
    }
  }

  // Send to Sentry if configured
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      // Add context
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, { value });
        });
      }

      // Set user context if available
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }

      // Capture exception
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(errorMessage, 'error');
      }
    });
  }

  // Send to Supabase audit_logs (structured logging)
  if (context?.restaurantId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('gm_audit_logs').insert({
        tenant_id: context.restaurantId,
        actor_id: context.userId || user?.id || null,
        action: 'ERROR',
        resource_entity: context.action || 'system',
        resource_id: context.orderId || context.tableId || 'unknown',
        metadata: {
          error_message: errorMessage,
          error_stack: errorStack,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
          },
        },
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      // Silently fail - don't break app if audit logging fails
      if (__DEV__) {
        console.warn('[Logging] Failed to write to audit_logs:', e);
      }
    }
  }
}

/**
 * Log an event (non-error)
 * @param event - Event name
 * @param metadata - Additional metadata
 */
export async function logEvent(event: LogEvent | string, metadata?: Record<string, any>): Promise<void> {
  const eventName = typeof event === 'string' ? event : event.name;
  const eventMetadata = typeof event === 'string' ? metadata : event.metadata;
  const level = typeof event === 'string' ? 'info' : (event.level || 'info');

  // Log to console in development
  if (__DEV__) {
    console.log(`[${level.toUpperCase()}]`, eventName, eventMetadata || '');
  }

  // Send to Sentry if configured
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message: eventName,
      level: level as Sentry.SeverityLevel,
      data: eventMetadata,
      timestamp: Date.now() / 1000,
    });

    // For important events, also capture as message
    if (level === 'warning' || level === 'error') {
      Sentry.captureMessage(eventName, level as Sentry.SeverityLevel);
    }
  }

  // Send to Supabase audit_logs for important events
  if (eventMetadata?.restaurantId && (level === 'warning' || level === 'error')) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('gm_audit_logs').insert({
        tenant_id: eventMetadata.restaurantId,
        actor_id: eventMetadata.userId || user?.id || null,
        action: eventName.toUpperCase(),
        resource_entity: eventMetadata.action || 'event',
        resource_id: eventMetadata.orderId || eventMetadata.tableId || 'unknown',
        metadata: {
          level,
          ...eventMetadata,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      // Silently fail - don't break app if audit logging fails
      if (__DEV__) {
        console.warn('[Logging] Failed to write to audit_logs:', e);
      }
    }
  }
}

/**
 * Set user context for all subsequent logs
 * @param userId - User ID
 * @param restaurantId - Restaurant ID (optional)
 */
export function setUserContext(userId: string, restaurantId?: string): void {
  if (SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      restaurantId: restaurantId,
    });
  }

  if (__DEV__) {
    console.log('[USER CONTEXT]', { userId, restaurantId });
  }
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }

  if (__DEV__) {
    console.log('[USER CONTEXT]', 'cleared');
  }
}

/**
 * Add breadcrumb for debugging
 * @param message - Breadcrumb message
 * @param category - Breadcrumb category
 * @param data - Additional data
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, any>
): void {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category: category || 'default',
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }

  if (__DEV__) {
    console.log('[BREADCRUMB]', category || 'default', message, data || '');
  }
}

/**
 * Wrap async function with error logging
 * @param fn - Async function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: LogContext
): T {
  return (async (...args: any[]) => {
    try {
      addBreadcrumb(`Starting ${fn.name}`, 'function', { args: args.length });
      const result = await fn(...args);
      addBreadcrumb(`Completed ${fn.name}`, 'function');
      return result;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        ...context,
        function: fn.name,
        args: args.length,
      });
      throw error;
    }
  }) as T;
}
