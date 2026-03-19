/**
 * NotificationChannels — Role-based notification channel system.
 *
 * Defines notification channels per staff role (KITCHEN, WAITER, MANAGER, CASHIER)
 * and allows subscribing/notifying operators on specific channels.
 *
 * Uses PushNotificationService for actual delivery.
 * Uses TPVCentralEvents for integration with existing event bus.
 */

import { Logger } from "../logger";
import {
  pushNotificationService,
  type StoredNotification,
} from "./PushNotificationService";

/* ── Channel Definitions ──────────────────────────────────────────────── */

export type StaffRole = "KITCHEN" | "WAITER" | "MANAGER" | "CASHIER" | "OWNER";

export type NotificationChannelId =
  // Kitchen channels
  | "kitchen.new_order"
  | "kitchen.order_modified"
  | "kitchen.rush_alert"
  // Waiter channels
  | "waiter.order_ready"
  | "waiter.table_needs_attention"
  | "waiter.new_reservation"
  // Manager channels
  | "manager.low_stock"
  | "manager.shift_change"
  | "manager.daily_summary"
  | "manager.dispute_alert"
  // Cashier channels
  | "cashier.payment_failed"
  | "cashier.refund_requested";

export interface NotificationChannel {
  id: NotificationChannelId;
  /** i18n key for the channel label */
  labelKey: string;
  /** i18n key for the channel description */
  descriptionKey: string;
  /** Default icon for notifications on this channel */
  icon: string;
  /** Roles that should see this channel */
  roles: StaffRole[];
  /** Default enabled state */
  defaultEnabled: boolean;
}

/** Full channel catalog */
export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  // ── Kitchen ────────────────────────────────────────────────────
  {
    id: "kitchen.new_order",
    labelKey: "notifications.channels.newOrder",
    descriptionKey: "notifications.channels.newOrderDesc",
    icon: "\uD83C\uDF73", // cooking
    roles: ["KITCHEN"],
    defaultEnabled: true,
  },
  {
    id: "kitchen.order_modified",
    labelKey: "notifications.channels.orderModified",
    descriptionKey: "notifications.channels.orderModifiedDesc",
    icon: "\u270F\uFE0F", // pencil
    roles: ["KITCHEN"],
    defaultEnabled: true,
  },
  {
    id: "kitchen.rush_alert",
    labelKey: "notifications.channels.rushAlert",
    descriptionKey: "notifications.channels.rushAlertDesc",
    icon: "\uD83D\uDD25", // fire
    roles: ["KITCHEN", "MANAGER", "OWNER"],
    defaultEnabled: true,
  },
  // ── Waiter ─────────────────────────────────────────────────────
  {
    id: "waiter.order_ready",
    labelKey: "notifications.channels.orderReady",
    descriptionKey: "notifications.channels.orderReadyDesc",
    icon: "\u2705", // check
    roles: ["WAITER"],
    defaultEnabled: true,
  },
  {
    id: "waiter.table_needs_attention",
    labelKey: "notifications.channels.tableAttention",
    descriptionKey: "notifications.channels.tableAttentionDesc",
    icon: "\uD83C\uDF7D\uFE0F", // plate
    roles: ["WAITER", "MANAGER", "OWNER"],
    defaultEnabled: true,
  },
  {
    id: "waiter.new_reservation",
    labelKey: "notifications.channels.newReservation",
    descriptionKey: "notifications.channels.newReservationDesc",
    icon: "\uD83D\uDCC5", // calendar
    roles: ["WAITER", "MANAGER", "OWNER"],
    defaultEnabled: false,
  },
  // ── Manager ────────────────────────────────────────────────────
  {
    id: "manager.low_stock",
    labelKey: "notifications.channels.lowStock",
    descriptionKey: "notifications.channels.lowStockDesc",
    icon: "\uD83D\uDCE6", // package
    roles: ["MANAGER", "OWNER"],
    defaultEnabled: true,
  },
  {
    id: "manager.shift_change",
    labelKey: "notifications.channels.shiftChange",
    descriptionKey: "notifications.channels.shiftChangeDesc",
    icon: "\uD83D\uDD52", // clock
    roles: ["MANAGER", "OWNER"],
    defaultEnabled: true,
  },
  {
    id: "manager.daily_summary",
    labelKey: "notifications.channels.dailySummary",
    descriptionKey: "notifications.channels.dailySummaryDesc",
    icon: "\uD83D\uDCCA", // chart
    roles: ["MANAGER", "OWNER"],
    defaultEnabled: false,
  },
  {
    id: "manager.dispute_alert",
    labelKey: "notifications.channels.disputeAlert",
    descriptionKey: "notifications.channels.disputeAlertDesc",
    icon: "\u26A0\uFE0F", // warning
    roles: ["MANAGER", "OWNER"],
    defaultEnabled: true,
  },
  // ── Cashier ────────────────────────────────────────────────────
  {
    id: "cashier.payment_failed",
    labelKey: "notifications.channels.paymentFailed",
    descriptionKey: "notifications.channels.paymentFailedDesc",
    icon: "\u274C", // cross
    roles: ["CASHIER", "MANAGER", "OWNER"],
    defaultEnabled: true,
  },
  {
    id: "cashier.refund_requested",
    labelKey: "notifications.channels.refundRequested",
    descriptionKey: "notifications.channels.refundRequestedDesc",
    icon: "\uD83D\uDCB8", // money wings
    roles: ["CASHIER", "MANAGER", "OWNER"],
    defaultEnabled: true,
  },
];

