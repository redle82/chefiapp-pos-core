/**
 * Template de Recibo do Cliente — ESC/POS.
 *
 * Imprime o recibo completo com:
 * - Cabeçalho do restaurante (nome + morada, centrado, tamanho duplo)
 * - Data/hora
 * - Número do pedido e mesa
 * - Itens com quantidade, nome, preço unitário e total da linha
 * - Modificadores indentados
 * - Subtotal, IVA, total (negrito, tamanho duplo)
 * - Método de pagamento
 * - Rodapé: "Obrigado pela preferência"
 * - QR code com ID do pedido
 */

import { EscPosBuilder } from '../EscPosDriver';
import type { RestaurantIdentity } from '../types';
import type { Order, OrderItem } from '@/domain/order/types';

/**
 * Formata cêntimos em string de preço (ex: 1250 → "12.50").
 * Aceita valores já em euros (decimal) ou em cêntimos (inteiro).
 */
function formatPrice(value: number): string {
  // Se o valor parece estar em cêntimos (> 100 e inteiro), converter
  const euros = Number.isInteger(value) && Math.abs(value) >= 100
    ? value / 100
    : value;
  return euros.toFixed(2);
}

/**
 * Formata data/hora no formato DD/MM/AAAA HH:MM.
 */
function formatDateTime(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/**
 * Calcula o total de uma linha (unitPrice * quantity + modifiers).
 */
function itemLineTotal(item: OrderItem): number {
  const modifiersTotal = (item.modifiers ?? []).reduce((sum, m) => sum + (m.price ?? 0), 0);
  return (item.unitPrice + modifiersTotal) * item.quantity;
}

/**
 * Gera um recibo de cliente em ESC/POS.
 *
 * @param order - Pedido completo
 * @param restaurant - Identidade do restaurante
 * @param paymentMethod - Método de pagamento (ex: "Dinheiro", "Cartão")
 */
export function buildOrderReceipt(
  order: Order,
  restaurant: RestaurantIdentity,
  paymentMethod?: string,
): EscPosBuilder {
  const b = new EscPosBuilder();
  const now = new Date();

  b.init();

  // ---- Cabeçalho ----
  b.align('center');
  b.size(2, 2);
  b.bold(true);
  b.text(restaurant.name.toUpperCase());
  b.size(1, 1);
  b.bold(false);

  if (restaurant.address) {
    b.text(restaurant.address);
  }
  if (restaurant.nif) {
    b.text(`NIF: ${restaurant.nif}`);
  }
  if (restaurant.phone) {
    b.text(`Tel: ${restaurant.phone}`);
  }

  b.separator('=');

  // ---- Info do pedido ----
  b.align('left');
  b.columns2('Data:', formatDateTime(now));
  b.columns2('Pedido:', `#${order.id.slice(-6).toUpperCase()}`);
  if (order.tableNumber) {
    b.columns2('Mesa:', String(order.tableNumber));
  }
  if (order.customerName) {
    b.columns2('Cliente:', order.customerName);
  }

  b.separator('-');

  // ---- Itens ----
  b.bold(true);
  b.columns3('QTD', 'ITEM', 'TOTAL');
  b.bold(false);
  b.separator('-');

  for (const item of order.items) {
    const total = itemLineTotal(item);
    b.columns3(
      `${item.quantity}x`,
      item.name,
      formatPrice(total),
    );

    // Preço unitário (se quantidade > 1)
    if (item.quantity > 1) {
      b.text(`      @ ${formatPrice(item.unitPrice)} un.`);
    }

    // Modificadores indentados
    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        const modPrice = mod.price > 0 ? ` +${formatPrice(mod.price)}` : '';
        b.text(`      + ${mod.name}${modPrice}`);
      }
    }

    // Notas do item
    if (item.notes) {
      b.text(`      * ${item.notes}`);
    }
  }

  b.separator('=');

  // ---- Totais ----
  b.columns2('Subtotal:', formatPrice(order.subtotal));

  if (order.discount > 0) {
    b.columns2('Desconto:', `-${formatPrice(order.discount)}`);
  }

  b.columns2('IVA:', formatPrice(order.tax));

  b.emptyLine();
  b.bold(true);
  b.size(2, 2);
  b.columns2('TOTAL:', formatPrice(order.total));
  b.size(1, 1);
  b.bold(false);

  b.separator('=');

  // ---- Pagamento ----
  if (paymentMethod) {
    b.columns2('Pagamento:', paymentMethod);
    b.emptyLine();
  }

  // ---- QR Code com ID do pedido ----
  b.align('center');
  b.emptyLine();
  b.qrCode(order.id, 4);
  b.emptyLine();

  // ---- Rodapé ----
  b.align('center');
  b.text('Obrigado pela preferencia!');
  b.emptyLine();
  b.text(`${formatDateTime(now)}`);

  // ---- Notas do pedido ----
  if (order.notes) {
    b.emptyLine();
    b.text(`Obs: ${order.notes}`);
  }

  b.feed(2);
  b.cut();

  return b;
}
