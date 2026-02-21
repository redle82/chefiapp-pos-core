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
// @ts-nocheck
function stryNS_9fa48() {
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
const BOOTSTRAP_ALLOWED_ROUTES = stryMutAct_9fa48("899") ? [] : (stryCov_9fa48("899"), [stryMutAct_9fa48("900") ? "" : (stryCov_9fa48("900"), "/bootstrap"), stryMutAct_9fa48("901") ? "" : (stryCov_9fa48("901"), "/auth"), stryMutAct_9fa48("902") ? "" : (stryCov_9fa48("902"), "/setup/restaurant-minimal"), stryMutAct_9fa48("903") ? "" : (stryCov_9fa48("903"), "/welcome"), stryMutAct_9fa48("904") ? "" : (stryCov_9fa48("904"), "/onboarding"), stryMutAct_9fa48("905") ? "" : (stryCov_9fa48("905"), "/onboarding/assistant")]);

/** Rotas permitidas por estado (matriz do contrato v2 + onboarding 9 telas). */
const ROUTES_BY_STATE: Record<RestaurantLifecycleState, string[]> = stryMutAct_9fa48("906") ? {} : (stryCov_9fa48("906"), {
  VISITOR: stryMutAct_9fa48("907") ? [] : (stryCov_9fa48("907"), [stryMutAct_9fa48("908") ? "" : (stryCov_9fa48("908"), "/"), stryMutAct_9fa48("909") ? "" : (stryCov_9fa48("909"), "/landing"), stryMutAct_9fa48("910") ? "" : (stryCov_9fa48("910"), "/pricing"), stryMutAct_9fa48("911") ? "" : (stryCov_9fa48("911"), "/features"), stryMutAct_9fa48("912") ? "" : (stryCov_9fa48("912"), "/auth"), stryMutAct_9fa48("913") ? "" : (stryCov_9fa48("913"), "/auth/phone"), stryMutAct_9fa48("914") ? "" : (stryCov_9fa48("914"), "/auth/verify"), stryMutAct_9fa48("915") ? "" : (stryCov_9fa48("915"), "/auth/email"), stryMutAct_9fa48("916") ? "" : (stryCov_9fa48("916"), "/bootstrap"), stryMutAct_9fa48("917") ? "" : (stryCov_9fa48("917"), "/setup/restaurant-minimal"), stryMutAct_9fa48("918") ? "" : (stryCov_9fa48("918"), "/welcome"), stryMutAct_9fa48("919") ? "" : (stryCov_9fa48("919"), "/onboarding"), stryMutAct_9fa48("920") ? "" : (stryCov_9fa48("920"), "/trial-guide"), stryMutAct_9fa48("921") ? "" : (stryCov_9fa48("921"), "/trial"), stryMutAct_9fa48("922") ? "" : (stryCov_9fa48("922"), "/help/start-local")]),
  BOOTSTRAP_REQUIRED: BOOTSTRAP_ALLOWED_ROUTES,
  BOOTSTRAP_IN_PROGRESS: BOOTSTRAP_ALLOWED_ROUTES,
  READY_TO_OPERATE: stryMutAct_9fa48("923") ? ["Stryker was here"] : (stryCov_9fa48("923"), []) // todas permitidas (tratado em isPathAllowedForState)
});

/** Destino canónico para redirecionamento quando a rota não é permitida. NAVIGATION_CONTRACT: sem org → /welcome. */
const CANONICAL_DESTINATION: Record<RestaurantLifecycleState, string> = stryMutAct_9fa48("924") ? {} : (stryCov_9fa48("924"), {
  VISITOR: stryMutAct_9fa48("925") ? "" : (stryCov_9fa48("925"), "/"),
  BOOTSTRAP_REQUIRED: stryMutAct_9fa48("926") ? "" : (stryCov_9fa48("926"), "/welcome"),
  BOOTSTRAP_IN_PROGRESS: stryMutAct_9fa48("927") ? "" : (stryCov_9fa48("927"), "/welcome"),
  READY_TO_OPERATE: stryMutAct_9fa48("928") ? "" : (stryCov_9fa48("928"), "/dashboard")
});

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
  if (stryMutAct_9fa48("929")) {
    {}
  } else {
    stryCov_9fa48("929");
    const {
      pathname,
      isAuthenticated,
      hasOrganization
    } = params;
    if (stryMutAct_9fa48("931") ? false : stryMutAct_9fa48("930") ? true : (stryCov_9fa48("930", "931"), hasOrganization)) {
      if (stryMutAct_9fa48("932")) {
        {}
      } else {
        stryCov_9fa48("932");
        return stryMutAct_9fa48("933") ? "" : (stryCov_9fa48("933"), "READY_TO_OPERATE");
      }
    }
    if (stryMutAct_9fa48("935") ? false : stryMutAct_9fa48("934") ? true : (stryCov_9fa48("934", "935"), isAuthenticated)) {
      if (stryMutAct_9fa48("936")) {
        {}
      } else {
        stryCov_9fa48("936");
        if (stryMutAct_9fa48("939") ? pathname === "/bootstrap" && pathname === "/setup/restaurant-minimal" : stryMutAct_9fa48("938") ? false : stryMutAct_9fa48("937") ? true : (stryCov_9fa48("937", "938", "939"), (stryMutAct_9fa48("941") ? pathname !== "/bootstrap" : stryMutAct_9fa48("940") ? false : (stryCov_9fa48("940", "941"), pathname === (stryMutAct_9fa48("942") ? "" : (stryCov_9fa48("942"), "/bootstrap")))) || (stryMutAct_9fa48("944") ? pathname !== "/setup/restaurant-minimal" : stryMutAct_9fa48("943") ? false : (stryCov_9fa48("943", "944"), pathname === (stryMutAct_9fa48("945") ? "" : (stryCov_9fa48("945"), "/setup/restaurant-minimal")))))) {
          if (stryMutAct_9fa48("946")) {
            {}
          } else {
            stryCov_9fa48("946");
            return stryMutAct_9fa48("947") ? "" : (stryCov_9fa48("947"), "BOOTSTRAP_IN_PROGRESS");
          }
        }
        return stryMutAct_9fa48("948") ? "" : (stryCov_9fa48("948"), "BOOTSTRAP_REQUIRED");
      }
    }
    return stryMutAct_9fa48("949") ? "" : (stryCov_9fa48("949"), "VISITOR");
  }
}

