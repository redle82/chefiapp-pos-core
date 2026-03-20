/**
 * Event Log Types (Top-level re-export)
 *
 * Canonical types live in core-engine/event-log/types.ts.
 * This file exists so that fiscal-modules and other top-level packages
 * can import from "../event-log/types" without path gymnastics.
 */
export type {
  CoreEvent,
  EventMetadata,
  EventStore,
  EventType,
  OrderStatus,
  PaymentStatus,
  StreamId,
  StreamMetadata,
} from "../core-engine/event-log/types";
