/**
 * ORDER CONTEXT TOKEN — Token Compartilhado
 *
 * FASE 3.4: Consolidação de Contexts
 *
 * Este arquivo exporta APENAS o token do Context.
 * O provider real está em OrderContextReal.tsx
 *
 * REGRAS:
 * - Apenas o token (createContext)
 * - Sem provider
 * - Sem lógica
 * - Compartilhado entre OrderContext e OrderContextReal
 */

import { createContext } from "react";
import type { Order } from "../../../core/contracts";
import type { OrderExceptionPayload } from "../../../core/tpv/TPVCentralEvents";

export type OrderCreateInput = Partial<Order> & {
  syncMetadata?: Record<string, unknown>;
};

export interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  createOrder: (order: OrderCreateInput) => Promise<Order>;
  addItemToOrder: (orderId: string, item: any) => Promise<void>;
  removeItemFromOrder: (orderId: string, itemId: string) => Promise<void>;
  updateItemQuantity: (
    orderId: string,
    itemId: string,
    quantity: number,
  ) => Promise<void>;
  performOrderAction: (
    orderId: string,
    action: string,
    payload?: any,
  ) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  resetOrders: () => void;
  pendingExceptions: (OrderExceptionPayload & { eventId: string })[];
  error: Error | null;

  // Extended Context Interface
  loading: boolean;
  isConnected: boolean;
  isOffline: boolean;
  /** Número de pedidos na fila offline (para OfflineIndicator) */
  pendingSync: number;
  realtimeStatus: string;
  lastRealtimeEvent: Date | null;
  syncNow: () => Promise<void>;

  attachCustomer: (orderId: string, customerId: string) => Promise<void>;
  getActiveOrders: () => Promise<void>;
  openCashRegister: (balance: number) => Promise<void>;
  closeCashRegister: (balance: number) => Promise<void>;
  getOpenCashRegister: () => Promise<any | null>;
  getDailyTotal: () => Promise<number>;
  cashRegisterId: string | null;
  /** FASE 1: true se o pedido já foi confirmado (imutável). Ver FLUXO_DE_PEDIDO_OPERACIONAL.md */
  isOrderConfirmed: (orderId: string) => boolean;
}

/**
 * Token do Context compartilhado.
 *
 * Usado por:
 * - OrderContextReal.tsx (provider completo)
 */
export const OrderContext = createContext<OrderContextType | undefined>(
  undefined,
);
