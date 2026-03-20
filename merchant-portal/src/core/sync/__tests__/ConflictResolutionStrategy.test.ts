// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConflictResolutionStrategy,
  type EntityType,
  type VersionedRecord,
} from '../ConflictResolutionStrategy';

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

describe('ConflictResolutionStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ConflictResolutionStrategy.clearConflictLog();
  });

  describe('getStrategy', () => {
    it('returns server_wins for orders', () => {
      expect(ConflictResolutionStrategy.getStrategy('orders')).toBe('server_wins');
    });

    it('returns last_write_wins for tables', () => {
      expect(ConflictResolutionStrategy.getStrategy('tables')).toBe('last_write_wins');
    });

    it('returns merge for shifts', () => {
      expect(ConflictResolutionStrategy.getStrategy('shifts')).toBe('merge');
    });

    it('returns client_wins for receipts', () => {
      expect(ConflictResolutionStrategy.getStrategy('receipts')).toBe('client_wins');
    });

    it('returns server_wins for stock', () => {
      expect(ConflictResolutionStrategy.getStrategy('stock')).toBe('server_wins');
    });

    it('returns server_wins for settings', () => {
      expect(ConflictResolutionStrategy.getStrategy('settings')).toBe('server_wins');
    });
  });

  describe('resolveConflict — server_wins', () => {
    it('uses server version for orders', () => {
      const local: VersionedRecord = {
        id: 'order-1',
        status: 'preparing',
        total_cents: 1500,
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'order-1',
        status: 'delivered',
        total_cents: 1800,
        updated_at: '2025-01-01T11:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('orders', local, server);

      expect(result.status).toBe('delivered');
      expect(result.total_cents).toBe(1800);
      expect(result.id).toBe('order-1');
    });

    it('uses server version for stock', () => {
      const local: VersionedRecord = {
        id: 'stock-1',
        quantity: 10,
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'stock-1',
        quantity: 5,
        updated_at: '2025-01-01T11:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('stock', local, server);

      expect(result.quantity).toBe(5);
    });
  });

  describe('resolveConflict — client_wins', () => {
    it('uses local version for receipts', () => {
      const local: VersionedRecord = {
        id: 'receipt-1',
        printed: true,
        receipt_data: 'local-printed-content',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'receipt-1',
        printed: false,
        receipt_data: 'server-placeholder',
        updated_at: '2025-01-01T11:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('receipts', local, server);

      expect(result.printed).toBe(true);
      expect(result.receipt_data).toBe('local-printed-content');
    });
  });

  describe('resolveConflict — last_write_wins', () => {
    it('picks server when server has later timestamp', () => {
      const local: VersionedRecord = {
        id: 'table-1',
        status: 'occupied',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'table-1',
        status: 'available',
        updated_at: '2025-01-01T11:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('tables', local, server);

      expect(result.status).toBe('available');
    });

    it('picks local when local has later timestamp', () => {
      const local: VersionedRecord = {
        id: 'table-1',
        status: 'occupied',
        updated_at: '2025-01-01T12:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'table-1',
        status: 'available',
        updated_at: '2025-01-01T11:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('tables', local, server);

      expect(result.status).toBe('occupied');
    });

    it('picks local when timestamps are equal (local >= server)', () => {
      const local: VersionedRecord = {
        id: 'table-2',
        status: 'reserved',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'table-2',
        status: 'available',
        updated_at: '2025-01-01T10:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('tables', local, server);

      expect(result.status).toBe('reserved');
    });
  });

  describe('resolveConflict — merge (shifts)', () => {
    it('concatenates break arrays from both versions', () => {
      const local: VersionedRecord = {
        id: 'shift-1',
        clock_in: '2025-01-01T08:00:00Z',
        breaks: [{ id: 'break-local-1', start: '10:00', end: '10:15' }],
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'shift-1',
        clock_in: '2025-01-01T08:00:00Z',
        breaks: [{ id: 'break-server-1', start: '12:00', end: '12:30' }],
        updated_at: '2025-01-01T12:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('shifts', local, server);

      const breaks = result.breaks as Array<{ id: string }>;
      expect(breaks).toHaveLength(2);
      expect(breaks.map((b) => b.id)).toContain('break-local-1');
      expect(breaks.map((b) => b.id)).toContain('break-server-1');
    });

    it('deduplicates breaks by id', () => {
      const local: VersionedRecord = {
        id: 'shift-1',
        breaks: [
          { id: 'break-1', start: '10:00', end: '10:15' },
          { id: 'break-2', start: '14:00', end: '14:15' },
        ],
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'shift-1',
        breaks: [
          { id: 'break-1', start: '10:00', end: '10:15' },
          { id: 'break-3', start: '16:00', end: '16:15' },
        ],
        updated_at: '2025-01-01T12:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('shifts', local, server);

      const breaks = result.breaks as Array<{ id: string }>;
      // Server has break-1 and break-3; local adds break-2 (break-1 is a duplicate)
      expect(breaks).toHaveLength(3);
      const breakIds = breaks.map((b) => b.id);
      expect(breakIds).toContain('break-1');
      expect(breakIds).toContain('break-2');
      expect(breakIds).toContain('break-3');
    });

    it('keeps locally-added fields that server does not have', () => {
      const local: VersionedRecord = {
        id: 'shift-1',
        clock_in: '2025-01-01T08:00:00Z',
        local_notes: 'Something the operator typed offline',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'shift-1',
        clock_in: '2025-01-01T08:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('shifts', local, server);

      expect(result.local_notes).toBe('Something the operator typed offline');
    });

    it('for scalar conflicts in merge mode, server wins', () => {
      const local: VersionedRecord = {
        id: 'shift-1',
        clock_in: '2025-01-01T08:00:00Z',
        clock_out: '2025-01-01T17:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'shift-1',
        clock_in: '2025-01-01T08:00:00Z',
        clock_out: '2025-01-01T18:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      };

      const result = ConflictResolutionStrategy.resolveConflict('shifts', local, server);

      // Server wins on scalar conflict
      expect(result.clock_out).toBe('2025-01-01T18:00:00Z');
    });
  });

  describe('conflict audit trail', () => {
    it('logs conflicts to the audit trail', () => {
      const local: VersionedRecord = {
        id: 'order-1',
        status: 'preparing',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'order-1',
        status: 'delivered',
        updated_at: '2025-01-01T11:00:00Z',
      };

      ConflictResolutionStrategy.resolveConflict('orders', local, server);

      const log = ConflictResolutionStrategy.getConflictLog();
      expect(log.length).toBeGreaterThan(0);

      const statusConflict = log.find((r) => r.field === 'status');
      expect(statusConflict).toBeDefined();
      expect(statusConflict!.entity).toBe('orders');
      expect(statusConflict!.entityId).toBe('order-1');
      expect(statusConflict!.localValue).toBe('preparing');
      expect(statusConflict!.serverValue).toBe('delivered');
      expect(statusConflict!.resolution).toBe('server_wins');
    });

    it('getConflictsForEntity filters correctly', () => {
      const local: VersionedRecord = {
        id: 'order-1',
        status: 'x',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'order-1',
        status: 'y',
        updated_at: '2025-01-01T11:00:00Z',
      };
      ConflictResolutionStrategy.resolveConflict('orders', local, server);

      const conflicts = ConflictResolutionStrategy.getConflictsForEntity('orders', 'order-1');
      expect(conflicts.length).toBeGreaterThan(0);

      const unrelated = ConflictResolutionStrategy.getConflictsForEntity('tables', 'table-99');
      expect(unrelated.length).toBe(0);
    });

    it('clearConflictLog empties the log', () => {
      const local: VersionedRecord = {
        id: 'x',
        status: 'a',
        updated_at: '2025-01-01T10:00:00Z',
      };
      const server: VersionedRecord = {
        id: 'x',
        status: 'b',
        updated_at: '2025-01-01T11:00:00Z',
      };
      ConflictResolutionStrategy.resolveConflict('orders', local, server);
      expect(ConflictResolutionStrategy.getConflictLog().length).toBeGreaterThan(0);

      ConflictResolutionStrategy.clearConflictLog();
      expect(ConflictResolutionStrategy.getConflictLog().length).toBe(0);
    });
  });
});
