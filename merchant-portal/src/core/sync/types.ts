export type QueueStatus =
    | 'queued'      // ação registrada localmente
    | 'syncing'     // tentando enviar
    | 'failed'      // tentativa falhou
    | 'applied'     // confirmada pelo backend
    | 'dead_letter' // falha permanente após max retries

/** Item de pedido no payload de ORDER_CREATE. */
export interface OrderCreateSyncItem {
  product_id?: string;
  id?: string;
  name?: string;
  quantity?: number;
  unit_price?: number;
  price?: number;
}

/** Payload para ORDER_CREATE (SyncEngine). Fase 4: tipagem explícita. */
export interface OrderCreateSyncPayload {
  restaurant_id?: string;
  restaurantId?: string;
  items?: OrderCreateSyncItem[];
  payment_method?: string;
  localId?: string;
  id?: string;
  source?: string;
  table_number?: string;
  tableNumber?: string;
  table_id?: string;
  tableId?: string;
}

/** Payload para ORDER_PAY (SyncEngine). */
export interface OrderPaySyncPayload {
  orderId: string;
  restaurantId: string;
  amountCents: number;
  method: string;
  cashRegisterId: string;
  operatorId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  isPartial?: boolean;
}

/** Payload para ORDER_UPDATE (SyncEngine). */
export interface OrderUpdateSyncPayload {
  orderId: string;
  restaurantId: string;
  action?: string;
  items?: unknown[];
  [key: string]: unknown;
}

export interface OfflineQueueItem {
    id: string            // uuid
    type: 'ORDER_CREATE' | 'ORDER_UPDATE' | 'ORDER_CLOSE' | 'ORDER_ADD_ITEM' | 'ORDER_UPDATE_ITEM_QTY' | 'ORDER_REMOVE_ITEM' | 'ORDER_CANCEL' | 'ORDER_PAY'
    payload: unknown
    createdAt: number
    lastAttemptAt?: number
    attempts: number
    status: QueueStatus
    nextRetryAt?: number // Para backoff
    error?: string
    lastError?: string
    appliedAt?: number
    idempotency_key?: string // TASK-4.1.1: Chave de idempotência baseada em conteúdo + timestamp
}
