
import { OfflineQueueService } from '../services/OfflineQueueService';

// --- MOCKS ---
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
    console.log("🧪 Testing OfflineQueueService Logic (Local)...");

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
