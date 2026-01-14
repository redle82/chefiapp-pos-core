import { useEffect, useRef, useState, useCallback } from 'react'
import { useOfflineQueue } from './useOfflineQueue'
import { fetchWithTimeout } from '../utils/http/fetchWithTimeout'
import { getTabIsolated } from '../storage/TabIsolatedStorage'

interface ReconcilerOptions {
    healthStatus: 'UP' | 'DOWN' | 'UNKNOWN' | 'DEGRADED'
    apiBase: string
}

export function useOfflineReconciler({
    healthStatus,
    apiBase,
}: ReconcilerOptions) {
    const { items, update, refresh } = useOfflineQueue()
    const runningRef = useRef(false)
    const [tick, setTick] = useState(0) // ⏰ Wake up signal
    
    // CRITICAL: Use refs to avoid loop from items/refresh changing
    const itemsRef = useRef(items)
    const refreshRef = useRef(refresh)
    
    useEffect(() => {
        itemsRef.current = items
        refreshRef.current = refresh
    }, [items, refresh])

    // TASK-4.2.1 e TASK-4.2.2: Polling Otimizado e Adaptativo
    // 1. Listen to 'online' event for immediate reaction
    // 2. Polling adaptativo baseado no número de itens pendentes
    // 3. Poll on visibility change (user comes back to tab)
    useEffect(() => {
        const triggerSync = () => {
            refreshRef.current()
            setTick(t => t + 1)
        }

        // Events
        window.addEventListener('online', triggerSync)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') triggerSync()
        })

        // TASK-4.2.2: Polling adaptativo baseado no número de itens pendentes
        const getPollingInterval = (): number => {
            const pendingCount = itemsRef.current.filter(item => 
                item.status === 'queued' && 
                (!item.nextRetryAt || Date.now() >= item.nextRetryAt)
            ).length;

            // TASK-4.2.2: Mais agressivo quando há itens pendentes, menos quando vazio
            if (pendingCount === 0) {
                return 10000; // 10s quando não há itens pendentes
            } else if (pendingCount <= 3) {
                return 5000; // 5s quando há poucos itens (TASK-4.2.1: padrão)
            } else {
                return 3000; // 3s quando há muitos itens (mais agressivo)
            }
        };

        // TASK-4.2.1: Polling padrão: 5s (quando há itens pendentes)
        // TASK-4.2.1: Polling quando offline: 10s (quando não há itens)
        let currentInterval = getPollingInterval();
        let id = setInterval(triggerSync, currentInterval);

        // Atualizar intervalo quando items mudarem
        const updateInterval = () => {
            const newInterval = getPollingInterval();
            if (newInterval !== currentInterval) {
                clearInterval(id);
                currentInterval = newInterval;
                id = setInterval(triggerSync, currentInterval);
            }
        };

        // Observar mudanças nos items para ajustar polling
        const intervalCheck = setInterval(updateInterval, 2000); // Verificar a cada 2s

        return () => {
            window.removeEventListener('online', triggerSync)
            document.removeEventListener('visibilitychange', triggerSync)
            clearInterval(id)
            clearInterval(intervalCheck)
        }
    }, []) // CRITICAL: Empty deps - use refs to avoid loop

    // Main Sync Logic
    useEffect(() => {
        if (healthStatus !== 'UP') return
        if (runningRef.current) return

        const run = async () => {
            const pendingItems = itemsRef.current.filter(item =>
                item.status === 'queued' &&
                (!item.nextRetryAt || Date.now() >= item.nextRetryAt)
            )

            if (pendingItems.length === 0) return

            console.log(`[OfflineReconciler] waking up. Pending=${pendingItems.length}`)

            const sessionToken = getTabIsolated('x-chefiapp-token') || ''
            runningRef.current = true

            for (const item of pendingItems) {
                try {
                    // Update to syncing
                    try {
                        await update(item.id, { status: 'syncing' })
                    } catch (e) {
                        continue // Skip if update fails
                    }

                    // TASK-4.1.1: Headers with Idempotency Key
                    // Usar idempotency_key se disponível, senão usar item.id como fallback
                    const idempotencyKey = item.idempotency_key || item.id;
                    const headers = {
                        'Content-Type': 'application/json',
                        'x-chefiapp-token': sessionToken,
                        'Idempotency-Key': idempotencyKey // TASK-4.1.1: Usar idempotency_key baseado em conteúdo
                    }

                    // 🔁 Process
                    switch (item.type) {
                        case 'ORDER_CREATE': {
                            const res = await fetchWithTimeout(`${apiBase}/api/orders`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify(item.payload),
                            }, 30000)
                            if (res.status === 409) console.warn('Idempotent Replay Prevented')
                            if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
                            break
                        }

                        case 'ORDER_UPDATE': {
                            const payload = item.payload as any
                            const res = await fetchWithTimeout(
                                `${apiBase}/api/orders/${payload.orderId}`,
                                {
                                    method: 'PATCH',
                                    headers,
                                    body: JSON.stringify({ action: payload.action }),
                                },
                                30000
                            )
                            if (!res.ok) throw new Error(`HTTP ${res.status}`)
                            break
                        }

                        case 'ORDER_CLOSE': {
                            const payload = item.payload as any
                            const res = await fetchWithTimeout(
                                `${apiBase}/api/orders/${payload.orderId}/close`,
                                {
                                    method: 'POST',
                                    headers,
                                },
                                30000
                            )
                            if (!res.ok) throw new Error(`HTTP ${res.status}`)
                            break
                        }

                        default:
                            throw new Error('Unknown Queue Type')
                    }

                    // Success
                    console.log(`[OfflineReconciler] ✅ Synced: ${item.id}`)
                    await update(item.id, {
                        status: 'applied',
                        appliedAt: Date.now(),
                    })

                } catch (err: any) {
                    console.error('[OfflineReconciler] Sync Failed:', item.id, err)

                    // Auth Check
                    if (err.message.includes('401') || err.message.includes('403')) {
                        await update(item.id, {
                            status: 'failed',
                            lastError: 'AUTH EXPIRED',
                            attempts: 99
                        })
                        continue
                    }

                    // Backoff Logic
                    const currentAttempts = (item.attempts || 0) + 1
                    const maxAttempts = 5 // Increased for robustness

                    if (currentAttempts < maxAttempts) {
                        const delay = 2000 * Math.pow(2, currentAttempts - 1)
                        await update(item.id, {
                            status: 'queued',
                            attempts: currentAttempts,
                            nextRetryAt: Date.now() + delay,
                            lastError: err.message
                        })
                    } else {
                        await update(item.id, {
                            status: 'failed',
                            attempts: currentAttempts,
                            lastError: err.message
                        })
                    }
                }
            }

            runningRef.current = false
            // Check if more items appeared/unblocked while we were running
            if (pendingItems.length > 0) {
                // re-tick to process remaining if any (or changed state)
                setTick(t => t + 1)
            }
        }

        run()
    }, [healthStatus, apiBase, update, tick]) // CRITICAL: Use itemsRef instead of items
}

