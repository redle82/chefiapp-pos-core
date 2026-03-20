/**
 * OfflineOperationRules — Defines what CAN and CANNOT happen offline in POS.
 *
 * Critical for user experience: operators must know immediately if an action
 * requires network. No surprises, no silent failures.
 *
 * Rules:
 *   ALLOWED offline: create orders, add items, send to kitchen (queued),
 *     cash payments, print receipts, clock in/out, record waste
 *   BLOCKED offline: card payments, MBWay/PIX, Stripe refunds,
 *     real-time delivery updates, customer email sending
 */

import { Logger } from '../logger';
import { NetworkStateMachine } from './NetworkStateMachine';

// ─── Types ───────────────────────────────────────────────────────────────────

export type OfflineAction =
  // Allowed offline
  | 'create_order'
  | 'add_items'
  | 'remove_items'
  | 'update_item_qty'
  | 'send_to_kitchen'
  | 'cash_payment'
  | 'print_receipt'
  | 'clock_in'
  | 'clock_out'
  | 'record_waste'
  | 'close_order'
  | 'cancel_order'
  | 'open_cash_register'
  | 'close_cash_register'
  // Blocked offline
  | 'card_payment'
  | 'mbway_payment'
  | 'pix_payment'
  | 'stripe_refund'
  | 'delivery_update'
  | 'send_email'
  | 'sync_inventory'
  | 'export_report';

export interface OfflineCapability {
  action: OfflineAction;
  allowed: boolean;
  reason: string;
  queueable: boolean; // If true, action is queued for sync when online
}

// ─── Rules ───────────────────────────────────────────────────────────────────

const OFFLINE_RULES: Record<OfflineAction, Omit<OfflineCapability, 'action'>> = {
  // ─── ALLOWED OFFLINE ─────────────────────────────────────
  create_order: {
    allowed: true,
    reason: 'Orders are stored locally and synced when online',
    queueable: true,
  },
  add_items: {
    allowed: true,
    reason: 'Item additions are stored locally and synced when online',
    queueable: true,
  },
  remove_items: {
    allowed: true,
    reason: 'Item removals are stored locally and synced when online',
    queueable: true,
  },
  update_item_qty: {
    allowed: true,
    reason: 'Quantity updates are stored locally and synced when online',
    queueable: true,
  },
  send_to_kitchen: {
    allowed: true,
    reason: 'Kitchen orders are queued locally for sync',
    queueable: true,
  },
  cash_payment: {
    allowed: true,
    reason: 'Cash payments are recorded locally with timestamp',
    queueable: true,
  },
  print_receipt: {
    allowed: true,
    reason: 'Local ESC/POS printing does not require network',
    queueable: false,
  },
  clock_in: {
    allowed: true,
    reason: 'Clock-in recorded locally with timestamp, synced later',
    queueable: true,
  },
  clock_out: {
    allowed: true,
    reason: 'Clock-out recorded locally with timestamp, synced later',
    queueable: true,
  },
  record_waste: {
    allowed: true,
    reason: 'Waste records are stored locally and synced when online',
    queueable: true,
  },
  close_order: {
    allowed: true,
    reason: 'Order closing is stored locally and synced when online',
    queueable: true,
  },
  cancel_order: {
    allowed: true,
    reason: 'Order cancellation is stored locally and synced when online',
    queueable: true,
  },
  open_cash_register: {
    allowed: true,
    reason: 'Cash register opening is recorded locally',
    queueable: true,
  },
  close_cash_register: {
    allowed: true,
    reason: 'Cash register closing is recorded locally with totals',
    queueable: true,
  },

  // ─── BLOCKED OFFLINE ─────────────────────────────────────
  card_payment: {
    allowed: false,
    reason: 'Card payments require a live connection to the payment gateway',
    queueable: false,
  },
  mbway_payment: {
    allowed: false,
    reason: 'MBWay payments require a live connection to the payment gateway',
    queueable: false,
  },
  pix_payment: {
    allowed: false,
    reason: 'PIX payments require a live connection to the payment gateway',
    queueable: false,
  },
  stripe_refund: {
    allowed: false,
    reason: 'Refunds require a live connection to Stripe',
    queueable: false,
  },
  delivery_update: {
    allowed: false,
    reason: 'Real-time delivery updates require an active network connection',
    queueable: false,
  },
  send_email: {
    allowed: false,
    reason: 'Email sending requires an active network connection',
    queueable: false,
  },
  sync_inventory: {
    allowed: false,
    reason: 'Inventory sync requires server communication to prevent conflicts',
    queueable: false,
  },
  export_report: {
    allowed: false,
    reason: 'Report exports require server-side data aggregation',
    queueable: false,
  },
};

