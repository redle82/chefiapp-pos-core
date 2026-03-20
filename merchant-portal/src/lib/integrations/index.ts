/**
 * Integrations — Stub barrel for Vite build.
 *
 * The Vite alias rewrites `../../../../../integrations` to `src/lib/integrations/`.
 * This file re-exports all names that integration pages import from the barrel.
 *
 * Real implementation lives in src/integrations/.
 */

// ── IntegrationRegistry (singleton stub) ────────────────────────────

interface IntegrationAdapterLike {
  id: string;
  [key: string]: unknown;
}

export const IntegrationRegistry = {
  async register(_adapter: IntegrationAdapterLike): Promise<void> {},
  async unregister(_adapterId: string): Promise<void> {},
  async dispatch(_event: unknown): Promise<void> {},
  getAll(): IntegrationAdapterLike[] {
    return [];
  },
  get(_id: string): IntegrationAdapterLike | undefined {
    return undefined;
  },
};

// ── INTEGRATION_EVENT_TYPES (used by WebhooksPage) ──────────────────

export const INTEGRATION_EVENT_TYPES: string[] = [
  "order.created",
  "order.updated",
  "order.completed",
  "order.paid",
  "order.ready",
  "order.closed",
  "payment.confirmed",
  "menu.updated",
  "delivery.status",
  "shift.started",
  "shift.ended",
  "alert.raised",
  "task.created",
];

// ── StripePaymentAdapter (used by PaymentsPage) ─────────────────────

export const StripePaymentAdapter: IntegrationAdapterLike = {
  id: "stripe_payment",
  name: "Stripe",
  description: "Stub Stripe adapter",
  capabilities: ["payments.process"],
  async onEvent() {},
  async healthCheck() {
    return { status: "degraded", lastCheckedAt: Date.now() };
  },
};

export const STRIPE_PAYMENT_ADAPTER_ID = "stripe_payment";

// ── PaymentIntegrationService stubs (used by PaymentsPage) ──────────

export async function openCustomerPortal(): Promise<{ url: string }> {
  console.warn("[integrations stub] openCustomerPortal not implemented");
  return { url: "" };
}

export async function startCheckout(): Promise<{ url: string }> {
  console.warn("[integrations stub] startCheckout not implemented");
  return { url: "" };
}

export function getActivePaymentAdapter(): IntegrationAdapterLike | undefined {
  return undefined;
}

// ── Event bus stubs ─────────────────────────────────────────────────

export function emitIntegrationEvent(_event: unknown): void {}
export async function emitIntegrationEventAsync(_event: unknown): Promise<void> {}
export function emitOrderCreated(_payload: unknown): void {}
export function emitOrderUpdated(_payload: unknown): void {}
export function emitOrderCompleted(_payload: unknown): void {}

// ── Type re-exports (types are erased at build, so stubs are fine) ──

export type IntegrationEvent = {
  type: string;
  payload: unknown;
  timestamp?: number;
  source?: string;
};

export type IntegrationEventType = string;
export type IntegrationAdapter = IntegrationAdapterLike;
export type IntegrationCapability = string;

export type IntegrationStatus = {
  status: "ok" | "degraded" | "down";
  lastCheckedAt: number;
};

export type IntegrationHealthStatus = "ok" | "degraded" | "down";

export type IntegrationInfo = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: IntegrationStatus;
};

// ── Mock adapter stubs ──────────────────────────────────────────────

export const MockDeliveryAdapter: IntegrationAdapterLike = {
  id: "mock_delivery",
  name: "Mock Delivery",
  description: "Stub mock delivery adapter",
  capabilities: ["orders.receive"],
};

export const mockDeliveryAdapter = MockDeliveryAdapter;

// ── Status helpers ──────────────────────────────────────────────────

export function createHealthyStatus(): IntegrationStatus {
  return { status: "ok", lastCheckedAt: Date.now() };
}
export function createDegradedStatus(): IntegrationStatus {
  return { status: "degraded", lastCheckedAt: Date.now() };
}
export function createDownStatus(): IntegrationStatus {
  return { status: "down", lastCheckedAt: Date.now() };
}

