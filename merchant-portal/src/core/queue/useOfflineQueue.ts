import { useState, useCallback, useEffect } from 'react'
import { OfflineDB } from './db'
import type { OfflineQueueItem } from './types'

export function useOfflineQueue() {
    const [items, setItems] = useState<OfflineQueueItem[]>([])
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(async () => {
        try {
            const list = await OfflineDB.getAll()
            console.log(`[OfflineQueue] Loaded ${list.length} items`)
            setItems(list)
        } catch (err) {
            console.error('Failed to read offline queue', err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Sync across instances via BroadcastChannel
    useEffect(() => {
        const channel = new BroadcastChannel('chefiapp_offline_sync')
        channel.onmessage = () => {
            console.log('[OfflineQueue] Signal received, refreshing...')
            refresh()
        }
        // Auto-load once
        refresh()

        return () => channel.close()
    }, [refresh])

    const notify = () => {
        const channel = new BroadcastChannel('chefiapp_offline_sync')
        channel.postMessage('update')
        channel.close()
    }

    const enqueue = useCallback(async (item: OfflineQueueItem) => {
        await OfflineDB.put(item)
        await refresh()
        notify()
    }, [refresh])

    const update = useCallback(async (id: string, patch: Partial<OfflineQueueItem>) => {
        await OfflineDB.update(id, patch)
        await refresh()
        notify()
    }, [refresh])

    const remove = useCallback(async (id: string) => {
        await OfflineDB.remove(id)
        await refresh()
        notify()
    }, [refresh])

    return {
        items,
        loading,
        refresh,
        enqueue,
        update,
        remove
    }
}
