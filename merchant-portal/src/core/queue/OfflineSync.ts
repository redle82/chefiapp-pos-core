/**
 * OfflineSync - Serviço de sincronização da fila offline
 * 
 * REGRA: Quando volta online, processa a fila em ordem FIFO
 * REGRA: Retry com backoff exponencial
 * REGRA: Máximo 5 tentativas antes de marcar como failed
 */

import { OfflineDB } from './db';
import type { OfflineQueueItem, QueueStatus } from './types';
import { OrderEngine, type OrderItemInput } from '../tpv/OrderEngine';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 segundo
const MAX_DELAY_MS = 30000; // 30 segundos

interface SyncResult {
    processed: number;
    failed: number;
    remaining: number;
}

/**
 * Processa um item da fila
 */
async function processItem(item: OfflineQueueItem): Promise<boolean> {
    console.log(`[OfflineSync] Processing item ${item.id} (${item.type})`);

    try {
        switch (item.type) {
            case 'ORDER_CREATE': {
                const payload = item.payload as {
                    restaurantId: string;
                    tableNumber?: number;
                    tableId?: string;
                    operatorId?: string;
                    cashRegisterId?: string;
                    items: OrderItemInput[];
                    localId: string; // ID local para reconciliação
                };

                // Verificar se pedido já foi criado (idempotência)
                // Usar localId como referência
                const existingOrder = await checkExistingOrder(payload.localId);
                if (existingOrder) {
                    console.log(`[OfflineSync] Order ${payload.localId} already synced as ${existingOrder}`);
                    return true;
                }

                // Criar pedido real com sync_metadata
                await OrderEngine.createOrder({
                    restaurantId: payload.restaurantId,
                    tableNumber: payload.tableNumber,
                    tableId: payload.tableId,
                    operatorId: payload.operatorId,
                    cashRegisterId: payload.cashRegisterId,
                    items: payload.items,
                    notes: `[Offline] ${payload.localId}`, // Tag para idempotência (fallback)
                    syncMetadata: {
                        localId: payload.localId,
                        syncAttempts: item.attempts || 0,
                        lastSyncAt: new Date().toISOString(),
                    },
                });

                return true;
            }

            case 'ORDER_UPDATE': {
                const payload = item.payload as {
                    orderId: string;
                    restaurantId: string;
                    action: string;
                    data?: unknown;
                };

                // Re-tentar a ação
                switch (payload.action) {
                    case 'add_item':
                        await OrderEngine.addItemToOrder(
                            payload.orderId,
                            payload.data as OrderItemInput,
                            payload.restaurantId
                        );
                        break;
                    case 'remove_item':
                        await OrderEngine.removeItemFromOrder(
                            payload.orderId,
                            (payload.data as { itemId: string }).itemId,
                            payload.restaurantId
                        );
                        break;
                    case 'update_status':
                        await OrderEngine.updateOrderStatus(
                            payload.orderId,
                            (payload.data as { status: 'OPEN' | 'IN_PREP' | 'READY' | 'PAID' | 'CANCELLED' }).status,
                            payload.restaurantId
                        );
                        break;
                }
                return true;
            }

            case 'ORDER_CLOSE': {
                // Pagamento offline é perigoso - não implementamos
                // Pedidos ficam pendentes até voltar online
                console.warn('[OfflineSync] ORDER_CLOSE not supported offline - skipping');
                return false;
            }

            default:
                console.warn(`[OfflineSync] Unknown item type: ${item.type}`);
                return false;
        }
    } catch (err) {
        console.error(`[OfflineSync] Failed to process item ${item.id}:`, err);
        throw err;
    }
}

/**
 * Verifica se pedido já foi criado (idempotência via sync_metadata)
 */
async function checkExistingOrder(localId: string): Promise<string | null> {
    try {
        const { supabase } = await import('../supabase');
        
        // Buscar por sync_metadata->>'localId' = localId
        const { data } = await supabase
            .from('gm_orders')
            .select('id')
            .eq('sync_metadata->>localId', localId)
            .limit(1)
            .maybeSingle();

        if (data?.id) {
            return data.id;
        }

        // Fallback: buscar por notes (para pedidos antigos)
        const { data: fallbackData } = await supabase
            .from('gm_orders')
            .select('id')
            .ilike('notes', `%${localId}%`)
            .limit(1)
            .maybeSingle();

        return fallbackData?.id || null;
    } catch (err) {
        console.error('[OfflineSync] Error checking existing order:', err);
        return null;
    }
}

/**
 * Calcula delay com backoff exponencial
 */
function calculateDelay(attempts: number): number {
    const delay = BASE_DELAY_MS * Math.pow(2, attempts);
    return Math.min(delay, MAX_DELAY_MS);
}

/**
 * Sincroniza toda a fila quando volta online
 */
