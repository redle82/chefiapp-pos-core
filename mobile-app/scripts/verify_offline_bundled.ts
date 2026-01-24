
// --- AUTHORED BUNDLE FOR VERIFICATION ---

// MOCKS for standard imports if they stick around (but we will rely on DI)
const AsyncStorage = {
    setItem: async () => { },
    getItem: async () => null,
    removeItem: async () => { }
};
const supabase = {
    from: () => ({ insert: async () => ({ error: null }) })
};
const Alert = { alert: () => { } };

// --- OfflineQueueService CODE (Inlined) ---
const QUEUE_KEY = '@mutation_queue_v1';

// Types
type MutationType =
    | 'CREATE_ORDER'
    | 'UPDATE_ORDER_STATUS'
    | 'ADD_ORDER_ITEMS'
    | 'CLOSE_SHIFT'
    | 'ADD_PAYMENT';

interface QueueItem {
    id: string;
    mutationType: MutationType;
    payload: any;
    timestamp: number;
    retryCount: number;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const OfflineQueueService = {
    storage: AsyncStorage as any,
    db: supabase as any,

    init(storageVal: any, dbVal: any) {
        this.storage = storageVal;
        this.db = dbVal;
    },

    async enqueue(mutationType: MutationType, payload: any) {
        try {
            const currentQueue = await this.getQueue();
            const newItem: QueueItem = {
                id: generateUUID(),
                mutationType,
                payload,
                timestamp: Date.now(),
                retryCount: 0
            };

            const newQueue = [...currentQueue, newItem];
            await this.storage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
            console.log(`[OfflineQueue] Enqueued ${mutationType}`, payload);
            return newItem.id;
        } catch (e) {
            console.error('[OfflineQueue] Enqueue Failed', e);
            return null;
        }
    },

    async getQueue(): Promise<QueueItem[]> {
        try {
            const json = await this.storage.getItem(QUEUE_KEY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('[OfflineQueue] GetQueue Failed', e);
            return [];
        }
    },

    async dequeue(itemId: string) {
        try {
            const currentQueue = await this.getQueue();
            const newQueue = currentQueue.filter((i: any) => i.id !== itemId);
            await this.storage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
        } catch (e) {
            console.error('[OfflineQueue] Dequeue Failed', e);
        }
    },

    async clearQueue() {
        await this.storage.removeItem(QUEUE_KEY);
    },

    async processQueue(): Promise<number> {
        const queue = await this.getQueue();
        if (queue.length === 0) return 0;

        console.log(`[OfflineQueue] Processing ${queue.length} items...`);
        let successCount = 0;

        for (const item of queue) {
            const success = await this.processItem(item);
            if (success) {
                await this.dequeue(item.id);
                successCount++;
            } else {
                console.warn(`[OfflineQueue] Item ${item.id} failed. Stopping queue processing.`);
                break;
            }
        }
        return successCount;
    },

    async processItem(item: QueueItem): Promise<boolean> {
        try {
            switch (item.mutationType) {
                case 'CREATE_ORDER':
                    return await this.syncCreateOrder(item.payload);
                case 'ADD_ORDER_ITEMS':
                    return await this.syncAddOrderItems(item.payload);
                default:
                    console.warn(`[OfflineQueue] Unknown mutation type: ${item.mutationType}`);
                    return true;
            }
        } catch (e) {
            console.error(`[OfflineQueue] Process Error [${item.mutationType}]`, e);
            return false;
        }
    },

    async syncCreateOrder(payload: any) {
        console.log('[OfflineQueue] Replaying CREATE_ORDER');
        const { error } = await this.db.from('gm_orders').insert(payload);
        if (error) {
            console.error('[OfflineQueue] Sync Error:', error.message);
            return false;
        }
        return true;
    },

    async syncAddOrderItems(payload: any) {
        console.log('[OfflineQueue] Replaying ADD_ORDER_ITEMS');
        const { error } = await this.db.from('gm_order_items').insert(payload);
        if (error) {
            console.error('[OfflineQueue] Sync Error:', error.message);
            return false;
        }
        return true;
    }
};

// --- TEST SCRIPT LOGIC ---

// MOCKS for Test Execution
const mockStorageData = new Map<string, string>();

const MockAsyncStorage = {
    setItem: async (key: string, value: string) => {
        console.log(`[MockStorage] setItem ${key}`);
        mockStorageData.set(key, value);
    },
    getItem: async (key: string) => {
        console.log(`[MockStorage] getItem ${key}`);
        return mockStorageData.get(key) || null;
    },
    removeItem: async (key: string) => {
        console.log(`[MockStorage] removeItem ${key}`);
        mockStorageData.delete(key);
    }
};

const MockSupabase = {
    from: (table: string) => ({
        insert: async (payload: any) => {
            console.log(`[MockSupabase] Insert into ${table}:`, JSON.stringify(payload));
            return { error: null };
        }
    })
};

async function runTest() {
    console.log("🧪 Testing OfflineQueueService Logic (Bundled)...");

    // 1. Inject Mocks
    OfflineQueueService.init(MockAsyncStorage, MockSupabase);

    // 2. Test Enqueue
    const orderId = "test-order-1";
    await OfflineQueueService.enqueue('CREATE_ORDER', { id: orderId, total: 100 });

    // 3. Verify Queue
    const queue = await OfflineQueueService.getQueue();
    console.log("Queue Length:", queue.length);
    if (queue.length !== 1) throw new Error("Queue should have 1 item");
    if (queue[0].mutationType !== 'CREATE_ORDER') throw new Error("Wrong mutation type");

    // 4. Test Process (Sync)
    const successCount = await OfflineQueueService.processQueue();
    console.log("Processed Count:", successCount);

    if (successCount !== 1) throw new Error("Should have processed 1 item");

    // 5. Verify Queue Empty
    const queueAfter = await OfflineQueueService.getQueue();
    console.log("Queue Length After:", queueAfter.length);
    if (queueAfter.length !== 0) throw new Error("Queue should be empty");

    console.log("✅ OfflineService Unit Test Passed!");
}

runTest().catch(e => {
    console.error("❌ Test Failed", e);
    process.exit(1);
});
