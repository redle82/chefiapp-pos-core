/**
 * ChefIApp Integration System
 * 
 * Sistema de integrações event-driven inspirado em Last.app e GloriaFood.
 * 
 * Princípios:
 * 1. ChefIApp = System of Record (fonte de verdade)
 * 2. Integrações = satélites, nunca o core
 * 3. Adapters não importam TPV/Staff/Inventory
 * 4. Tudo comunica via eventos
 * 5. Falhas são isoladas
 * 
 * Uso básico:
 * ```ts
 * import { 
 *   IntegrationRegistry, 
 *   emitIntegrationEvent,
 *   type IntegrationAdapter 
 * } from '@/integrations';
 * 
 * // Registrar adapter
 * await IntegrationRegistry.register(MyAdapter);
 * 
 * // Emitir evento
 * emitIntegrationEvent({ type: 'order.created', payload: {...} });
 * ```
 */

// ─────────────────────────────────────────────────────────────
// CORE
// ─────────────────────────────────────────────────────────────

export { IntegrationRegistry } from './core/IntegrationRegistry';

export {
  emitIntegrationEvent,
  emitIntegrationEventAsync,
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderCompleted,
} from './core/IntegrationEventBus';
export type { EmitOptions } from './core/IntegrationEventBus';

export {
  hasCapability,
  canReceiveOrders,
  canSyncMenu,
  canTrackDelivery,
} from './core/IntegrationContract';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type {
  IntegrationAdapter,
  IntegrationCapability,
} from './core/IntegrationContract';

export type {
  IntegrationEvent,
  IntegrationEventType,
  OrderCreatedEvent,
  OrderUpdatedEvent,
  OrderCompletedEvent,
  OrderPaidEvent,
  OrderReadyEvent,
  OrderClosedEvent,
  PaymentConfirmedEvent,
  MenuUpdatedEvent,
  DeliveryStatusEvent,
  ShiftStartedEvent,
  ShiftEndedEvent,
  AlertRaisedEvent,
  TaskCreatedEvent,
} from './types/IntegrationEvent';

export type {
  IntegrationStatus,
  IntegrationHealthStatus,
  IntegrationInfo,
} from './types/IntegrationStatus';

export {
  INTEGRATION_EVENT_TYPES,
  createOrderCreatedEvent,
  createOrderUpdatedEvent,
  createOrderCompletedEvent,
  createOrderPaidEvent,
  createOrderReadyEvent,
  createOrderClosedEvent,
  createPaymentConfirmedEvent,
  createShiftStartedEvent,
  createShiftEndedEvent,
  createAlertRaisedEvent,
  createTaskCreatedEvent,
} from './types/IntegrationEvent';

export {
  createHealthyStatus,
  createDegradedStatus,
  createDownStatus,
} from './types/IntegrationStatus';

// ─────────────────────────────────────────────────────────────
// ADAPTERS
// ─────────────────────────────────────────────────────────────

// Stripe (Payments)
export { StripePaymentAdapter, STRIPE_PAYMENT_ADAPTER_ID } from './adapters/stripe/StripePaymentAdapter';

// WhatsApp (Messaging)
export {
  WhatsAppAdapter,
  createWhatsAppAdapter,
  WHATSAPP_ADAPTER_ID,
} from './adapters/whatsapp/WhatsAppAdapter';
export type { WhatsAppAdapterConfig } from './adapters/whatsapp/WhatsAppAdapter';
export {
  getActivePaymentAdapter,
  startCheckout,
  openCustomerPortal,
} from './services/PaymentIntegrationService';

// Mock (Dev/Testing)
export { MockDeliveryAdapter, mockDeliveryAdapter } from './adapters/MockDeliveryAdapter';
export type { MockOrder, MockOrderItem } from './adapters/MockDeliveryAdapter';

// GloriaFood (Production)
export { 
  GloriaFoodAdapter, 
  createGloriaFoodAdapter,
  isValidGloriaFoodPayload,
  isNewOrderEvent,
  isCancellationEvent,
} from './adapters/gloriafood';
export type { 
  GloriaFoodConfig,
  GloriaFoodWebhookPayload,
  GloriaFoodOrder,
} from './adapters/gloriafood';
