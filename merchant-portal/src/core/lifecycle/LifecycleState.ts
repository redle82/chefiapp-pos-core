/**
 * Restaurant Lifecycle State (jornada do utilizador)
 *
 * Fonte única de verdade para "em que ponto da vida do restaurante estamos".
 * Alinhado à Sequência Canônica v1.0 e ao Onboarding 5min (9 telas): docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 * VISITOR → passos 1–2 (Landing, Auth); BOOTSTRAP_* → onboarding 9 telas ou bootstrap/first-product (legado); READY_TO_OPERATE → passos 6–8.
 *
 * Ref: docs/contracts/CONTRATO_VIDA_RESTAURANTE.md (v2)
 *
 * Não confundir com Lifecycle.ts (configured/published/operational).
 * v2: Eliminados DEMO_GUIDED e DEMO_FINISHED; fluxo único Landing → Auth → Bootstrap → Operação.
 */

import { ONBOARDING_5MIN_ALL_ROUTES } from "../flow/onboarding5minState";

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

/** Rotas de onboarding 5min (9 telas) + legado bootstrap/first-product. */
const BOOTSTRAP_ALLOWED_ROUTES = [
  "/bootstrap",
  "/auth",
  "/onboarding/first-product",
  ...ONBOARDING_5MIN_ALL_ROUTES,
];

/** Rotas permitidas por estado (matriz do contrato v2 + onboarding 9 telas). */
const ROUTES_BY_STATE: Record<RestaurantLifecycleState, string[]> = {
  VISITOR: [
    "/",
    "/landing",
    "/pricing",
    "/features",
    "/auth",
    "/demo-guiado",
    "/demo",
    "/help/start-local",
  ],
  BOOTSTRAP_REQUIRED: BOOTSTRAP_ALLOWED_ROUTES,
  BOOTSTRAP_IN_PROGRESS: BOOTSTRAP_ALLOWED_ROUTES,
  READY_TO_OPERATE: [], // todas permitidas (tratado em isPathAllowedForState)
};

/** Destino canónico para redirecionamento quando a rota não é permitida. Onboarding 5min: início em intro. */
const CANONICAL_DESTINATION: Record<RestaurantLifecycleState, string> = {
  VISITOR: "/",
  BOOTSTRAP_REQUIRED: "/onboarding/intro",
  BOOTSTRAP_IN_PROGRESS: "/onboarding/intro",
  READY_TO_OPERATE: "/dashboard",
};

/**
 * Deriva o estado da jornada a partir do contexto atual.
 * Função pura e determinística.
 *
 * Prioridade (contrato v2): hasOrganization → READY; isAuthenticated → BOOTSTRAP_*; senão → VISITOR.
 */
export function deriveLifecycleState(
  params: LifecycleStateInput
): RestaurantLifecycleState {
  const { pathname, isAuthenticated, hasOrganization } = params;

  if (hasOrganization) {
    return "READY_TO_OPERATE";
  }

  if (isAuthenticated) {
    if (
      pathname === "/bootstrap" ||
      pathname === "/onboarding/first-product" ||
      ONBOARDING_5MIN_ALL_ROUTES.includes(pathname)
    ) {
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
  state: RestaurantLifecycleState
): boolean {
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
  state: RestaurantLifecycleState
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
 * Fonte única para UI e gates; não confundir com demo/pilot/live (removidos da UI).
 */
export function deriveSystemState(params: SystemStateInput): SystemState {
  if (!params.hasOrganization || !params.isBootstrapComplete) return "SETUP";
  const b = (params.billingStatus ?? "trial").toLowerCase();
  if (b === "trial" || b === "" || b === "free") return "TRIAL";
  if (b === "active" || b === "paid") return "ACTIVE";
  return "SUSPENDED";
}
