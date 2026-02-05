/**
 * Copy por papel — textos e labels adaptados ao role (spec secção 10)
 * Dono = estratégia; Gerente = coordenação; Funcionário = acção imediata
 */

import type { UserRole } from "./rolePermissions";

export interface DashboardCopy {
  sidebarTitle: string;
  sidebarSubtitle: string;
  mainTitle: string;
  mainSubtitle: string;
}

export interface ConfigCopy {
  title: string;
  subtitle: string;
}

export interface StaffCopy {
  title: string;
  subtitle: string;
  tabAction: string;
}

const DASHBOARD_COPY: Record<Exclude<UserRole, "staff">, DashboardCopy> = {
  owner: {
    sidebarTitle: "ChefIApp OS",
    sidebarSubtitle: "Estado do sistema",
    mainTitle: "Seu Sistema Operacional",
    mainSubtitle:
      "Setup, trial ou plano ativo — uma única verdade de estado (CONTRATO_TRIAL_REAL).",
  },
  manager: {
    sidebarTitle: "ChefIApp OS",
    sidebarSubtitle: "O que fazer agora",
    mainTitle: "O que fazer agora",
    mainSubtitle:
      "Visão do que está ativo e do que fazer a seguir.",
  },
};

const CONFIG_COPY: Record<Exclude<UserRole, "staff">, ConfigCopy> = {
  owner: {
    title: "Configuração",
    subtitle: "Gerencie seu restaurante",
  },
  manager: {
    title: "Configuração",
    subtitle: "O que precisa para operar hoje",
  },
};

const STAFF_COPY: StaffCopy = {
  title: "AppStaff",
  subtitle: "KDS, TPV e tarefas — o que fazer agora",
  tabAction: "KDS & TPV",
};

/**
 * Copy do Dashboard (owner ou manager; staff não acede ao dashboard)
 */
export function getDashboardCopy(role: UserRole | null): DashboardCopy {
  if (role === "owner" || role === "manager") return DASHBOARD_COPY[role];
  return DASHBOARD_COPY.manager;
}

/**
 * Copy da sidebar de Config (owner ou manager)
 */
export function getConfigCopy(role: UserRole | null): ConfigCopy {
  if (role === "owner" || role === "manager") return CONFIG_COPY[role];
  return CONFIG_COPY.manager;
}

/**
 * Copy do AppStaff (interface staff — acção imediata)
 */
export function getStaffCopy(): StaffCopy {
  return STAFF_COPY;
}
