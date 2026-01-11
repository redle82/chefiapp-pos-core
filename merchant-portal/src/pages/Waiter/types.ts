/**
 * Comandeiro do Garçom — Tipos e Enums
 * Princípio: 1 dedo, 1 ação, zero pensamento.
 */

// ============================================================================
// STATUS DE MESA
// ============================================================================

export const TableStatus = {
  /** Mesa livre, disponível */
  FREE: 'FREE',
  /** Mesa ocupada (clientes sentados, sem comanda ainda) */
  OCCUPIED: 'OCCUPIED',
  /** Cliente chamou o garçom (urgente se repetido) */
  CALLING: 'CALLING',
  /** Conta foi solicitada */
  BILL_REQUESTED: 'BILL_REQUESTED',
  /** Cliente está pagando */
  PAYING: 'PAYING',
  /** Cozinha marcou pedido como pronto */
  KITCHEN_READY: 'KITCHEN_READY',
  /** Mesa precisa de limpeza */
  CLEANING: 'CLEANING',
} as const;
export type TableStatus = typeof TableStatus[keyof typeof TableStatus];

// ============================================================================
// PRIORIDADE DE ALERTAS
// ============================================================================

export const AlertPriority = {
  /** Vermelho: mesa chamando repetido, reclamação, atraso crítico */
  P0: 'P0',
  /** Laranja: cozinha pronta, conta solicitada */
  P1: 'P1',
  /** Azul: novo pedido, atualização de status */
  P2: 'P2',
  /** Cinza: lembrete de rotina */
  P3: 'P3',
} as const;
export type AlertPriority = typeof AlertPriority[keyof typeof AlertPriority];

// ============================================================================
// EVENTOS DO SISTEMA
// ============================================================================

export const WaiterEvent = {
  /** Cliente chamou o garçom */
  CALL_WAITER: 'CALL_WAITER',
  /** Novo pedido criado */
  ORDER_CREATED: 'ORDER_CREATED',
  /** Cozinha marcou como pronto */
  KITCHEN_READY: 'KITCHEN_READY',
  /** Conta foi solicitada */
  BILL_REQUESTED: 'BILL_REQUESTED',
  /** Pagamento registrado */
  PAID: 'PAID',
  /** Mesa transferida para outro garçom */
  TABLE_TRANSFERRED: 'TABLE_TRANSFERRED',
  /** Ajuda solicitada */
  HELP_REQUESTED: 'HELP_REQUESTED',
} as const;
export type WaiterEvent = typeof WaiterEvent[keyof typeof WaiterEvent];

// ============================================================================
// INTERFACES
// ============================================================================

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
  area?: string; // "Área 1", "Área 2", etc.
  seatedAt?: Date; // Quando os clientes sentaram
  callCount?: number; // Quantas vezes chamou (para deduplicação)
  lastCallAt?: Date;
  orderId?: string; // ID da comanda ativa
  total?: number; // Total da comanda em centavos
  currency?: string;
}

export interface WaiterCall {
  id: string;
  tableId: string;
  tableNumber: number;
  priority: AlertPriority;
  count: number; // Quantas vezes chamou (3 = urgente)
  createdAt: Date;
  acknowledgedAt?: Date;
  message?: string;
}

export interface KitchenOrder {
  id: string;
  tableId: string;
  tableNumber: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  status: 'pending' | 'sent' | 'ready' | 'delivered';
  createdAt: Date;
  readyAt?: Date;
}

export interface WaiterProfile {
  id: string;
  name: string;
  photoUrl?: string;
  role: 'waiter' | 'manager' | 'host';
  area?: string; // Área de atuação
  shift?: {
    start: string; // "18:00"
    end: string; // "23:00"
  };
  manager?: {
    name: string;
    phone: string;
    whatsapp?: string;
  };
}

// ============================================================================
// CONFIGURAÇÃO DE DEDUPLICAÇÃO
// ============================================================================

export interface DedupeConfig {
  /** Quantos chamados da mesma mesa = 1 alerta urgente */
  urgentThreshold: number; // default: 3
  /** Janela de tempo para considerar "repetido" (ms) */
  timeWindow: number; // default: 300000 (5 min)
}

export const DEFAULT_DEDUPE_CONFIG: DedupeConfig = {
  urgentThreshold: 3,
  timeWindow: 300000, // 5 minutos
};

// Alias para compatibilidade (exportado no final para evitar conflitos)
export type WaiterTable = Table;
