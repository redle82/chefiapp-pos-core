/**
 * Restaurant Lifecycle State (jornada do utilizador)
 *
 * Fonte única de verdade para "em que ponto da vida do restaurante estamos".
 * Modelo atual: sem onboarding wizard; apenas um setup mínimo em
 * `/setup/restaurant-minimal` (alias técnico de bootstrap) antes do
 * Dashboard/config-first.
 *
 * Ref: docs/contracts/CONTRATO_VIDA_RESTAURANTE.md (v2)
 *
 * Não confundir com Lifecycle.ts (configured/published/operational).
 * Fluxo: Landing/Auth → Bootstrap (se ainda não houver organização) → Dashboard/Operação.
 */

export type RestaurantLifecycleState =
  | "VISITOR"
  | "BOOTSTRAP_REQUIRED"
  | "BOOTSTRAP_IN_PROGRESS"
  | "READY_TO_OPERATE";

export interface LifecycleStateInput {
  pathname: string;
  isAuthenticated: boolean;
  hasOrganization: boolean;
}

/** Rotas permitidas durante a fase de bootstrap (sem organização criada). */
const BOOTSTRAP_ALLOWED_ROUTES = [
  "/bootstrap",
  "/auth",
  "/setup/restaurant-minimal",
  "/welcome",
  "/onboarding",
  "/onboarding/assistant",
];

/** Rotas permitidas por estado (matriz do contrato v2 + onboarding 9 telas). */
const ROUTES_BY_STATE: Record<RestaurantLifecycleState, string[]> = {
  VISITOR: [
    "/",
    "/landing",
    "/pricing",
    "/features",
    "/auth",
    "/auth/email",
    "/auth/verify",
    "/auth/email",
    "/bootstrap",
    "/setup/restaurant-minimal",
    "/welcome",
    "/onboarding",
    "/trial-guide",
    "/trial",
    "/help/start-local",
  ],
  BOOTSTRAP_REQUIRED: BOOTSTRAP_ALLOWED_ROUTES,
  BOOTSTRAP_IN_PROGRESS: BOOTSTRAP_ALLOWED_ROUTES,
  READY_TO_OPERATE: [], // todas permitidas (tratado em isPathAllowedForState)
};

/** Destino canónico para redirecionamento quando a rota não é permitida. NAVIGATION_CONTRACT: sem org → /welcome. */
const CANONICAL_DESTINATION: Record<RestaurantLifecycleState, string> = {
  VISITOR: "/",
  BOOTSTRAP_REQUIRED: "/welcome",
  BOOTSTRAP_IN_PROGRESS: "/welcome",
  READY_TO_OPERATE: "/dashboard",
};

/**
 * Deriva o estado da jornada a partir do contexto atual.
 * Função pura e determinística.
 *
 * Prioridade (contrato v2): hasOrganization → READY; isAuthenticated → BOOTSTRAP_*; senão → VISITOR.
 *
 * Nota: onboarding 5min e rotas `/onboarding/*` foram removidos. O estado de
 * bootstrap usa apenas `/setup/restaurant-minimal` (e `/bootstrap` como alias
 * técnico legado).
 */
export function deriveLifecycleState(
  params: LifecycleStateInput,
): RestaurantLifecycleState {
  const { pathname, isAuthenticated, hasOrganization } = params;

  if (hasOrganization) {
    return "READY_TO_OPERATE";
  }

  if (isAuthenticated) {
    if (pathname === "/bootstrap" || pathname === "/setup/restaurant-minimal") {
      return "BOOTSTRAP_IN_PROGRESS";
    }
    return "BOOTSTRAP_REQUIRED";
  }

  return "VISITOR";
}

/**
 * Indica se a rota atual é permitida para o estado dado.
 */
export function isPathAllowedForState(
  pathname: string,
  state: RestaurantLifecycleState,
): boolean {
  // Public Void Protocol: /public/* is customer-facing — always allowed regardless of lifecycle state.
  if (pathname.startsWith("/public")) return true;
  if (state === "READY_TO_OPERATE") {
    return true;
  }
  const allowed = ROUTES_BY_STATE[state];
  return allowed.includes(pathname);
}

/**
 * Retorna o destino canónico para o estado (para redirecionamento).
 */
export function getCanonicalDestination(
  state: RestaurantLifecycleState,
): string {
  return CANONICAL_DESTINATION[state];
}

// =============================================================================
// SystemState (FASE C — estado único: SETUP | TRIAL | ACTIVE | SUSPENDED)
// Ref: docs/contracts/CONTRATO_TRIAL_REAL.md
// =============================================================================

export type SystemState = "SETUP" | "TRIAL" | "ACTIVE" | "SUSPENDED";

export interface SystemStateInput {
  hasOrganization: boolean;
  billingStatus: string | null | undefined;
  isBootstrapComplete: boolean;
}

/**
 * Deriva o estado do sistema (configuração vs trial vs pago vs suspenso).
 * Fonte única para UI e gates; não confundir com trial/pilot/live (removidos da UI).
 */
export function deriveSystemState(params: SystemStateInput): SystemState {
  if (!params.hasOrganization || !params.isBootstrapComplete) return "SETUP";
  const b = (params.billingStatus ?? "trial").toLowerCase();
  if (b === "trial" || b === "" || b === "free") return "TRIAL";
  if (b === "active" || b === "paid") return "ACTIVE";
  return "SUSPENDED";
}
