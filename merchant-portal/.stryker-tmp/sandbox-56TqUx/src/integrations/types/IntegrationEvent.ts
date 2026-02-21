/**
 * IntegrationEvent — Eventos que fluem pelo sistema de integrações
 * 
 * Princípio: Todo evento é imutável e auto-descritivo.
 * Adapters reagem a eventos, nunca os modificam.
 */
// @ts-nocheck


// ─────────────────────────────────────────────────────────────
// ORDER EVENTS
// ─────────────────────────────────────────────────────────────

export interface OrderCreatedEvent {
  type: 'order.created';
  payload: {
    orderId: string;
    source: 'tpv' | 'delivery' | 'online' | 'whatsapp';
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      priceCents: number;
    }>;
    totalCents: number;
    tableId?: string;
    customerName?: string;
    customerPhone?: string;
    createdAt: number;
    metadata?: Record<string, unknown>;
  };
}

export interface OrderUpdatedEvent {
  type: 'order.updated';
  payload: {
    orderId: string;
    status: 'new' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
    updatedAt: number;
  };
}

export interface OrderCompletedEvent {
  type: 'order.completed';
  payload: {
    orderId: string;
    totalCents: number;
    paymentMethod: 'cash' | 'card' | 'pix' | 'mixed';
    completedAt: number;
  };
}

// ─────────────────────────────────────────────────────────────
// MENU EVENTS
// ─────────────────────────────────────────────────────────────

export interface MenuUpdatedEvent {
  type: 'menu.updated';
  payload: {
    restaurantId: string;
    categories: Array<{
      id: string;
      name: string;
      items: Array<{
        id: string;
        name: string;
        priceCents: number;
        available: boolean;
      }>;
    }>;
    updatedAt: number;
  };
}

// ─────────────────────────────────────────────────────────────
// DELIVERY EVENTS
// ─────────────────────────────────────────────────────────────

export interface DeliveryStatusEvent {
  type: 'delivery.status';
  payload: {
    orderId: string;
    externalId: string;
    status: 'pending' | 'accepted' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
    estimatedDeliveryAt?: number;
    updatedAt: number;
  };
}

// ─────────────────────────────────────────────────────────────
// EXTENDED ORDER & PAYMENT EVENTS (Event Catalog §1.3)
// ─────────────────────────────────────────────────────────────

export interface OrderPaidEvent {
  type: 'order.paid';
  payload: {
    orderId: string;
    totalCents: number;
    paymentMethod?: string;
    completedAt: number;
  };
}

export interface OrderReadyEvent {
  type: 'order.ready';
  payload: {
    orderId: string;
    readyAt: number;
  };
}

export interface OrderClosedEvent {
  type: 'order.closed';
  payload: {
    orderId: string;
    closedAt: number;
  };
}

export interface PaymentConfirmedEvent {
  type: 'payment.confirmed';
  payload: {
    orderId?: string;
    subscriptionId?: string;
    amountCents?: number;
    confirmedAt: number;
    metadata?: Record<string, unknown>;
  };
}

// ─────────────────────────────────────────────────────────────
// SHIFT EVENTS
// ─────────────────────────────────────────────────────────────

export interface ShiftStartedEvent {
  type: 'shift.started';
  payload: {
    restaurantId: string;
    shiftId?: string;
    startedAt: number;
  };
}

export interface ShiftEndedEvent {
  type: 'shift.ended';
  payload: {
    restaurantId: string;
    shiftId?: string;
    endedAt: number;
  };
}

// ─────────────────────────────────────────────────────────────
// ALERT & TASK EVENTS
// ─────────────────────────────────────────────────────────────

export interface AlertRaisedEvent {
  type: 'alert.raised';
  payload: {
    alertId: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    raisedAt: number;
    metadata?: Record<string, unknown>;
  };
}

export interface TaskCreatedEvent {
  type: 'task.created';
  payload: {
    taskId: string;
    title: string;
    description?: string;
    priority?: string;
    assigneeRole?: string;
    createdAt: number;
  };
}

// ─────────────────────────────────────────────────────────────
// UNION TYPE & EVENT TYPE LITERAL
// ─────────────────────────────────────────────────────────────

export type IntegrationEvent =
  | OrderCreatedEvent
  | OrderUpdatedEvent
  | OrderCompletedEvent
  | OrderPaidEvent
  | OrderReadyEvent
  | OrderClosedEvent
  | PaymentConfirmedEvent
  | MenuUpdatedEvent
  | DeliveryStatusEvent
  | ShiftStartedEvent
  | ShiftEndedEvent
  | AlertRaisedEvent
  | TaskCreatedEvent;

/** Literal union of event type strings for webhook config and API. */
export type IntegrationEventType = IntegrationEvent['type'];

/** All canonical event type strings (for UI selectors and validation). */
export const INTEGRATION_EVENT_TYPES: IntegrationEventType[] = [
  'order.created',
  'order.updated',
  'order.completed',
  'order.paid',
  'order.ready',
  'order.closed',
  'payment.confirmed',
  'menu.updated',
  'delivery.status',
  'shift.started',
  'shift.ended',
  'alert.raised',
  'task.created',
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

export const createOrderCreatedEvent = (
  payload: OrderCreatedEvent['payload']
): OrderCreatedEvent => ({
  type: 'order.created',
  payload,
});

export const createOrderUpdatedEvent = (
  payload: OrderUpdatedEvent['payload']
): OrderUpdatedEvent => ({
  type: 'order.updated',
  payload,
});

export const createOrderCompletedEvent = (
  payload: OrderCompletedEvent['payload']
): OrderCompletedEvent => ({
  type: 'order.completed',
  payload,
});

export const createOrderPaidEvent = (
  payload: OrderPaidEvent['payload']
): OrderPaidEvent => ({
  type: 'order.paid',
  payload,
});

export const createOrderReadyEvent = (
  payload: OrderReadyEvent['payload']
): OrderReadyEvent => ({
  type: 'order.ready',
  payload,
});

export const createOrderClosedEvent = (
  payload: OrderClosedEvent['payload']
): OrderClosedEvent => ({
  type: 'order.closed',
  payload,
});

export const createPaymentConfirmedEvent = (
  payload: PaymentConfirmedEvent['payload']
): PaymentConfirmedEvent => ({
  type: 'payment.confirmed',
  payload,
});

export const createShiftStartedEvent = (
  payload: ShiftStartedEvent['payload']
): ShiftStartedEvent => ({
  type: 'shift.started',
  payload,
});

export const createShiftEndedEvent = (
  payload: ShiftEndedEvent['payload']
): ShiftEndedEvent => ({
  type: 'shift.ended',
  payload,
});

export const createAlertRaisedEvent = (
  payload: AlertRaisedEvent['payload']
): AlertRaisedEvent => ({
  type: 'alert.raised',
  payload,
});

export const createTaskCreatedEvent = (
  payload: TaskCreatedEvent['payload']
): TaskCreatedEvent => ({
  type: 'task.created',
  payload,
});
