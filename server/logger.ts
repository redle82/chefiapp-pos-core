/**
 * server/logger.ts — Structured JSON logger for the integration-gateway.
 *
 * Emits log lines as JSON objects with consistent fields:
 *   { level, ts, msg, ...context }
 *
 * Usage:
 *   import { logger } from "./logger";
 *   logger.info("server started", { port: 4320 });
 *   logger.error("stripe failed", { error: err.message, restaurant_id });
 *   const child = logger.child({ request_id: "abc123", restaurant_id: "uuid" });
 *   child.warn("rate limit hit");
 *
 * Optional Sentry integration (zero hard deps on @sentry/node):
 *   import * as Sentry from "@sentry/node";
 *   Sentry.init({ dsn: process.env.SENTRY_DSN });
 *   import { setSentryCapture } from "./logger";
 *   setSentryCapture((msg, ctx) =>
 *     Sentry.captureException(new Error(msg), { extra: ctx })
 *   );
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

// ---------------------------------------------------------------------------
// Optional Sentry hook — zero hard dependency on @sentry/node.
// Call setSentryCapture() once at startup to forward errors to Sentry.
// ---------------------------------------------------------------------------
export type SentryCaptureFn = (
  msg: string,
  ctx: Record<string, unknown>,
) => void;

let captureHook: SentryCaptureFn | null = null;

/**
 * Register a Sentry (or any) error-capture callback.
 * Called automatically on every logger.error() invocation.
 */
export function setSentryCapture(fn: SentryCaptureFn): void {
  captureHook = fn;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
const IS_PRETTY =
  process.env.LOG_PRETTY === "1" || process.env.NODE_ENV === "test";

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL];
}

function emit(
  level: LogLevel,
  msg: string,
  ctx: Record<string, unknown>,
): void {
  if (!shouldLog(level)) return;
  const entry: Record<string, unknown> = {
    level,
    ts: new Date().toISOString(),
    msg,
    ...ctx,
  };
  if (IS_PRETTY) {
    const prefix =
      level === "error"
        ? "ERROR"
        : level === "warn"
        ? "WARN "
        : level === "debug"
        ? "DEBUG"
        : "INFO ";
    // Strip internal fields for readable output in tests/dev
    const { level: _l, ts: _t, msg: _m, ...rest } = entry;
    const extras = Object.keys(rest).length ? " " + JSON.stringify(rest) : "";
    const out = `[integration-gateway] ${prefix} ${msg}${extras}`;
    if (level === "error") {
      process.stderr.write(out + "\n");
    } else {
      process.stdout.write(out + "\n");
    }
  } else {
    const line = JSON.stringify(entry);
    if (level === "error") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  }
  // Forward errors to Sentry (or any registered capture hook)
  if (level === "error" && captureHook) {
    try {
      captureHook(msg, ctx);
    } catch {
      // never let capture failures propagate
    }
  }
}

export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
  /** Return a child logger that merges extra context into every log entry. */
  child(ctx: Record<string, unknown>): Logger;
}

function createLogger(base: Record<string, unknown> = {}): Logger {
  return {
    debug: (msg, ctx = {}) => emit("debug", msg, { ...base, ...ctx }),
    info: (msg, ctx = {}) => emit("info", msg, { ...base, ...ctx }),
    warn: (msg, ctx = {}) => emit("warn", msg, { ...base, ...ctx }),
    error: (msg, ctx = {}) => emit("error", msg, { ...base, ...ctx }),
    child: (ctx) => createLogger({ ...base, ...ctx }),
  };
}

export const logger: Logger = createLogger();