/**
 * Indica se a rota atual é permitida para o estado dado.
 */
export function isPathAllowedForState(pathname: string, state: RestaurantLifecycleState): boolean {
  if (stryMutAct_9fa48("950")) {
    {}
  } else {
    stryCov_9fa48("950");
    if (stryMutAct_9fa48("953") ? state !== "READY_TO_OPERATE" : stryMutAct_9fa48("952") ? false : stryMutAct_9fa48("951") ? true : (stryCov_9fa48("951", "952", "953"), state === (stryMutAct_9fa48("954") ? "" : (stryCov_9fa48("954"), "READY_TO_OPERATE")))) {
      if (stryMutAct_9fa48("955")) {
        {}
      } else {
        stryCov_9fa48("955");
        return stryMutAct_9fa48("956") ? false : (stryCov_9fa48("956"), true);
      }
    }
    const allowed = ROUTES_BY_STATE[state];
    return allowed.includes(pathname);
  }
}

/**
 * Retorna o destino canónico para o estado (para redirecionamento).
 */
export function getCanonicalDestination(state: RestaurantLifecycleState): string {
  if (stryMutAct_9fa48("957")) {
    {}
  } else {
    stryCov_9fa48("957");
    return CANONICAL_DESTINATION[state];
  }
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
  if (stryMutAct_9fa48("958")) {
    {}
  } else {
    stryCov_9fa48("958");
    if (stryMutAct_9fa48("961") ? !params.hasOrganization && !params.isBootstrapComplete : stryMutAct_9fa48("960") ? false : stryMutAct_9fa48("959") ? true : (stryCov_9fa48("959", "960", "961"), (stryMutAct_9fa48("962") ? params.hasOrganization : (stryCov_9fa48("962"), !params.hasOrganization)) || (stryMutAct_9fa48("963") ? params.isBootstrapComplete : (stryCov_9fa48("963"), !params.isBootstrapComplete)))) return stryMutAct_9fa48("964") ? "" : (stryCov_9fa48("964"), "SETUP");
    const b = stryMutAct_9fa48("965") ? (params.billingStatus ?? "trial").toUpperCase() : (stryCov_9fa48("965"), (stryMutAct_9fa48("966") ? params.billingStatus && "trial" : (stryCov_9fa48("966"), params.billingStatus ?? (stryMutAct_9fa48("967") ? "" : (stryCov_9fa48("967"), "trial")))).toLowerCase());
    if (stryMutAct_9fa48("970") ? (b === "trial" || b === "") && b === "free" : stryMutAct_9fa48("969") ? false : stryMutAct_9fa48("968") ? true : (stryCov_9fa48("968", "969", "970"), (stryMutAct_9fa48("972") ? b === "trial" && b === "" : stryMutAct_9fa48("971") ? false : (stryCov_9fa48("971", "972"), (stryMutAct_9fa48("974") ? b !== "trial" : stryMutAct_9fa48("973") ? false : (stryCov_9fa48("973", "974"), b === (stryMutAct_9fa48("975") ? "" : (stryCov_9fa48("975"), "trial")))) || (stryMutAct_9fa48("977") ? b !== "" : stryMutAct_9fa48("976") ? false : (stryCov_9fa48("976", "977"), b === (stryMutAct_9fa48("978") ? "Stryker was here!" : (stryCov_9fa48("978"), "")))))) || (stryMutAct_9fa48("980") ? b !== "free" : stryMutAct_9fa48("979") ? false : (stryCov_9fa48("979", "980"), b === (stryMutAct_9fa48("981") ? "" : (stryCov_9fa48("981"), "free")))))) return stryMutAct_9fa48("982") ? "" : (stryCov_9fa48("982"), "TRIAL");
    if (stryMutAct_9fa48("985") ? b === "active" && b === "paid" : stryMutAct_9fa48("984") ? false : stryMutAct_9fa48("983") ? true : (stryCov_9fa48("983", "984", "985"), (stryMutAct_9fa48("987") ? b !== "active" : stryMutAct_9fa48("986") ? false : (stryCov_9fa48("986", "987"), b === (stryMutAct_9fa48("988") ? "" : (stryCov_9fa48("988"), "active")))) || (stryMutAct_9fa48("990") ? b !== "paid" : stryMutAct_9fa48("989") ? false : (stryCov_9fa48("989", "990"), b === (stryMutAct_9fa48("991") ? "" : (stryCov_9fa48("991"), "paid")))))) return stryMutAct_9fa48("992") ? "" : (stryCov_9fa48("992"), "ACTIVE");
    return stryMutAct_9fa48("993") ? "" : (stryCov_9fa48("993"), "SUSPENDED");
  }
}