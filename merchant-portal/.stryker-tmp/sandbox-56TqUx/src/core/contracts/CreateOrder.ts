/**
 * CREATE ORDER — Contratos de RPC
 * 
 * FASE 3.2: Isolamento de Contratos
 * 
 * ÚNICA fonte de verdade para inputs/outputs de criação de pedidos.
 * 
 * REGRAS:
 * - Baseado em OrderWriter.ts (createOrder)
 * - Não alterar payloads existentes
 * - Manter compatibilidade com RPC create_order_atomic
 */
// @ts-nocheck


import type { OrderOrigin } from './OrderOrigin';

/**
 * Item de pedido para criação via RPC.
 * 
 * Baseado em OrderWriter.ts - OrderItemInput
 */
export interface OrderItemInput {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number; // em centavos
}

/**
 * Metadados de sincronização para criação de pedido.
 * 
 * Usado em sync_metadata do RPC create_order_atomic
 */
export interface CreateOrderSyncMetadata {
  table_id?: string;
  table_number?: number;
  created_by_user_id?: string;
  created_by_role?: string;
  [key: string]: any; // Permite campos adicionais
}

/**
 * Resultado da criação de pedido via RPC.
 * 
 * Retornado por create_order_atomic
 */
export interface CreateOrderResult {
  id: string;
  total_cents: number;
  status: string;
}

/**
 * Parâmetros para criação de pedido via RPC.
 * 
 * Usado internamente por createOrder()
 */
export interface CreateOrderParams {
  restaurantId: string;
  items: OrderItemInput[];
  origin: OrderOrigin | string; // Aceita string para compatibilidade
  paymentMethod?: string; // Default: 'cash'
  syncMetadata?: CreateOrderSyncMetadata;
}
