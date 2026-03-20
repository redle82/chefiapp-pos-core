// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory store to simulate IndexedDB
let queueStore: Map<string, any>;

vi.mock('../IndexedDBQueue', () => ({
  IndexedDBQueue: {
    put: vi.fn(async (item: any) => {
      queueStore.set(item.id, item);
    }),
    getAll: vi.fn(async () => {
      return Array.from(queueStore.values()).sort(
        (a: any, b: any) => a.createdAt - b.createdAt,
      );
    }),
    updateStatus: vi.fn(async (id: string, status: string, error?: string, nextRetryAt?: number) => {
      const item = queueStore.get(id);
      if (item) {
        item.status = status;
        if (error) item.error = error;
        if (nextRetryAt) item.nextRetryAt = nextRetryAt;
        if (status === 'failed') {
          item.attempts = (item.attempts || 0) + 1;
        }
        if (status === 'applied') {
          item.appliedAt = Date.now();
        }
      }
    }),
    remove: vi.fn(async (id: string) => {
      queueStore.delete(id);
    }),
  },
}));

vi.mock('../../logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../config', () => ({
  CONFIG: {
    CORE_URL: '',
    OFFLINE_HEARTBEAT_ENABLED: false,
  },
}));

import { OfflineQueueManager } from '../OfflineQueueManager';
import type { OfflineQueueItem } from '../types';

function makeItem(
  overrides: Partial<OfflineQueueItem> & { id: string; type: OfflineQueueItem['type'] },
): OfflineQueueItem {
  return {
    payload: {},
    createdAt: Date.now(),
    attempts: 0,
    status: 'queued',
    ...overrides,
  };
}

