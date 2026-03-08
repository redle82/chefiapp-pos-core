/**
 * Order Status Helper Functions
 *
 * Funções puras para manipulação de status de pedidos.
 * Sem dependências de React ou infraestrutura.
 */

import type { Order, OrderPaymentStatus, OrderStatus, Payment } from "./types";

/**
 * Verifica se um pedido está ativo (não finalizado).
 *
 * @param status - Status do pedido
 * @returns true se o pedido está ativo
 */
export function isOrderActive(status: OrderStatus): boolean {
  return status !== "PAID" && status !== "CANCELLED";
}

/**
 * Verifica se um pedido pode ser pago.
 *
 * @param order - Pedido
 * @returns true se o pedido pode ser pago
 */
export function canOrderBePaid(order: Order): boolean {
  return (
    order.status !== "PAID" &&
    order.status !== "CANCELLED" &&
    order.total > 0
  );
}

/**
 * Verifica se um pedido pode ser cancelado.
 *
 * @param order - Pedido
 * @returns true se o pedido pode ser cancelado
 */
export function canOrderBeCancelled(order: Order): boolean {
  return order.status !== "PAID" && order.status !== "CANCELLED";
}

/**
 * Determina o status de pagamento de um pedido.
 *
 * @param order - Pedido
 * @param payments - Lista de pagamentos do pedido
 * @returns Status de pagamento
 */
export function determinePaymentStatus(
  order: Order,
  payments: Payment[],
): OrderPaymentStatus {
  const completedPayments = payments.filter((p) => p.status === "completed");
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid === 0) return "unpaid";
  if (totalPaid >= order.total) return "paid";
  return "partial";
}

/**
 * Calcula o valor restante a pagar.
 *
 * @param order - Pedido
 * @param payments - Lista de pagamentos do pedido
 * @returns Valor restante em centavos
 */
export function calculateRemainingAmount(
  order: Order,
  payments: Payment[],
): number {
  const completedPayments = payments.filter((p) => p.status === "completed");
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, order.total - totalPaid);
}

/**
 * Verifica se um pedido está pronto para entrega.
 *
 * @param status - Status do pedido
 * @returns true se está pronto
 */
export function isOrderReady(status: OrderStatus): boolean {
  return status === "READY";
}

/**
 * Verifica se um pedido está em preparação.
 *
 * @param status - Status do pedido
 * @returns true se está em preparação
 */
export function isOrderPreparing(status: OrderStatus): boolean {
  return status === "PREPARING";
}

/**
 * Determina o próximo status válido para um pedido.
 *
 * @param currentStatus - Status atual
 * @returns Próximo status ou null se não há transição válida
 */
export function getNextOrderStatus(
  currentStatus: OrderStatus,
): OrderStatus | null {
  const transitions: Record<OrderStatus, OrderStatus | null> = {
    OPEN: "PREPARING",
    PREPARING: "READY",
    READY: "DELIVERED",
    DELIVERED: "PAID",
    PAID: null,
    CANCELLED: null,
  };
  return transitions[currentStatus];
}

/**
 * Verifica se uma transição de status é válida.
 *
 * @param from - Status atual
 * @param to - Status desejado
 * @returns true se a transição é válida
 */
export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    OPEN: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY", "CANCELLED"],
    READY: ["DELIVERED", "CANCELLED"],
    DELIVERED: ["PAID"],
    PAID: [],
    CANCELLED: [],
  };
  return validTransitions[from].includes(to);
}