/* ── Channel Registry ─────────────────────────────────────────────────── */

/** In-memory subscriber registry: channelId -> set of operatorIds */
const channelSubscribers = new Map<NotificationChannelId, Set<string>>();

/**
 * Returns channels available for a given role.
 * OWNER sees all channels.
 */
export function getChannelsForRole(role: StaffRole): NotificationChannel[] {
  if (role === "OWNER") return [...NOTIFICATION_CHANNELS];
  return NOTIFICATION_CHANNELS.filter((ch) => ch.roles.includes(role));
}

/**
 * Subscribe an operator to a specific channel.
 */
export function subscribeToChannel(
  channelId: NotificationChannelId,
  operatorId: string,
): void {
  if (!channelSubscribers.has(channelId)) {
    channelSubscribers.set(channelId, new Set());
  }
  channelSubscribers.get(channelId)!.add(operatorId);
  Logger.debug(
    `[NotificationChannels] ${operatorId} subscribed to ${channelId}`,
  );
}

/**
 * Unsubscribe an operator from a specific channel.
 */
export function unsubscribeFromChannel(
  channelId: NotificationChannelId,
  operatorId: string,
): void {
  channelSubscribers.get(channelId)?.delete(operatorId);
}

/**
 * Subscribe an operator to all channels relevant to their role.
 */
export function subscribeToRoleChannels(
  role: StaffRole,
  operatorId: string,
): void {
  const channels = getChannelsForRole(role);
  for (const ch of channels) {
    if (ch.defaultEnabled) {
      subscribeToChannel(ch.id, operatorId);
    }
  }
  Logger.info(
    `[NotificationChannels] ${operatorId} subscribed to ${role} channels`,
  );
}

/**
 * Unsubscribe an operator from all channels.
 */
export function unsubscribeFromAll(operatorId: string): void {
  for (const [, subs] of channelSubscribers) {
    subs.delete(operatorId);
  }
  Logger.info(
    `[NotificationChannels] ${operatorId} unsubscribed from all channels`,
  );
}

/* ── Notification Dispatch ────────────────────────────────────────────── */

