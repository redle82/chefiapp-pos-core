/**
 * ORDER — Contrato Centralizado
 * 
 * FASE 3.2: Isolamento de Contratos
 * 
 * ÚNICA fonte de verdade para pedidos.
 * 
 * REGRAS:
 * - Incluir TODOS os campos já usados no sistema
 * - Não remover campos existentes (compatibilidade)
 * - Baseado no type mais completo encontrado (TPV/context/OrderTypes.ts)
 */

import type { OrderItem } from './OrderItem';
import type { OrderOrigin } from './OrderOrigin';

/**
 * Pedido conforme usado em todo o sistema.
 * 
 * Baseado no type mais completo encontrado:
 * - TPV/context/OrderTypes.ts (UI)
 * - Inclui campos do Core (CoreOrder)
 * - Inclui campos específicos da UI (isWebOrder, service_source, etc.)
 */
export interface Order {
  id: string;
  tableNumber?: number; // Número da mesa
  tableId?: string; // ID da mesa
  status: 'new' | 'preparing' | 'ready' | 'served' | 'paid' | 'partially_paid' | 'cancelled';
  items: OrderItem[];
  total: number; // Em centavos (Integer)
  createdAt: Date;
  updatedAt: Date;
  // Core 5 -> Core 2 Flags
  isWebOrder?: boolean; // Flag para pedidos web
  origin?: OrderOrigin | 'web' | 'local' | 'external'; // Origem do pedido (compatibilidade com valores legacy)
  service_source?: 'ubereats' | 'glovo' | 'deliveroo' | 'other'; // Fonte de serviço externo
  external_reference?: string; // Referência externa
  customerName?: string; // Nome do cliente
  transaction_id?: string; // ID da transação (consistência)
  customerId?: string; // ID do cliente (Sprint 12: Loyalty)
}
