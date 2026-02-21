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
// @ts-nocheck


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
  productId?: string; // ID do produto (pode ser undefined em alguns casos)
  name: string; // Nome do item (snapshot)
  quantity: number;
  price: number; // Em centavos (Integer)
  priceFormatted?: string; // Formatação opcional
  notes?: string; // Notas do item
  categoryName?: string; // Nome da categoria (Phase 55: Station Intelligence)
  consumptionGroupId?: string | null; // Grupo de consumo
  // KDS Phase 2.2 - Status do item no KDS
  status?: 'pending' | 'preparing' | 'ready' | 'voided';
  startedAt?: Date; // Quando começou a preparação
  completedAt?: Date; // Quando foi concluído
  stationId?: string; // ID da estação de preparo
}
