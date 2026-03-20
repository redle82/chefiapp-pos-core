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

import type { OrderItem } from "./OrderItem";
import type { OrderOrigin } from "./OrderOrigin";

export type OrderStatus =
  | "new"
  | "pending" // Alias para new/A FAZER
  | "preparing"
  | "ready"
  | "served"
  | "delivered" // Alias para served
  | "paid"
  | "partially_paid"
  | "cancelled"
  | "OPEN"
  | "LOCKED"
  | "CLOSED"; // Mapeamento para estados internos do Repo

export type PaymentStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "FAILED";

export interface Order {
  id: string;
  restaurantId: string; // OBRIGATÓRIO: Todo pedido pertence a um restaurante
  sessionId?: string; // ID da Sessão/Turno
  tableNumber?: number;
  tableId?: string;
  // Operação / Origem
  waiterId?: string | null;
  shiftId?: string | null;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  items?: OrderItem[]; // Changed from required to optional

  // Financeiro (Inteiros em centavos)
  totalAmount: number;
  subtotalCents?: number;
  taxCents?: number;
  discountCents?: number;

  // Auditoria e Concorrência
  createdAt: Date;
  updatedAt: Date;
  version: number; // Controle de concorrência otimista

  // Contexto...
  source: "tpv" | "web" | "app" | "external";
  operatorId?: string;
  operatorName?: string;
  cashRegisterId?: string;
  notes?: string;

  // Compatibilidade Core 5 -> Core 2
  isWebOrder?: boolean;
  origin?: OrderOrigin | "web" | "local" | "external";
  service_source?: "ubereats" | "glovo" | "deliveroo" | "other";
  external_reference?: string;
  customerName?: string;
  transaction_id?: string;
  customerId?: string;
}
