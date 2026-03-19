/**
 * NotificationsPage — Centro de notificações do AppStaff.
 *
 * Lista de notificações filtráveis por tipo.
 * Suporte a browser push notifications (quando permitido).
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { useStaff } from "../context/StaffContext";
import type { NotificationType } from "../context/NotificationTypes";
import styles from "./NotificationsPage.module.css";

// ── Labels ───────────────────────────────────────────────────────

const TYPE_LABELS: Record<NotificationType, string> = {
  task: "Tarefa",
  announcement: "Anúncio",
  shift: "Turno",
  system: "Sistema",
  chat: "Chat",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ── Component ────────────────────────────────────────────────────

type FilterType = "all" | NotificationType;

export function NotificationsPage() {
  const { activeRole } = useStaff();
  const role = activeRole ?? "worker";
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    requestPushPermission,
  } = useNotifications(role);

  const [filter, setFilter] = useState<FilterType>("all");
  const [pushState, setPushState] = useState<string>(() => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const handleClick = useCallback(
    (id: string, actionUrl?: string) => {
      markRead(id);
      if (actionUrl) {
        // Use pushState + popstate for SPA navigation
        history.pushState(null, "", actionUrl);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    },
    [markRead],
  );

  const handleRequestPush = useCallback(async () => {
    const result = await requestPushPermission();
    setPushState(result);
  }, [requestPushPermission]);

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Notificações</h2>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount}</span>
          )}
        </div>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button className={styles.headerBtn} onClick={markAllRead}>
              Marcar todas lidas
            </button>
          )}
          {notifications.length > 0 && (
            <button className={styles.headerBtn} onClick={clearAll}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Push permission banner */}
      {pushState === "default" && (
        <div className={styles.pushBanner}>
          <span className={styles.pushText}>
            Ative notificações push para não perder alertas
          </span>
          <button className={styles.pushBtn} onClick={handleRequestPush}>
            Ativar
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div className={styles.filters}>
        {(["all", "task", "announcement", "shift", "system", "chat"] as FilterType[]).map(
          (f) => (
            <button
              key={f}
              className={
                filter === f ? styles.filterChipActive : styles.filterChip
              }
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : TYPE_LABELS[f as NotificationType]}
            </button>
          ),
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔔</div>
          <div className={styles.emptyText}>Sem notificações</div>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((notif) => {
            const itemClass =
              notif.priority === "critical"
                ? styles.notifItemCritical
                : !notif.read
                  ? styles.notifItemUnread
                  : styles.notifItem;

            return (
              <div
                key={notif.id}
                className={itemClass}
                onClick={() => handleClick(notif.id, notif.action_url)}
              >
                <div className={styles.notifIcon}>{notif.icon}</div>

                <div className={styles.notifContent}>
                  <h4 className={styles.notifTitle}>
                    {!notif.read && <span className={styles.notifUnreadDot} />}
                    {notif.title}
                  </h4>
                  <p className={styles.notifBody}>{notif.body}</p>
                  <div className={styles.notifMeta}>
                    <span className={styles.notifTime}>
                      {timeAgo(notif.created_at)}
                    </span>
                    <span className={styles.notifType}>
                      {TYPE_LABELS[notif.type]}
                    </span>
                  </div>
                </div>

                <button
                  className={styles.notifDismiss}
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(notif.id);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
