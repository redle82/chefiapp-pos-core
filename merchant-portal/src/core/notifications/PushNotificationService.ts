/**
 * PushNotificationService — Browser-native push notifications for operational alerts.
 *
 * Uses the Notification API (no FCM dependency). Supports:
 * - Permission management (request, check status)
 * - Local notifications with sound and vibration
 * - Subscribe/unsubscribe per operator and role
 * - Notification history persisted in localStorage
 *
 * IMPORTANT: This is a browser-only service. Sound playback uses AudioContext
 * to generate a short bell tone (no external audio files needed).
 */

import { Logger } from "../logger";

/* ── Types ────────────────────────────────────────────────────────────── */

export type PermissionStatus = "granted" | "denied" | "default";

export interface PushNotificationOptions {
  /** Icon URL for the notification */
  icon?: string;
  /** Tag to replace existing notifications of same type */
  tag?: string;
  /** Additional data payload */
  data?: Record<string, unknown>;
  /** Whether to play a sound (respects user preference) */
  playSound?: boolean;
  /** Whether to vibrate on mobile (respects user preference) */
  vibrate?: boolean;
  /** Auto-close after ms (default: 8000) */
  autoCloseMs?: number;
  /** Click callback */
  onClick?: () => void;
}

export interface StoredNotification {
  id: string;
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
  timestamp: number;
  read: boolean;
}

interface SubscriptionInfo {
  restaurantId: string;
  operatorId: string;
  role: string;
  subscribedAt: number;
}

/* ── Constants ────────────────────────────────────────────────────────── */

const STORAGE_KEY_NOTIFICATIONS = "chefiapp_notifications";
const STORAGE_KEY_SUBSCRIPTION = "chefiapp_push_subscription";
const STORAGE_KEY_PREFERENCES = "chefiapp_notification_prefs";
const MAX_STORED_NOTIFICATIONS = 50;
const DEFAULT_AUTO_CLOSE_MS = 8_000;

/* ── Preferences ──────────────────────────────────────────────────────── */

export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  /** Per-channel enable/disable overrides */
  channelOverrides: Record<string, boolean>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  vibrateEnabled: true,
  channelOverrides: {},
};

/* ── Service ──────────────────────────────────────────────────────────── */

