/**
 * TERMINAL REGISTRY
 *
 * Manages the fleet of sovereign terminals connected to the Kernel.
 * In Phase 2, this is an in-memory registry for ensuring only authorized
 * and "alive" terminals are part of the operational loop.
 */

export type TerminalType = "KDS" | "TPV" | "MOBILE" | "MANAGER" | "TABLET";

export interface TerminalIdentity {
  terminalId: string;
  tenantId: string;
  type: TerminalType;
  label: string; // e.g. "Kitchen Main", "Bar TPV"
  version: string;
  capabilities: string[];
  registeredAt: string;
  ipAddress?: string;
}

export class TerminalRegistry {
  private static terminals = new Map<string, TerminalIdentity>();

  /**
   * Registers a new terminal into the fleet.
   * If functionality expands, this will persist to Redis/DB.
   */
  public static register(identity: TerminalIdentity): void {
    if (!identity.terminalId || !identity.tenantId) {
      throw new Error("Invalid terminal identity: Missing IDs");
    }

    console.log(
      `[TerminalRegistry] 📠 Registering ${identity.type}: ${identity.label} (${identity.terminalId})`,
    );

    this.terminals.set(identity.terminalId, {
      ...identity,
      registeredAt: new Date().toISOString(),
    });
  }

  public static get(terminalId: string): TerminalIdentity | undefined {
    return this.terminals.get(terminalId);
  }

  public static list(tenantId: string): TerminalIdentity[] {
    return Array.from(this.terminals.values()).filter(
      (t) => t.tenantId === tenantId,
    );
  }

  public static unregister(terminalId: string): void {
    const t = this.terminals.get(terminalId);
    if (t) {
      console.log(
        `[TerminalRegistry] 🔌 Unregistering ${t.label} (${terminalId})`,
      );
      this.terminals.delete(terminalId);
    }
  }
}
