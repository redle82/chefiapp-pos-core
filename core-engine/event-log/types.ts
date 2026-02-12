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
  // ORDER lifecycle events (aligned with DB state machine: OPEN → PREPARING → IN_PREP → READY → CLOSED)
  | "ORDER_CREATED" // → status: OPEN
  | "ORDER_PREPARING" // → status: PREPARING (sent to KDS)
  | "ORDER_IN_PREP" // → status: IN_PREP (kitchen started)
  | "ORDER_READY" // → status: READY (kitchen done)
  | "ORDER_CLOSED" // → status: CLOSED (payment confirmed or manual close)
  | "ORDER_CANCELED" // → status: CANCELLED
  // PAYMENT events (separate from order status — tracked via payment_status column)
  | "PAYMENT_CREATED"
  | "PAYMENT_CONFIRMED" // → payment_status: PAID
  | "PAYMENT_FAILED"
  | "PAYMENT_CANCELED"
  | "PAYMENT_RETRIED"
  // ORDER_ITEM events
  | "ORDER_ITEM_ADDED"
  | "ORDER_ITEM_REMOVED"
  | "ORDER_ITEM_QTY_UPDATED"
  // TABLE events (derived, but tracked)
  | "TABLE_OCCUPIED"
  | "TABLE_AVAILABLE"
  // INVENTORY events (Metabolic Loop)
  | "INVENTORY_CONSUMED"
  | "INVENTORY_RESTOCKED"
  | "INVENTORY_ADJUSTED"
  // CASH_REGISTER events (Shift Management)
  | "CASH_REGISTER_OPENED"
  | "CASH_REGISTER_CLOSED"
  | "CASH_REGISTER_DROP" // Sangria
  | "CASH_REGISTER_ADD"; // Suprimento

/**
 * Canonical order status values — mirrors PostgreSQL trg_validate_order_status.
 * TypeScript MUST match these exactly. The DB trigger is the source of truth.
 *
 * Transitions:
 *   KDS forward:  OPEN → PREPARING → IN_PREP → READY
 *   Payment:      ANY non-terminal → CLOSED
 *   Cancel:       ANY non-terminal → CANCELLED
 *   Terminal:     CLOSED, CANCELLED (no further transitions)
 */
export type OrderStatus =
  | "OPEN"
  | "PREPARING"
  | "IN_PREP"
  | "READY"
  | "CLOSED"
  | "CANCELLED";

/**
 * Canonical payment status values — mirrors PostgreSQL orders_payment_status_check.
 */
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "PARTIALLY_PAID"
  | "FAILED"
  | "REFUNDED";

/**
 * @deprecated Use ORDER_PREPARING, ORDER_IN_PREP, ORDER_READY instead.
 * Kept for backward compatibility with CDC event_store entries.
 */
export type LegacyEventType = "ORDER_LOCKED" | "ORDER_PAID";

export interface EventMetadata {
  causation_id?: string;
  correlation_id?: string;
  actor_ref?: string;
  idempotency_key?: string;
  hash_prev?: string;
  hash?: string;
  server_timestamp?: string; // Audit timestamp
}

export interface CoreEvent {
  event_id: string; // UUID
  stream_id: StreamId;
  stream_version: number;
  type: EventType;
  payload: Record<string, any>;
  occurred_at: Date; // Keep as Date object for internal domain math
  meta: EventMetadata; // [REFACTOR] Nested Metadata

  /**
   * Backwards-compat (legacy flattened metadata).
   * Some server modules still write/read these as top-level columns.
   * Prefer using `meta.*` going forward.
   */
  causation_id?: string;
  correlation_id?: string;
  actor_ref?: string;
  idempotency_key?: string;
  hash_prev?: string;
  hash?: string;
}

export interface EventStore {
  /**
   * Append event to stream with optimistic concurrency control
   * @throws if stream_version mismatch (concurrent modification)
   * @throws if event_id already exists (duplicate)
   */
  append(event: CoreEvent, expectedStreamVersion?: number): Promise<void>;

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

export interface StreamMetadata {
  stream_id: StreamId;
  current_version: number;
  last_event_id?: string;
  last_event_at?: Date;
}
