import type { ILogTransport, LogLevel, LogPayload } from "./ILogTransport";

export class ErrorsStoreTransport implements ILogTransport {
  shouldHandle(level: LogLevel): boolean {
    return level === "error" || level === "critical";
  }

  log(payload: LogPayload): void {
    // Store errors for UI (e.g. ErrorsStore) — stub
  }
}