class PushNotificationServiceImpl {
  private subscription: SubscriptionInfo | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.loadSubscription();
  }

  /* ── Permission ───────────────────────────────────────────────── */

  /**
   * Returns the current notification permission status.
   */
  getPermissionStatus(): PermissionStatus {
    if (typeof Notification === "undefined") return "denied";
    return Notification.permission as PermissionStatus;
  }

  /**
   * Requests notification permission from the user.
   * Returns the resulting permission status.
   */
  async requestPermission(): Promise<PermissionStatus> {
    if (typeof Notification === "undefined") {
      Logger.warn("[PushNotification] Notification API not available");
      return "denied";
    }

    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";

    try {
      const result = await Notification.requestPermission();
      Logger.info(`[PushNotification] Permission result: ${result}`);
      return result as PermissionStatus;
    } catch (err) {
      Logger.error("[PushNotification] Error requesting permission:", err);
      return "denied";
    }
  }

  /* ── Subscription ─────────────────────────────────────────────── */

  /**
   * Subscribe this operator to push notifications for a restaurant.
   */
  subscribe(restaurantId: string, operatorId: string, role: string): void {
    this.subscription = {
      restaurantId,
      operatorId,
      role,
      subscribedAt: Date.now(),
    };
    this.saveSubscription();
    Logger.info(
      `[PushNotification] Subscribed: ${operatorId} (${role}) at ${restaurantId}`,
    );
  }

  /**
   * Unsubscribe from push notifications.
   */
  unsubscribe(): void {
    this.subscription = null;
    try {
      localStorage.removeItem(STORAGE_KEY_SUBSCRIPTION);
    } catch {
      // localStorage may be unavailable
    }
    Logger.info("[PushNotification] Unsubscribed");
  }

  /**
   * Returns current subscription info, or null if not subscribed.
   */
  getSubscription(): SubscriptionInfo | null {
    return this.subscription;
  }

  /* ── Send Notification ────────────────────────────────────────── */

  /**
   * Sends a local browser notification.
   * Falls back to in-app only if permission not granted.
   * Always stores in notification history.
   */
  sendLocalNotification(
    title: string,
    body: string,
    options?: PushNotificationOptions,
  ): StoredNotification {
    const prefs = this.getPreferences();
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const stored: StoredNotification = {
      id,
      title,
      body,
      tag: options?.tag,
      data: options?.data,
      timestamp: Date.now(),
      read: false,
    };

    // Store in history
    this.addToHistory(stored);

    if (!prefs.enabled) return stored;

    // Play sound if enabled
    if ((options?.playSound ?? true) && prefs.soundEnabled) {
      this.playBellSound();
    }

    // Vibrate on mobile if enabled
    if ((options?.vibrate ?? true) && prefs.vibrateEnabled) {
      this.vibrate();
    }

    // Show browser notification if permission granted
    if (this.getPermissionStatus() === "granted") {
      try {
        const notification = new Notification(title, {
          body,
          icon: options?.icon ?? "/chefiapp-icon-192.png",
          tag: options?.tag,
          data: options?.data,
          silent: true, // We handle sound ourselves
        });

        if (options?.onClick) {
          notification.onclick = () => {
            options.onClick?.();
            notification.close();
            window.focus();
          };
        }

        // Auto-close
        const autoClose = options?.autoCloseMs ?? DEFAULT_AUTO_CLOSE_MS;
        if (autoClose > 0) {
          setTimeout(() => notification.close(), autoClose);
        }
      } catch (err) {
        Logger.warn("[PushNotification] Failed to show notification:", err);
      }
    }

    return stored;
  }

  /* ── Notification History ─────────────────────────────────────── */

  /**
   * Returns stored notifications, most recent first.
   */
  getHistory(limit = 20): StoredNotification[] {
    const all = this.loadHistory();
    return all.slice(0, limit);
  }

  /**
   * Returns count of unread notifications.
   */
  getUnreadCount(): number {
    return this.loadHistory().filter((n) => !n.read).length;
  }

  /**
   * Marks a notification as read.
   */
  markAsRead(notificationId: string): void {
    const all = this.loadHistory();
    const updated = all.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    this.saveHistory(updated);
  }

  /**
   * Marks all notifications as read.
   */
  markAllAsRead(): void {
    const all = this.loadHistory();
    const updated = all.map((n) => ({ ...n, read: true }));
    this.saveHistory(updated);
  }

  /**
   * Clears all notification history.
   */
  clearHistory(): void {
    this.saveHistory([]);
  }

  /* ── Preferences ──────────────────────────────────────────────── */

  /**
   * Returns current notification preferences.
   */
  getPreferences(): NotificationPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFERENCES);
      if (raw) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
      }
    } catch {
      // localStorage may be unavailable
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Saves notification preferences.
   */
  savePreferences(prefs: Partial<NotificationPreferences>): void {
    const current = this.getPreferences();
    const merged = { ...current, ...prefs };
    try {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(merged));
    } catch {
      // localStorage may be unavailable
    }
  }

  /**
   * Check if a specific channel is enabled for the current user.
   */
  isChannelEnabled(channelId: string): boolean {
    const prefs = this.getPreferences();
    if (!prefs.enabled) return false;
    // If no override exists, default to enabled
    return prefs.channelOverrides[channelId] !== false;
  }

  /* ── Sound ────────────────────────────────────────────────────── */

  /**
   * Plays a short bell/chime sound using Web Audio API.
   * No external audio files needed.
   */
  private playBellSound(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }

      const ctx = this.audioCtx;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const now = ctx.currentTime;

      // Bell tone: two sine oscillators with decay
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(830, now); // E5-ish
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1245, now); // D#6-ish (harmonic)

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch {
      // AudioContext may not be available
    }
  }

  /* ── Vibration ────────────────────────────────────────────────── */

  /**
   * Vibrates on mobile devices using the Vibration API.
   */
  private vibrate(): void {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]); // short-pause-short
      }
    } catch {
      // Vibration API may not be available
    }
  }

  /* ── Internal: History persistence ────────────────────────────── */

  private loadHistory(): StoredNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (raw) return JSON.parse(raw) as StoredNotification[];
    } catch {
      // localStorage may be unavailable
    }
    return [];
  }

  private saveHistory(items: StoredNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(items));
    } catch {
      // localStorage may be unavailable
    }
  }

  private addToHistory(notification: StoredNotification): void {
    const all = this.loadHistory();
    all.unshift(notification); // Most recent first
    // Cap at MAX
    if (all.length > MAX_STORED_NOTIFICATIONS) {
      all.length = MAX_STORED_NOTIFICATIONS;
    }
    this.saveHistory(all);
  }

  /* ── Internal: Subscription persistence ───────────────────────── */

  private loadSubscription(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      if (raw) this.subscription = JSON.parse(raw) as SubscriptionInfo;
    } catch {
      // localStorage may be unavailable
    }
  }

  private saveSubscription(): void {
    if (!this.subscription) return;
    try {
      localStorage.setItem(
        STORAGE_KEY_SUBSCRIPTION,
        JSON.stringify(this.subscription),
      );
    } catch {
      // localStorage may be unavailable
    }
  }
}

/** Singleton instance */
export const pushNotificationService = new PushNotificationServiceImpl();
