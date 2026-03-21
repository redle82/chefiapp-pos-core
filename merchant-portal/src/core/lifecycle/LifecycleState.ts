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
  "/setup",
  "/setup/start",
  "/setup/identity",
  "/setup/location",
  "/setup/hours",
  "/setup/catalog",
  "/setup/inventory",
  "/setup/staff",
  "/setup/payments",
  "/setup/integrations",
  "/setup/publish",
  "/setup/review",
  "/setup/activate",
  "/setup/restaurant-minimal",
  "/welcome",
  "/onboarding",
  "/onboarding/assistant",
  "/onboarding/intro",
  "/onboarding/identity",
  "/onboarding/location",
  "/onboarding/day-profile",
  "/onboarding/shift-setup",
  "/onboarding/products",
  "/onboarding/tpv-preview",
  "/onboarding/plan-trial",
  "/onboarding/ritual-open",
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
    "/setup",
    "/setup/start",
    "/setup/identity",
    "/setup/location",
    "/setup/hours",
    "/setup/catalog",
    "/setup/inventory",
    "/setup/staff",
    "/setup/payments",
    "/setup/integrations",
    "/setup/publish",
    "/setup/review",
    "/setup/activate",
    "/setup/restaurant-minimal",
    "/welcome",
    "/onboarding",
    "/onboarding/intro",
    "/onboarding/identity",
    "/onboarding/location",
    "/onboarding/day-profile",
    "/onboarding/shift-setup",
    "/onboarding/products",
    "/onboarding/tpv-preview",
    "/onboarding/plan-trial",
    "/onboarding/ritual-open",
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
  BOOTSTRAP_REQUIRED: "/setup/start",
  BOOTSTRAP_IN_PROGRESS: "/setup/start",
  READY_TO_OPERATE: "/dashboard",
};

/**
 * Deriva o estado da jornada a partir do contexto atual.
 * Função pura e determinística.
 *
 * Prioridade (contrato v2): hasOrganization → READY; isAuthenticated → BOOTSTRAP_*; senão → VISITOR.
 *
 * Nota: onboarding completo com 9 telas (`/onboarding/*`) está registado.
 * O estado BOOTSTRAP_IN_PROGRESS é derivado quando o utilizador está em
 * qualquer sub-rota de `/onboarding/`.
 */
export function deriveLifecycleState(
  params: LifecycleStateInput,
): RestaurantLifecycleState {
  const { pathname, isAuthenticated, hasOrganization } = params;

  if (hasOrganization) {
    return "READY_TO_OPERATE";
  }

  if (isAuthenticated) {
    if (
      pathname === "/bootstrap" ||
      pathname === "/setup/restaurant-minimal" ||
      pathname.startsWith("/setup/") ||
      pathname === "/setup" ||
      pathname.startsWith("/onboarding/")
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
  state: RestaurantLifecycleState,
): boolean {
  // Public Void Protocol: /public/* is customer-facing — always allowed regardless of lifecycle state.
  if (pathname.startsWith("/public")) return true;
  if (state === "READY_TO_OPERATE") {
    return true;
  }
  const allowed = ROUTES_BY_STATE[state];
  // Exact match or prefix match for /onboarding/* and /setup/* sub-routes
  return (
    allowed.includes(pathname) ||
    (pathname.startsWith("/onboarding/") && allowed.some(r => r.startsWith("/onboarding/"))) ||
    (pathname.startsWith("/setup/") && allowed.some(r => r.startsWith("/setup/"))) ||
    (pathname.startsWith("/setup") && allowed.includes("/setup"))
  );
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
