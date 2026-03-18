/**
 * Template de Ticket de Bar — ESC/POS.
 *
 * Reutiliza a lógica do KitchenTicket mas filtrado para station='BAR'.
 * Mantido como ficheiro separado para permitir customizações
 * futuras específicas do bar (ex: estilo diferente, ícones, etc.).
 */

import { buildKitchenTicket } from './KitchenTicket';
import type { KitchenOrder } from './KitchenTicket';
import type { EscPosBuilder } from '../EscPosDriver';

/**
 * Gera um ticket de bar em ESC/POS.
 *
 * Filtra automaticamente os itens com stationId='BAR'.
 * Se nenhum item pertencer ao bar, devolve null.
 *
 * @param order - Pedido com itens
 */
export function buildBarTicket(order: KitchenOrder): EscPosBuilder | null {
  return buildKitchenTicket(order, 'BAR');
}
