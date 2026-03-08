/**
 * Kitchen Preparation Time Functions
 *
 * Funções puras para cálculos de tempo de preparo.
 * Sem dependências de React ou infraestrutura.
 */

import type {
  KitchenItem,
  KitchenOrder,
  TimerState,
  TimerThresholds,
} from "./types";
import { DEFAULT_TIMER_THRESHOLDS } from "./types";

/**
 * Calcula a idade de um pedido em minutos.
 *
 * @param createdAt - Data de criação (ISO string)
 * @param now - Data atual (default: Date.now())
 * @returns Idade em minutos
 */
export function calculateOrderAge(
  createdAt: string,
  now: number = Date.now(),
): number {
  const created = new Date(createdAt).getTime();
  return Math.floor((now - created) / 60000);
}

/**
 * Calcula a idade de um pedido em segundos.
 *
 * @param createdAt - Data de criação (ISO string)
 * @param now - Data atual (default: Date.now())
 * @returns Idade em segundos
 */
export function calculateOrderAgeSeconds(
  createdAt: string,
  now: number = Date.now(),
): number {
  const created = new Date(createdAt).getTime();
  return Math.floor((now - created) / 1000);
}

/**
 * Calcula o atraso de um item em relação ao tempo de preparo esperado.
 *
 * @param item - Item da cozinha
 * @param now - Data atual (default: Date.now())
 * @returns Atraso em segundos (negativo se ainda no prazo)
 */
export function calculateItemDelay(
  item: KitchenItem,
  now: number = Date.now(),
): number {
  if (!item.startedAt) return 0;
  const started = new Date(item.startedAt).getTime();
  const elapsed = Math.floor((now - started) / 1000);
  return elapsed - item.prepTimeSeconds;
}

/**
 * Determina o estado do timer baseado na idade do pedido.
 *
 * @param ageMinutes - Idade do pedido em minutos
 * @param thresholds - Thresholds para cada estado
 * @returns Estado do timer
 */
export function determineTimerState(
  ageMinutes: number,
  thresholds: TimerThresholds = DEFAULT_TIMER_THRESHOLDS,
): TimerState {
  if (ageMinutes >= thresholds.delay) return "delay";
  if (ageMinutes >= thresholds.attention) return "attention";
  return "normal";
}

/**
 * Formata tempo em minutos e segundos.
 *
 * @param totalSeconds - Tempo total em segundos
 * @returns String formatada (ex: "5:30")
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Formata tempo em minutos.
 *
 * @param totalSeconds - Tempo total em segundos
 * @returns String formatada (ex: "5 min")
 */
export function formatTimeMinutes(totalSeconds: number): string {
  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes} min`;
}

/**
 * Calcula o tempo total de preparo de um pedido.
 *
 * @param order - Pedido da cozinha
 * @returns Tempo total em segundos
 */
export function calculateTotalPrepTime(order: KitchenOrder): number {
  return order.items.reduce((max, item) => {
    return Math.max(max, item.prepTimeSeconds);
  }, 0);
}

/**
 * Calcula o progresso de preparo de um pedido.
 *
 * @param order - Pedido da cozinha
 * @returns Progresso de 0 a 1
 */
export function calculatePrepProgress(order: KitchenOrder): number {
  const total = order.items.length;
  if (total === 0) return 1;

  const completed = order.items.filter(
    (item) => item.status === "ready" || item.status === "delivered",
  ).length;

  return completed / total;
}

/**
 * Verifica se todos os itens de um pedido estão prontos.
 *
 * @param order - Pedido da cozinha
 * @returns true se todos os itens estão prontos
 */
export function isOrderComplete(order: KitchenOrder): boolean {
  return order.items.every(
    (item) =>
      item.status === "ready" ||
      item.status === "delivered" ||
      item.status === "cancelled",
  );
}

/**
 * Conta itens pendentes em um pedido.
 *
 * @param order - Pedido da cozinha
 * @returns Número de itens pendentes
 */
export function countPendingItems(order: KitchenOrder): number {
  return order.items.filter(
    (item) => item.status === "pending" || item.status === "preparing",
  ).length;
}
