/**
 * IntegrationEventBus — Ponto único de emissão de eventos
 *
 * Uso:
 * ```ts
 * import { emitIntegrationEvent } from '@/integrations';
 *
 * emitIntegrationEvent({ type: 'order.created', payload: { ... } }, { restaurantId: '...' });
 * ```
 *
 * Se options.restaurantId for passado, o evento é também enviado ao backend (POST /internal/events)
 * para entrega a Webhooks OUT configurados. Ref: CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md
 */

import { IntegrationRegistry } from './IntegrationRegistry';
import type { IntegrationEvent } from '../types/IntegrationEvent';

const API_BASE =
  typeof window !== 'undefined' ? '' : (import.meta.env?.VITE_API_BASE ?? 'http://localhost:4320');
const INTERNAL_TOKEN = import.meta.env?.VITE_INTERNAL_API_TOKEN ?? 'chefiapp-internal-token-dev';

export interface EmitOptions {
  /** Quando presente, o evento é enviado ao backend para Webhooks OUT. */
  restaurantId?: string;
}

/**
 * Emite um evento para todas as integrações registradas e, se restaurantId for passado,
 * envia também ao backend (POST /internal/events) para entrega a Webhooks OUT.
 */
export const emitIntegrationEvent = async (
  event: IntegrationEvent,
  options?: EmitOptions
): Promise<void> => {
  if (!event?.payload) {
    console.warn("[EventBus] Ignoring event without payload:", event?.type ?? event);
    return;
  }
  if (import.meta.env.DEV) {
    console.log(`[EventBus] 📤 ${event.type}`, event.payload);
  }

  await IntegrationRegistry.dispatch(event);

  if (options?.restaurantId) {
    const url = `${API_BASE}/internal/events`;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        event: event.type,
        restaurant_id: options.restaurantId,
        payload: event.payload,
      }),
    }).catch(err => {
      console.warn('[EventBus] Webhooks OUT delivery request failed:', err);
    });
  }
};

/**
 * Versão fire-and-forget (não aguarda processamento)
 * Use quando não precisa garantir que o evento foi processado
 */
export const emitIntegrationEventAsync = (
  event: IntegrationEvent,
  options?: EmitOptions
): void => {
  emitIntegrationEvent(event, options).catch(err => {
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