export interface ChannelNotificationPayload {
  title: string;
  body: string;
  /** Additional data attached to the notification */
  data?: Record<string, unknown>;
  /** Override sound for this notification */
  playSound?: boolean;
  /** Override vibration for this notification */
  vibrate?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Sends a notification to all subscribers of a channel.
 * Respects per-channel preferences.
 *
 * In the current single-tab architecture, this sends the notification
 * to the local operator if they are subscribed to the channel.
 */
export function notifyChannel(
  channelId: NotificationChannelId,
  payload: ChannelNotificationPayload,
): StoredNotification | null {
  // Check if the current operator has this channel enabled
  if (!pushNotificationService.isChannelEnabled(channelId)) {
    Logger.debug(
      `[NotificationChannels] Channel ${channelId} disabled by preferences`,
    );
    return null;
  }

  const channel = NOTIFICATION_CHANNELS.find((ch) => ch.id === channelId);
  if (!channel) {
    Logger.warn(`[NotificationChannels] Unknown channel: ${channelId}`);
    return null;
  }

  // Check subscription
  const sub = pushNotificationService.getSubscription();
  if (!sub) {
    Logger.debug(
      "[NotificationChannels] No active subscription, skipping notification",
    );
    return null;
  }

  const subscribers = channelSubscribers.get(channelId);
  if (!subscribers?.has(sub.operatorId)) {
    Logger.debug(
      `[NotificationChannels] Operator ${sub.operatorId} not subscribed to ${channelId}`,
    );
    return null;
  }

  // Dispatch via PushNotificationService
  return pushNotificationService.sendLocalNotification(
    payload.title,
    payload.body,
    {
      tag: channelId,
      data: { channelId, ...payload.data },
      playSound: payload.playSound,
      vibrate: payload.vibrate,
      onClick: payload.onClick,
    },
  );
}

/* ── Integration Helpers ──────────────────────────────────────────────── */

/**
 * Convenience: notify when an order is ready for pickup.
 * Targets waiter.order_ready channel.
 */
export function notifyOrderReady(
  orderId: string,
  tableNumber?: number,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): StoredNotification | null {
  const title = t
    ? t("notifications.orderReady")
    : "Order Ready";
  const body = t
    ? t("notifications.orderReadyBody", { orderId, table: tableNumber ?? "-" })
    : `Order #${orderId} is ready${tableNumber ? ` (Table ${tableNumber})` : ""}`;

  return notifyChannel("waiter.order_ready", {
    title,
    body,
    data: { orderId, tableNumber },
  });
}

/**
 * Convenience: notify when a new order arrives.
 * Targets kitchen.new_order channel.
 */
export function notifyNewOrder(
  orderId: string,
  source: string,
  itemCount: number,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): StoredNotification | null {
  const title = t
    ? t("notifications.newOrder")
    : "New Order";
  const body = t
    ? t("notifications.newOrderBody", { orderId, source, count: itemCount })
    : `Order #${orderId} from ${source} (${itemCount} items)`;

  return notifyChannel("kitchen.new_order", {
    title,
    body,
    data: { orderId, source, itemCount },
  });
}

/**
 * Convenience: notify when stock is low.
 * Targets manager.low_stock channel.
 */
export function notifyLowStock(
  productName: string,
  currentStock: number,
  threshold: number,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): StoredNotification | null {
  const title = t
    ? t("notifications.lowStock")
    : "Low Stock Alert";
  const body = t
    ? t("notifications.lowStockBody", { product: productName, current: currentStock, threshold })
    : `${productName}: ${currentStock} remaining (threshold: ${threshold})`;

  return notifyChannel("manager.low_stock", {
    title,
    body,
    data: { productName, currentStock, threshold },
  });
}

/**
 * Convenience: notify table needs attention.
 * Targets waiter.table_needs_attention channel.
 */
export function notifyTableAttention(
  tableNumber: number,
  reason: string,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): StoredNotification | null {
  const title = t
    ? t("notifications.tableAttention")
    : "Table Needs Attention";
  const body = t
    ? t("notifications.tableAttentionBody", { table: tableNumber, reason })
    : `Table ${tableNumber}: ${reason}`;

  return notifyChannel("waiter.table_needs_attention", {
    title,
    body,
    data: { tableNumber, reason },
  });
}

/**
 * Convenience: notify shift reminder.
 * Targets manager.shift_change channel.
 */
export function notifyShiftReminder(
  message: string,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): StoredNotification | null {
  const title = t
    ? t("notifications.shiftReminder")
    : "Shift Reminder";

  return notifyChannel("manager.shift_change", {
    title,
    body: message,
    data: { type: "shift_reminder" },
  });
}
