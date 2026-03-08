/**
 * Order Calculation Functions
 *
 * Funções puras para cálculos de pedidos.
 * Sem dependências de React ou infraestrutura.
 */

import type { OrderItem, OrderTotals } from "./types";

/**
 * Calcula o preço total de um item incluindo modificadores.
 *
 * @param item - Item do pedido
 * @returns Preço total do item em centavos
 */
export function calculateItemTotal(item: OrderItem): number {
  const modifiersTotal =
    item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) ?? 0;
  return (item.unitPrice + modifiersTotal) * item.quantity;
}

/**
 * Calcula o subtotal de uma lista de itens.
 *
 * @param items - Lista de itens do pedido
 * @returns Subtotal em centavos
 */
export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

/**
 * Calcula o imposto sobre um valor.
 *
 * @param subtotal - Subtotal em centavos
 * @param taxRate - Taxa de imposto (ex: 0.23 para 23%)
 * @returns Valor do imposto em centavos
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * taxRate);
}

/**
 * Calcula o total final do pedido.
 *
 * @param subtotal - Subtotal em centavos
 * @param tax - Imposto em centavos
 * @param discount - Desconto em centavos
 * @returns Total em centavos
 */
export function calculateTotal(
  subtotal: number,
  tax: number,
  discount: number,
): number {
  return Math.max(0, subtotal + tax - discount);
}

/**
 * Calcula todos os totais de um pedido.
 *
 * @param items - Lista de itens do pedido
 * @param taxRate - Taxa de imposto (default 0)
 * @param discount - Desconto em centavos (default 0)
 * @returns Objeto com todos os totais
 */
export function calculateOrderTotals(
  items: OrderItem[],
  taxRate: number = 0,
  discount: number = 0,
): OrderTotals {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal, taxRate);
  const total = calculateTotal(subtotal, tax, discount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    discount,
    total,
    itemCount,
  };
}

/**
 * Calcula o desconto percentual.
 *
 * @param subtotal - Subtotal em centavos
 * @param discountPercent - Percentual de desconto (ex: 10 para 10%)
 * @returns Valor do desconto em centavos
 */
export function calculatePercentDiscount(
  subtotal: number,
  discountPercent: number,
): number {
  return Math.round(subtotal * (discountPercent / 100));
}
