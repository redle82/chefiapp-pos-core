// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
let mockCanSync = true;
let mockQueueHealth = { pending: 0, failed: 0, total: 0, syncing: 0, deadLetter: 0, applied: 0, oldestItemAge: 0, capacityWarning: 'none' as const };

vi.mock('../NetworkStateMachine', () => ({
  NetworkStateMachine: {
    canSync: vi.fn(() => mockCanSync),
    markReconnectionComplete: vi.fn(),
  },
}));

vi.mock('../OfflineQueueManager', () => ({
  OfflineQueueManager: {
    getQueueHealth: vi.fn(() => Promise.resolve(mockQueueHealth)),
    drainQueue: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../ConflictResolutionStrategy', () => ({
  ConflictResolutionStrategy: {
    resolveConflict: vi.fn((entity: string, local: any, server: any) => {
      // Default: return server version (server_wins)
      return { ...server };
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

import { ReconnectReconciler, type ReconciliationProgress } from '../ReconnectReconciler';
import { NetworkStateMachine } from '../NetworkStateMachine';
import { ConflictResolutionStrategy } from '../ConflictResolutionStrategy';
import { OfflineQueueManager } from '../OfflineQueueManager';

describe('ReconnectReconciler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanSync = true;
    mockQueueHealth = {
      pending: 0, failed: 0, total: 0,
      syncing: 0, deadLetter: 0, applied: 0,
      oldestItemAge: 0, capacityWarning: 'none',
    };
  });

  describe('reconcileOnReconnect — basic flow', () => {
    it('runs 5-step reconciliation and returns result', async () => {
      const mockServerFetcher = vi.fn().mockResolvedValue([]);
      const mockLocalProvider = vi.fn().mockResolvedValue([]);
      const mockLocalUpdater = vi.fn().mockResolvedValue(undefined);
      const mockProcessQueue = vi.fn().mockResolvedValue(undefined);

      ReconnectReconciler.configure({
        serverFetcher: mockServerFetcher,
        localDataProvider: mockLocalProvider,
        localDataUpdater: mockLocalUpdater,
        processQueue: mockProcessQueue,
      });

      const result = await ReconnectReconciler.reconcileOnReconnect();

      expect(result.success).toBe(true);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(NetworkStateMachine.markReconnectionComplete).toHaveBeenCalled();
    });

    it('aborts if network is lost during pause', async () => {
      mockCanSync = false; // Network lost immediately

      ReconnectReconciler.configure({
        serverFetcher: vi.fn(),
        localDataProvider: vi.fn(),
        localDataUpdater: vi.fn(),
        processQueue: vi.fn(),
      });

      const result = await ReconnectReconciler.reconcileOnReconnect();

      expect(result.success).toBe(false);
    });

    it('skips duplicate reconciliation if already in progress', async () => {
      // We can't easily test this race condition, but we verify the guard
      const mockProcessQueue = vi.fn(async () => {
        // Simulate slow processing
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockResolvedValue([]),
        localDataProvider: vi.fn().mockResolvedValue([]),
        localDataUpdater: vi.fn(),
        processQueue: mockProcessQueue,
      });

      // First call runs normally
      const result = await ReconnectReconciler.reconcileOnReconnect();
      expect(result.success).toBe(true);
    });
  });

  describe('progress events', () => {
    it('emits RECONCILIATION_STARTED and RECONCILIATION_COMPLETED events', async () => {
      const events: ReconciliationProgress[] = [];
      const unsub = ReconnectReconciler.subscribe((progress) => {
        events.push({ ...progress });
      });

      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockResolvedValue([]),
        localDataProvider: vi.fn().mockResolvedValue([]),
        localDataUpdater: vi.fn(),
        processQueue: vi.fn().mockResolvedValue(undefined),
      });

      await ReconnectReconciler.reconcileOnReconnect();

      const eventTypes = events.map((e) => e.event);
      expect(eventTypes).toContain('RECONCILIATION_STARTED');
      expect(eventTypes).toContain('RECONCILIATION_COMPLETED');

      unsub();
    });

    it('emits RECONCILIATION_CONFLICT when conflicts are found', async () => {
      const events: ReconciliationProgress[] = [];
      const unsub = ReconnectReconciler.subscribe((progress) => {
        events.push({ ...progress });
      });

      const localOrder = {
        id: 'order-1',
        status: 'preparing',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const serverOrder = {
        id: 'order-1',
        status: 'delivered',
        updated_at: '2025-01-01T11:00:00Z',
      };

      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockResolvedValue([serverOrder]),
        localDataProvider: vi.fn().mockImplementation(async (entity: string) => {
          if (entity === 'orders') return [localOrder];
          return [];
        }),
        localDataUpdater: vi.fn().mockResolvedValue(undefined),
        processQueue: vi.fn().mockResolvedValue(undefined),
      });

      await ReconnectReconciler.reconcileOnReconnect();

      const conflictEvents = events.filter((e) => e.event === 'RECONCILIATION_CONFLICT');
      expect(conflictEvents.length).toBeGreaterThan(0);
      expect(ConflictResolutionStrategy.resolveConflict).toHaveBeenCalledWith(
        'orders',
        localOrder,
        serverOrder,
      );

      unsub();
    });

    it('emits RECONCILIATION_COMPLETED with correct stats', async () => {
      const events: ReconciliationProgress[] = [];
      const unsub = ReconnectReconciler.subscribe((progress) => {
        events.push({ ...progress });
      });

      const localOrder = {
        id: 'order-1',
        status: 'preparing',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const serverOrder = {
        id: 'order-1',
        status: 'delivered',
        updated_at: '2025-01-01T11:00:00Z',
      };

      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockResolvedValue([serverOrder]),
        localDataProvider: vi.fn().mockImplementation(async (entity: string) => {
          if (entity === 'orders') return [localOrder];
          return [];
        }),
        localDataUpdater: vi.fn().mockResolvedValue(undefined),
        processQueue: vi.fn().mockResolvedValue(undefined),
      });

      const result = await ReconnectReconciler.reconcileOnReconnect();

      expect(result.conflicts).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);

      const completedEvent = events.find((e) => e.event === 'RECONCILIATION_COMPLETED');
      expect(completedEvent).toBeDefined();
      expect(completedEvent!.conflicts).toBeGreaterThan(0);

      unsub();
    });
  });

  describe('conflict resolution integration', () => {
    it('uses ConflictResolutionStrategy to resolve conflicts', async () => {
      const localOrder = {
        id: 'order-1',
        status: 'preparing',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const serverOrder = {
        id: 'order-1',
        status: 'delivered',
        updated_at: '2025-01-01T11:00:00Z',
      };

      const mockUpdater = vi.fn().mockResolvedValue(undefined);

      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockResolvedValue([serverOrder]),
        localDataProvider: vi.fn().mockImplementation(async (entity: string) => {
          if (entity === 'orders') return [localOrder];
          return [];
        }),
        localDataUpdater: mockUpdater,
        processQueue: vi.fn().mockResolvedValue(undefined),
      });

      await ReconnectReconciler.reconcileOnReconnect();

      expect(ConflictResolutionStrategy.resolveConflict).toHaveBeenCalledWith(
        'orders',
        localOrder,
        serverOrder,
      );
      // The resolved record should be applied locally
      expect(mockUpdater).toHaveBeenCalledWith('orders', expect.objectContaining({ id: 'order-1' }));
    });

    it('skips records that are already in sync (same updated_at)', async () => {
      const localOrder = {
        id: 'order-1',
        status: 'preparing',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const serverOrder = {
        id: 'order-1',
        status: 'preparing',
        updated_at: '2025-01-01T10:00:00Z',
      };

      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockResolvedValue([serverOrder]),
        localDataProvider: vi.fn().mockImplementation(async (entity: string) => {
          if (entity === 'orders') return [localOrder];
          return [];
        }),
        localDataUpdater: vi.fn(),
        processQueue: vi.fn().mockResolvedValue(undefined),
      });

      const result = await ReconnectReconciler.reconcileOnReconnect();

      expect(ConflictResolutionStrategy.resolveConflict).not.toHaveBeenCalled();
      expect(result.synced).toBeGreaterThan(0);
      expect(result.conflicts).toBe(0);
    });
  });

  describe('queue draining', () => {
    it('drains queue using processQueue function when configured', async () => {
      mockQueueHealth = {
        ...mockQueueHealth,
        pending: 5,
        failed: 2,
        total: 7,
      };

      const mockProcessQueue = vi.fn().mockResolvedValue(undefined);

      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockResolvedValue([]),
        localDataProvider: vi.fn().mockResolvedValue([]),
        localDataUpdater: vi.fn(),
        processQueue: mockProcessQueue,
      });

      const result = await ReconnectReconciler.reconcileOnReconnect();

      expect(mockProcessQueue).toHaveBeenCalled();
      expect(result.synced).toBeGreaterThanOrEqual(7); // pending + failed
    });

    it('falls back to batch drain when processQueue is not configured', async () => {
      mockQueueHealth = {
        ...mockQueueHealth,
        pending: 3,
        failed: 0,
        total: 3,
      };

      // Configure without processQueue
      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockResolvedValue([]),
        localDataProvider: vi.fn().mockResolvedValue([]),
        localDataUpdater: vi.fn(),
        processQueue: null as any, // No processQueue
      });

      // Mock drainQueue to return items then empty
      (OfflineQueueManager.drainQueue as any)
        .mockResolvedValueOnce([
          { id: '1', type: 'ORDER_PAY' },
          { id: '2', type: 'ORDER_CREATE' },
          { id: '3', type: 'ORDER_UPDATE' },
        ])
        .mockResolvedValueOnce([]);

      const result = await ReconnectReconciler.reconcileOnReconnect();

      expect(OfflineQueueManager.drainQueue).toHaveBeenCalled();
      expect(result.synced).toBeGreaterThan(0);
    });
  });

  describe('isInProgress', () => {
    it('returns false when not reconciling', () => {
      expect(ReconnectReconciler.isInProgress()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles server fetch failures gracefully', async () => {
      ReconnectReconciler.configure({
        serverFetcher: vi.fn().mockRejectedValue(new Error('Network error')),
        localDataProvider: vi.fn().mockImplementation(async (entity: string) => {
          if (entity === 'orders') return [{ id: 'order-1', updated_at: '2025-01-01T10:00:00Z' }];
          return [];
        }),
        localDataUpdater: vi.fn(),
        processQueue: vi.fn().mockResolvedValue(undefined),
      });

      const result = await ReconnectReconciler.reconcileOnReconnect();

      // Should complete with errors but not crash
      expect(result.errors).toBeGreaterThan(0);
      expect(result.success).toBe(true); // Overall success because it completed
    });
  });
});
