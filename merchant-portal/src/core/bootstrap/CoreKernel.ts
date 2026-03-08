import { Logger } from "../logger";

export const SystemLayer = {
  L0_PHYSICS: 0, // Infrastructure (Browser, OS, Network)
  L1_RUNTIME: 1, // Execution Engine (JS, React, Event Loop)
  L2_KERNEL: 2, // Genesis (Bootstrap, Env, Config)
  L3_WORLD: 3, // Orientation (Router, Theme, UI Basics)
  L4_TRUTH: 4, // Data State (Core Data, Menu, User Profile)
  L5_AGENCY: 5, // Operation (Staff, Actions, Permissions)
  L6_INTELLIGENCE: 6, // Nervous System (Reflex, AI, Telemetry)
} as const;

export type SystemLayer = (typeof SystemLayer)[keyof typeof SystemLayer];

// Reverse mapping for logging
const LayerNames: Record<number, string> = Object.fromEntries(
  Object.entries(SystemLayer).map(([k, v]) => [v, k]),
);

export type LayerStatus = "void" | "mounting" | "stable" | "degraded" | "dead";

/**
 * 🏛️ CORE KERNEL (The Unmoved Mover)
 *
 * This singleton enforces the System Law (Ontology of Initialization).
 * It does not render UI. It judges existence.
 */
class CoreKernel {
  private state: Record<SystemLayer, LayerStatus> = {
    [SystemLayer.L0_PHYSICS]: "stable", // Axiomatic: If we are running, physics exists
    [SystemLayer.L1_RUNTIME]: "stable", // Axiomatic: If this class is eval'd, runtime exists
    [SystemLayer.L2_KERNEL]: "void",
    [SystemLayer.L3_WORLD]: "void",
    [SystemLayer.L4_TRUTH]: "void",
    [SystemLayer.L5_AGENCY]: "void",
    [SystemLayer.L6_INTELLIGENCE]: "void",
  };

  private listeners: Set<() => void> = new Set(); // Simple subscription for generic updates

  private locked: boolean = false;
  private degraded: boolean = false;

  /**
   * Declares a layer's status transformation.
   * Enforces the "Cascade of Existence": Layer N cannot be stable if N-1 is not stable.
   */
  public signal(layer: SystemLayer, status: LayerStatus) {
    if (this.locked && status !== "dead") {
      Logger.warn(
        `[CoreKernel] REJECTED signal to ${LayerNames[layer]} (System Locked).`,
      );
      return;
    }

    // Enforce Causality (Downward Dependency Check)
    if (status === "stable" && layer > SystemLayer.L0_PHYSICS) {
      const previous = this.state[(layer - 1) as SystemLayer];
      if (previous !== "stable" && previous !== "degraded") {
        Logger.warn(
          `[CoreKernel] Violation: Layer ${
            LayerNames[layer]
          } tried to stabilize, but ${
            LayerNames[layer - 1]
          } is ${previous}. Rejecting.`,
        );
        return; // ⛔ REJECT: You cannot exist before your parents.
      }
    }

    this.state[layer] = status;

    // Auto-detect degradation
    if (status === "degraded" || status === "dead") {
      this.degraded = true;
    }

    this.notify();

    if (status !== "stable") {
      Logger.debug(`[CoreKernel] Layer ${LayerNames[layer]} signal: ${status}`);
    }
  }

  /**
   * The Gatekeeper query.
   * Components ask this before attempting to exist.
   */
  public isReady(targetLayer: SystemLayer): boolean {
    // To be ready, the layer itself must be stable,
    // AND all previous layers must be at least stable/degraded.

    // 1. Check Previous Layers (Recursive Integrity)
    for (let i = 0; i < targetLayer; i++) {
      const s = this.state[i as SystemLayer];
      if (s === "dead" || s === "void" || s === "mounting") return false;
    }

    // 2. Check Target Layer
    const current = this.state[targetLayer];
    return current === "stable" || current === "degraded";
  }

  /**
   * Has the system suffered partial failure?
   * (e.g. API down, but Cache working)
   */
  public isDegraded(): boolean {
    return this.degraded;
  }

  /**
   * Is the system completely locked down?
   * (e.g. Security breach, Data corruption, Payment Freeze)
   */
  public isLocked(): boolean {
    return this.locked;
  }

  /**
   * 🚨 EMERGENCY BREAK
   * Calling this stops all new layers from mounting.
   */
  public panic(reason: string) {
    Logger.warn(`[CoreKernel] 🚨 SYSTEM PANIC: ${reason}`);
    this.locked = true;
    this.degraded = true;
    this.notify();
  }

  /**
   * Specifically checks if the system has collapsed from a specific point upward.
   */
  public isDead(fromLayer: SystemLayer = SystemLayer.L2_KERNEL): boolean {
    return this.state[fromLayer] === "dead";
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // --- Developer Tools ---

  public dump() {
    Logger.debug("[CoreKernel] State:", { state: this.state });
  }
}

// 👑 SINGLETON: There is only one Kernel.
export const Kernel = new CoreKernel();

// 🎹 GLOBAL ACCESS (for Console Debugging)
(window as any).__KERNEL__ = Kernel;
