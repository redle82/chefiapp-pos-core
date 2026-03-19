/**
 * NotificationBell — Notification bell icon with dropdown for the TPV Header.
 *
 * Aggregates two sources:
 * 1. **Operational alerts** (polled every 30s): tables needing attention, open tasks, kitchen delays
 * 2. **Push notification history** (from PushNotificationService): persistent, supports read/unread
 *
 * Features:
 * - Unread notification count badge
 * - Dropdown with recent notifications (last 20)
 * - Mark individual as read on click
 * - "Mark all as read" button
 * - Notification persistence in localStorage via PushNotificationService
 *
 * Polls every 30s for table + task data. Listens to event bus for kitchen pressure.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import tpvEventBus from "../../../core/tpv/TPVCentralEvents";
import type { KitchenPressurePayload } from "../../../core/tpv/TPVCentralEvents";
import {
  pushNotificationService,
  type StoredNotification,
} from "../../../core/notifications/PushNotificationService";

/* ── Types ────────────────────────────────────────────────────── */

type NotificationType = "table_attention" | "task_pending" | "kitchen_delayed" | "push";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
  meta?: { tableNumber?: number; taskId?: string; orderId?: string };
}

interface NotificationBellProps {
  restaurantId: string;
}

/* ── Icons ────────────────────────────────────────────────────── */

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2a5 5 0 0 0-5 5v3l-1.5 2.5a.5.5 0 0 0 .43.75h12.14a.5.5 0 0 0 .43-.75L15 10V7a5 5 0 0 0-5-5Z" />
      <path d="M8 14a2 2 0 0 0 4 0" />
    </svg>
  );
}

function CheckAllIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 7.5l3 3 6-6" />
    </svg>
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */

