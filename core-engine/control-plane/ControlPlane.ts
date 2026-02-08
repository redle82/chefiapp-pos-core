/**
 * CONTROL PLANE
 *
 * The Nervous System of the Operation.
 * Facade for Terminal Management, Heartbeats, and Fleet Command.
 */

import { HealthStatus, Heartbeat, Pulse } from "./Heartbeat";
import { TerminalIdentity, TerminalRegistry } from "./TerminalRegistry";

export class ControlPlane {
  // --- REGISTRY ---

  public static registerTerminal(identity: TerminalIdentity) {
    return TerminalRegistry.register(identity);
  }

  public static unregisterTerminal(terminalId: string) {
    return TerminalRegistry.unregister(terminalId);
  }

  public static getTerminal(terminalId: string) {
    return TerminalRegistry.get(terminalId);
  }

  public static getFleet(tenantId: string) {
    return TerminalRegistry.list(tenantId);
  }

  // --- VITALITY ---

  public static sendPulse(pulse: Pulse) {
    return Heartbeat.record(pulse);
  }

  public static getTerminalHealth(terminalId: string): HealthStatus {
    return Heartbeat.checkHealth(terminalId);
  }

  /**
   * Returns a full fleet report with health status.
   */
  public static getFleetStatus(tenantId: string) {
    const terminals = TerminalRegistry.list(tenantId);

    return terminals.map((t) => ({
      ...t,
      health: Heartbeat.checkHealth(t.terminalId),
    }));
  }
}
