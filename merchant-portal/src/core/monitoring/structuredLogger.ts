/**
 * StructuredLogger — Enhanced structured logging with JSON output
 *
 * Wraps the existing Logger with structured output format.
 * Auto-attaches restaurantId, operatorId, sessionId, and version.
 * In production: only warn+ levels are emitted (suppresses debug/info noise).
 *
 * Backwards compatibility: `structuredLogger` is re-exported as a legacy alias.
 */

import { Logger } from "../logger";
import type { LogLevel } from "../logger";

export interface StructuredLogContext {
  restaurantId?: string;
  operatorId?: string;
  sessionId?: string;
  traceId?: string;
  [key: string]: unknown;
}

interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: StructuredLogContext;
  traceId: string;
  version: string;
}

const APP_VERSION = "1.0.0";

function isProduction(): boolean {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      return (import.meta as any).env.PROD === true;
    }
  } catch {
    // fallback
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV === "production";
  }
  return false;
}

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

class StructuredLoggerService {
  private globalContext: StructuredLogContext = {};
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Set persistent context that is attached to every log entry.
   */
  setContext(ctx: Partial<StructuredLogContext>): void {
    this.globalContext = { ...this.globalContext, ...ctx };
  }

  /**
   * Clear all persistent context.
   */
  clearContext(): void {
    this.globalContext = {};
  }

  /**
   * Log a message with structured metadata.
   */
  log(level: LogLevel, message: string, context?: StructuredLogContext): void {
    // In production, suppress debug and info levels
    if (isProduction() && (level === "debug" || level === "info")) {
      return;
    }

    const traceId = context?.traceId ?? generateTraceId();
    const mergedContext: StructuredLogContext = {
      ...this.globalContext,
      sessionId: this.sessionId,
      ...context,
    };

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: mergedContext,
      traceId,
      version: APP_VERSION,
    };

    // Output structured JSON to console for log aggregation
    // eslint-disable-next-line no-console
    console.info(JSON.stringify(entry));

    // Also route through existing Logger for transport pipeline (Sentry, DB, etc.)
    switch (level) {
      case "debug":
        Logger.debug(message, mergedContext as Record<string, any>);
        break;
      case "info":
        Logger.info(message, mergedContext as Record<string, any>);
        break;
      case "warn":
        Logger.warn(message, mergedContext as Record<string, any>);
        break;
      case "error":
        Logger.error(message, undefined, mergedContext as Record<string, any>);
        break;
      case "critical":
        Logger.critical(message, undefined, mergedContext as Record<string, any>);
        break;
    }
  }

  /** Convenience: debug level */
  debug(message: string, context?: StructuredLogContext): void {
    this.log("debug", message, context);
  }

  /** Convenience: info level */
  info(message: string, context?: StructuredLogContext): void {
    this.log("info", message, context);
  }

  /** Convenience: warn level */
  warn(message: string, context?: StructuredLogContext): void {
    this.log("warn", message, context);
  }

  /** Convenience: error level */
  error(message: string, context?: StructuredLogContext): void {
    this.log("error", message, context);
  }

  /** Convenience: fatal/critical level */
  fatal(message: string, context?: StructuredLogContext): void {
    this.log("critical", message, context);
  }
}

/** Singleton structured logger. */
export const StructuredLogger = new StructuredLoggerService();

/**
 * Legacy alias for backwards compatibility.
 * @deprecated Use StructuredLogger instead.
 */
export const structuredLogger = {
  async info(message: string, data?: Record<string, any>): Promise<void> {
    StructuredLogger.info(message, data);
  },
  async warn(message: string, data?: Record<string, any>): Promise<void> {
    StructuredLogger.warn(message, data);
  },
  async error(message: string, errorOrData?: Error | Record<string, any>, data?: Record<string, any>): Promise<void> {
    if (errorOrData instanceof Error) {
      StructuredLogger.error(message, { error: errorOrData.message, ...data });
    } else {
      StructuredLogger.error(message, errorOrData);
    }
  },
  async debug(message: string, data?: Record<string, any>): Promise<void> {
    StructuredLogger.debug(message, data);
  },
};
