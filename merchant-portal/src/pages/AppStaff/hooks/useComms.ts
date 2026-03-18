/**
 * useComms — Hook para comunicação interna (anúncios + chat).
 *
 * MVP: dados em localStorage, pronto para migrar a Supabase realtime.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Announcement,
  AnnouncementPriority,
  Channel,
  ChatMessage,
} from "../context/CommsTypes";
import { DEFAULT_CHANNELS } from "../context/CommsTypes";
import type { StaffRole } from "../context/StaffCoreTypes";

// ── Storage ──────────────────────────────────────────────────────

const STORAGE_ANNOUNCEMENTS = "chefi_announcements";
const STORAGE_MESSAGES = "chefi_chat_messages";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage full */
  }
}

// ── Hook ─────────────────────────────────────────────────────────

export function useComms(currentUserId: string, currentRole: StaffRole) {
  // ── Announcements ──────────────────────────────────────────
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    load(STORAGE_ANNOUNCEMENTS, []),
  );

  useEffect(() => {
    save(STORAGE_ANNOUNCEMENTS, announcements);
  }, [announcements]);

  const visibleAnnouncements = useMemo(() => {
    const now = new Date().toISOString();
    return announcements
      .filter((a) => {
        // Filter by target roles
        if (a.target_roles.length > 0 && !a.target_roles.includes(currentRole)) {
          return false;
        }
        // Filter expired
        if (a.expires_at && a.expires_at < now) return false;
        return true;
      })
      .sort((a, b) => {
        // Pinned first, then by date
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.created_at.localeCompare(a.created_at);
      });
  }, [announcements, currentRole]);

  const createAnnouncement = useCallback(
    (params: {
      title: string;
      body: string;
      priority?: AnnouncementPriority;
      target_roles?: StaffRole[];
      pinned?: boolean;
      expires_at?: string | null;
    }) => {
      const ann: Announcement = {
        id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        restaurant_id: "current",
        author_id: currentUserId,
        author_name: currentUserId, // In real app, resolve name
        author_role: currentRole,
        title: params.title,
        body: params.body,
        priority: params.priority ?? "info",
        target_roles: params.target_roles ?? [],
        pinned: params.pinned ?? false,
        created_at: new Date().toISOString(),
        expires_at: params.expires_at ?? null,
        read_by: [currentUserId],
      };
      setAnnouncements((prev) => [ann, ...prev]);
      return ann;
    },
    [currentUserId, currentRole],
  );

  const deleteAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const markAnnouncementRead = useCallback(
    (id: string) => {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id && !a.read_by.includes(currentUserId)
            ? { ...a, read_by: [...a.read_by, currentUserId] }
            : a,
        ),
      );
    },
    [currentUserId],
  );

  const unreadCount = useMemo(
    () => visibleAnnouncements.filter((a) => !a.read_by.includes(currentUserId)).length,
    [visibleAnnouncements, currentUserId],
  );

  // ── Chat ───────────────────────────────────────────────────

  const channels = DEFAULT_CHANNELS;

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    load(STORAGE_MESSAGES, []),
  );

  useEffect(() => {
    save(STORAGE_MESSAGES, messages);
  }, [messages]);

  const getChannelMessages = useCallback(
    (channelId: string) =>
      messages
        .filter((m) => m.channel_id === channelId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [messages],
  );

  const sendMessage = useCallback(
    (channelId: string, body: string) => {
      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        channel_id: channelId,
        author_id: currentUserId,
        author_name: currentUserId,
        author_role: currentRole,
        body,
        created_at: new Date().toISOString(),
        reactions: {},
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [currentUserId, currentRole],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const current = m.reactions[emoji] ?? [];
          const has = current.includes(currentUserId);
          return {
            ...m,
            reactions: {
              ...m.reactions,
              [emoji]: has
                ? current.filter((id) => id !== currentUserId)
                : [...current, currentUserId],
            },
          };
        }),
      );
    },
    [currentUserId],
  );

  return {
    // Announcements
    announcements: visibleAnnouncements,
    unreadCount,
    createAnnouncement,
    deleteAnnouncement,
    markAnnouncementRead,
    // Chat
    channels,
    getChannelMessages,
    sendMessage,
    toggleReaction,
  };
}
