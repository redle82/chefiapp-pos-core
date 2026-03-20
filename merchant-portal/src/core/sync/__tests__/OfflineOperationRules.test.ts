// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock NetworkStateMachine
let mockNetworkState = 'ONLINE';

vi.mock('../NetworkStateMachine', () => ({
  NetworkStateMachine: {
    getState: vi.fn(() => mockNetworkState),
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

import { OfflineOperationRules, type OfflineAction } from '../OfflineOperationRules';

describe('OfflineOperationRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNetworkState = 'ONLINE';
  });

  describe('canOperate — when ONLINE', () => {
    it('allows all operations when online', () => {
      const allActions: OfflineAction[] = [
        'create_order', 'cash_payment', 'card_payment',
        'stripe_refund', 'send_email',
      ];

      for (const action of allActions) {
        expect(OfflineOperationRules.canOperate(action)).toBe(true);
      }
    });
  });

  describe('canOperate — when OFFLINE', () => {
    beforeEach(() => {
      mockNetworkState = 'OFFLINE';
    });

    it('allows cash payment offline', () => {
      expect(OfflineOperationRules.canOperate('cash_payment')).toBe(true);
    });

    it('blocks card payment offline', () => {
      expect(OfflineOperationRules.canOperate('card_payment')).toBe(false);
    });

    it('allows order creation offline', () => {
      expect(OfflineOperationRules.canOperate('create_order')).toBe(true);
    });

    it('blocks Stripe refund offline', () => {
      expect(OfflineOperationRules.canOperate('stripe_refund')).toBe(false);
    });

    it('blocks email sending offline', () => {
      expect(OfflineOperationRules.canOperate('send_email')).toBe(false);
    });

    it('allows printing offline', () => {
      expect(OfflineOperationRules.canOperate('print_receipt')).toBe(true);
    });

    it('allows clock in offline', () => {
      expect(OfflineOperationRules.canOperate('clock_in')).toBe(true);
    });

    it('allows clock out offline', () => {
      expect(OfflineOperationRules.canOperate('clock_out')).toBe(true);
    });

    it('blocks MBWay payment offline', () => {
      expect(OfflineOperationRules.canOperate('mbway_payment')).toBe(false);
    });

    it('blocks PIX payment offline', () => {
      expect(OfflineOperationRules.canOperate('pix_payment')).toBe(false);
    });

    it('allows adding items offline', () => {
      expect(OfflineOperationRules.canOperate('add_items')).toBe(true);
    });

    it('allows send to kitchen offline', () => {
      expect(OfflineOperationRules.canOperate('send_to_kitchen')).toBe(true);
    });

    it('blocks inventory sync offline', () => {
      expect(OfflineOperationRules.canOperate('sync_inventory')).toBe(false);
    });

    it('blocks report export offline', () => {
      expect(OfflineOperationRules.canOperate('export_report')).toBe(false);
    });

    it('blocks delivery update offline', () => {
      expect(OfflineOperationRules.canOperate('delivery_update')).toBe(false);
    });
  });

  describe('canOperate — when DEGRADED', () => {
    beforeEach(() => {
      mockNetworkState = 'DEGRADED';
    });

    it('blocks card payment in degraded mode', () => {
      expect(OfflineOperationRules.canOperate('card_payment')).toBe(false);
    });

    it('allows cash payment in degraded mode', () => {
      expect(OfflineOperationRules.canOperate('cash_payment')).toBe(true);
    });

    it('allows order creation in degraded mode', () => {
      expect(OfflineOperationRules.canOperate('create_order')).toBe(true);
    });
  });

  describe('canOperate — when RECONNECTING', () => {
    it('allows all operations when reconnecting', () => {
      mockNetworkState = 'RECONNECTING';

      expect(OfflineOperationRules.canOperate('card_payment')).toBe(true);
      expect(OfflineOperationRules.canOperate('cash_payment')).toBe(true);
      expect(OfflineOperationRules.canOperate('stripe_refund')).toBe(true);
    });
  });

  describe('canOperateOffline', () => {
    it('returns true for actions allowed offline regardless of current state', () => {
      // Even when online, this reports offline capability
      expect(OfflineOperationRules.canOperateOffline('cash_payment')).toBe(true);
      expect(OfflineOperationRules.canOperateOffline('create_order')).toBe(true);
      expect(OfflineOperationRules.canOperateOffline('print_receipt')).toBe(true);
    });

    it('returns false for actions blocked offline regardless of current state', () => {
      expect(OfflineOperationRules.canOperateOffline('card_payment')).toBe(false);
      expect(OfflineOperationRules.canOperateOffline('stripe_refund')).toBe(false);
      expect(OfflineOperationRules.canOperateOffline('send_email')).toBe(false);
    });
  });

  describe('getOfflineCapabilities', () => {
    it('returns correct lists of allowed and blocked actions', () => {
      const { allowed, blocked } = OfflineOperationRules.getOfflineCapabilities();

      const allowedActions = allowed.map((c) => c.action);
      const blockedActions = blocked.map((c) => c.action);

      // Allowed
      expect(allowedActions).toContain('create_order');
      expect(allowedActions).toContain('cash_payment');
      expect(allowedActions).toContain('print_receipt');
      expect(allowedActions).toContain('clock_in');
      expect(allowedActions).toContain('clock_out');
      expect(allowedActions).toContain('add_items');
      expect(allowedActions).toContain('remove_items');
      expect(allowedActions).toContain('send_to_kitchen');
      expect(allowedActions).toContain('record_waste');

      // Blocked
      expect(blockedActions).toContain('card_payment');
      expect(blockedActions).toContain('mbway_payment');
      expect(blockedActions).toContain('pix_payment');
      expect(blockedActions).toContain('stripe_refund');
      expect(blockedActions).toContain('send_email');
      expect(blockedActions).toContain('delivery_update');
      expect(blockedActions).toContain('sync_inventory');
      expect(blockedActions).toContain('export_report');

      // No overlap
      for (const a of allowedActions) {
        expect(blockedActions).not.toContain(a);
      }
    });

    it('every capability has a reason string', () => {
      const { allowed, blocked } = OfflineOperationRules.getOfflineCapabilities();
      const all = [...allowed, ...blocked];

      for (const cap of all) {
        expect(cap.reason).toBeTruthy();
        expect(typeof cap.reason).toBe('string');
      }
    });
  });

  describe('getCapability', () => {
    it('returns full capability info for known action', () => {
      const cap = OfflineOperationRules.getCapability('cash_payment');

      expect(cap.action).toBe('cash_payment');
      expect(cap.allowed).toBe(true);
      expect(cap.queueable).toBe(true);
      expect(cap.reason).toBeTruthy();
    });

    it('returns blocked for unknown action', () => {
      const cap = OfflineOperationRules.getCapability('totally_unknown' as any);

      expect(cap.allowed).toBe(false);
      expect(cap.reason).toBe('Unknown action');
    });
  });

  describe('canProcessPayment', () => {
    it('allows all payment methods when online', () => {
      mockNetworkState = 'ONLINE';

      expect(OfflineOperationRules.canProcessPayment('cash')).toBe(true);
      expect(OfflineOperationRules.canProcessPayment('card')).toBe(true);
      expect(OfflineOperationRules.canProcessPayment('mbway')).toBe(true);
    });

    it('allows cash payment when offline', () => {
      mockNetworkState = 'OFFLINE';

      expect(OfflineOperationRules.canProcessPayment('cash')).toBe(true);
      expect(OfflineOperationRules.canProcessPayment('dinheiro')).toBe(true);
      expect(OfflineOperationRules.canProcessPayment('numerario')).toBe(true);
    });

    it('blocks card payment when offline', () => {
      mockNetworkState = 'OFFLINE';

      expect(OfflineOperationRules.canProcessPayment('card')).toBe(false);
      expect(OfflineOperationRules.canProcessPayment('mbway')).toBe(false);
    });

    it('handles case-insensitive and trimmed input', () => {
      mockNetworkState = 'OFFLINE';

      expect(OfflineOperationRules.canProcessPayment('  Cash  ')).toBe(true);
      expect(OfflineOperationRules.canProcessPayment('DINHEIRO')).toBe(true);
    });
  });

  describe('getBlockedReason', () => {
    it('returns null when action is allowed', () => {
      mockNetworkState = 'ONLINE';
      expect(OfflineOperationRules.getBlockedReason('card_payment')).toBeNull();
    });

    it('returns reason string when action is blocked', () => {
      mockNetworkState = 'OFFLINE';
      const reason = OfflineOperationRules.getBlockedReason('card_payment');
      expect(reason).toBeTruthy();
      expect(typeof reason).toBe('string');
    });
  });
});
