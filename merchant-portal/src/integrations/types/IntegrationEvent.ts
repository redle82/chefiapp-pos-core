/**
 * IntegrationEvent — Eventos que fluem pelo sistema de integrações
 * 
 * Princípio: Todo evento é imutável e auto-descritivo.
 * Adapters reagem a eventos, nunca os modificam.
 */

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
    createdAt: number;
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
// UNION TYPE
// ─────────────────────────────────────────────────────────────

export type IntegrationEvent =
  | OrderCreatedEvent
  | OrderUpdatedEvent
  | OrderCompletedEvent
  | MenuUpdatedEvent
  | DeliveryStatusEvent;

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
