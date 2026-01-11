import { CoreEvent } from "../event-log/types";

export interface Projection {
    /**
     * Unique name of the projection (e.g., "order_summary_v1")
     * Used for checkpointing cursors.
     */
    readonly projectionName: string;

    /**
     * Handle an event from the stream.
     * Should be idempotent.
     */
    handle(event: CoreEvent): Promise<void>;

    /**
     * Reset the projection state (e.g., truncate table).
     * Used for replays.
     */
    reset(): Promise<void>;
}

export interface ProjectionManager {
    /**
     * Register a projection to receive events.
     */
    register(projection: Projection): void;

    /**
     * Process a single event across all registered projections.
     */
    handleEvent(event: CoreEvent): Promise<void>;

    /**
     * Replay all events from the store to rebuild projections.
     */
    replayAll(): Promise<void>;
}
