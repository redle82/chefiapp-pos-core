/**
 * ORDER ITEM — Contrato Centralizado
 *
 * FASE 3.2: Isolamento de Contratos
 *
 * ÚNICA fonte de verdade para itens de pedido.
 *
 * REGRAS:
 * - Incluir TODOS os campos já usados no sistema
 * - Não remover campos existentes (compatibilidade)
 * - Baseado no type mais completo encontrado (TPV/context/OrderTypes.ts)
 */

/**
 * Item de pedido conforme usado em todo o sistema.
 *
 * Baseado no type mais completo encontrado:
 * - TPV/context/OrderTypes.ts (UI)
 * - Inclui campos do Core (CoreOrderItem)
 * - Inclui campos específicos da UI (status KDS, etc.)
 */
export interface OrderItem {
  id: string;
  orderId?: string;
  productId?: string;
  name: string; // Nome conforme o snapshot no momento da venda
  nameSnapshot?: string; // Alias para compatibilidade
  quantity: number;
  price: number; // Preço unitário em centavos
  priceSnapshot?: number; // Alias
  subtotalCents?: number;
  subtotalAmount?: number;

  notes?: string;
  categoryName?: string;
  consumptionGroupId?: string | null;

  // KDS Phase 2.2 - Status do item no KDS
  status?: "pending" | "preparing" | "ready" | "voided";
  startedAt?: Date;
  completedAt?: Date;
  stationId?: string;

  modifiers?: any[];
  createdAt?: Date;
}
