import type { ILogTransport, LogLevel, LogPayload } from "./ILogTransport";

const MAX_STORED = 10;

export interface StoredError {
  timestamp: string;
  message: string;
  level: LogLevel;
  data?: Record<string, unknown>;
}

const recentErrors: StoredError[] = [];

export function getLastErrors(): StoredError[] {
  return [...recentErrors];
}

export class ErrorsStoreTransport implements ILogTransport {
  shouldHandle(level: LogLevel): boolean {
    return level === "error" || level === "critical";
  }

  log(payload: LogPayload): void {
    recentErrors.unshift({
      timestamp: payload.timestamp,
      message: payload.message,
      level: payload.level,
      data: payload.data as Record<string, unknown> | undefined,
    });
    if (recentErrors.length > MAX_STORED) recentErrors.pop();
  }
}
