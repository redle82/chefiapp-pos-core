/**
 * Domain Events
 *
 * Immutable, append-only events that represent facts about what happened
 * in the system. Used for audit trails and cross-context notifications.
 *
 * Events are for traceability, NOT for orchestration.
 * They are emitted after a mutation succeeds and never drive control flow.
 */

import type { OrderItem } from "../order/types";

// ---------------------------------------------------------------------------
// Event definitions
// ---------------------------------------------------------------------------

export type DomainEvent =
  | { type: "ORDER_CREATED"; orderId: string; items: OrderItem[] }
  | { type: "ORDER_PAID"; orderId: string; paymentId: string; totalCents: number }
  | { type: "ORDER_CANCELLED"; orderId: string; reason: string; cancelledBy: string }
  | { type: "ORDER_REOPENED"; orderId: string; reason: string; reopenedBy: string }
  | { type: "PAYMENT_REFUNDED"; paymentId: string; amountCents: number }
  | { type: "DISCOUNT_APPLIED"; orderId: string; discountId: string; amountCents: number }
  | { type: "SHIFT_STARTED"; operatorId: string; shiftId: string }
  | { type: "SHIFT_ENDED"; operatorId: string; totalMinutes: number }
  | { type: "WASTE_RECORDED"; productId: string; quantity: number; reason: string }
  | { type: "RESERVATION_CREATED"; reservationId: string }
  | { type: "STOCK_MOVEMENT"; productId: string; quantity: number; direction: "in" | "out" };

// ---------------------------------------------------------------------------
// Envelope — wraps every event with metadata
// ---------------------------------------------------------------------------

export interface DomainEventEnvelope {
  /** Unique ID for this event instance */
  id: string;
  /** The domain event payload */
  event: DomainEvent;
  /** ISO timestamp of when the event was emitted */
  occurredAt: string;
  /** ID of the restaurant / tenant context */
  restaurantId: string;
  /** ID of the operator who triggered the action */
  operatorId?: string;
}

// ---------------------------------------------------------------------------
// Event handler type
// ---------------------------------------------------------------------------

export type DomainEventHandler = (envelope: DomainEventEnvelope) => void;

// ---------------------------------------------------------------------------
// In-memory event bus (singleton)
// ---------------------------------------------------------------------------

type EventType = DomainEvent["type"];

const listeners = new Map<EventType, Set<DomainEventHandler>>();
const auditLog: DomainEventEnvelope[] = [];

/**
 * Generate a short unique ID for events.
 */
function generateEventId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Emit a domain event.
 *
 * - Appends to the in-memory audit log (immutable, append-only).
 * - Notifies all registered listeners for the event type.
 * - Failures in individual listeners are caught and logged to console
 *   so they never break the emitting code.
 */
export function emitDomainEvent(
  event: DomainEvent,
  restaurantId: string,
  operatorId?: string,
): DomainEventEnvelope {
  const envelope: DomainEventEnvelope = {
    id: generateEventId(),
    event,
    occurredAt: new Date().toISOString(),
    restaurantId,
    operatorId,
  };

  // Append-only audit log
  auditLog.push(Object.freeze(envelope) as DomainEventEnvelope);

  // Notify listeners
  const handlers = listeners.get(event.type);
  if (handlers) {
    for (const handler of handlers) {
      try {
        handler(envelope);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[DomainEvents] Handler error for "${event.type}":`, err);
      }
    }
  }

  return envelope;
}

/**
 * Subscribe to a specific domain event type.
 *
 * @returns An unsubscribe function.
 */
export function onDomainEvent(
  type: EventType,
  handler: DomainEventHandler,
): () => void {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  listeners.get(type)!.add(handler);

  return () => {
    listeners.get(type)?.delete(handler);
  };
}

/**
 * Read the in-memory audit log (read-only snapshot).
 * Useful for debugging and in-session traceability.
 */
export function getAuditLog(): readonly DomainEventEnvelope[] {
  return auditLog;
}

/**
 * Clear all listeners and the audit log.
 * Only intended for testing or full app reset.
 */
export function resetDomainEvents(): void {
  listeners.clear();
  auditLog.length = 0;
}
