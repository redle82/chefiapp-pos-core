// @ts-nocheck
import type { StaffRole, OperatorAppId } from "../../pages/AppStaff/context/StaffCoreTypes";

/**
 * Mapeia um papel operacional para o app lógico principal.
 * Mantém a regra de que o operador não escolhe app manualmente:
 * o sistema decide o contexto inicial.
 */
export function resolveAppForRole(role: StaffRole): OperatorAppId {
  switch (role) {
    case "owner":
      return "owner";
    case "manager":
      return "manager";
    case "waiter":
      return "waiter";
    case "kitchen":
      return "kitchen";
    case "cleaning":
      return "cleaning";
    case "worker":
    default:
      // Worker genérico: tratar como staff de chão (waiter) por enquanto.
      return "waiter";
  }
}

/**
 * Resolve a rota raiz para o app adequado a partir do papel.
 * Exemplo: owner → /app/owner, waiter → /app/waiter.
 */
export function resolveAppRouteForRole(role: StaffRole): string {
  const app = resolveAppForRole(role);
  return `/app/${app}`;
}