// ── Event factories ─────────────────────────────────────────────────

export function createOrderCreatedEvent(payload: unknown): IntegrationEvent {
  return { type: "order.created", payload };
}
export function createOrderUpdatedEvent(payload: unknown): IntegrationEvent {
  return { type: "order.updated", payload };
}
export function createOrderCompletedEvent(payload: unknown): IntegrationEvent {
  return { type: "order.completed", payload };
}
export function createOrderPaidEvent(payload: unknown): IntegrationEvent {
  return { type: "order.paid", payload };
}
export function createOrderReadyEvent(payload: unknown): IntegrationEvent {
  return { type: "order.ready", payload };
}
export function createOrderClosedEvent(payload: unknown): IntegrationEvent {
  return { type: "order.closed", payload };
}
export function createPaymentConfirmedEvent(payload: unknown): IntegrationEvent {
  return { type: "payment.confirmed", payload };
}
export function createShiftStartedEvent(payload: unknown): IntegrationEvent {
  return { type: "shift.started", payload };
}
export function createShiftEndedEvent(payload: unknown): IntegrationEvent {
  return { type: "shift.ended", payload };
}
export function createAlertRaisedEvent(payload: unknown): IntegrationEvent {
  return { type: "alert.raised", payload };
}
export function createTaskCreatedEvent(payload: unknown): IntegrationEvent {
  return { type: "task.created", payload };
}

// ── Contract helpers ────────────────────────────────────────────────

export function hasCapability(_adapter: IntegrationAdapterLike, _cap: string): boolean {
  return false;
}
export function canReceiveOrders(_adapter: IntegrationAdapterLike): boolean {
  return false;
}
export function canSyncMenu(_adapter: IntegrationAdapterLike): boolean {
  return false;
}
export function canTrackDelivery(_adapter: IntegrationAdapterLike): boolean {
  return false;
}

// ── WhatsApp re-exports (some files import from barrel) ─────────────

export {
  WhatsAppAdapter,
  createWhatsAppAdapter,
  WHATSAPP_ADAPTER_ID,
} from "./adapters/whatsapp/WhatsAppAdapter";
export type { WhatsAppAdapterConfig } from "./adapters/whatsapp/WhatsAppAdapter";

// ── GloriaFood stubs ────────────────────────────────────────────────

export const GloriaFoodAdapter: IntegrationAdapterLike = {
  id: "gloriafood",
  name: "GloriaFood",
  description: "Stub GloriaFood adapter",
  capabilities: ["orders.receive"],
};

export function createGloriaFoodAdapter(): IntegrationAdapterLike {
  return GloriaFoodAdapter;
}
export function isValidGloriaFoodPayload(_p: unknown): boolean {
  return false;
}
export function isNewOrderEvent(_p: unknown): boolean {
  return false;
}
export function isCancellationEvent(_p: unknown): boolean {
  return false;
}

export type GloriaFoodConfig = Record<string, unknown>;
export type GloriaFoodWebhookPayload = Record<string, unknown>;
export type GloriaFoodOrder = Record<string, unknown>;

// ── Additional type stubs matching real barrel ──────────────────────

export type OrderCreatedEvent = IntegrationEvent;
export type OrderUpdatedEvent = IntegrationEvent;
export type OrderCompletedEvent = IntegrationEvent;
export type OrderPaidEvent = IntegrationEvent;
export type OrderReadyEvent = IntegrationEvent;
export type OrderClosedEvent = IntegrationEvent;
export type PaymentConfirmedEvent = IntegrationEvent;
export type MenuUpdatedEvent = IntegrationEvent;
export type DeliveryStatusEvent = IntegrationEvent;
export type ShiftStartedEvent = IntegrationEvent;
export type ShiftEndedEvent = IntegrationEvent;
export type AlertRaisedEvent = IntegrationEvent;
export type TaskCreatedEvent = IntegrationEvent;

export type EmitOptions = {
  async?: boolean;
};

export type MockOrder = Record<string, unknown>;
export type MockOrderItem = Record<string, unknown>;