describe('OfflineQueueManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queueStore = new Map();
  });

  describe('getPriority', () => {
    it('prioritizes ORDER_PAY (0) over ORDER_UPDATE (2)', () => {
      expect(OfflineQueueManager.getPriority('ORDER_PAY')).toBeLessThan(
        OfflineQueueManager.getPriority('ORDER_UPDATE'),
      );
    });

    it('prioritizes ORDER_CREATE (1) over ORDER_CANCEL (3)', () => {
      expect(OfflineQueueManager.getPriority('ORDER_CREATE')).toBeLessThan(
        OfflineQueueManager.getPriority('ORDER_CANCEL'),
      );
    });

    it('returns default priority (5) for unknown types', () => {
      expect(OfflineQueueManager.getPriority('UNKNOWN_TYPE')).toBe(5);
    });
  });

  describe('getPendingByPriority', () => {
    it('returns items sorted by priority then by creation time', async () => {
      const now = Date.now();
      queueStore.set('update-1', makeItem({
        id: 'update-1',
        type: 'ORDER_UPDATE',
        createdAt: now - 3000,
      }));
      queueStore.set('pay-1', makeItem({
        id: 'pay-1',
        type: 'ORDER_PAY',
        createdAt: now - 1000,
      }));
      queueStore.set('create-1', makeItem({
        id: 'create-1',
        type: 'ORDER_CREATE',
        createdAt: now - 2000,
      }));

      const pending = await OfflineQueueManager.getPendingByPriority();

      expect(pending[0].id).toBe('pay-1');    // priority 0
      expect(pending[1].id).toBe('create-1'); // priority 1
      expect(pending[2].id).toBe('update-1'); // priority 2
    });

    it('excludes items with future nextRetryAt', async () => {
      queueStore.set('retry-later', makeItem({
        id: 'retry-later',
        type: 'ORDER_UPDATE',
        status: 'failed',
        nextRetryAt: Date.now() + 60_000,
      }));
      queueStore.set('ready', makeItem({
        id: 'ready',
        type: 'ORDER_UPDATE',
        status: 'queued',
      }));

      const pending = await OfflineQueueManager.getPendingByPriority();

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('ready');
    });

    it('excludes applied and dead_letter items', async () => {
      queueStore.set('applied', makeItem({
        id: 'applied',
        type: 'ORDER_UPDATE',
        status: 'applied' as any,
      }));
      queueStore.set('dead', makeItem({
        id: 'dead',
        type: 'ORDER_UPDATE',
        status: 'dead_letter' as any,
      }));
      queueStore.set('queued', makeItem({
        id: 'queued',
        type: 'ORDER_UPDATE',
        status: 'queued',
      }));

      const pending = await OfflineQueueManager.getPendingByPriority();

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('queued');
    });
  });

  describe('capacity limits', () => {
    it('allows enqueueing under capacity', async () => {
      const item = makeItem({ id: 'item-1', type: 'ORDER_CREATE' });

      await expect(OfflineQueueManager.enqueue(item)).resolves.not.toThrow();
      expect(queueStore.has('item-1')).toBe(true);
    });

    it('rejects all items at hard max (1000)', async () => {
      // Fill with 1000 items
      for (let i = 0; i < 1000; i++) {
        queueStore.set(`fill-${i}`, makeItem({
          id: `fill-${i}`,
          type: 'ORDER_UPDATE',
        }));
      }

      const item = makeItem({ id: 'overflow', type: 'ORDER_PAY' });

      await expect(OfflineQueueManager.enqueue(item)).rejects.toThrow('QUEUE_FULL');
    });

    it('blocks non-critical items at 800+', async () => {
      for (let i = 0; i < 800; i++) {
        queueStore.set(`fill-${i}`, makeItem({
          id: `fill-${i}`,
          type: 'ORDER_UPDATE',
        }));
      }

      const nonCritical = makeItem({ id: 'non-critical', type: 'ORDER_CANCEL' });
      await expect(OfflineQueueManager.enqueue(nonCritical)).rejects.toThrow('QUEUE_NEAR_FULL');
    });

    it('allows critical items (ORDER_PAY) at 800+', async () => {
      for (let i = 0; i < 800; i++) {
        queueStore.set(`fill-${i}`, makeItem({
          id: `fill-${i}`,
          type: 'ORDER_UPDATE',
        }));
      }

      const critical = makeItem({ id: 'payment', type: 'ORDER_PAY' });
      await expect(OfflineQueueManager.enqueue(critical)).resolves.not.toThrow();
    });

    it('allows critical items (ORDER_CREATE) at 800+', async () => {
      for (let i = 0; i < 800; i++) {
        queueStore.set(`fill-${i}`, makeItem({
          id: `fill-${i}`,
          type: 'ORDER_UPDATE',
        }));
      }

      const critical = makeItem({ id: 'create', type: 'ORDER_CREATE' });
      await expect(OfflineQueueManager.enqueue(critical)).resolves.not.toThrow();
    });
  });

  describe('dead letter handling', () => {
    it('moves failed items to dead letter after max retries', async () => {
      queueStore.set('fail-item', makeItem({
        id: 'fail-item',
        type: 'ORDER_UPDATE',
        attempts: 9,
      }));

      await OfflineQueueManager.handleFailure('fail-item', 'server error', 9);

      const item = queueStore.get('fail-item');
      expect(item.status).toBe('dead_letter');
    });

    it('schedules retry when under max retries', async () => {
      queueStore.set('retry-item', makeItem({
        id: 'retry-item',
        type: 'ORDER_UPDATE',
        attempts: 2,
      }));

      await OfflineQueueManager.handleFailure('retry-item', 'temporary error', 2);

      const item = queueStore.get('retry-item');
      expect(item.status).toBe('failed');
      expect(item.nextRetryAt).toBeGreaterThan(Date.now());
    });

    it('retries dead letter items by resetting status', async () => {
      queueStore.set('dead-1', makeItem({
        id: 'dead-1',
        type: 'ORDER_UPDATE',
        status: 'dead_letter' as any,
        attempts: 10,
        error: 'some error',
      }));

      await OfflineQueueManager.retryDeadLetterItem('dead-1');

      const item = queueStore.get('dead-1');
      expect(item.status).toBe('queued');
      expect(item.attempts).toBe(0);
    });

    it('throws when retrying non-existent dead letter item', async () => {
      await expect(
        OfflineQueueManager.retryDeadLetterItem('non-existent'),
      ).rejects.toThrow('not found');
    });

    it('discards dead letter item with audit log', async () => {
      queueStore.set('discard-1', makeItem({
        id: 'discard-1',
        type: 'ORDER_UPDATE',
        status: 'dead_letter' as any,
      }));

      await OfflineQueueManager.discardDeadLetterItem('discard-1', 'Confirmed duplicate');

      expect(queueStore.has('discard-1')).toBe(false);
    });

    it('throws when discarding non-existent dead letter item', async () => {
      await expect(
        OfflineQueueManager.discardDeadLetterItem('ghost', 'reason'),
      ).rejects.toThrow('not found');
    });

    it('getDeadLetterItems returns only dead letter items', async () => {
      queueStore.set('alive', makeItem({ id: 'alive', type: 'ORDER_UPDATE', status: 'queued' }));
      queueStore.set('dead', makeItem({ id: 'dead', type: 'ORDER_UPDATE', status: 'dead_letter' as any }));

      const deadLetters = await OfflineQueueManager.getDeadLetterItems();

      expect(deadLetters).toHaveLength(1);
      expect(deadLetters[0].id).toBe('dead');
    });
  });

  describe('purgeApplied', () => {
    it('removes applied items older than maxAge', async () => {
      const oldTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      queueStore.set('old-applied', makeItem({
        id: 'old-applied',
        type: 'ORDER_UPDATE',
        status: 'applied' as any,
        createdAt: oldTime,
      }));
      queueStore.set('recent-applied', makeItem({
        id: 'recent-applied',
        type: 'ORDER_UPDATE',
        status: 'applied' as any,
        createdAt: Date.now(),
      }));

      const removed = await OfflineQueueManager.purgeApplied(60 * 60 * 1000);

      expect(removed).toBe(1);
      expect(queueStore.has('old-applied')).toBe(false);
      expect(queueStore.has('recent-applied')).toBe(true);
    });
  });

  describe('drainQueue', () => {
    it('returns up to batchSize items in priority order', async () => {
      const now = Date.now();
      for (let i = 0; i < 15; i++) {
        queueStore.set(`item-${i}`, makeItem({
          id: `item-${i}`,
          type: 'ORDER_UPDATE',
          createdAt: now + i,
        }));
      }

      const batch = await OfflineQueueManager.drainQueue(5);
      expect(batch).toHaveLength(5);
    });
  });

  describe('getQueueHealth', () => {
    it('reports correct counts by status', async () => {
      queueStore.set('q1', makeItem({ id: 'q1', type: 'ORDER_UPDATE', status: 'queued' }));
      queueStore.set('q2', makeItem({ id: 'q2', type: 'ORDER_UPDATE', status: 'queued' }));
      queueStore.set('s1', makeItem({ id: 's1', type: 'ORDER_UPDATE', status: 'syncing' as any }));
      queueStore.set('f1', makeItem({ id: 'f1', type: 'ORDER_UPDATE', status: 'failed' }));
      queueStore.set('d1', makeItem({ id: 'd1', type: 'ORDER_UPDATE', status: 'dead_letter' as any }));
      queueStore.set('a1', makeItem({ id: 'a1', type: 'ORDER_UPDATE', status: 'applied' as any }));

      const health = await OfflineQueueManager.getQueueHealth();

      expect(health.total).toBe(6);
      expect(health.pending).toBe(2);
      expect(health.syncing).toBe(1);
      expect(health.failed).toBe(1);
      expect(health.deadLetter).toBe(1);
      expect(health.applied).toBe(1);
      expect(health.capacityWarning).toBe('none');
    });

    it('reports warn capacity at 500+', async () => {
      for (let i = 0; i < 500; i++) {
        queueStore.set(`i-${i}`, makeItem({ id: `i-${i}`, type: 'ORDER_UPDATE' }));
      }

      const health = await OfflineQueueManager.getQueueHealth();
      expect(health.capacityWarning).toBe('warn');
    });

    it('reports critical capacity at 800+', async () => {
      for (let i = 0; i < 800; i++) {
        queueStore.set(`i-${i}`, makeItem({ id: `i-${i}`, type: 'ORDER_UPDATE' }));
      }

      const health = await OfflineQueueManager.getQueueHealth();
      expect(health.capacityWarning).toBe('critical');
    });

    it('reports blocked capacity at 1000', async () => {
      for (let i = 0; i < 1000; i++) {
        queueStore.set(`i-${i}`, makeItem({ id: `i-${i}`, type: 'ORDER_UPDATE' }));
      }

      const health = await OfflineQueueManager.getQueueHealth();
      expect(health.capacityWarning).toBe('blocked');
    });
  });
});
