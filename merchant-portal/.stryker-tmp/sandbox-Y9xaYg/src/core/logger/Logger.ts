import { sanitize } from "./sanitizer/DataSanitizer";
import { AlertTransport } from "./transports/AlertTransport";
import { ConsoleTransport } from "./transports/ConsoleTransport";
import { DatabaseTransport } from "./transports/DatabaseTransport";
import { ErrorsStoreTransport } from "./transports/ErrorsStoreTransport";
import type { ILogTransport, LogLevel, LogPayload } from "./transports/ILogTransport";
import { SentryTransport } from "./transports/SentryTransport";

export type { LogLevel } from "./transports/ILogTransport";
export type { ILogTransport } from "./transports/ILogTransport";

export {
  Sentry,
  configureSentryScope,
  setSentryUser,
  clearSentryUser,
  addBreadcrumb,
  captureException,
} from "./transports/SentryTransport";
export type { SentryContextOptions } from "./transports/SentryTransport";
export { getPendingTags as _getSentryPendingTags } from "./transports/SentryTransport";

export interface LogContext {
  tenantId?: string;
  restaurant_id?: string;
  deviceId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  /** idempotency_key: evita 409 em app_logs quando a mesma operação é reenviada (retry). */
  idempotency_key?: string;
  url?: string;
  userAgent?: string;
  [key: string]: any;
}

function getEnv(): { DEV: boolean } {
  try {
    const meta = (globalThis as any).import?.meta || (typeof window !== "undefined" ? (window as any).import?.meta : undefined);
    if (meta?.env) return { DEV: meta.env.DEV || meta.env.MODE === "development" };
  } catch (_) {}
  if (typeof process !== "undefined" && process.env) return { DEV: process.env.NODE_ENV !== "production" };
  return { DEV: false };
}

class LoggerService {
  private static instance: LoggerService;
  private context: LogContext = {};
  private sessionId: string;
  private requestCounter = 0;
  private transports: ILogTransport[];

  private constructor(transports: ILogTransport[]) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.transports = transports;
  }

  public static getInstance(transports?: ILogTransport[]): LoggerService {
    if (!LoggerService.instance) {
      const env = getEnv();
      LoggerService.instance = new LoggerService(transports ?? [
        new ConsoleTransport(env.DEV),
        new ErrorsStoreTransport(),
        new SentryTransport(),
        new DatabaseTransport(),
        new AlertTransport(),
      ]);
    }
    return LoggerService.instance;
  }

  public setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
  }

  public clearContext() {
    this.context = { sessionId: this.sessionId };
  }

  private async emit(level: LogLevel, message: string, data?: Record<string, any>) {
    const meta = {
      ...this.context,
      requestId: `req_${++this.requestCounter}`,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      sessionId: this.sessionId,
    };

    const payload: LogPayload = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data: sanitize(data || {}) as Record<string, unknown>,
      meta: sanitize(meta) as Record<string, unknown>,
    };

    for (const transport of this.transports) {
      if (transport.shouldHandle(level)) {
        try {
          transport.log(payload);
        } catch (_) {}
      }
    }
  }

  public debug(message: string, data?: Record<string, any>) { this.emit("debug", message, data); }
  public info(message: string, data?: Record<string, any>) { this.emit("info", message, data); }
  public warn(message: string, data?: Record<string, any>) { this.emit("warn", message, data); }

  public error(message: string, error?: any, data?: Record<string, any>) {
    this.emit("error", message, {
      ...data,
      error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
    });
  }

  public critical(message: string, error?: any, data?: Record<string, any>) {
    this.emit("critical", message, {
      ...data,
      error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
    });
  }
}

export const Logger = LoggerService.getInstance();
