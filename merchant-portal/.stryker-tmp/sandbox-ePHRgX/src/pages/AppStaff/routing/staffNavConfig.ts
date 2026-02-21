/**
 * Navegação do AppStaff por papel (APPSTAFF_APPSHELL_MAP).
 * Cada papel vê apenas os itens da sua sub-árvore + comuns.
 */
// @ts-nocheck


import type { StaffRole } from "../context/StaffCoreTypes";

export interface NavItem {
  to: string;
  label: string;
  icon?: string;
}

/** Itens comuns a todos os papéis */
export const COMMON_NAV: NavItem[] = [
  { to: "profile", label: "Perfil", icon: "👤" },
  { to: "notifications", label: "Notificações", icon: "🔔" },
  { to: "help", label: "Ajuda", icon: "❓" },
  { to: "history", label: "Meu histórico", icon: "📋" },
];

/** Itens por papel (sub-rota base já é o path) */
export const ROLE_NAV: Record<StaffRole, NavItem[]> = {
  owner: [
    { to: "owner/overview", label: "Visão geral", icon: "📊" },
    { to: "tpv", label: "TPV", icon: "🧾" },
    { to: "kds", label: "KDS", icon: "🍳" },
    { to: "owner/saude-sistema", label: "Saúde do sistema", icon: "❤️" },
    { to: "owner/dispositivos-turnos", label: "Dispositivos & turnos", icon: "📱" },
    { to: "owner/pessoas", label: "Pessoas & papéis", icon: "👥" },
    { to: "owner/relatorios", label: "Relatórios", icon: "📈" },
  ],
  manager: [
    { to: "manager/home", label: "Visão operacional", icon: "🎛️" },
    { to: "manager/turno", label: "Turno", icon: "⏱️" },
    { to: "manager/equipe", label: "Equipe em turno", icon: "👥" },
    { to: "manager/tarefas", label: "Tarefas críticas", icon: "✅" },
    { to: "manager/excecoes", label: "Exceções", icon: "⚠️" },
    { to: "tpv", label: "TPV", icon: "🧾" },
    { to: "kds", label: "KDS", icon: "🍳" },
  ],
  waiter: [
    { to: "tpv", label: "TPV", icon: "🧾" },
    { to: "waiter/tasks", label: "Minhas tarefas", icon: "📋" },
    { to: "waiter/checklists", label: "Checklists", icon: "☑️" },
    { to: "waiter/chamados", label: "Chamados", icon: "📢" },
  ],
  worker: [
    { to: "waiter/tasks", label: "Minhas tarefas", icon: "📋" },
    { to: "waiter/checklists", label: "Checklists", icon: "☑️" },
    { to: "waiter/chamados", label: "Chamados", icon: "📢" },
  ],
  kitchen: [
    { to: "kds", label: "KDS", icon: "🍳" },
    { to: "kitchen/preparacao", label: "Preparação", icon: "📦" },
    { to: "kitchen/alerts", label: "Alertas", icon: "⚠️" },
  ],
  cleaning: [
    { to: "cleaning/checklists", label: "Checklists", icon: "🧹" },
    { to: "cleaning/alerts", label: "Alertas", icon: "⚠️" },
  ],
};

export function getNavItemsForRole(role: StaffRole): NavItem[] {
  const roleItems = ROLE_NAV[role] ?? ROLE_NAV.waiter;
  return [...roleItems, ...COMMON_NAV];
}
