import type { OfflineQueueItem } from './types'

const DB_NAME = 'chefiapp_offline_queue'
const STORE_NAME = 'queue'
const DB_VERSION = 1

/**
 * Low-level IndexedDB wrapper
 * Promise-based for async/await usage.
 */
export const OfflineDB = {
    async open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // Key path is 'id' (uuid)
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
                    // Index by status for quick filtering
                    store.createIndex('status', 'status', { unique: false })
                    store.createIndex('createdAt', 'createdAt', { unique: false })
                }
            }
        })
    },

    async put(item: OfflineQueueItem): Promise<void> {
        const db = await this.open()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            const request = store.put(item)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    },

    async getAll(): Promise<OfflineQueueItem[]> {
        const db = await this.open()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly')
            const store = tx.objectStore(STORE_NAME)
            // Get all items sorted by createdAt implicitly?
            // Or explicitly use index. For now simple getAll is fine for reasonable queue size.
            const request = store.getAll()
            request.onsuccess = () => {
                // Sort by createdAt ascending (FIFO)
                const items = request.result as OfflineQueueItem[]
                items.sort((a, b) => a.createdAt - b.createdAt)
                resolve(items)
            }
            request.onerror = () => reject(request.error)
        })
    },

    async update(id: string, patch: Partial<OfflineQueueItem>): Promise<void> {
        const db = await this.open()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)

            const getReq = store.get(id)
            getReq.onsuccess = () => {
                const item = getReq.result as OfflineQueueItem
                if (!item) {
                    reject(new Error(`Item ${id} not found`))
                    return
                }
                const updated = { ...item, ...patch }
                const putReq = store.put(updated)
                putReq.onsuccess = () => resolve()
                putReq.onerror = () => reject(putReq.error)
            }
            getReq.onerror = () => reject(getReq.error)
        })
    },

    async remove(id: string): Promise<void> {
        const db = await this.open()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            const request = store.delete(id)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }
}
