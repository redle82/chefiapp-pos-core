/**
 * Route guards — API nomeada sobre CoreFlow (fonte única: resolveNextRoute).
 * Para uso em testes e documentação; não duplica regras.
 * Ref: docs/architecture/NAVIGATION_CONTRACT.md
 */

import type { UserState } from "../flow/CoreFlow";
import { resolveNextRoute } from "../flow/CoreFlow";

/** Dados mínimos de sessão para construir UserState de entrada. */
export interface SessionLike {
  /** Utilizador autenticado. */
  isAuthenticated: boolean;
}

/** Dados mínimos de runtime (tenant/restaurante) para construir UserState. */
export interface RuntimeLike {
  hasOrganization?: boolean;
  hasRestaurant?: boolean;
  activated?: boolean;
  systemState?: "SETUP" | "TRIAL" | "ACTIVE" | "SUSPENDED";
}

/**
 * Destino canónico após "entrada" (path de entrada = /auth/phone).
 * Chama resolveNextRoute e retorna o path para onde o utilizador deve ir.
 */
export function resolveEntryRoute(
  session: SessionLike,
  runtime: RuntimeLike,
): string {
  const state: UserState = {
    isAuthenticated: session.isAuthenticated,
    hasOrganization: runtime.hasOrganization ?? false,
    hasRestaurant: runtime.hasRestaurant ?? runtime.hasOrganization,
    currentPath: "/auth/phone",
    systemState: runtime.systemState,
    activated: runtime.activated,
  };
  const decision = resolveNextRoute(state);
  if (decision.type === "REDIRECT") return decision.to;
  return "/auth/phone";
}

/**
 * True se o estado permite aceder a rotas /op/ (TPV, KDS).
 * Em SETUP ou não ativado, CoreFlow redireciona para /app/activation.
 */
export function guardOpsRoutes(state: UserState): boolean {
  const decision = resolveNextRoute({
    ...state,
    currentPath: "/op/tpv",
  });
  return decision.type === "ALLOW";
}

/**
 * True se o estado permite aceder a /app/dashboard (hasOrg + ativado).
 */
export function guardDashboard(state: UserState): boolean {
  const decision = resolveNextRoute({
    ...state,
    currentPath: "/app/dashboard",
  });
  return decision.type === "ALLOW";
}