export async function syncOfflineQueue(): Promise<SyncResult> {
    console.log('[OfflineSync] Starting queue sync...');

    const items = await OfflineDB.getAll();
    const pendingItems = items.filter(i => i.status === 'queued' || i.status === 'failed');

    if (pendingItems.length === 0) {
        console.log('[OfflineSync] No pending items');
        return { processed: 0, failed: 0, remaining: 0 };
    }

    console.log(`[OfflineSync] Processing ${pendingItems.length} pending items`);

    let processed = 0;
    let failed = 0;

    for (const item of pendingItems) {
        // Verificar se passou do limite de retries
        if (item.attempts >= MAX_RETRIES) {
            console.warn(`[OfflineSync] Item ${item.id} exceeded max retries - marking as failed`);
            await OfflineDB.update(item.id, {
                status: 'failed' as QueueStatus,
                lastError: 'Max retries exceeded',
            });
            failed++;
            continue;
        }

        // Verificar se está no período de backoff
        if (item.nextRetryAt && Date.now() < item.nextRetryAt) {
            console.log(`[OfflineSync] Item ${item.id} in backoff - skipping`);
            continue;
        }

        // Atualizar status para syncing
        await OfflineDB.update(item.id, {
            status: 'syncing' as QueueStatus,
            lastAttemptAt: Date.now(),
            attempts: item.attempts + 1,
        });

        try {
            const success = await processItem(item);

            if (success) {
                // Sucesso - remover da fila
                await OfflineDB.update(item.id, {
                    status: 'applied' as QueueStatus,
                    appliedAt: Date.now(),
                });
                processed++;
                console.log(`[OfflineSync] Item ${item.id} synced successfully`);
            } else {
                // Falha não-retriable
                await OfflineDB.update(item.id, {
                    status: 'failed' as QueueStatus,
                    lastError: 'Non-retriable failure',
                });
                failed++;
            }
        } catch (err) {
            // Falha retriable
            const newAttempts = item.attempts + 1;
            const nextDelay = calculateDelay(newAttempts);

            await OfflineDB.update(item.id, {
                status: 'failed' as QueueStatus,
                lastError: err instanceof Error ? err.message : 'Unknown error',
                nextRetryAt: Date.now() + nextDelay,
            });

            console.warn(`[OfflineSync] Item ${item.id} failed, retry in ${nextDelay}ms`);
        }
    }

    // Contar remaining
    const remaining = (await OfflineDB.getAll()).filter(
        i => i.status === 'queued' || i.status === 'failed'
    ).length;

    console.log(`[OfflineSync] Sync complete: ${processed} processed, ${failed} failed, ${remaining} remaining`);

    return { processed, failed, remaining };
}

/**
 * P2-4 FIX: Garbage Collection - Limpa items aplicados há mais de 24h
 * Executa periodicamente para manter IndexedDB limpo e performance otimizada
 * 
 * P0-3 FIX: Adiciona limite máximo de tamanho para prevenir IndexedDB crescer indefinidamente
 */
const GC_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const MAX_QUEUE_SIZE = 1000; // P0-3: Máximo de items na fila
const MAX_QUEUE_SIZE_MB = 50; // P0-3: Máximo de 50MB (estimativa: ~50KB por item)

export async function cleanupProcessedItems(): Promise<number> {
    const items = await OfflineDB.getAll();
    const now = Date.now();
    
    // P2-4 FIX: Filtrar apenas items aplicados há mais de 24h
    const oldAppliedItems = items.filter(i => {
        if (i.status !== 'applied') return false;
        if (!i.appliedAt) return false; // Se não tem appliedAt, manter (segurança)
        
        const age = now - i.appliedAt;
        return age > GC_TTL_MS;
    });

    let cleaned = 0;
    for (const item of oldAppliedItems) {
        try {
            await OfflineDB.remove(item.id);
            cleaned++;
        } catch (err) {
            console.warn(`[OfflineSync] Failed to remove item ${item.id}:`, err);
        }
    }

    // P0-3 FIX: Enforce queue size limits
    const remainingItems = await OfflineDB.getAll();
    
    // Limite por quantidade de items
    if (remainingItems.length > MAX_QUEUE_SIZE) {
        // Ordenar por prioridade: failed primeiro, depois queued, depois syncing
        const priority = (status: string) => {
            if (status === 'failed') return 0;
            if (status === 'queued') return 1;
            if (status === 'syncing') return 2;
            return 3; // applied (menor prioridade)
        };
        
        const sorted = remainingItems.sort((a, b) => {
            const priorityDiff = priority(a.status) - priority(b.status);
            if (priorityDiff !== 0) return priorityDiff;
            // Mesma prioridade: mais antigo primeiro
            return a.createdAt - b.createdAt;
        });
        
        // Remover items mais antigos até ficar dentro do limite
        const toRemove = sorted.slice(MAX_QUEUE_SIZE);
        for (const item of toRemove) {
            try {
                await OfflineDB.remove(item.id);
                cleaned++;
                console.warn(`[OfflineSync] Removed item ${item.id} to enforce queue size limit`);
            } catch (err) {
                console.warn(`[OfflineSync] Failed to remove item ${item.id}:`, err);
            }
        }
    }

    if (cleaned > 0) {
        console.log(`[OfflineSync] Garbage collection: cleaned ${cleaned} items (GC + size limit)`);
    }
    
    return cleaned;
}

/**
 * P2-4 FIX: Inicia garbage collection periódica (executa a cada hora)
 */
export function startGarbageCollection(): () => void {
    // Executar imediatamente na primeira vez
    cleanupProcessedItems().catch(err => {
        console.error('[OfflineSync] Initial GC failed:', err);
    });

    // Executar a cada hora
    const interval = setInterval(() => {
        cleanupProcessedItems().catch(err => {
            console.error('[OfflineSync] Periodic GC failed:', err);
        });
    }, 60 * 60 * 1000); // 1 hora

    // Retornar função de limpeza
    return () => clearInterval(interval);
}

/**
 * Retorna estatísticas da fila
 */
export async function getQueueStats() {
    const items = await OfflineDB.getAll();

    return {
        total: items.length,
        queued: items.filter(i => i.status === 'queued').length,
        syncing: items.filter(i => i.status === 'syncing').length,
        failed: items.filter(i => i.status === 'failed').length,
        applied: items.filter(i => i.status === 'applied').length,
    };
}
