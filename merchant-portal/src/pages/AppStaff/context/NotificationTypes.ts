/**
 * NotificationTypes — Sistema de notificações in-app do AppStaff.
 *
 * Tipos de notificação:
 * - task: tarefa atribuída/completada/escalada
 * - announcement: novo anúncio publicado
 * - shift: turno publicado/alterado, lembrete de início
 * - system: alerta do sistema (stock, equipamento, etc)
 * - chat: menção ou mensagem direta
 */

import type { StaffRole } from "./StaffCoreTypes";

export type NotificationType = "task" | "announcement" | "shift" | "system" | "chat";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  /** Ícone do tipo */
  icon: string;
  /** Rota para navegar ao clicar */
  action_url?: string;
  /** Dados extras para processamento */
  metadata?: Record<string, unknown>;
  /** Role(s) destinatário */
  target_roles: StaffRole[];
  /** Employee específico (vazio = todos do role) */
  target_employee_id?: string;
  read: boolean;
  dismissed: boolean;
  created_at: string; // ISO
}

// ── Notification generators ──────────────────────────────────────

export function createNotification(
  params: Omit<AppNotification, "id" | "read" | "dismissed" | "created_at"> & {
    id?: string;
  },
): AppNotification {
  return {
    ...params,
    id: params.id ?? `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    dismissed: false,
    created_at: new Date().toISOString(),
  };
}

// ── Icon map ─────────────────────────────────────────────────────

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  task: "✅",
  announcement: "📢",
  shift: "⏰",
  system: "⚙️",
  chat: "💬",
};
