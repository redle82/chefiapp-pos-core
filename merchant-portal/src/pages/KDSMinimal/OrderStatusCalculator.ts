/**
 * ORDER STATUS CALCULATOR — Calcula status do pedido baseado nos itens
 * 
 * REGRA: O pedido herda o estado do item mais crítico.
 * 
 * expected_ready_at = max(item.created_at + item.prep_time)
 * delay_seconds = now - expected_ready_at
 * delay_ratio = delay_seconds / expected_ready_at
 */

import type { CoreOrder, CoreOrderItem } from '../../core-boundary/docker-core/types';

export type OrderStatusState = 'normal' | 'attention' | 'delay';

export interface OrderStatusResult {
  // Item mais crítico (maior delay)
  criticalItem: CoreOrderItem | null;
  expectedReadyAt: Date | null; // Data esperada do item mais lento
  delaySeconds: number; // Delay do item mais crítico
  delayRatio: number; // 0.0 = no prazo, 0.1 = 10% atrasado
  state: OrderStatusState;
  borderColor: string;
  // Station dominante (BAR ou KITCHEN do item mais crítico)
  dominantStation: 'BAR' | 'KITCHEN' | null;
}

/**
 * Calcula o status do pedido baseado nos itens.
 * O pedido herda o estado do item mais crítico.
 */
export function calculateOrderStatus(
  order: CoreOrder,
  items: CoreOrderItem[]
): OrderStatusResult {
  if (items.length === 0) {
    return {
      criticalItem: null,
      expectedReadyAt: null,
      delaySeconds: 0,
      delayRatio: 0,
      state: 'normal',
      borderColor: '#ccc',
      dominantStation: null,
    };
  }

  const now = new Date();
  let criticalItem: CoreOrderItem | null = null;
  let maxDelayRatio = -Infinity;
  let maxExpectedReadyAt: Date | null = null;

  // Encontrar o item mais crítico (maior delay ratio)
  for (const item of items) {
    const created = new Date(item.created_at);
    const prepTimeSeconds = item.prep_time_seconds || 300; // 5 min padrão
    const expectedReadyAt = new Date(created.getTime() + prepTimeSeconds * 1000);
    
    const delaySeconds = (now.getTime() - expectedReadyAt.getTime()) / 1000;
    const delayRatio = prepTimeSeconds > 0 ? delaySeconds / prepTimeSeconds : 0;

    // Item mais crítico é o que tem maior delay ratio
    if (delayRatio > maxDelayRatio) {
      maxDelayRatio = delayRatio;
      criticalItem = item;
      maxExpectedReadyAt = expectedReadyAt;
    }
  }

  // Determinar estado baseado em desvio relativo
  let state: OrderStatusState;
  let borderColor: string;

  if (maxDelayRatio < 0.1) {
    // Dentro do prazo (até 10% de tolerância)
    state = 'normal';
    borderColor = '#22c55e'; // Verde
  } else if (maxDelayRatio < 0.25) {
    // 10-25% atrasado (atenção)
    state = 'attention';
    borderColor = '#eab308'; // Amarelo
  } else {
    // +25% ou mais atrasado (crítico)
    state = 'delay';
    borderColor = '#ef4444'; // Vermelho
  }

  return {
    criticalItem,
    expectedReadyAt: maxExpectedReadyAt,
    delaySeconds: maxDelayRatio > 0 ? (now.getTime() - (maxExpectedReadyAt?.getTime() || 0)) / 1000 : 0,
    delayRatio: maxDelayRatio,
    state,
    borderColor,
    dominantStation: criticalItem?.station || null,
  };
}
