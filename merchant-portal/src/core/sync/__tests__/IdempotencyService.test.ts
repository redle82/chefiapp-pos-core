// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock idb before importing IdempotencyService
const mockStore = new Map<string, any>();

vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    get: vi.fn((_store: string, key: string) => mockStore.get(key) ?? undefined),
    put: vi.fn((_store: string, entry: any) => {
      mockStore.set(entry.key, entry);
    }),
    delete: vi.fn((_store: string, key: string) => {
      mockStore.delete(key);
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
  v4: vi.fn(() => 'test-uuid-1234'),
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

describe('IdempotencyService', () => {
  let IdempotencyService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStore.clear();
    // Re-import to get fresh instance
    vi.resetModules();
    const mod = await import('../IdempotencyService');
    IdempotencyService = mod.IdempotencyService;
  });

  describe('generateKey', () => {
    it('generates deterministic key from action and entityId', () => {
      const key1 = IdempotencyService.generateKey('ORDER_CREATE', 'order-123');
      const key2 = IdempotencyService.generateKey('ORDER_CREATE', 'order-123');

      expect(key1).toBe('ORDER_CREATE:order-123');
      expect(key2).toBe('ORDER_CREATE:order-123');
      expect(key1).toBe(key2);
    });

    it('generates UUID-based key when no entityId provided', () => {
      const key = IdempotencyService.generateKey('ORDER_CREATE');

      expect(key).toBe('ORDER_CREATE:test-uuid-1234');
    });

    it('generates different keys for different actions on same entity', () => {
      const key1 = IdempotencyService.generateKey('ORDER_CREATE', 'order-123');
      const key2 = IdempotencyService.generateKey('ORDER_PAY', 'order-123');

      expect(key1).not.toBe(key2);
    });
  });

  describe('markProcessed and isProcessed', () => {
    it('marks an operation as processed', async () => {
      const key = 'ORDER_CREATE:order-123';

      await IdempotencyService.markProcessed(key, { id: 'server-1' });

      expect(mockStore.has(key)).toBe(true);
      const entry = mockStore.get(key);
      expect(entry.key).toBe(key);
      expect(entry.response).toEqual({ id: 'server-1' });
      expect(entry.expiresAt).toBeGreaterThan(Date.now());
    });

    it('detects already-processed operations', async () => {
      const key = 'ORDER_CREATE:order-123';

      // Manually place a non-expired entry
      mockStore.set(key, {
        key,
        processedAt: Date.now(),
        response: { id: 'server-1' },
        expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour from now
      });

      const result = await IdempotencyService.isProcessed(key);
      expect(result).toBe(true);
    });

    it('returns false for unprocessed operations', async () => {
      const result = await IdempotencyService.isProcessed('never-seen');
      expect(result).toBe(false);
    });
  });

  describe('TTL expiration', () => {
    it('treats expired entries as not processed', async () => {
      const key = 'ORDER_CREATE:expired-1';

      // Manually place an expired entry
      mockStore.set(key, {
        key,
        processedAt: Date.now() - 48 * 60 * 60 * 1000,
        response: { id: 'old' },
        expiresAt: Date.now() - 1000, // Already expired
      });

      const result = await IdempotencyService.isProcessed(key);
      expect(result).toBe(false);
      // Expired entry should be cleaned up
      expect(mockStore.has(key)).toBe(false);
    });
  });

  describe('getProcessedResult', () => {
    it('returns cached response for processed key', async () => {
      const key = 'ORDER_PAY:pay-1';
      mockStore.set(key, {
        key,
        processedAt: Date.now(),
        response: { paymentId: 'pay-result' },
        expiresAt: Date.now() + 1000 * 60 * 60,
      });

      const result = await IdempotencyService.getProcessedResult(key);
      expect(result).toEqual({ paymentId: 'pay-result' });
    });

    it('returns null for unknown key', async () => {
      const result = await IdempotencyService.getProcessedResult('unknown');
      expect(result).toBeNull();
    });

    it('returns null for expired key and cleans up', async () => {
      const key = 'ORDER_PAY:expired-pay';
      mockStore.set(key, {
        key,
        processedAt: Date.now() - 48 * 60 * 60 * 1000,
        response: { paymentId: 'old' },
        expiresAt: Date.now() - 1000,
      });

      const result = await IdempotencyService.getProcessedResult(key);
      expect(result).toBeNull();
      expect(mockStore.has(key)).toBe(false);
    });
  });

  describe('fail-open behavior', () => {
    it('returns false (allows operation) when store is unavailable', async () => {
      // Re-import with a broken idb mock
      vi.resetModules();
      vi.doMock('idb', () => ({
        openDB: vi.fn().mockRejectedValue(new Error('IndexedDB unavailable')),
      }));
      vi.doMock('../../logger', () => ({
        Logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));
      vi.doMock('../../../config', () => ({
        CONFIG: { CORE_URL: '', OFFLINE_HEARTBEAT_ENABLED: false },
      }));

      const { IdempotencyService: BrokenService } = await import(
        '../IdempotencyService'
      );

      const result = await BrokenService.isProcessed('any-key');
      // Fail-open: allow the operation rather than block it
      expect(result).toBe(false);
    });
  });

  describe('cleanup interval', () => {
    it('starts and stops cleanup interval', () => {
      vi.useFakeTimers();

      IdempotencyService.startCleanupInterval();
      // Starting again should be a no-op
      IdempotencyService.startCleanupInterval();

      IdempotencyService.stopCleanupInterval();

      vi.useRealTimers();
    });
  });
});
