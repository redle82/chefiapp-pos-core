/**
 * HEARTBEAT MONITOR
 *
 * "Alive until proven dead."
 * Tracks the vitality of registered terminals.
 */

import { TerminalRegistry } from "./TerminalRegistry";

export interface Pulse {
  terminalId: string;
  timestamp: number;
  load?: number; // CPU/Memory load or Queue depth
  battery?: number;
  status: "IDLE" | "BUSY" | "ERROR";
}

export interface HealthStatus {
  terminalId: string;
  isAlive: boolean;
  lastSeenSecondsAgo: number;
  status: "ONLINE" | "OFFLINE" | "CRITICAL";
}

const HEARTBEAT_TIMEOUT_MS = 30000; // 30 seconds to die

export class Heartbeat {
  private static lastPulse = new Map<string, number>();

  /**
   * Records a pulse from a terminal.
   * Returns true if the terminal is known and pulse is accepted.
   */
  public static record(pulse: Pulse): boolean {
    const terminal = TerminalRegistry.get(pulse.terminalId);

    if (!terminal) {
      console.warn(
        `[Heartbeat] 👻 Ghost pulse from unknown terminal: ${pulse.terminalId}`,
      );
      return false;
    }

    this.lastPulse.set(pulse.terminalId, Date.now());
    // In a real system, we might emit metrics here
    return true;
  }

  /**
   * Checks the health of a specific terminal.
   */
  public static checkHealth(terminalId: string): HealthStatus {
    const last = this.lastPulse.get(terminalId);

    if (!last) {
      return {
        terminalId,
        isAlive: false,
        lastSeenSecondsAgo: -1,
        status: "OFFLINE",
      };
    }

    const elapsed = Date.now() - last;
    const isAlive = elapsed < HEARTBEAT_TIMEOUT_MS;

    return {
      terminalId,
      isAlive,
      lastSeenSecondsAgo: Math.floor(elapsed / 1000),
      status: isAlive ? "ONLINE" : "OFFLINE",
    };
  }

  /**
   * Returns all currently live terminals for a tenant.
   */
  public static getLiveTerminals(tenantId: string): string[] {
    const all = TerminalRegistry.list(tenantId);
    return all
      .filter((t) => this.checkHealth(t.terminalId).isAlive)
      .map((t) => t.terminalId);
  }
}
