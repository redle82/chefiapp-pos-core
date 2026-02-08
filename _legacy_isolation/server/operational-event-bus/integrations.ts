/**
 * integrations.ts — Integrações do Event Bus com Módulos
 * 
 * Conecta Event Bus aos módulos existentes:
 * - OperationalHub (stock, time-tracking)
 * - TPV (orders)
 * - ReputationHub (reviews)
 * - AppStaff (tasks)
 */

import { emitEvent, CreateEventParams } from './event-bus';

/**
 * Stock Integration
 */
export async function emitStockLowEvent(
  restaurantId: string,
  stockItem: { id: string; product_name: string; current_stock: number; min_stock: number }
): Promise<void> {
  await emitEvent({
    restaurant_id: restaurantId,
    event_type: stockItem.current_stock === 0 ? 'stock_critical' : 'stock_low',
    priority: stockItem.current_stock === 0 ? 'P0' : 'P1',
    source_module: 'stock',
    source_id: stockItem.id,
    context: {
      product_name: stockItem.product_name,
      current_stock: stockItem.current_stock,
      min_stock: stockItem.min_stock,
      description: `Estoque baixo: ${stockItem.product_name} (${stockItem.current_stock} unidades, mínimo: ${stockItem.min_stock})`,
    },
    target_roles: ['manager', 'stock'],
    dedupe_key: `stock_low_${stockItem.id}_${new Date().toISOString().split('T')[0]}`,
    dedupe_window_minutes: 60, // 1 hora para evitar spam
  });
}

export async function emitStockRestockedEvent(
  restaurantId: string,
  stockItem: { id: string; product_name: string; quantity: number }
): Promise<void> {
  await emitEvent({
    restaurant_id: restaurantId,
    event_type: 'stock_restocked',
    priority: 'P3',
    source_module: 'stock',
    source_id: stockItem.id,
    context: {
      product_name: stockItem.product_name,
      quantity: stockItem.quantity,
      description: `Estoque reposto: ${stockItem.product_name} (+${stockItem.quantity} unidades)`,
    },
  });
}

/**
 * TPV Integration
 */
export async function emitOrderCreatedEvent(
  restaurantId: string,
  order: { id: string; table_id?: string; table_number?: number; total: number }
): Promise<void> {
  await emitEvent({
    restaurant_id: restaurantId,
    event_type: 'order_created',
    priority: 'P2',
    source_module: 'tpv',
    source_id: order.id,
    context: {
      order_id: order.id,
      table_id: order.table_id,
      table_number: order.table_number,
      total: order.total,
      description: order.table_number
        ? `Novo pedido na Mesa ${order.table_number}`
        : 'Novo pedido criado',
    },
    target_roles: ['kitchen', 'bar'],
  });
}

export async function emitOrderPaidEvent(
  restaurantId: string,
  order: { id: string; table_id?: string; table_number?: number; total: number }
): Promise<void> {
  await emitEvent({
    restaurant_id: restaurantId,
    event_type: 'order_paid',
    priority: 'P2',
    source_module: 'tpv',
    source_id: order.id,
    context: {
      order_id: order.id,
      table_id: order.table_id,
      table_number: order.table_number,
      total: order.total,
      description: order.table_number
        ? `Mesa ${order.table_number} pagou (€${(order.total / 100).toFixed(2)})`
        : 'Pedido pago',
    },
    target_roles: ['waiter', 'cleaner'],
  });
}

/**
 * Staff Integration (Waiter Calls)
 */
let waiterCallCounts: Map<string, { count: number; lastCall: Date }> = new Map();

export async function emitWaiterCallEvent(
  restaurantId: string,
  call: { table_id: string; table_number: number; user_id?: string }
): Promise<void> {
  const callKey = `${restaurantId}_${call.table_id}`;
  const existing = waiterCallCounts.get(callKey);

  if (existing) {
    const minutesSinceLastCall = (Date.now() - existing.lastCall.getTime()) / (1000 * 60);
    
    if (minutesSinceLastCall < 5) {
      // Repeated call within 5 minutes
      existing.count += 1;
      existing.lastCall = new Date();

      if (existing.count >= 3) {
        // 3+ calls = urgent
        await emitEvent({
          restaurant_id: restaurantId,
          event_type: 'waiter_call_repeated',
          priority: 'P0',
          source_module: 'staff',
          source_id: call.table_id,
          context: {
            table_id: call.table_id,
            table_number: call.table_number,
            call_count: existing.count,
            description: `URGENTE: Mesa ${call.table_number} chamando repetidamente (${existing.count}x)`,
          },
          target_roles: ['waiter', 'manager'],
          dedupe_key: `waiter_call_${call.table_id}`,
          dedupe_window_minutes: 5,
        });
      }
    } else {
      // Reset count if > 5 minutes
      waiterCallCounts.delete(callKey);
    }
  } else {
    // First call
    waiterCallCounts.set(callKey, { count: 1, lastCall: new Date() });

    await emitEvent({
      restaurant_id: restaurantId,
      event_type: 'waiter_call',
      priority: 'P1',
      source_module: 'staff',
      source_id: call.table_id,
      context: {
        table_id: call.table_id,
        table_number: call.table_number,
        description: `Mesa ${call.table_number} chamando`,
      },
      target_roles: ['waiter'],
      target_user_id: call.user_id,
      dedupe_key: `waiter_call_${call.table_id}`,
      dedupe_window_minutes: 5,
    });
  }
}

