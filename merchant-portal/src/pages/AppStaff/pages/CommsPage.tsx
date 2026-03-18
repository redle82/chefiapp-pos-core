/**
 * CommsPage — Comunicação interna (Anúncios + Chat de Equipa).
 *
 * Tab 1: Anúncios — broadcast do owner/manager
 * Tab 2: Chat — mensagens em canais (Geral, Cozinha, Sala, Turno)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useComms } from "../hooks/useComms";
import { useStaff } from "../context/StaffContext";
import type { AnnouncementPriority } from "../context/CommsTypes";
import styles from "./CommsPage.module.css";

// ── Role labels ──────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: "Dono",
  manager: "Gerente",
  waiter: "Garçom",
  kitchen: "Cozinha",
  cleaning: "Limpeza",
  worker: "Staff",
};

const QUICK_REACTIONS = ["👍", "✅", "🔥", "👀"];

// ── Time formatting ──────────────────────────────────────────────

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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ────────────────────────────────────────────────────

type TabId = "announcements" | "chat";

export function CommsPage() {
  const { activeWorkerId, activeRole } = useStaff();
  const userId = activeWorkerId ?? "anonymous";
  const role = activeRole ?? "worker";

  const {
    announcements,
    unreadCount,
    createAnnouncement,
    deleteAnnouncement,
    markAnnouncementRead,
    channels,
    getChannelMessages,
    sendMessage,
    toggleReaction,
  } = useComms(userId, role);

  const [activeTab, setActiveTab] = useState<TabId>("announcements");
  const canCreate = role === "owner" || role === "manager";

  return (
    <div className={styles.root}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={
            activeTab === "announcements" ? styles.tabActive : styles.tab
          }
          onClick={() => setActiveTab("announcements")}
        >
          📢 Anúncios
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </button>
        <button
          className={activeTab === "chat" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("chat")}
        >
          💬 Chat
        </button>
      </div>

      {activeTab === "announcements" ? (
        <AnnouncementsPanel
          announcements={announcements}
          canCreate={canCreate}
          userId={userId}
          onCreateAnnouncement={createAnnouncement}
          onDeleteAnnouncement={deleteAnnouncement}
          onMarkRead={markAnnouncementRead}
        />
      ) : (
        <ChatPanel
          channels={channels}
          userId={userId}
          role={role}
          getChannelMessages={getChannelMessages}
          onSendMessage={sendMessage}
          onToggleReaction={toggleReaction}
        />
      )}
    </div>
  );
}

// ── Announcements Panel ──────────────────────────────────────────

function AnnouncementsPanel({
  announcements,
  canCreate,
  userId,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  onMarkRead,
}: {
  announcements: ReturnType<typeof useComms>["announcements"];
  canCreate: boolean;
  userId: string;
  onCreateAnnouncement: ReturnType<typeof useComms>["createAnnouncement"];
  onDeleteAnnouncement: ReturnType<typeof useComms>["deleteAnnouncement"];
  onMarkRead: ReturnType<typeof useComms>["markAnnouncementRead"];
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("info");

  const handleCreate = useCallback(() => {
    if (!title.trim()) return;
    onCreateAnnouncement({ title: title.trim(), body: "", priority });
    setTitle("");
    setPriority("info");
  }, [title, priority, onCreateAnnouncement]);

  return (
    <div className={styles.announcementsPanel}>
      {canCreate && (
        <div>
          <div className={styles.createBar}>
            <input
              className={styles.createInput}
              placeholder="Novo anúncio para a equipa..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              className={styles.sendBtn}
              onClick={handleCreate}
              disabled={!title.trim()}
            >
              Publicar
            </button>
          </div>
          <div className={styles.priorityBar}>
            {(["info", "warning", "urgent"] as const).map((p) => (
              <button
                key={p}
                className={`${priority === p ? styles.priorityBtnActive : styles.priorityBtn} ${
                  p === "info"
                    ? styles.priorityInfo
                    : p === "warning"
                      ? styles.priorityWarning
                      : styles.priorityUrgent
                }`}
                onClick={() => setPriority(p)}
              >
                {p === "info" ? "ℹ️ Info" : p === "warning" ? "⚠️ Aviso" : "🚨 Urgente"}
              </button>
            ))}
          </div>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📢</div>
          <div className={styles.emptyText}>Sem anúncios</div>
        </div>
      ) : (
        announcements.map((ann) => {
          const isUnread = !ann.read_by.includes(userId);
          const cardClass =
            ann.priority === "urgent"
              ? styles.annCardUrgent
              : ann.priority === "warning"
                ? styles.annCardWarning
                : isUnread
                  ? styles.annCardUnread
                  : styles.annCard;

          return (
            <div
              key={ann.id}
              className={cardClass}
              onClick={() => isUnread && onMarkRead(ann.id)}
            >
              <div className={styles.annHeader}>
                <span className={styles.annAuthor}>
                  {ROLE_LABELS[ann.author_role] ?? ann.author_role} •{" "}
                  {ann.author_name}
                </span>
                {ann.pinned && <span className={styles.annPinned}>📌</span>}
              </div>
              <h4 className={styles.annTitle}>{ann.title}</h4>
              {ann.body && <p className={styles.annBody}>{ann.body}</p>}
              <div className={styles.annTime}>{timeAgo(ann.created_at)}</div>
              {canCreate && (
                <button
                  className={styles.annDelete}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnouncement(ann.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Chat Panel ───────────────────────────────────────────────────

function ChatPanel({
  channels,
  userId,
  role,
  getChannelMessages,
  onSendMessage,
  onToggleReaction,
}: {
  channels: ReturnType<typeof useComms>["channels"];
  userId: string;
  role: string;
  getChannelMessages: ReturnType<typeof useComms>["getChannelMessages"];
  onSendMessage: ReturnType<typeof useComms>["sendMessage"];
  onToggleReaction: ReturnType<typeof useComms>["toggleReaction"];
}) {
  const [activeChannel, setActiveChannel] = useState(channels[0]?.id ?? "");
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const messages = getChannelMessages(activeChannel);

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSendMessage(activeChannel, input.trim());
    setInput("");
  }, [input, activeChannel, onSendMessage]);

  return (
    <div className={styles.chatPanel}>
      {/* Channel selector */}
      <div className={styles.channelBar}>
        {channels.map((ch) => (
          <button
            key={ch.id}
            className={
              activeChannel === ch.id
                ? styles.channelChipActive
                : styles.channelChip
            }
            onClick={() => setActiveChannel(ch.id)}
          >
            {ch.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className={styles.messageList} ref={listRef}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💬</div>
            <div className={styles.emptyText}>
              Sem mensagens. Comece a conversa!
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.author_id === userId;
            return (
              <div
                key={msg.id}
                className={isMine ? styles.msgBubbleMine : styles.msgBubble}
              >
                {!isMine && (
                  <div className={styles.msgAuthor}>
                    {ROLE_LABELS[msg.author_role] ?? msg.author_role} •{" "}
                    {msg.author_name}
                  </div>
                )}
                <div className={styles.msgBody}>{msg.body}</div>
                <div className={styles.msgTime}>{formatTime(msg.created_at)}</div>

                {/* Reactions */}
                <div className={styles.msgReactions}>
                  {Object.entries(msg.reactions).map(([emoji, authors]) =>
                    authors.length > 0 ? (
                      <button
                        key={emoji}
                        className={
                          authors.includes(userId)
                            ? styles.reactionBtnActive
                            : styles.reactionBtn
                        }
                        onClick={() => onToggleReaction(msg.id, emoji)}
                      >
                        {emoji} {authors.length}
                      </button>
                    ) : null,
                  )}
                  {/* Quick reaction buttons */}
                  {QUICK_REACTIONS.filter(
                    (e) => !(msg.reactions[e]?.length > 0),
                  )
                    .slice(0, 2)
                    .map((emoji) => (
                      <button
                        key={emoji}
                        className={styles.reactionBtn}
                        onClick={() => onToggleReaction(msg.id, emoji)}
                        style={{ opacity: 0.4 }}
                      >
                        {emoji}
                      </button>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className={styles.chatInput}>
        <input
          className={styles.chatInputField}
          placeholder="Escrever mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className={styles.chatSendBtn}
          onClick={handleSend}
          disabled={!input.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
