export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface LogPayload {
  level: LogLevel;
  timestamp: string;
  message: string;
  data: Record<string, unknown>;
  meta: Record<string, unknown>;
}

export interface ILogTransport {
  shouldHandle(level: LogLevel): boolean;
  log(payload: LogPayload): void;
}
