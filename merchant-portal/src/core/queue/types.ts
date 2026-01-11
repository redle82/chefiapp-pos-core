export type QueueStatus =
    | 'queued'      // ação registrada localmente
    | 'syncing'     // tentando enviar
    | 'failed'      // tentativa falhou
    | 'applied'     // confirmada pelo backend

export interface OfflineQueueItem {
    id: string            // uuid
    type: 'ORDER_CREATE' | 'ORDER_UPDATE' | 'ORDER_CLOSE'
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
