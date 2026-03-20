/**
 * EXECUTION CONTEXT CONTRACT
 * 
 * The "Envelope" that validates the existence of a Kernel Operation.
 * Prevents "Ghost Operations" (executors running after tenant disposal).
 */

export type ExecutionLifecycle = 'BOOTING' | 'ACTIVE' | 'DISPOSING' | 'TERMINATED';
export type ExecutionSource = 'UI' | 'API' | 'WEBHOOK' | 'CRON' | 'SYSTEM';

export interface ExecutionContext {
    /**
     * The Tenant this execution belongs to.
     * MUST match the Kernel's TenantId.
     */
    readonly tenantId: string;

    /**
     * Unique ID of the Kernel Instance (Boot Session).
     * If Kernel reboots, this ID changes.
     * Used to invalidate stale listeners/executors.
     */
    readonly executionId: string;

    /**
     * Current Lifecycle State of the Kernel.
     * Executors must throw if this is 'DISPOSING' or 'TERMINATED'.
     */
    readonly lifecycle: ExecutionLifecycle;

    /**
     * Where this operation originated.
     */
    readonly source: ExecutionSource;

    /**
     * Trace ID for the root operation (e.g. HTTP Request ID).
     */
    readonly correlationRoot: string;

    /**
     * Timestamp when this context was created/refreshed.
     */
    readonly timestamp: Date;
}