const ICON_MAP: Record<NotificationType, string> = {
  table_attention: "\uD83C\uDF7D", // fork and knife plate
  task_pending: "\uD83D\uDCCB",    // clipboard
  kitchen_delayed: "\uD83D\uDD25", // fire
  push: "\uD83D\uDD14",            // bell
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "<1m";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}m`;
}

/** Convert StoredNotification to our internal Notification type */
function fromStored(sn: StoredNotification): Notification {
  return {
    id: sn.id,
    type: "push",
    message: `${sn.title}: ${sn.body}`,
    timestamp: new Date(sn.timestamp),
    read: sn.read,
    meta: sn.data as Notification["meta"],
  };
}

/* ── Component ────────────────────────────────────────────────── */

export function NotificationBell({ restaurantId }: NotificationBellProps) {
  const { t } = useTranslation("tpv");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const kitchenDelayedRef = useRef(0);

  /* ── Merge operational + push notifications ────────────────── */

  const buildNotificationList = useCallback(
    (operationalItems: Notification[]) => {
      // Get push notification history
      const pushHistory = pushNotificationService.getHistory(20);
      const pushItems = pushHistory.map(fromStored);

      // Merge: operational items are always "unread" (live state)
      // Push items carry their own read state
      const merged = [...operationalItems, ...pushItems];

      // De-duplicate by id
      const seen = new Set<string>();
      const unique = merged.filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });

      // Sort by timestamp descending (most recent first), limit to 20
      unique.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return unique.slice(0, 20);
    },
    [],
  );

  /* ── Fetch table + task notifications ────────────────────── */

  const fetchNotifications = useCallback(async () => {
    if (!restaurantId) return;

    const items: Notification[] = [];

    // 1. Tables needing attention
    try {
      const { data: tables } = await dockerCoreClient
        .from("gm_tables")
        .select("id, number, status, last_state_change_at")
        .eq("restaurant_id", restaurantId)
        .in("status", ["ready_to_serve", "bill_requested", "cleaning"]);

      if (tables) {
        for (const row of tables as Array<Record<string, unknown>>) {
          const tableNumber = row.number as number;
          const status = row.status as string;
          const changedAt = row.last_state_change_at
            ? new Date(row.last_state_change_at as string)
            : new Date();
          const elapsed = timeAgo(changedAt);

          let message: string;
          if (status === "ready_to_serve") {
            message = t("header.tableReady", { number: tableNumber, time: elapsed });
          } else if (status === "bill_requested") {
            message = t("header.tableBillRequested", { number: tableNumber });
          } else {
            message = t("header.tableCleaning", { number: tableNumber });
          }

          items.push({
            id: `table_${row.id}`,
            type: "table_attention",
            message,
            timestamp: changedAt,
            read: false,
            meta: { tableNumber },
          });
        }
      }
    } catch {
      // Tables may not exist yet — silently ignore
    }

    // 2. Open tasks
    try {
      const { count } = await dockerCoreClient
        .from("gm_tasks")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId)
        .eq("status", "OPEN");

      if (count && count > 0) {
        items.push({
          id: "tasks_pending",
          type: "task_pending",
          message: t("header.tasksPending", { count }),
          timestamp: new Date(),
          read: false,
        });
      }
    } catch {
      // Tasks table may not exist — silently ignore
    }

    // 3. Kitchen delayed (from event bus state)
    if (kitchenDelayedRef.current > 0) {
      items.push({
        id: "kitchen_delayed",
        type: "kitchen_delayed",
        message: t("header.kitchenDelayed", { count: kitchenDelayedRef.current }),
        timestamp: new Date(),
        read: false,
      });
    }

    setNotifications(buildNotificationList(items));
  }, [restaurantId, t, buildNotificationList]);

  /* ── Polling ────────────────────────────────────────────── */

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /* ── Kitchen pressure event listener ────────────────────── */

  useEffect(() => {
    const unsub = tpvEventBus.on<KitchenPressurePayload>(
      "kitchen.pressure_change",
      (event) => {
        kitchenDelayedRef.current = event.payload.delayedOrders;
        fetchNotifications();
      },
    );
    return unsub;
  }, [fetchNotifications]);

  /* ── Click outside / Escape to close ──────────────────── */

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  /* ── Actions ────────────────────────────────────────────── */

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      // Mark in push service if it's a push notification
      pushNotificationService.markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        ),
      );
    },
    [],
  );

  const handleMarkAllAsRead = useCallback(() => {
    pushNotificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  /* ── Render ─────────────────────────────────────────────── */

  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div ref={containerRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? `${t("header.notifications")} (${unreadCount} unread)`
            : t("header.notifications")
        }
        aria-expanded={open}
        aria-haspopup="true"
        data-testid="notification-bell"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: open ? "rgba(255,255,255,0.08)" : "transparent",
          color: unreadCount > 0 ? "#fafafa" : "#737373",
          cursor: "pointer",
          transition: "background-color 0.15s",
        }}
      >
        <BellIcon />
        {/* Badge — shows unread count */}
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "16px",
              textAlign: "center",
              padding: "0 4px",
              pointerEvents: "none",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          data-testid="notification-dropdown"
          role="region"
          aria-label={t("header.notifications")}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            maxHeight: 440,
            overflowY: "auto",
            backgroundColor: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#fafafa", fontWeight: 600, fontSize: 14 }}>
                {t("header.notifications")}
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 10,
                    backgroundColor: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {/* Mark all as read */}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                title={t("header.markAllRead")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#f97316",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: 6,
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "rgba(249,115,22,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
              >
                <CheckAllIcon />
                {t("header.markAllRead")}
              </button>
            )}
          </div>

          {/* Items */}
          {totalCount === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#737373",
                fontSize: 14,
              }}
            >
              {t("header.noNotifications")}
            </div>
          ) : (
            <div style={{ padding: "4px 0" }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleMarkAsRead(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleMarkAsRead(n.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 16px",
                    cursor: "pointer",
                    transition: "background-color 0.1s",
                    backgroundColor: n.read
                      ? "transparent"
                      : "rgba(249,115,22,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      n.read
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(249,115,22,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      n.read ? "transparent" : "rgba(249,115,22,0.04)";
                  }}
                >
                  {/* Unread dot */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: n.read ? "transparent" : "#f97316",
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />

                  {/* Type icon */}
                  <span style={{ fontSize: 16, lineHeight: "20px", flexShrink: 0 }}>
                    {ICON_MAP[n.type]}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: n.read ? "#a3a3a3" : "#e5e5e5",
                        fontSize: 14,
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                        fontWeight: n.read ? 400 : 500,
                      }}
                    >
                      {n.message}
                    </div>
                    <div
                      style={{
                        color: "#737373",
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {timeAgo(n.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
