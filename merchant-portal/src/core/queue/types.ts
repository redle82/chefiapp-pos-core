export type QueueStatus =
    | 'queued'      // ação registrada localmente
    | 'syncing'     // tentando enviar
    | 'failed'      // tentativa falhou
    | 'applied'     // confirmada pelo backend

export interface OfflineQueueItem {
    id: string            // uuid
    type: 'ORDER_CREATE' | 'ORDER_UPDATE' | 'ORDER_CLOSE' | 'ORDER_ADD_ITEM' | 'ORDER_UPDATE_ITEM_QTY' | 'ORDER_REMOVE_ITEM'
    payload: unknown
    createdAt: number
    lastAttemptAt?: number
    attempts: number
    status: QueueStatus
    nextRetryAt?: number // Para backoff
    error?: string
    lastError?: string
    appliedAt?: number
}
