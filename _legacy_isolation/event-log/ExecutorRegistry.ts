import { EventExecutor } from "./EventExecutor";
import { EventStore } from "./types";
import { InMemoryRepo } from "../core-engine/repo/InMemoryRepo";

/**
 * Tenant-Scoped Executor Registry
 * 
 * Enforces the "One Executor per Tenant" rule.
 * Prevents state leakage between tenants by maintaining isolated Registry entries.
 */
export class ExecutorRegistry {
    private executors = new Map<string, EventExecutor>();
    private repos = new Map<string, InMemoryRepo>();

    constructor(private eventStore: EventStore) { }

    /**
     * Get or create an executor for a specific tenant.
     * Guarantees isolation (separate Repo).
     */
    getExecutor(tenantId: string): EventExecutor {
        if (!tenantId) {
            throw new Error("[ExecutorRegistry] TenantId is required to access Kernel.");
        }

        if (!this.executors.has(tenantId)) {
            console.log(`[ExecutorRegistry] 🟢 Booting Kernel for Tenant: ${tenantId}`);

            // 1. Create Tenant-Scoped Repo
            const repo = new InMemoryRepo();
            this.repos.set(tenantId, repo);

            // 2. Create Executor (injecting Tenant Repo)
            const executor = new EventExecutor(this.eventStore, repo);
            this.executors.set(tenantId, executor);
        }

        return this.executors.get(tenantId)!;
    }

    /**
     * Dispose an executor (e.g. on tenant switch or logout).
     * Ensures memory cleanup and state reset.
     */
    dispose(tenantId: string): void {
        if (this.executors.has(tenantId)) {
            console.log(`[ExecutorRegistry] 🔴 Disposing Kernel for Tenant: ${tenantId}`);
            this.repos.get(tenantId)?.clear();
            this.repos.delete(tenantId);
            this.executors.delete(tenantId);
        }
    }

    /**
     * Nuclear option: Reset everything.
     */
    resetAll(): void {
        this.executors.clear();
        this.repos.forEach(r => r.clear());
        this.repos.clear();
    }
}
