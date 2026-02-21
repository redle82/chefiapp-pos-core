// @ts-nocheck
import type { ILogTransport, LogLevel, LogPayload } from "./ILogTransport";

export class ConsoleTransport implements ILogTransport {
  constructor(private dev: boolean) {}

  shouldHandle(level: LogLevel): boolean {
    return true;
  }

  log(payload: LogPayload): void {
    const fn = payload.level === "error" || payload.level === "critical" ? console.error : payload.level === "warn" ? console.warn : console.log;
    fn(`[${payload.level}]`, payload.message, payload.data || {});
  }
}
