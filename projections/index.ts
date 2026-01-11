/**
 * Projections
 * 
 * Rebuild state from events via deterministic replay.
 * State is a projection, not the source of truth.
 */

import type { CoreEvent } from "../event-log/types";
import type { Session, Order, OrderItem, Payment } from "../core-engine/repo/types";

// ============================================================================
// PROJECTION STATE
// ============================================================================

export interface ProjectionState {
  sessions: Map<string, Session>;
  orders: Map<string, Order>;
  orderItems: Map<string, OrderItem[]>; // order_id -> items[]
  payments: Map<string, Payment[]>; // order_id -> payments[]
}

// ============================================================================
// APPLY EVENT (Deterministic)
// ============================================================================

export function applyEvent(
  state: ProjectionState,
  event: CoreEvent
): ProjectionState {
  // Create new state (immutable update)
  const newState: ProjectionState = {
    sessions: new Map(state.sessions),
    orders: new Map(state.orders),
    orderItems: new Map(state.orderItems),
    payments: new Map(state.payments),
  };

  switch (event.type) {
    // ========================================================================
    // SESSION EVENTS
    // ========================================================================
    case "SESSION_STARTED": {
      const sessionId = extractId(event.stream_id);
      newState.sessions.set(sessionId, {
        id: sessionId,
        state: "ACTIVE",
        opened_at: event.occurred_at,
        version: event.stream_version,
      });
      break;
    }

    case "SESSION_CLOSED": {
      const sessionId = extractId(event.stream_id);
      const session = newState.sessions.get(sessionId);
      if (session) {
        session.state = "CLOSED";
        session.closed_at = event.occurred_at;
        session.version = event.stream_version;
      }
      break;
    }

    case "SESSION_RESET": {
      const sessionId = extractId(event.stream_id);
      const session = newState.sessions.get(sessionId);
      if (session) {
        session.state = "INACTIVE";
        session.version = event.stream_version;
      }
      break;
    }

    // ========================================================================
    // ORDER EVENTS
    // ========================================================================
    case "ORDER_CREATED": {
      const orderId = extractId(event.stream_id);
      newState.orders.set(orderId, {
        id: orderId,
        session_id: event.payload.session_id,
        table_id: event.payload.table_id,
        state: "OPEN",
        version: event.stream_version,
      });
      break;
    }

    case "ORDER_LOCKED": {
      const orderId = extractId(event.stream_id);
      const order = newState.orders.get(orderId);
      if (order) {
        order.state = "LOCKED";
        order.total_cents = event.payload.total_cents; // Immutable after this. In CENTS.
        order.version = event.stream_version;
      }
      break;
    }

    case "ORDER_PAID": {
      const orderId = extractId(event.stream_id);
      const order = newState.orders.get(orderId);
      if (order) {
        order.state = "PAID";
        order.version = event.stream_version;
      }
      break;
    }

    case "ORDER_CLOSED": {
      const orderId = extractId(event.stream_id);
      const order = newState.orders.get(orderId);
      if (order) {
        order.state = "CLOSED";
        order.version = event.stream_version;
      }
      break;
    }

    case "ORDER_CANCELED": {
      const orderId = extractId(event.stream_id);
      const order = newState.orders.get(orderId);
      if (order) {
        order.state = "CANCELED";
        order.version = event.stream_version;
      }
      break;
    }

    // ========================================================================
    // ORDER_ITEM EVENTS
    // ========================================================================
    case "ORDER_ITEM_ADDED": {
      const orderId = event.payload.order_id;
      const items = newState.orderItems.get(orderId) || [];
      items.push({
        id: event.payload.item_id,
        order_id: orderId,
        product_id: event.payload.product_id,
        name: event.payload.name,
        quantity: event.payload.quantity,
        price_snapshot_cents: event.payload.price_snapshot_cents,
        subtotal_cents: event.payload.quantity * event.payload.price_snapshot_cents,
      });
      newState.orderItems.set(orderId, items);
      break;
    }

    // ========================================================================
    // PAYMENT EVENTS
    // ========================================================================
    case "PAYMENT_CREATED": {
      const orderId = event.payload.order_id;
      const payments = newState.payments.get(orderId) || [];
      payments.push({
        id: event.payload.payment_id,
        order_id: orderId,
        session_id: event.payload.session_id,
        method: event.payload.method,
        amount_cents: event.payload.amount_cents,
        state: "PENDING",
        version: event.stream_version,
      });
      newState.payments.set(orderId, payments);
      break;
    }

    case "PAYMENT_CONFIRMED": {
      const orderId = event.payload.order_id;
      const payments = newState.payments.get(orderId) || [];
      const payment = payments.find(
        (p) => p.id === event.payload.payment_id
      );
      if (payment) {
        payment.state = "CONFIRMED";
        payment.version = event.stream_version;
      }
      break;
    }

    case "PAYMENT_FAILED": {
      const orderId = event.payload.order_id;
      const payments = newState.payments.get(orderId) || [];
      const payment = payments.find(
        (p) => p.id === event.payload.payment_id
      );
      if (payment) {
        payment.state = "FAILED";
        payment.version = event.stream_version;
      }
      break;
    }

    case "PAYMENT_CANCELED": {
      const orderId = event.payload.order_id;
      const payments = newState.payments.get(orderId) || [];
      const payment = payments.find(
        (p) => p.id === event.payload.payment_id
      );
      if (payment) {
        payment.state = "CANCELED";
        payment.version = event.stream_version;
      }
      break;
    }

    case "PAYMENT_RETRIED": {
      const orderId = event.payload.order_id;
      const payments = newState.payments.get(orderId) || [];
      const payment = payments.find(
        (p) => p.id === event.payload.payment_id
      );
      if (payment) {
        payment.state = "PENDING";
        payment.version = event.stream_version;
      }
      break;
    }

    // TABLE events are derived, not stored
    case "TABLE_OCCUPIED":
    case "TABLE_AVAILABLE":
      // No-op (derived state)
      break;
  }

  return newState;
}

// ============================================================================
// REBUILD STATE (Replay)
// ============================================================================

export function rebuildState(events: CoreEvent[]): ProjectionState {
  let state: ProjectionState = {
    sessions: new Map(),
    orders: new Map(),
    orderItems: new Map(),
    payments: new Map(),
  };

  // Apply events in order (deterministic)
  // CRITICAL: applyEvent returns NEW state (immutable), must use return value
  for (const event of events) {
    state = applyEvent(state, event);
  }

  return state;
}

// ============================================================================
// HELPERS
// ============================================================================

function extractId(streamId: string): string {
  // Extract ID from "SESSION:{id}" format
  const parts = streamId.split(":");
  return parts[1] || streamId;
}
