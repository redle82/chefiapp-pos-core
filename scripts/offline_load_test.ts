
// --- COPIED & ADAPTED SERVICE LOGIC (Testable & Fixed) ---

const QUEUE_KEY = '@mutation_queue_v1';

export type MutationType =
    | 'CREATE_ORDER'
    | 'UPDATE_ORDER_STATUS'
    | 'ADD_ORDER_ITEMS'
    | 'CLOSE_SHIFT'
    | 'ADD_PAYMENT';

export interface QueueItem {
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
    storage: null as any,
    db: null as any,

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
            return newItem.id;
        } catch (e) {
            console.error('[OfflineQueue] Enqueue Failed', e);
            return null;
        }
    },

    async getQueue(): Promise<QueueItem[]> {
        const json = await this.storage.getItem(QUEUE_KEY);
        return json ? JSON.parse(json) : [];
    },

    async dequeue(itemId: string) {
        const currentQueue = await this.getQueue();
        const newQueue = currentQueue.filter(i => i.id !== itemId);
        await this.storage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
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
                case 'ADD_PAYMENT':
                    return await this.syncAddPayment(item.payload);
                case 'UPDATE_ORDER_STATUS':
                    return await this.syncUpdateOrderStatus(item.payload);
                default:
                    console.warn(`[OfflineQueue] Unknown mutation type: ${item.mutationType}`);
                    return true;
            }
        } catch (e) {
            console.error(`[OfflineQueue] Process Error`, e);
            return false;
        }
    },

    async syncCreateOrder(payload: any) {
        const { error } = await this.db.from('gm_orders').insert(payload);
        return !error;
    },

    async syncAddOrderItems(payload: any) {
        const { error } = await this.db.from('gm_order_items').insert(payload);
        return !error;
    },

    async syncUpdateOrderStatus(payload: any) {
        const { orderId, status } = payload;
        const { error } = await this.db.from('gm_orders').update({ status }).eq('id', orderId);
        return !error;
    },

    async syncAddPayment(payload: any) {
        const { orderId, method, status } = payload;
        const updatePayload: any = { status: status || 'PAID', payment_method: method, payment_status: 'paid' };
        const { error } = await this.db.from('gm_orders').update(updatePayload).eq('id', orderId);
        return !error;
    }
};

// --- MOCKS ---

const mockStorage = new Map<string, string>();
const AsyncStorageMock = {
    getItem: async (key: string) => mockStorage.get(key) || null,
    setItem: async (key: string, value: string) => { mockStorage.set(key, value); },
    removeItem: async (key: string) => { mockStorage.delete(key); }
};

const processedInserts: any[] = [];
const SupabaseMock = {
    from: (table: string) => ({
        insert: async (payload: any) => {
            processedInserts.push({ table, payload, operation: 'insert' });
            return { error: null };
        },
        update: (payload: any) => ({
            eq: async (col: string, val: string) => {
                processedInserts.push({ table, payload, operation: 'update', where: { [col]: val } });
                return { error: null };
            }
        })
    })
};

// Inject Mocks
OfflineQueueService.init(AsyncStorageMock as any, SupabaseMock as any);

// --- TEST SCENARIO ---

async function runLoadTest() {
    console.log("🚀 Starting Offline Queue Load Test (50 Orders)...");

    // 1. Simulate "Offline" Usage - 50 Orders
    for (let i = 0; i < 50; i++) {
        const orderId = `offline-order-${i}`;

        await OfflineQueueService.enqueue('CREATE_ORDER', {
            id: orderId,
            table_number: i,
            total_amount: 1000,
            status: 'OPEN'
        });

        await OfflineQueueService.enqueue('ADD_ORDER_ITEMS', [
            { order_id: orderId, product_name: 'Burger' }
        ]);

        await OfflineQueueService.enqueue('ADD_PAYMENT', {
            orderId: orderId,
            amount: 1400,
            method: 'card',
            status: 'PAID'
        });
    }

    console.log("📶 Network Restored. Processing Queue...");
    const syncStart = Date.now();

    // 2. Process Queue
    const processedCount = await OfflineQueueService.processQueue();

    const syncEnd = Date.now();
    const duration = syncEnd - syncStart;

    console.log(`✅ Processed ${processedCount} items in ${duration}ms`);

    // 3. Verification
    const orderInserts = processedInserts.filter(i => i.table === 'gm_orders' && i.operation === 'insert').length;
    const itemInserts = processedInserts.filter(i => i.table === 'gm_order_items' && i.operation === 'insert').length;
    const paymentUpdates = processedInserts.filter(i => i.table === 'gm_orders' && i.operation === 'update').length;

    console.log(`\n--- INTEGRITY REPORT ---`);
    console.log(`Orders Synced: ${orderInserts} / 50`);
    console.log(`Items Synced: ${itemInserts} / 50`);
    console.log(`Payments Synced: ${paymentUpdates} / 50`);

    if (processedCount === 150 && orderInserts === 50 && itemInserts === 50 && paymentUpdates === 50) {
        console.log("✅ SUCCESS: All 150 Offline Mutations (Orders, Items, Payments) were synced!");
    } else {
        console.log("❌ FAILURE: Counts mismatch.");
    }
}

runLoadTest().catch(console.error);
