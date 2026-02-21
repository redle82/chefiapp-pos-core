/**
 * AppStaff RBAC — permissões por papel (ACCESS_RULES_MINIMAL, CORE_APPSTAFF_CONTRACT).
 * Usado na UI para mostrar/esconder módulos e acções; chamadas ao Core com role inválido
 * devem ser rejeitadas (403) e logadas.
 */
// @ts-nocheck


export type AppStaffRole =
  | "owner"
  | "manager"
  | "waiter"
  | "staff"
  | "kitchen"
  | "cleaning"
  | "worker"
  | "cashier"
  | "auditor";

export interface AppStaffPermissions {
  /** Fechar caixa / fechar financeiro (Owner, Manager only) */
  canCloseCash: boolean;
  /** Criar tarefa (Owner, Manager) */
  canCreateTask: boolean;
  /** Atribuir tarefa a outro (Owner, Manager) */
  canAssignTask: boolean;
  /** Ver faturação global (Owner, Manager) */
  canSeeBilling: boolean;
  /** Marcar pedido SERVED / entregar (Owner, Manager, Waiter/Staff) */
  canMarkServed: boolean;
  /** Ver Orders Lite (pedidos OPEN→READY) — Waiter/Staff/Manager/Owner; Kitchen não salão */
  canSeeOrdersLite: boolean;
  /** Ver KDS Lite (IN_PREP, READY) */
  canSeeKDSLite: boolean;
  /** Ver Inventory Lite e alertas "repor X" */
  canSeeInventoryLite: boolean;
  /** Ver métricas de equipa / handover */
  canSeeTeamMetrics: boolean;
  /** Apenas leitura (Auditor): sem execução */
  readOnly: boolean;
}

/**
 * Normaliza role do StaffContext para AppStaffRole (waiter ↔ staff).
 */
export function normalizeToAppStaffRole(
  role: string | undefined | null
): AppStaffRole {
  if (!role) return "worker";
  const r = role.toLowerCase();
  if (r === "owner" || r === "manager") return r as "owner" | "manager";
  if (r === "waiter" || r === "staff") return "waiter";
  if (
    r === "kitchen" ||
    r === "cleaning" ||
    r === "worker" ||
    r === "cashier" ||
    r === "auditor"
  )
    return r as AppStaffRole;
  return "worker";
}

/**
 * Devolve permissões AppStaff para o papel dado (ACCESS_RULES_MINIMAL).
 */
export function getAppStaffPermissions(
  role: AppStaffRole | string | undefined | null
): AppStaffPermissions {
  const r = normalizeToAppStaffRole(
    typeof role === "string" ? role : undefined
  );

  switch (r) {
    case "owner":
      return {
        canCloseCash: true,
        canCreateTask: true,
        canAssignTask: true,
        canSeeBilling: true,
        canMarkServed: true,
        canSeeOrdersLite: true,
        canSeeKDSLite: true,
        canSeeInventoryLite: true,
        canSeeTeamMetrics: true,
        readOnly: false,
      };
    case "manager":
      return {
        canCloseCash: true,
        canCreateTask: true,
        canAssignTask: true,
        canSeeBilling: true,
        canMarkServed: true,
        canSeeOrdersLite: true,
        canSeeKDSLite: true,
        canSeeInventoryLite: true,
        canSeeTeamMetrics: true,
        readOnly: false,
      };
    case "waiter":
    case "staff":
      return {
        canCloseCash: false,
        canCreateTask: false,
        canAssignTask: false,
        canSeeBilling: false,
        canMarkServed: true,
        canSeeOrdersLite: true,
        canSeeKDSLite: true,
        canSeeInventoryLite: true,
        canSeeTeamMetrics: false,
        readOnly: false,
      };
    case "kitchen":
      return {
        canCloseCash: false,
        canCreateTask: false,
        canAssignTask: false,
        canSeeBilling: false,
        canMarkServed: false,
        canSeeOrdersLite: false,
        canSeeKDSLite: true,
        canSeeInventoryLite: true,
        canSeeTeamMetrics: false,
        readOnly: false,
      };
    case "cashier":
      return {
        canCloseCash: false,
        canCreateTask: false,
        canAssignTask: false,
        canSeeBilling: false,
        canMarkServed: true,
        canSeeOrdersLite: true,
        canSeeKDSLite: false,
        canSeeInventoryLite: false,
        canSeeTeamMetrics: false,
        readOnly: false,
      };
    case "auditor":
      return {
        canCloseCash: false,
        canCreateTask: false,
        canAssignTask: false,
        canSeeBilling: false,
        canMarkServed: false,
        canSeeOrdersLite: true,
        canSeeKDSLite: true,
        canSeeInventoryLite: true,
        canSeeTeamMetrics: true,
        readOnly: true,
      };
    default:
      // worker, cleaning, etc.
      return {
        canCloseCash: false,
        canCreateTask: false,
        canAssignTask: false,
        canSeeBilling: false,
        canMarkServed: false,
        canSeeOrdersLite: true,
        canSeeKDSLite: true,
        canSeeInventoryLite: true,
        canSeeTeamMetrics: false,
        readOnly: false,
      };
  }
}
