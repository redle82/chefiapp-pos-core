// @vitest-environment jsdom
/**
 * NetworkDegradation Test
 *
 * Simulates intermittent connectivity and verifies:
 * - Queue builds up correctly during outages
 * - Reconciliation works after reconnect
 * - No data loss
 * - No duplicate orders
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── In-memory stores ────────────────────────────────────────────────────────

let queueStore: Map<string, any>;
let idempotencyStore: Map<string, any>;

// ─── Mock IndexedDBQueue ────────────────────────────────────────────────────

vi.mock('../IndexedDBQueue', () => ({
  IndexedDBQueue: {
    put: vi.fn(async (item: any) => {
      queueStore.set(item.id, { ...item });
    }),
    getAll: vi.fn(async () => {
      return Array.from(queueStore.values()).sort(
        (a: any, b: any) => a.createdAt - b.createdAt,
      );
    }),
    getPending: vi.fn(async () => {
      const now = Date.now();
      return Array.from(queueStore.values())
        .filter(
          (i: any) =>
            (i.status === 'queued' || i.status === 'failed') &&
            (!i.nextRetryAt || i.nextRetryAt <= now),
        )
        .sort((a: any, b: any) => a.createdAt - b.createdAt);
    }),
    updateStatus: vi.fn(async (id: string, status: string, error?: string, nextRetryAt?: number) => {
      const item = queueStore.get(id);
      if (item) {
        item.status = status;
        if (error) { item.error = error; item.lastError = error; }
        if (nextRetryAt) item.nextRetryAt = nextRetryAt;
        if (status === 'failed') item.attempts = (item.attempts || 0) + 1;
        if (status === 'applied') item.appliedAt = Date.now();
      }
    }),
    remove: vi.fn(async (id: string) => {
      queueStore.delete(id);
    }),
    open: vi.fn(),
  },
}));

vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    get: vi.fn((_store: string, key: string) => idempotencyStore.get(key)),
    put: vi.fn((_store: string, entry: any) => {
      idempotencyStore.set(entry.key, entry);
    }),
    delete: vi.fn((_store: string, key: string) => {
      idempotencyStore.delete(key);
    }),
    transaction: vi.fn(() => ({
      store: {
        index: vi.fn(() => ({
          openCursor: vi.fn().mockResolvedValue(null),
        })),
      },
      done: Promise.resolve(),
    })),
  }),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => `uuid-${Math.random().toString(36).slice(2, 10)}`),
}));

vi.mock('../../config', () => ({
  CONFIG: {
    CORE_URL: '',
    OFFLINE_HEARTBEAT_ENABLED: false,
    OFFLINE_HEARTBEAT_INTERVAL_MS: 30000,
    OFFLINE_HEARTBEAT_FAILURES: 2,
  },
}));

vi.mock('../../logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

let createOrderCallCount = 0;
let createOrderShouldFail = false;

vi.mock('../../infra/CoreOrdersApi', () => ({
  createOrderAtomic: vi.fn(async () => {
    createOrderCallCount++;
    if (createOrderShouldFail) {
      return { data: null, error: { message: 'Network timeout' } };
    }
    return { data: { id: `server-order-${createOrderCallCount}` }, error: null };
  }),
}));

vi.mock('../../governance/DbWriteGate', () => ({
  DbWriteGate: {
    insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockResolvedValue({ data: [{ id: 'updated' }], error: null }),
  },
}));

vi.mock('../../tpv/PaymentEngine', () => ({
  PaymentEngine: {
    processPayment: vi.fn().mockResolvedValue(undefined),
    processSplitPayment: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../supabase', () => ({
  supabase: { rpc: vi.fn() },
}));

vi.mock('../../errors/FailureClassifier', () => ({
  classifyFailure: vi.fn(() => ({ class: 'degradation' })),
}));

vi.mock('../../infra/backendAdapter', () => ({
  BackendType: { supabase: 'supabase', docker: 'docker' },
  getBackendType: vi.fn(() => 'supabase'),
}));

vi.mock('../ConflictResolver', () => ({
  ConflictResolver: {
    shouldApplyUpdate: vi.fn().mockResolvedValue(true),
    getVersion: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../RetryStrategy', () => ({
  calculateNextRetry: vi.fn(() => 0), // No delay for tests
  MAX_RETRIES: 10,
}));

import { OfflineQueueManager } from '../OfflineQueueManager';
import type { OfflineQueueItem } from '../types';

function makeOrderItem(id: string, createdAt?: number): OfflineQueueItem {
  return {
    id,
    type: 'ORDER_CREATE',
    payload: {
      restaurant_id: 'res-1',
      items: [{ product_id: 'p1', name: 'Cafe', quantity: 1, unit_price: 350 }],
    },
    createdAt: createdAt ?? Date.now(),
    attempts: 0,
    status: 'queued',
    idempotency_key: `order-create-${id}`,
  };
}

describe('Network Degradation Simulation', () => {
  let SyncEngine: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    queueStore = new Map();
    idempotencyStore = new Map();
    createOrderCallCount = 0;
    createOrderShouldFail = false;

    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });

    vi.resetModules();
    const mod = await import('../SyncEngine');
    SyncEngine = mod.SyncEngine;
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe('intermittent connectivity', () => {
    it('queues build up during outage and all get processed on reconnect', async () => {
      // Simulate offline: queue 5 orders
      const orderCount = 5;
      for (let i = 0; i < orderCount; i++) {
        const item = makeOrderItem(`offline-${i}`, Date.now() + i);
        queueStore.set(item.id, { ...item });
      }

      // Verify queue size
      const health = await OfflineQueueManager.getQueueHealth();
      expect(health.pending).toBe(orderCount);

      // Come back online: process queue
      await SyncEngine.processQueue();

      // All items should be applied
      for (let i = 0; i < orderCount; i++) {
        const item = queueStore.get(`offline-${i}`);
        expect(item?.status).toBe('applied');
      }
    });

    it('no data loss: failed items stay in queue for retry', async () => {
      // Queue some items
      for (let i = 0; i < 3; i++) {
        queueStore.set(`item-${i}`, makeOrderItem(`item-${i}`, Date.now() + i));
      }

      // First attempt fails
      createOrderShouldFail = true;
      await SyncEngine.processQueue();

      // Items should be 'failed', not lost
      const failedCount = Array.from(queueStore.values()).filter(
        (i: any) => i.status === 'failed',
      ).length;
      expect(failedCount).toBe(3);

      // Nothing was lost
      expect(queueStore.size).toBe(3);

      // Retry succeeds
      createOrderShouldFail = false;
      await SyncEngine.processQueue();

      const appliedCount = Array.from(queueStore.values()).filter(
        (i: any) => i.status === 'applied',
      ).length;
      expect(appliedCount).toBe(3);
    });

    it('no duplicate orders: idempotency prevents re-processing', async () => {
      const { createOrderAtomic } = await import('../../infra/CoreOrdersApi');

      // Queue one item
      const item = makeOrderItem('dedup-1');
      queueStore.set(item.id, { ...item });

      // Process successfully
      await SyncEngine.processQueue();
      expect(queueStore.get('dedup-1')?.status).toBe('applied');

      // Idempotency entry should exist
      expect(idempotencyStore.has('order-create-dedup-1')).toBe(true);

      // Reset item to queued (simulating a queue restart / duplicate entry)
      queueStore.set('dedup-1', makeOrderItem('dedup-1'));
      const callsBefore = (createOrderAtomic as any).mock.calls.length;

      await SyncEngine.processQueue();

      // API should NOT be called again due to idempotency
      expect((createOrderAtomic as any).mock.calls.length).toBe(callsBefore);
      expect(queueStore.get('dedup-1')?.status).toBe('applied');
    });
  });

  describe('queue capacity during extended outage', () => {
    it('handles many items queued during extended offline period', async () => {
      // Queue 50 items (simulating busy restaurant offline)
      const count = 50;
      for (let i = 0; i < count; i++) {
        queueStore.set(`bulk-${i}`, makeOrderItem(`bulk-${i}`, Date.now() + i));
      }

      const health = await OfflineQueueManager.getQueueHealth();
      expect(health.pending).toBe(count);
      expect(health.capacityWarning).toBe('none');

      // Process all at once when back online
      await SyncEngine.processQueue();

      const appliedCount = Array.from(queueStore.values()).filter(
        (i: any) => i.status === 'applied',
      ).length;
      expect(appliedCount).toBe(count);
    });
  });

  describe('mixed success/failure during intermittent connectivity', () => {
    it('processes successful items and retries failed ones', async () => {
      let callIndex = 0;

      const { createOrderAtomic } = await import('../../infra/CoreOrdersApi');
      (createOrderAtomic as any).mockImplementation(async () => {
        callIndex++;
        // Fail every 2nd call
        if (callIndex % 2 === 0) {
          return { data: null, error: { message: 'Intermittent failure' } };
        }
        return { data: { id: `server-${callIndex}` }, error: null };
      });

      // Queue 4 items
      for (let i = 0; i < 4; i++) {
        queueStore.set(`mix-${i}`, makeOrderItem(`mix-${i}`, Date.now() + i));
      }

      // First pass: some succeed, some fail
      await SyncEngine.processQueue();

      const applied = Array.from(queueStore.values()).filter(
        (i: any) => i.status === 'applied',
      );
      const failed = Array.from(queueStore.values()).filter(
        (i: any) => i.status === 'failed',
      );

      // Some succeeded, some failed
      expect(applied.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);
      // Nothing lost
      expect(applied.length + failed.length).toBe(4);

      // Second pass with all succeeding
      (createOrderAtomic as any).mockResolvedValue({
        data: { id: 'retry-success' },
        error: null,
      });

      await SyncEngine.processQueue();

      const finalApplied = Array.from(queueStore.values()).filter(
        (i: any) => i.status === 'applied',
      );
      expect(finalApplied.length).toBe(4);
    });
  });

  describe('payment priority during reconciliation', () => {
    it('processes ORDER_PAY before ORDER_CREATE and ORDER_UPDATE', async () => {
      const processingOrder: string[] = [];

      const { createOrderAtomic } = await import('../../infra/CoreOrdersApi');
      (createOrderAtomic as any).mockImplementation(async () => {
        return { data: { id: 'ok' }, error: null };
      });

      const { PaymentEngine } = await import('../../tpv/PaymentEngine');
      (PaymentEngine.processPayment as any).mockImplementation(async () => {
        processingOrder.push('ORDER_PAY');
      });

      const { IndexedDBQueue: mockQueue } = await import('../IndexedDBQueue');
      (mockQueue.updateStatus as any).mockImplementation(
        async (id: string, status: string) => {
          const item = queueStore.get(id);
          if (item) {
            item.status = status;
            if (status === 'syncing') {
              processingOrder.push(item.type);
            }
          }
        },
      );

      const now = Date.now();

      // Add in non-priority order
      queueStore.set('update-first', {
        id: 'update-first',
        type: 'ORDER_UPDATE',
        payload: { orderId: 'o1', restaurantId: 'r1', action: 'update' },
        createdAt: now - 3000,
        attempts: 0,
        status: 'queued',
      });
      queueStore.set('create-second', {
        id: 'create-second',
        type: 'ORDER_CREATE',
        payload: {
          restaurant_id: 'r1',
          items: [{ product_id: 'p1', name: 'X', quantity: 1, unit_price: 100 }],
        },
        createdAt: now - 2000,
        attempts: 0,
        status: 'queued',
      });
      queueStore.set('pay-third', {
        id: 'pay-third',
        type: 'ORDER_PAY',
        payload: {
          orderId: 'o1',
          restaurantId: 'r1',
          amountCents: 500,
          method: 'cash',
          cashRegisterId: 'cr-1',
        },
        createdAt: now - 1000,
        attempts: 0,
        status: 'queued',
        idempotency_key: 'pay-key',
      });

      await SyncEngine.processQueue();

      // First syncing call should be ORDER_PAY
      const syncingOrder = processingOrder.filter((t) => t !== 'ORDER_PAY' || true);
      expect(syncingOrder[0]).toBe('ORDER_PAY');
    });
  });
});
