/**
 * useNotifications — Hook para notificações in-app.
 *
 * MVP: localStorage + seed de notificações demo.
 * Pronto para: Supabase realtime, Web Push API, React Native push.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppNotification, NotificationType } from "../context/NotificationTypes";
import { createNotification, NOTIFICATION_ICONS } from "../context/NotificationTypes";
import type { StaffRole } from "../context/StaffCoreTypes";

// ── Storage ──────────────────────────────────────────────────────

const STORAGE_KEY = "chefi_notifications";
const STORAGE_SEEDED = "chefi_notifications_seeded";

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function save(data: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full */
  }
}

// ── Demo seed ────────────────────────────────────────────────────

function seedDemoNotifications(): AppNotification[] {
  if (localStorage.getItem(STORAGE_SEEDED)) return load();

  const now = Date.now();
  const demos: AppNotification[] = [
    createNotification({
      type: "shift",
      priority: "normal",
      title: "Escala publicada",
      body: "A escala da próxima semana foi publicada. Verifique os seus turnos.",
      icon: NOTIFICATION_ICONS.shift,
      action_url: "/app/staff/home/schedule",
      target_roles: [],
    }),
    createNotification({
      type: "task",
      priority: "high",
      title: "Tarefa atribuída",
      body: "Limpeza da câmara fria — prazo: 14h",
      icon: NOTIFICATION_ICONS.task,
      target_roles: ["cleaning"],
    }),
    createNotification({
      type: "announcement",
      priority: "normal",
      title: "Novo anúncio do gerente",
      body: "Reunião de equipa às 15h na cozinha",
      icon: NOTIFICATION_ICONS.announcement,
      action_url: "/app/staff/home/comms",
      target_roles: [],
    }),
    createNotification({
      type: "system",
      priority: "critical",
      title: "Stock baixo",
      body: "Salmão fresco — apenas 2 unidades restantes",
      icon: NOTIFICATION_ICONS.system,
      target_roles: ["kitchen", "manager", "owner"],
    }),
    createNotification({
      type: "chat",
      priority: "low",
      title: "Nova mensagem no canal Geral",
      body: "João Costa: Bom dia equipa!",
      icon: NOTIFICATION_ICONS.chat,
      action_url: "/app/staff/home/comms",
      target_roles: [],
    }),
  ];

  // Stagger creation times
  demos.forEach((d, i) => {
    d.created_at = new Date(now - i * 15 * 60_000).toISOString();
  });

  localStorage.setItem(STORAGE_SEEDED, "true");
  save(demos);
  return demos;
}

// ── Hook ─────────────────────────────────────────────────────────

export function useNotifications(currentRole: StaffRole) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const existing = load();
    return existing.length > 0 ? existing : seedDemoNotifications();
  });

  useEffect(() => {
    save(notifications);
  }, [notifications]);

  // Filter by role
  const visibleNotifications = useMemo(
    () =>
      notifications
        .filter((n) => !n.dismissed)
        .filter(
          (n) =>
            n.target_roles.length === 0 || n.target_roles.includes(currentRole),
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [notifications, currentRole],
  );

  const unreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.read).length,
    [visibleNotifications],
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n)),
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, dismissed: true })));
  }, []);

  const addNotification = useCallback(
    (params: {
      type: NotificationType;
      title: string;
      body: string;
      priority?: AppNotification["priority"];
      action_url?: string;
      target_roles?: StaffRole[];
    }) => {
      const notif = createNotification({
        type: params.type,
        priority: params.priority ?? "normal",
        title: params.title,
        body: params.body,
        icon: NOTIFICATION_ICONS[params.type],
        action_url: params.action_url,
        target_roles: params.target_roles ?? [],
      });
      setNotifications((prev) => [notif, ...prev]);

      // Browser notification (if permitted)
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(params.title, {
            body: params.body,
            icon: "/favicon.ico",
            tag: notif.id,
          });
        } catch {
          /* ignore */
        }
      }

      return notif;
    },
    [],
  );

  const requestPushPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported";
    const result = await Notification.requestPermission();
    return result; // "granted" | "denied" | "default"
  }, []);

  return {
    notifications: visibleNotifications,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    addNotification,
    requestPushPermission,
  };
}
