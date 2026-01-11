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
  OrderCreatedEvent,
  OrderUpdatedEvent,
  OrderCompletedEvent,
  MenuUpdatedEvent,
  DeliveryStatusEvent,
} from './types/IntegrationEvent';

export type {
  IntegrationStatus,
  IntegrationHealthStatus,
  IntegrationInfo,
} from './types/IntegrationStatus';

export {
  createOrderCreatedEvent,
  createOrderUpdatedEvent,
  createOrderCompletedEvent,
} from './types/IntegrationEvent';

export {
  createHealthyStatus,
  createDegradedStatus,
  createDownStatus,
} from './types/IntegrationStatus';

// ─────────────────────────────────────────────────────────────
// ADAPTERS
// ─────────────────────────────────────────────────────────────

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
