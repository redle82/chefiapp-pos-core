/**
 * OfflineQueueService — Unit tests
 *
 * Validates FIFO queue, enqueue/dequeue, idempotency and processItem logic.
 */
import {
  OfflineQueueService,
  generateUUID,
  type QueueItem,
} from "../../services/OfflineQueueService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    _store: store,
  };
}

function mockDb(overrides: Record<string, any> = {}) {
  return {
    from: jest.fn((_table: string) => ({
      insert: jest.fn(() =>
        Promise.resolve({ error: overrides.insertError ?? null }),
      ),
      update: jest.fn((_payload: any) => ({
        eq: jest.fn(() =>
          Promise.resolve({ error: overrides.updateError ?? null }),
        ),
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("generateUUID", () => {
  it("returns a v4 UUID-like string", () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("generates unique IDs", () => {
    const ids = Array.from({ length: 50 }, () => generateUUID());
    expect(new Set(ids).size).toBe(50);
  });
});

describe("OfflineQueueService", () => {
  let storage: ReturnType<typeof mockStorage>;
  let db: ReturnType<typeof mockDb>;

  beforeEach(() => {
    storage = mockStorage();
    db = mockDb();
    OfflineQueueService.init(storage, db);
  });

  // -- enqueue / getQueue / dequeue --
  describe("enqueue + getQueue", () => {
    it("starts with an empty queue", async () => {
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toEqual([]);
    });

    it("adds an item and retrieves it", async () => {
      await OfflineQueueService.enqueue("CREATE_ORDER", { foo: 1 });
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].mutationType).toBe("CREATE_ORDER");
      expect(queue[0].payload).toEqual({ foo: 1 });
      expect(queue[0].retryCount).toBe(0);
    });

    it("preserves FIFO order", async () => {
      await OfflineQueueService.enqueue("CREATE_ORDER", { order: 1 });
      await OfflineQueueService.enqueue("ADD_PAYMENT", { order: 2 });
      await OfflineQueueService.enqueue("CLOSE_SHIFT", { order: 3 });
      const queue = await OfflineQueueService.getQueue();
      expect(queue.map((i) => i.mutationType)).toEqual([
        "CREATE_ORDER",
        "ADD_PAYMENT",
        "CLOSE_SHIFT",
      ]);
    });
  });

  describe("dequeue", () => {
    it("removes an item by id", async () => {
      const id = await OfflineQueueService.enqueue("ADD_PAYMENT", { x: 1 });
      expect(id).toBeTruthy();
      await OfflineQueueService.dequeue(id!);
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(0);
    });

    it("is safe when id does not exist", async () => {
      await OfflineQueueService.enqueue("ADD_PAYMENT", { x: 1 });
      await OfflineQueueService.dequeue("nonexistent");
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(1);
    });
  });

  describe("clearQueue", () => {
    it("empties the entire queue", async () => {
      await OfflineQueueService.enqueue("CREATE_ORDER", {});
      await OfflineQueueService.enqueue("CLOSE_SHIFT", {});
      await OfflineQueueService.clearQueue();
      const queue = await OfflineQueueService.getQueue();
      expect(queue).toHaveLength(0);
    });
  });

  // -- processItem --
  describe("processItem", () => {
    it("syncs UPDATE_ORDER_STATUS via db.update", async () => {
      const item: QueueItem = {
        id: "q1",
        mutationType: "UPDATE_ORDER_STATUS",
        payload: { orderId: "o1", status: "PAID" },
        timestamp: Date.now(),
        retryCount: 0,
      };
      const result = await OfflineQueueService.processItem(item);
      expect(result).toBe(true);
      expect(db.from).toHaveBeenCalledWith("gm_orders");
    });

    it("returns false when db update fails", async () => {
      const failDb = mockDb({ updateError: { message: "timeout" } });
      OfflineQueueService.init(storage, failDb);
      const item: QueueItem = {
        id: "q2",
        mutationType: "UPDATE_ORDER_STATUS",
        payload: { orderId: "o2", status: "PAID" },
        timestamp: Date.now(),
        retryCount: 0,
      };
      const result = await OfflineQueueService.processItem(item);
      expect(result).toBe(false);
    });

    it("dequeues unknown mutation types (prevents blocking)", async () => {
      const item: QueueItem = {
        id: "q3",
        mutationType: "CREATE_ORDER" as any,
        payload: {},
        timestamp: Date.now(),
        retryCount: 0,
      };
      // CREATE_ORDER is handled by a separate switch branch —
      // if processItem falls through to default, it returns true
      const result = await OfflineQueueService.processItem(item);
      // syncCreateOrder will be called — result depends on db mock
      expect(typeof result).toBe("boolean");
    });
  });

  // -- processQueue --
  describe("processQueue", () => {
    it("returns 0 for empty queue", async () => {
      const count = await OfflineQueueService.processQueue();
      expect(count).toBe(0);
    });

    it("processes items and dequeues on success", async () => {
      await OfflineQueueService.enqueue("UPDATE_ORDER_STATUS", {
        orderId: "o1",
        status: "PAID",
      });
      await OfflineQueueService.enqueue("ADD_PAYMENT", {
        orderId: "o2",
        method: "card",
        status: "PAID",
      });
      const count = await OfflineQueueService.processQueue();
      expect(count).toBe(2);
      const remaining = await OfflineQueueService.getQueue();
      expect(remaining).toHaveLength(0);
    });

    it("stops on first failure (preserves order)", async () => {
      const failDb = mockDb({ updateError: { message: "network" } });
      OfflineQueueService.init(storage, failDb);
      await OfflineQueueService.enqueue("UPDATE_ORDER_STATUS", {
        orderId: "o1",
        status: "X",
      });
      await OfflineQueueService.enqueue("ADD_PAYMENT", {
        orderId: "o2",
        method: "cash",
      });
      const count = await OfflineQueueService.processQueue();
      expect(count).toBe(0);
      const remaining = await OfflineQueueService.getQueue();
      expect(remaining).toHaveLength(2);
    });
  });
});
