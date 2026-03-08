/**
 * Kitchen Domain Types
 *
 * Tipos finitos para o domínio de cozinha/KDS.
 * Sem dependências de React ou infraestrutura.
 */

/** Estado do timer de um pedido */
export type TimerState = "normal" | "attention" | "delay" | "ready";

/** Status de um item na cozinha */
export type KitchenItemStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

/** Prioridade de um pedido */
export type OrderPriority = "normal" | "high" | "urgent";

/** Item na cozinha */
export interface KitchenItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  quantity: number;
  status: KitchenItemStatus;
  prepTimeSeconds: number;
  notes?: string;
  modifiers?: string[];
  startedAt?: string;
  completedAt?: string;
}

/** Pedido na cozinha */
export interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  type: "dine_in" | "takeaway" | "delivery";
  items: KitchenItem[];
  priority: OrderPriority;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/** Thresholds para estados do timer (em minutos) */
export interface TimerThresholds {
  attention: number;
  delay: number;
}

/** Configuração padrão de thresholds */
export const DEFAULT_TIMER_THRESHOLDS: TimerThresholds = {
  attention: 5,
  delay: 10,
};
