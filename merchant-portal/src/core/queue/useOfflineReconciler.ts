import { useEffect, useRef, useState } from 'react'
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

    // Poller to wake up reconciler and sync DB
    useEffect(() => {
        if (healthStatus !== 'UP') return
        const id = setInterval(() => {
            refresh()
            setTick(t => t + 1)
        }, 1000)
        return () => clearInterval(id)
    }, [healthStatus, refresh])

    useEffect(() => {
        if (healthStatus !== 'UP') return
        if (runningRef.current) return

        const run = async () => {
            const pendingItems = items.filter(item =>
                item.status === 'queued' &&
                (!item.nextRetryAt || Date.now() >= item.nextRetryAt)
            )

            console.log(`[OfflineReconciler] Run Check. Health=${healthStatus}, TotalItems=${items.length}, Pending=${pendingItems.length}`)

            const sessionToken = getTabIsolated('x-chefiapp-token') || ''

            if (pendingItems.length === 0) return

            runningRef.current = true
            console.group(`[OfflineReconciler] Batch: ${pendingItems.length} items`)

            for (const item of pendingItems) {
                try {
                    // 🔵 syncing
                    await update(item.id, { status: 'syncing' })

                    // 🔁 Processar por tipo
                    switch (item.type) {
                        case 'ORDER_CREATE': {
                            const res = await fetchWithTimeout(`${apiBase}/api/orders`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-chefiapp-token': getTabIsolated('x-chefiapp-token') || ''
                                },
                                body: JSON.stringify(item.payload),
                            }, 30000)

                            if (!res.ok) throw new Error(`HTTP ${res.status}`)
                            break
                        }

                        case 'ORDER_UPDATE': {
                            const payload = item.payload as any
                            const res = await fetchWithTimeout(
                                `${apiBase}/api/orders/${payload.orderId}`,
                                {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-chefiapp-token': sessionToken
                                    },
                                    body: JSON.stringify({
                                        action: payload.action,
                                    }),
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
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-chefiapp-token': sessionToken
                                    },
                                },
                                30000
                            )
                            if (!res.ok) throw new Error(`HTTP ${res.status}`)
                            break
                        }

                        default:
                            throw new Error('Tipo de fila desconhecido')
                    }

                    // 🟢 aplicado
                    console.log(`[OfflineReconciler] Success: ${item.id} (${item.type})`)
                    await update(item.id, {
                        status: 'applied',
                        appliedAt: Date.now(),
                    })

                } catch (err: any) {
                    console.error('[OfflineReconciler] Falha ao reconciliar:', item.id, err)

                    // 🛑 FAIL FAST: Auth Errors (401/403)
                    // If token is dead, retrying won't help. We must stop immediately to avoid infinite loops.
                    const isAuthError = err.message.includes('401') || err.message.includes('403');

                    if (isAuthError) {
                        console.error('🚨 [OfflineReconciler] AUTH TOKEN EXPIRED. Stopping queue processing.');
                        await update(item.id, {
                            status: 'failed',
                            lastError: 'AUTH_EXPIRED: Please login again.',
                            attempts: 99 // Permanent Fail
                        });
                        // Optional: Emit event to UI to show login modal
                        // window.dispatchEvent(new CustomEvent('chefiapp:auth-expired'));
                        continue;
                    }

                    const currentAttempts = (item.attempts || 0) + 1
                    const maxAttempts = 3

                    if (currentAttempts < maxAttempts) {
                        // ⏳ Backoff: 2s, 4s, 8s...
                        const delay = 2000 * Math.pow(2, currentAttempts - 1)
                        console.log(`[Backoff] Item ${item.id} retrying in ${delay}ms (Attempt ${currentAttempts}/${maxAttempts})`)

                        await update(item.id, {
                            status: 'queued', // Keep queued to retry
                            attempts: currentAttempts,
                            nextRetryAt: Date.now() + delay,
                            lastError: err instanceof Error ? err.message : 'Erro desconhecido',
                        })
                    } else {
                        // ❌ Hard Fail after max attempts
                        await update(item.id, {
                            status: 'failed',
                            attempts: currentAttempts,
                            lastError: err instanceof Error ? err.message : 'Erro desconhecido',
                        })
                    }
                }
            }

            console.groupEnd()
            runningRef.current = false
        }

        run()
    }, [healthStatus, items, apiBase, update, tick])
}