/**
 * Review Integration
 */
export async function emitReviewReceivedEvent(
  restaurantId: string,
  review: {
    id: string;
    rating: number;
    text: string;
    topics?: string[];
  }
): Promise<void> {
  const isNegative = review.rating <= 2;
  const isPositive = review.rating >= 4;

  await emitEvent({
    restaurant_id: restaurantId,
    event_type: isNegative ? 'review_negative' : isPositive ? 'review_positive' : 'review_received',
    priority: isNegative ? 'P1' : 'P3',
    source_module: 'reviews',
    source_id: review.id,
    context: {
      review_id: review.id,
      rating: review.rating,
      text: review.text.substring(0, 200), // First 200 chars
      topics: review.topics || [],
      description: isNegative
        ? `Review negativo recebido (${review.rating} estrelas)`
        : isPositive
        ? `Review positivo recebido (${review.rating} estrelas)`
        : `Review recebido (${review.rating} estrelas)`,
    },
    target_roles: isNegative ? ['manager', 'owner'] : [],
  });

  // Emit topic-specific events
  if (review.topics) {
    for (const topic of review.topics) {
      if (topic === 'cleanliness') {
        await emitEvent({
          restaurant_id: restaurantId,
          event_type: 'review_mention_cleanliness',
          priority: isNegative ? 'P1' : 'P3',
          source_module: 'reviews',
          source_id: review.id,
          context: {
            review_id: review.id,
            rating: review.rating,
            description: `Review menciona limpeza`,
          },
          target_roles: ['manager', 'cleaner'],
        });
      } else if (topic === 'service') {
        await emitEvent({
          restaurant_id: restaurantId,
          event_type: 'review_mention_service',
          priority: isNegative ? 'P1' : 'P3',
          source_module: 'reviews',
          source_id: review.id,
          context: {
            review_id: review.id,
            rating: review.rating,
            description: `Review menciona atendimento`,
          },
          target_roles: ['manager', 'waiter'],
        });
      } else if (topic === 'price') {
        await emitEvent({
          restaurant_id: restaurantId,
          event_type: 'review_mention_price',
          priority: 'P2',
          source_module: 'reviews',
          source_id: review.id,
          context: {
            review_id: review.id,
            rating: review.rating,
            description: `Review menciona preço`,
          },
          target_roles: ['manager', 'owner'],
        });
      } else if (topic === 'food') {
        await emitEvent({
          restaurant_id: restaurantId,
          event_type: 'review_mention_food',
          priority: isNegative ? 'P1' : 'P3',
          source_module: 'reviews',
          source_id: review.id,
          context: {
            review_id: review.id,
            rating: review.rating,
            description: `Review menciona comida`,
          },
          target_roles: ['manager', 'chef', 'kitchen'],
        });
      }
    }
  }
}

/**
 * Delivery Integration
 */
export async function emitDeliveryOrderReceivedEvent(
  restaurantId: string,
  order: { id: string; channel: string; total: number }
): Promise<void> {
  await emitEvent({
    restaurant_id: restaurantId,
    event_type: 'delivery_order_received',
    priority: 'P2',
    source_module: 'delivery',
    source_id: order.id,
    context: {
      order_id: order.id,
      channel: order.channel,
      total: order.total,
      description: `Pedido delivery recebido via ${order.channel}`,
    },
    target_roles: ['kitchen', 'bar'],
  });
}

/**
 * Operational Events
 */
export async function emitKitchenDelayEvent(
  restaurantId: string,
  delay: { order_id: string; delay_minutes: number }
): Promise<void> {
  await emitEvent({
    restaurant_id: restaurantId,
    event_type: 'kitchen_delay',
    priority: delay.delay_minutes > 30 ? 'P0' : delay.delay_minutes > 15 ? 'P1' : 'P2',
    source_module: 'operational',
    source_id: delay.order_id,
    context: {
      order_id: delay.order_id,
      delay_minutes: delay.delay_minutes,
      description: `Atraso na cozinha detectado: ${delay.delay_minutes} minutos`,
    },
    target_roles: ['kitchen', 'chef', 'manager'],
  });
}

