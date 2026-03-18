/**
 * Template de Ticket de Cozinha — ESC/POS.
 *
 * Imprime um ticket operacional para a estação de preparação:
 * - "** COZINHA **" em negrito e tamanho duplo
 * - Número do pedido (grande)
 * - Mesa
 * - Timestamp
 * - Itens filtrados por estação (apenas KITCHEN)
 * - Modificadores em negrito
 * - Instruções especiais
 * - SEM preços (a cozinha não vê valores)
 */

import { EscPosBuilder } from '../EscPosDriver';
import type { KitchenStation } from '../types';

/** Item de pedido simplificado para tickets de cozinha (sem dependência de domain types) */
export interface KitchenOrderItem {
  id: string;
  name: string;
  nameSnapshot?: string;
  quantity: number;
  modifiers?: Array<{ name: string }>;
  notes?: string;
  /** Estação de destino: 'KITCHEN', 'BAR', etc. */
  stationId?: string;
  status?: string;
}

/** Pedido simplificado para tickets de cozinha */
export interface KitchenOrder {
  id: string;
  tableNumber?: number | string;
  notes?: string;
  createdAt: Date | string;
  items: KitchenOrderItem[];
  /** Número do curso/ronda (opcional) */
  course?: number;
}

/**
 * Formata hora no formato HH:MM:SS.
 */
function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Gera um ticket de cozinha em ESC/POS.
 *
 * Filtra automaticamente os itens pela estação indicada.
 * Se nenhum item pertencer à estação, devolve null.
 *
 * @param order - Pedido com itens
 * @param station - Estação de destino ('KITCHEN' ou 'BAR')
 */
export function buildKitchenTicket(
  order: KitchenOrder,
  station: KitchenStation = 'KITCHEN',
): EscPosBuilder | null {
  // Filtrar itens pela estação
  const filteredItems = order.items.filter((item) => {
    // Se o item tem stationId, usar esse valor
    if (item.stationId) {
      return item.stationId.toUpperCase() === station;
    }
    // Se não tem stationId, assumir KITCHEN por defeito
    return station === 'KITCHEN';
  });

  // Se não há itens para esta estação, não imprimir
  if (filteredItems.length === 0) {
    return null;
  }

  const b = new EscPosBuilder();
  const now = new Date();
  const orderTime = order.createdAt instanceof Date
    ? order.createdAt
    : new Date(order.createdAt);

  b.init();

  // ---- Cabeçalho ----
  b.align('center');
  b.bold(true);
  b.size(2, 2);

  const stationLabel = station === 'KITCHEN' ? 'COZINHA' : 'BAR';
  b.text(`** ${stationLabel} **`);

  b.size(1, 1);
  b.separator('=');

  // ---- Número do pedido (grande) ----
  b.align('center');
  b.size(2, 2);
  b.text(`#${order.id.slice(-6).toUpperCase()}`);
  b.size(1, 1);
  b.bold(false);

  b.emptyLine();

  // ---- Mesa e hora ----
  b.align('left');
  if (order.tableNumber) {
    b.bold(true);
    b.size(2, 1);
    b.text(`Mesa: ${order.tableNumber}`);
    b.size(1, 1);
    b.bold(false);
  }

  b.columns2('Entrada:', formatTime(orderTime));
  b.columns2('Impresso:', formatTime(now));

  if (order.course) {
    b.bold(true);
    b.text(`Ronda: ${order.course}`);
    b.bold(false);
  }

  b.separator('=');

  // ---- Itens ----
  for (const item of filteredItems) {
    b.emptyLine();

    // Quantidade e nome (grande)
    b.bold(true);
    b.size(2, 1);
    const itemName = item.nameSnapshot ?? item.name;
    b.text(`${item.quantity}x ${itemName}`);
    b.size(1, 1);

    // Modificadores em negrito
    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        b.text(`   + ${mod.name}`);
      }
    }

    b.bold(false);

    // Notas do item
    if (item.notes) {
      b.bold(true);
      b.invert(true);
      b.text(` ! ${item.notes} `);
      b.invert(false);
      b.bold(false);
    }
  }

  b.emptyLine();
  b.separator('=');

  // ---- Instruções especiais do pedido ----
  if (order.notes) {
    b.emptyLine();
    b.bold(true);
    b.invert(true);
    b.align('center');
    b.text(` NOTAS: ${order.notes} `);
    b.invert(false);
    b.bold(false);
    b.align('left');
    b.emptyLine();
  }

  // ---- Contagem total ----
  b.align('center');
  b.text(`Total: ${filteredItems.reduce((sum, i) => sum + i.quantity, 0)} itens`);

  b.feed(2);
  b.cut();

  return b;
}
