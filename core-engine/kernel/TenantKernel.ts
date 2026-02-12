import { EventExecutor } from "../event-log/EventExecutor";
import { EventStore } from "../event-log/types";
import type {
  TransitionRequest,
  TransitionResult,
} from "../executor/CoreExecutor";
import { InMemoryRepo } from "../repo/InMemoryRepo";
import type { ExecutionContext, ExecutionLifecycle } from "./ExecutionContext";

/**
 * TENANT KERNEL
 *
 * The Sovereign Object that represents a "Living Tenant" in the system.
 * It encapsulates the entire execution context for a single tenant.
 *
 * "No operation exists outside of a Kernel."
 */

// Robust UUID Generator (Browser + Node)
const generateUUID = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export interface KernelOptions {
  tenantId: string;
  debugMode?: boolean;
}

export class TenantKernel {
  public readonly tenantId: string;
  public readonly executionId: string; // [ECC] Unique ID for this Boot Session
  private lifecycle: ExecutionLifecycle = "BOOTING";

  // The Trinity of the Kernel
  private executor: EventExecutor;
  private repo: InMemoryRepo;
  private eventStore: EventStore;

  constructor(context: KernelOptions, eventStore: EventStore) {
    if (!context.tenantId) {
      throw new Error(
        "[TenantKernel] FATAL: Cannot birth a Kernel without TenantId.",
      );
    }
    this.tenantId = context.tenantId;
    this.executionId = generateUUID(); // [ECC] New Life ID
    this.eventStore = eventStore;

    // 1. Create Isolated Memory (Repo)
    this.repo = new InMemoryRepo();

    // 2. Create Brain (Executor) - Injecting the scoped Repo
    // [FENCE] Bind Executor to this Logic Universe
    this.executor = new EventExecutor(
      this.eventStore,
      this.repo,
      this.tenantId,
      this.executionId,
    );
  }

  /**
   * Wakes up the Kernel.
   * Hydrates state from EventStore.
   */
  async boot(): Promise<void> {
    if (this.lifecycle !== "BOOTING") return;

    console.log(
      `[Kernel:${this.tenantId}] 🟢 Booting (ExecID: ${this.executionId})...`,
    );
    try {
      // Future: Load snapshots, replay streams for global aggregates if needed
      // For now, we rely on Lazy hydration per stream in EventExecutor

      this.lifecycle = "ACTIVE";
      console.log(`[Kernel:${this.tenantId}] 🚀 READY.`);
    } catch (e) {
      this.lifecycle = "TERMINATED";
      console.error(`[Kernel:${this.tenantId}] ❌ Boot Failed:`, e);
      throw e;
    }
  }

  /**
   * The Single Point of Entry for Domain Operations.
   */
  async execute(
    request: Omit<TransitionRequest, "tenantId">,
    upstreamContext?: Partial<ExecutionContext>,
  ): Promise<TransitionResult> {
    this.assertReady();

    // [ECC] Inject Execution Context
    // Prefer upstream correlation for tracing, fallback to generated
    const ctx: ExecutionContext = {
      tenantId: this.tenantId,
      executionId: this.executionId,
      lifecycle: this.lifecycle,
      source: upstreamContext?.source || "API",
      correlationRoot: upstreamContext?.correlationRoot || generateUUID(),
      timestamp: new Date(),
    };

    // Inject TenantId strictly here.
    const fullRequest: TransitionRequest = {
      ...request,
      tenantId: this.tenantId,
    };

    // [ECC] Pass Context to Executor
    return this.executor.execute(fullRequest, ctx);
  }

  /**
   * Nuclear cleanup.
   * Destroys the universe of this tenant.
   */
  dispose(): void {
    console.log(
      `[Kernel:${this.tenantId}] 🔴 Disposing (ExecID: ${this.executionId})...`,
    );
    this.lifecycle = "DISPOSING";
    this.repo.clear();
    // Potential: Unsubscribe realtime listeners here
    this.lifecycle = "TERMINATED";
  }

  private assertReady() {
    if (this.lifecycle !== "ACTIVE") {
      throw new Error(
        `[Kernel:${this.tenantId}] Violation: Cannot execute in lifecycle ${this.lifecycle} (ExecID: ${this.executionId})`,
      );
    }
  }

  // Debug Access (Read Only)
  getSnapshot() {
    return {
      tenantId: this.tenantId,
      executionId: this.executionId,
      lifecycle: this.lifecycle,
      repoSize: this.repo.getDebugStats(),
    };
  }
}
