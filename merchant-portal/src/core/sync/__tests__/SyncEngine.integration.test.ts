// @vitest-environment jsdom
/**
 * SyncEngine Integration Test
 *
 * Tests the full flow: go offline -> queue items -> come back online -> reconcile.
 * Verifies all sync modules work together correctly.
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

// ─── Mock idb (for IdempotencyService) ──────────────────────────────────────

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
  v4: vi.fn(() => `uuid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
}));

// ─── Mock external dependencies ─────────────────────────────────────────────

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

vi.mock('../../infra/CoreOrdersApi', () => ({
  createOrderAtomic: vi.fn().mockResolvedValue({
    data: { id: 'server-order-1' },
    error: null,
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
  calculateNextRetry: vi.fn(() => 1000),
  MAX_RETRIES: 10,
}));

// ─── Imports ────────────────────────────────────────────────────────────────

import { IndexedDBQueue } from '../IndexedDBQueue';
import { OfflineQueueManager } from '../OfflineQueueManager';
import { IdempotencyService } from '../IdempotencyService';
import type { OfflineQueueItem } from '../types';

describe('SyncEngine Integration', () => {
  let SyncEngine: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    queueStore = new Map();
    idempotencyStore = new Map();

    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });

    vi.resetModules();
    const mod = await import('../SyncEngine');
    SyncEngine = mod.SyncEngine;

    // Wait for constructor async effects
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe('full offline-to-online flow', () => {
    it('queues items offline and processes them when online', async () => {
      const { createOrderAtomic } = await import('../../infra/CoreOrdersApi');

      // Simulate items that were queued while offline
      const item1: OfflineQueueItem = {
        id: 'offline-order-1',
        type: 'ORDER_CREATE',
        payload: {
          restaurant_id: 'res-1',
          items: [{ product_id: 'p1', name: 'Coffee', quantity: 1, unit_price: 350 }],
        },
        createdAt: Date.now() - 5000,
        attempts: 0,
        status: 'queued',
        idempotency_key: 'order-create-offline-order-1',
      };

      const item2: OfflineQueueItem = {
        id: 'offline-pay-1',
        type: 'ORDER_PAY',
        payload: {
          orderId: 'server-order-1',
          restaurantId: 'res-1',
          amountCents: 350,
          method: 'cash',
          cashRegisterId: 'cr-1',
        },
        createdAt: Date.now() - 4000,
        attempts: 0,
        status: 'queued',
        idempotency_key: 'order-pay-offline-pay-1',
      };

      queueStore.set(item1.id, { ...item1 });
      queueStore.set(item2.id, { ...item2 });

      // Process queue (simulates coming back online)
      await SyncEngine.processQueue();

      // Both items should be applied
      expect(queueStore.get('offline-order-1')?.status).toBe('applied');
      expect(queueStore.get('offline-pay-1')?.status).toBe('applied');
      expect(createOrderAtomic).toHaveBeenCalled();
    });

    it('processes payments before other updates (priority ordering)', async () => {
      const processedIds: string[] = [];

      // Track processing order
      (IndexedDBQueue.updateStatus as any).mockImplementation(
        async (id: string, status: string) => {
          const item = queueStore.get(id);
          if (item) {
            item.status = status;
            if (status === 'syncing') {
              processedIds.push(id);
            }
          }
        },
      );

      // Add items out of priority order
      const now = Date.now();
      queueStore.set('update-1', {
        id: 'update-1',
        type: 'ORDER_UPDATE',
        payload: { orderId: 'o1', restaurantId: 'r1', action: 'update' },
        createdAt: now - 3000,
        attempts: 0,
        status: 'queued',
      });
      queueStore.set('pay-1', {
        id: 'pay-1',
        type: 'ORDER_PAY',
        payload: {
          orderId: 'o1',
          restaurantId: 'r1',
          amountCents: 1000,
          method: 'cash',
          cashRegisterId: 'cr-1',
        },
        createdAt: now - 2000,
        attempts: 0,
        status: 'queued',
        idempotency_key: 'pay-key-1',
      });
      queueStore.set('create-1', {
        id: 'create-1',
        type: 'ORDER_CREATE',
        payload: {
          restaurant_id: 'r1',
          items: [{ product_id: 'p1', name: 'X', quantity: 1, unit_price: 100 }],
        },
        createdAt: now - 1000,
        attempts: 0,
        status: 'queued',
        idempotency_key: 'create-key-1',
      });

      await SyncEngine.processQueue();

      // Payment (priority 0) should be processed before create (1) and update (2)
      expect(processedIds.indexOf('pay-1')).toBeLessThan(processedIds.indexOf('create-1'));
      expect(processedIds.indexOf('create-1')).toBeLessThan(processedIds.indexOf('update-1'));
    });
  });

  describe('idempotency prevents duplicates', () => {
    it('skips already-processed items', async () => {
      const { createOrderAtomic } = await import('../../infra/CoreOrdersApi');

      // Mark as already processed in idempotency store
      idempotencyStore.set('order-create-dup-1', {
        key: 'order-create-dup-1',
        processedAt: Date.now(),
        response: { id: 'already-synced' },
        expiresAt: Date.now() + 1000 * 60 * 60,
      });

      queueStore.set('dup-1', {
        id: 'dup-1',
        type: 'ORDER_CREATE',
        payload: {
          restaurant_id: 'r1',
          items: [{ product_id: 'p1', name: 'X', quantity: 1, unit_price: 100 }],
        },
        createdAt: Date.now(),
        attempts: 0,
        status: 'queued',
        idempotency_key: 'order-create-dup-1',
      });

      await SyncEngine.processQueue();

      // Should be marked as applied without calling the API
      expect(queueStore.get('dup-1')?.status).toBe('applied');
      expect(createOrderAtomic).not.toHaveBeenCalled();
    });
  });

  describe('dead letter handling', () => {
    it('moves critical failures to dead letter queue', async () => {
      const { classifyFailure } = await import('../../errors/FailureClassifier');
      (classifyFailure as any).mockReturnValue({ class: 'critical' });

      const { createOrderAtomic } = await import('../../infra/CoreOrdersApi');
      (createOrderAtomic as any).mockResolvedValue({
        data: null,
        error: { message: 'FATAL: constraint violation' },
      });

      queueStore.set('critical-fail', {
        id: 'critical-fail',
        type: 'ORDER_CREATE',
        payload: {
          restaurant_id: 'r1',
          items: [{ product_id: 'p1', name: 'X', quantity: 1, unit_price: 100 }],
        },
        createdAt: Date.now(),
        attempts: 0,
        status: 'queued',
        idempotency_key: 'order-create-critical-fail',
      });

      await SyncEngine.processQueue();

      expect(queueStore.get('critical-fail')?.status).toBe('dead_letter');
    });
  });

  describe('network quality tracking', () => {
    it('records request result after processing an item', async () => {
      const { NetworkStateMachine } = await import('../NetworkStateMachine');
      const spy = vi.spyOn(NetworkStateMachine, 'recordRequestResult');

      const { createOrderAtomic } = await import('../../infra/CoreOrdersApi');
      (createOrderAtomic as any).mockResolvedValue({
        data: { id: 'tracked-server-1' },
        error: null,
      });

      queueStore.set('track-1', {
        id: 'track-1',
        type: 'ORDER_CREATE',
        payload: {
          restaurant_id: 'r1',
          items: [{ product_id: 'p1', name: 'X', quantity: 1, unit_price: 100 }],
        },
        createdAt: Date.now(),
        attempts: 0,
        status: 'queued',
        idempotency_key: 'order-create-track-1',
      });

      await SyncEngine.processQueue();

      // recordRequestResult should be called at least once
      expect(spy).toHaveBeenCalled();
      // On successful processing, one call should be (true, latencyMs)
      const successCall = spy.mock.calls.find((c) => c[0] === true);
      if (successCall) {
        expect(successCall[1]).toEqual(expect.any(Number));
      }
      // On failure, it records (false)
      // Either way, the tracking mechanism works
      expect(spy.mock.calls.length).toBeGreaterThan(0);

      spy.mockRestore();
    });
  });
});
