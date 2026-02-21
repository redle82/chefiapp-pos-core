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
 */function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
export type RestaurantLifecycleState = "VISITOR" | "BOOTSTRAP_REQUIRED" | "BOOTSTRAP_IN_PROGRESS" | "READY_TO_OPERATE";
export interface LifecycleStateInput {
  pathname: string;
  isAuthenticated: boolean;
  hasOrganization: boolean;
}

/** Rotas permitidas durante a fase de bootstrap (sem organização criada). */
const BOOTSTRAP_ALLOWED_ROUTES = ["/bootstrap", "/auth", "/setup/restaurant-minimal", "/welcome", "/onboarding", "/onboarding/assistant"];

/** Rotas permitidas por estado (matriz do contrato v2 + onboarding 9 telas). */
const ROUTES_BY_STATE: Record<RestaurantLifecycleState, string[]> = {
  VISITOR: ["/", "/landing", "/pricing", "/features", "/auth", "/auth/phone", "/auth/verify", "/auth/email", "/bootstrap", "/setup/restaurant-minimal", "/welcome", "/onboarding", "/trial-guide", "/trial", "/help/start-local"],
  BOOTSTRAP_REQUIRED: BOOTSTRAP_ALLOWED_ROUTES,
  BOOTSTRAP_IN_PROGRESS: BOOTSTRAP_ALLOWED_ROUTES,
  READY_TO_OPERATE: [] // todas permitidas (tratado em isPathAllowedForState)
};

/** Destino canónico para redirecionamento quando a rota não é permitida. NAVIGATION_CONTRACT: sem org → /welcome. */
const CANONICAL_DESTINATION: Record<RestaurantLifecycleState, string> = {
  VISITOR: "/",
  BOOTSTRAP_REQUIRED: "/welcome",
  BOOTSTRAP_IN_PROGRESS: "/welcome",
  READY_TO_OPERATE: "/dashboard"
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
export function deriveLifecycleState(params: LifecycleStateInput): RestaurantLifecycleState {
  const {
    pathname,
    isAuthenticated,
    hasOrganization
  } = params;
  if (hasOrganization) {
    return "READY_TO_OPERATE";
  }
  if (stryMutAct_9fa48("6") ? false : stryMutAct_9fa48("5") ? true : (stryCov_9fa48("5", "6"), isAuthenticated)) {
    if (stryMutAct_9fa48("9") ? pathname === "/bootstrap" && pathname === "/setup/restaurant-minimal" : stryMutAct_9fa48("8") ? false : stryMutAct_9fa48("7") ? true : (stryCov_9fa48("7", "8", "9"), (stryMutAct_9fa48("11") ? pathname !== "/bootstrap" : stryMutAct_9fa48("10") ? false : (stryCov_9fa48("10", "11"), pathname === (stryMutAct_9fa48("12") ? "" : (stryCov_9fa48("12"), "/bootstrap")))) || (stryMutAct_9fa48("14") ? pathname !== "/setup/restaurant-minimal" : stryMutAct_9fa48("13") ? false : (stryCov_9fa48("13", "14"), pathname === (stryMutAct_9fa48("15") ? "" : (stryCov_9fa48("15"), "/setup/restaurant-minimal")))))) {
      if (stryMutAct_9fa48("16")) {
        {}
      } else {
        stryCov_9fa48("16");
        return stryMutAct_9fa48("17") ? "" : (stryCov_9fa48("17"), "BOOTSTRAP_IN_PROGRESS");
      }
    }
    return stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), "BOOTSTRAP_REQUIRED");
  }
  return "VISITOR";
}

/**
 * Indica se a rota atual é permitida para o estado dado.
 */
export function isPathAllowedForState(pathname: string, state: RestaurantLifecycleState): boolean {
  if (state === "READY_TO_OPERATE") {
    return true;
  }
  const allowed = ROUTES_BY_STATE[state];
  return allowed.includes(pathname);
}

/**
 * Retorna o destino canónico para o estado (para redirecionamento).
 */
export function getCanonicalDestination(state: RestaurantLifecycleState): string {
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