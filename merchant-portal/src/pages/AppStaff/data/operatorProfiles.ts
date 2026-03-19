/**
 * Perfis de operador por papel — simulação de dispositivos reais.
 * Um perfil por tela: dono, gerente, garçom, cozinheiro, limpeza, staff.
 * Usado na TopBar e na página Perfil para identificar "quem está a usar" o dispositivo.
 */

import type { StaffRole } from "../context/StaffCoreTypes";

export interface OperatorProfile {
  role: StaffRole;
  name: string;
  roleLabel: string;
  shortDescription: string;
}

export const OPERATOR_PROFILES: Record<StaffRole, OperatorProfile> = {
  owner: {
    role: "owner",
    name: "Comandante",
    roleLabel: "Dono",
    shortDescription: "Visão global, saúde da operação e tendências.",
  },
  manager: {
    role: "manager",
    name: "João Costa",
    roleLabel: "Gerente",
    shortDescription: "Execução, turno e equipa.",
  },
  waiter: {
    role: "waiter",
    name: "Ana Ferreira",
    roleLabel: "Garçom",
    shortDescription: "Sala, pedidos e mesas.",
  },
  kitchen: {
    role: "kitchen",
    name: "Rui Oliveira",
    roleLabel: "Cozinheiro",
    shortDescription: "Produção e KDS.",
  },
  cleaning: {
    role: "cleaning",
    name: "Sofia Martins",
    roleLabel: "Limpeza",
    shortDescription: "Checklists e tarefas de limpeza.",
  },
  worker: {
    role: "worker",
    name: "Pedro Silva",
    roleLabel: "Staff",
    shortDescription: "Tarefas e apoio operacional.",
  },
  delivery: {
    role: "delivery",
    name: "Carlos Lima",
    roleLabel: "Entregador",
    shortDescription: "Entregas, rotas e condutores.",
  },
};

export function getOperatorProfile(
  role: StaffRole | null | undefined,
): OperatorProfile | null {
  if (!role) return null;
  return OPERATOR_PROFILES[role] ?? null;
}

/**
 * Códigos do Demo Guide para "Inserir Código" — um por papel.
 * Funcionam com ?debug=1 na URL (modo mock). Formato: CHEF-XXXX-XX.
 */
export const TRIAL_GUIDE_CODES: Record<StaffRole, string> = {
  owner: "CHEF-CMDT-MOCK",
  manager: "CHEF-MGR-MOCK",
  waiter: "CHEF-WAIT-MOCK",
  kitchen: "CHEF-KIT-MOCK",
  cleaning: "CHEF-CLEA-MOCK",
  worker: "CHEF-STFF-MOCK",
  delivery: "CHEF-DLVR-MOCK",
};
