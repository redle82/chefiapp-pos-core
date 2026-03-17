/**
 * NotificationBell — Notification bell icon with dropdown for the TPV Header.
 *
 * Aggregates operational alerts:
 * 1. Tables needing attention (ready_to_serve, bill_requested, cleaning)
 * 2. Open tasks count
 * 3. Kitchen delayed orders (via TPVCentralEvents)
 *
 * Polls every 30s for table + task data. Listens to event bus for kitchen pressure.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import tpvEventBus from "../../../core/tpv/TPVCentralEvents";
import type { KitchenPressurePayload } from "../../../core/tpv/TPVCentralEvents";

/* ── Types ────────────────────────────────────────────────────── */

type NotificationType = "table_attention" | "task_pending" | "kitchen_delayed";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
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

/* ── Helpers ───────────────────────────────────────────────────── */

const ICON_MAP: Record<NotificationType, string> = {
  table_attention: "\uD83C\uDF7D", // fork and knife plate
  task_pending: "\uD83D\uDCCB",    // clipboard
  kitchen_delayed: "\uD83D\uDD25", // fire
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "<1m";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}m`;
}

/* ── Component ────────────────────────────────────────────────── */

export function NotificationBell({ restaurantId }: NotificationBellProps) {
  const { t } = useTranslation("tpv");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const kitchenDelayedRef = useRef(0);

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
      });
    }

    // Sort by timestamp descending (most recent first)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setNotifications(items);
  }, [restaurantId, t]);

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
        // Re-fetch to update the list
        fetchNotifications();
      },
    );
    return unsub;
  }, [fetchNotifications]);

  /* ── Click outside to close ─────────────────────────────── */

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* ── Render ─────────────────────────────────────────────── */

  const count = notifications.length;

  return (
    <div ref={containerRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("header.notifications")}
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
          color: count > 0 ? "#fafafa" : "#737373",
          cursor: "pointer",
          transition: "background-color 0.15s",
        }}
      >
        <BellIcon />
        {/* Badge */}
        {count > 0 && (
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
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          data-testid="notification-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 400,
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
            <span style={{ color: "#fafafa", fontWeight: 600, fontSize: 14 }}>
              {t("header.notifications")}
            </span>
            {count > 0 && (
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
                {count}
              </span>
            )}
          </div>

          {/* Items */}
          {count === 0 ? (
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
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 16px",
                    cursor: "default",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "transparent";
                  }}
                >
                  {/* Type icon */}
                  <span style={{ fontSize: 16, lineHeight: "20px", flexShrink: 0 }}>
                    {ICON_MAP[n.type]}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#e5e5e5",
                        fontSize: 14,
                        lineHeight: 1.4,
                        wordBreak: "break-word",
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
