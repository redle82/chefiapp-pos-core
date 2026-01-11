/**
 * IntegrationEventBus — Ponto único de emissão de eventos
 * 
 * Uso:
 * ```ts
 * import { emitIntegrationEvent } from '@/integrations';
 * 
 * emitIntegrationEvent({
 *   type: 'order.created',
 *   payload: { ... }
 * });
 * ```
 * 
 * Princípio: TPV, Staff e outros módulos emitem eventos aqui.
 * Adapters escutam via Registry. Ninguém se chama diretamente.
 */

import { IntegrationRegistry } from './IntegrationRegistry';
import type { IntegrationEvent } from '../types/IntegrationEvent';

// ─────────────────────────────────────────────────────────────
// EVENT EMISSION
// ─────────────────────────────────────────────────────────────

/**
 * Emite um evento para todas as integrações registradas
 * 
 * Esta é a API pública principal do sistema de integrações.
 * Pode ser chamada de qualquer lugar do sistema.
 */
export const emitIntegrationEvent = async (event: IntegrationEvent): Promise<void> => {
  if (import.meta.env.DEV) {
    console.log(`[EventBus] 📤 ${event.type}`, event.payload);
  }

  await IntegrationRegistry.dispatch(event);
};

/**
 * Versão fire-and-forget (não aguarda processamento)
 * Use quando não precisa garantir que o evento foi processado
 */
export const emitIntegrationEventAsync = (event: IntegrationEvent): void => {
  emitIntegrationEvent(event).catch(err => {
    console.error('[EventBus] Async emission failed:', err);
  });
};

// ─────────────────────────────────────────────────────────────
// EVENT HELPERS (conveniência)
// ─────────────────────────────────────────────────────────────

import {
  createOrderCreatedEvent,
  createOrderUpdatedEvent,
  createOrderCompletedEvent,
  type OrderCreatedEvent,
  type OrderUpdatedEvent,
  type OrderCompletedEvent,
} from '../types/IntegrationEvent';

/**
 * Emite evento de pedido criado
 */
export const emitOrderCreated = (payload: OrderCreatedEvent['payload']): void => {
  emitIntegrationEventAsync(createOrderCreatedEvent(payload));
};

/**
 * Emite evento de pedido atualizado
 */
export const emitOrderUpdated = (payload: OrderUpdatedEvent['payload']): void => {
  emitIntegrationEventAsync(createOrderUpdatedEvent(payload));
};

/**
 * Emite evento de pedido completado
 */
export const emitOrderCompleted = (payload: OrderCompletedEvent['payload']): void => {
  emitIntegrationEventAsync(createOrderCompletedEvent(payload));
};