// ─── Service ─────────────────────────────────────────────────────────────────

class OfflineOperationRulesClass {
  /**
   * Check if an action can be performed in the current network state.
   * When online, everything is allowed. When offline, only allowed actions work.
   */
  canOperate(action: OfflineAction): boolean {
    const networkState = NetworkStateMachine.getState();

    // When online or reconnecting, everything is allowed
    if (networkState === 'ONLINE' || networkState === 'RECONNECTING') {
      return true;
    }

    // When offline or degraded, check the rules
    const rule = OFFLINE_RULES[action];
    if (!rule) {
      Logger.warn(
        `[OfflineOperationRules] Unknown action '${action}', blocking by default`,
      );
      return false;
    }

    return rule.allowed;
  }

  /**
   * Check if an action can operate offline (regardless of current network state).
   * Useful for UI to show/hide offline indicators preemptively.
   */
  canOperateOffline(action: OfflineAction): boolean {
    const rule = OFFLINE_RULES[action];
    return rule?.allowed ?? false;
  }

  /**
   * Get the full capability info for an action.
   */
  getCapability(action: OfflineAction): OfflineCapability {
    const rule = OFFLINE_RULES[action];
    if (!rule) {
      return {
        action,
        allowed: false,
        reason: 'Unknown action',
        queueable: false,
      };
    }
    return { action, ...rule };
  }

  /**
   * Get all capabilities, split into allowed and blocked.
   */
  getOfflineCapabilities(): {
    allowed: OfflineCapability[];
    blocked: OfflineCapability[];
  } {
    const allowed: OfflineCapability[] = [];
    const blocked: OfflineCapability[] = [];

    for (const [action, rule] of Object.entries(OFFLINE_RULES)) {
      const capability: OfflineCapability = {
        action: action as OfflineAction,
        ...rule,
      };
      if (rule.allowed) {
        allowed.push(capability);
      } else {
        blocked.push(capability);
      }
    }

    return { allowed, blocked };
  }

  /**
   * Check if a payment method can be used in the current network state.
   * Convenience method for the payment flow.
   */
  canProcessPayment(method: string): boolean {
    const networkState = NetworkStateMachine.getState();

    // Online: all methods work
    if (networkState === 'ONLINE' || networkState === 'RECONNECTING') {
      return true;
    }

    // Offline/degraded: only cash
    const offlinePaymentMethods = new Set(['cash', 'dinheiro', 'numerario']);
    const normalizedMethod = method.toLowerCase().trim();

    if (offlinePaymentMethods.has(normalizedMethod)) {
      return true;
    }

    Logger.info(
      `[OfflineOperationRules] Payment method '${method}' blocked: network is ${networkState}`,
    );
    return false;
  }

  /**
   * Get a user-friendly message explaining why an action is blocked.
   */
  getBlockedReason(action: OfflineAction): string | null {
    if (this.canOperate(action)) return null;

    const rule = OFFLINE_RULES[action];
    return rule?.reason ?? 'This action requires a network connection.';
  }
}

export const OfflineOperationRules = new OfflineOperationRulesClass();
