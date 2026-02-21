// @ts-nocheck
import type { ILogTransport, LogLevel, LogPayload } from "./ILogTransport";

export class AlertTransport implements ILogTransport {
  shouldHandle(level: LogLevel): boolean {
    return level === "critical" || level === "error";
  }

  log(_payload: LogPayload): void {
    // Alert UI / Pager — stub
  }
}
