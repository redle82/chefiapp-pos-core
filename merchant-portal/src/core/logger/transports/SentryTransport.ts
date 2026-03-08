import type { ILogTransport, LogLevel, LogPayload } from "./ILogTransport";

export interface SentryContextOptions {
  userId?: string;
  restaurantId?: string;
  [key: string]: unknown;
}

export class SentryTransport implements ILogTransport {
  shouldHandle(level: LogLevel): boolean {
    return level === "error" || level === "critical" || level === "warn";
  }

  log(payload: LogPayload): void {
    if (payload.level === "error" || payload.level === "critical") {
      captureException(new Error(payload.message), payload.data);
    }
  }
}

// Re-exported by Logger — no-op stubs when Sentry SDK not configured
export const Sentry = typeof window !== "undefined" ? (window as any).Sentry : undefined;

export function configureSentryScope(options: SentryContextOptions): void {
  if (typeof window === "undefined") return;
  const S = (window as any).Sentry;
  if (!S?.setTag) return;
  try {
    if (options.restaurantId != null) S.setTag("restaurant_id", String(options.restaurantId));
    if (options.userId != null) S.setTag("user_id", String(options.userId));
  } catch (_) {}
}

export function setSentryUser(_userId: string | null, _attrs?: Record<string, unknown>): void {}

export function clearSentryUser(): void {}

export function addBreadcrumb(_message: string, _category?: string, _data?: Record<string, unknown>): void {}

export function captureException(error: Error, _context?: Record<string, unknown>): void {
  if (typeof console !== "undefined" && console.error) console.error(error);
}

export function getPendingTags(): string[] {
  return [];
}
