// @ts-nocheck
import type { ILogTransport, LogLevel, LogPayload } from "./ILogTransport";

export class DatabaseTransport implements ILogTransport {
  shouldHandle(_level: LogLevel): boolean {
    return true;
  }

  log(_payload: LogPayload): void {
    // Persist to Core/DB — stub
  }
}
