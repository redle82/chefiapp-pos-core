/**
 * CommsTypes — Tipos para o sistema de comunicação interna.
 *
 * Modelo:
 * - Announcement: mensagem broadcast do owner/manager para a equipa
 * - ChatMessage: mensagem num canal de turno/equipa
 * - Channel: grupo de chat (por turno, por role, geral)
 */

import type { StaffRole } from "./StaffCoreTypes";

// ── Announcements ────────────────────────────────────────────────

export type AnnouncementPriority = "info" | "warning" | "urgent";

export interface Announcement {
  id: string;
  restaurant_id: string;
  author_id: string;
  author_name: string;
  author_role: StaffRole;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  /** Roles que devem ver (vazio = todos) */
  target_roles: StaffRole[];
  pinned: boolean;
  created_at: string; // ISO
  expires_at: string | null; // ISO, null = sem expiração
  read_by: string[]; // employee IDs
}

// ── Chat ─────────────────────────────────────────────────────────

export type ChannelType = "general" | "shift" | "role" | "direct";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  role_filter?: StaffRole; // para canais por role
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  author_id: string;
  author_name: string;
  author_role: StaffRole;
  body: string;
  created_at: string; // ISO
  /** Reactions simples (emoji → count) */
  reactions: Record<string, string[]>; // emoji → author_ids
}

// ── Defaults ─────────────────────────────────────────────────────

export const DEFAULT_CHANNELS: Channel[] = [
  { id: "ch-general", name: "Geral", type: "general", created_at: new Date().toISOString() },
  { id: "ch-kitchen", name: "Cozinha", type: "role", role_filter: "kitchen", created_at: new Date().toISOString() },
  { id: "ch-floor", name: "Sala", type: "role", role_filter: "waiter", created_at: new Date().toISOString() },
  { id: "ch-shift", name: "Turno Atual", type: "shift", created_at: new Date().toISOString() },
];
