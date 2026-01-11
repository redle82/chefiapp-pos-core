/**
 * Event Log Types
 * 
 * Core event types for append-only event sourcing.
 * Events are the source of truth; state is a projection.
 */

export type StreamId = string; // Format: "SESSION:{id}" | "ORDER:{id}" | "PAYMENT:{id}" | "TABLE:{id}"

export type EventType =
  // SESSION events
  | "SESSION_STARTED"
  | "SESSION_CLOSED"
  | "SESSION_RESET"
  // ORDER events
  | "ORDER_CREATED"
  | "ORDER_LOCKED"
  | "ORDER_PAID"
  | "ORDER_CLOSED"
  | "ORDER_CANCELED"
  // PAYMENT events
  | "PAYMENT_CREATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "PAYMENT_CANCELED"
  | "PAYMENT_RETRIED"
  // ORDER_ITEM events
  | "ORDER_ITEM_ADDED"
  // TABLE events (derived, but tracked)
  // TABLE events (derived, but tracked)
  | "TABLE_OCCUPIED"
  | "TABLE_AVAILABLE"
  // INVENTORY events (Metabolic Loop)
  | "INVENTORY_CONSUMED"
  | "INVENTORY_RESTOCKED"
  | "INVENTORY_ADJUSTED";

export interface CoreEvent {
  event_id: string; // UUID, unique across all events
  stream_id: StreamId;
  stream_version: number; // Incremental per stream, for optimistic concurrency
  type: EventType;
  payload: Record<string, any>; // Event-specific data
  occurred_at: Date;
  causation_id?: string; // ID of command/event that caused this
  correlation_id?: string; // ID for tracing related events
  actor_ref?: string; // Optional external reference (not auth, just reference)
  idempotency_key?: string; // Optional key for idempotency
  hash_prev?: string; // Hash of previous event in stream (anti-tamper chain)
  hash?: string; // Hash of this event (anti-tamper chain)
}

export interface EventStore {
  /**
   * Append event to stream with optimistic concurrency control
   * @throws if stream_version mismatch (concurrent modification)
   * @throws if event_id already exists (duplicate)
   */
  append(
    event: CoreEvent,
    expectedStreamVersion?: number
  ): Promise<void>;

  /**
   * Read all events for a stream, ordered by stream_version
   */
  readStream(stream_id: StreamId): Promise<CoreEvent[]>;

  /**
   * Read all events matching filter (optional, for debugging/audit)
   */
  readAll(filter?: {
    stream_id?: StreamId;
    type?: EventType;
    since?: Date;
    until?: Date;
  }): Promise<CoreEvent[]>;

  /**
   * Get current stream version (for optimistic concurrency)
   */
  getStreamVersion(stream_id: StreamId): Promise<number>;
}

export interface EventMetadata {
  stream_id: StreamId;
  current_version: number;
  last_event_id?: string;
  last_event_at?: Date;
}

