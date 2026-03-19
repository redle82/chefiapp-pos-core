/**
 * Notifications module — barrel export.
 *
 * Provides:
 * - PushNotificationService: browser-native push notifications
 * - NotificationChannels: role-based channel system with integration helpers
 */

export {
  pushNotificationService,
  type PermissionStatus,
  type PushNotificationOptions,
  type StoredNotification,
  type NotificationPreferences,
} from "./PushNotificationService";

export {
  type StaffRole,
  type NotificationChannelId,
  type NotificationChannel,
  NOTIFICATION_CHANNELS,
  getChannelsForRole,
  subscribeToChannel,
  unsubscribeFromChannel,
  subscribeToRoleChannels,
  unsubscribeFromAll,
  notifyChannel,
  notifyOrderReady,
  notifyNewOrder,
  notifyLowStock,
  notifyTableAttention,
  notifyShiftReminder,
} from "./NotificationChannels";
