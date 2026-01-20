import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'chefiapp_offline_queue';

export interface QueuedAction {
    id: string;
    type: 'CREATE_ORDER' | 'UPDATE_ORDER' | 'ADD_ITEM';
    payload: any;
    createdAt: number;
    retryCount: number;
    status: 'pending' | 'syncing' | 'failed';
}

export const OfflineQueue = {
    /**
     * Add action to offline queue
     */
    async enqueue(type: QueuedAction['type'], payload: any): Promise<string> {
        const queue = await this.getAll();
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const action: QueuedAction = {
            id,
            type,
            payload,
            createdAt: Date.now(),
            retryCount: 0,
            status: 'pending',
        };

        queue.push(action);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        console.log(`[OfflineQueue] Enqueued: ${type} (${id})`);
        return id;
    },

    /**
     * Get all queued actions
     */
    async getAll(): Promise<QueuedAction[]> {
        try {
            const data = await AsyncStorage.getItem(QUEUE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    /**
     * Get pending actions only
     */
    async getPending(): Promise<QueuedAction[]> {
        const queue = await this.getAll();
        return queue.filter(a => a.status === 'pending');
    },

    /**
     * Update action status
     */
    async updateStatus(id: string, status: QueuedAction['status']): Promise<void> {
        const queue = await this.getAll();
        const updated = queue.map(a =>
            a.id === id ? { ...a, status, retryCount: status === 'failed' ? a.retryCount + 1 : a.retryCount } : a
        );
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    },

    /**
     * Remove action from queue (after successful sync)
     */
    async remove(id: string): Promise<void> {
        const queue = await this.getAll();
        const filtered = queue.filter(a => a.id !== id);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
        console.log(`[OfflineQueue] Removed: ${id}`);
    },

    /**
     * Clear all queued actions
     */
    async clear(): Promise<void> {
        await AsyncStorage.removeItem(QUEUE_KEY);
        console.log('[OfflineQueue] Cleared all');
    },

    /**
     * Get queue count
     */
    async count(): Promise<number> {
        const queue = await this.getAll();
        return queue.length;
    },
};

export default OfflineQueue;
