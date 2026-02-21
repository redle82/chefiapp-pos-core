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
const BOOTSTRAP_ALLOWED_ROUTES = stryMutAct_9fa48("832") ? [] : (stryCov_9fa48("832"), [stryMutAct_9fa48("833") ? "" : (stryCov_9fa48("833"), "/bootstrap"), stryMutAct_9fa48("834") ? "" : (stryCov_9fa48("834"), "/auth"), stryMutAct_9fa48("835") ? "" : (stryCov_9fa48("835"), "/setup/restaurant-minimal"), stryMutAct_9fa48("836") ? "" : (stryCov_9fa48("836"), "/welcome"), stryMutAct_9fa48("837") ? "" : (stryCov_9fa48("837"), "/onboarding"), stryMutAct_9fa48("838") ? "" : (stryCov_9fa48("838"), "/onboarding/assistant")]);

/** Rotas permitidas por estado (matriz do contrato v2 + onboarding 9 telas). */
const ROUTES_BY_STATE: Record<RestaurantLifecycleState, string[]> = stryMutAct_9fa48("839") ? {} : (stryCov_9fa48("839"), {
  VISITOR: stryMutAct_9fa48("840") ? [] : (stryCov_9fa48("840"), [stryMutAct_9fa48("841") ? "" : (stryCov_9fa48("841"), "/"), stryMutAct_9fa48("842") ? "" : (stryCov_9fa48("842"), "/landing"), stryMutAct_9fa48("843") ? "" : (stryCov_9fa48("843"), "/pricing"), stryMutAct_9fa48("844") ? "" : (stryCov_9fa48("844"), "/features"), stryMutAct_9fa48("845") ? "" : (stryCov_9fa48("845"), "/auth"), stryMutAct_9fa48("846") ? "" : (stryCov_9fa48("846"), "/auth/phone"), stryMutAct_9fa48("847") ? "" : (stryCov_9fa48("847"), "/auth/verify"), stryMutAct_9fa48("848") ? "" : (stryCov_9fa48("848"), "/auth/email"), stryMutAct_9fa48("849") ? "" : (stryCov_9fa48("849"), "/bootstrap"), stryMutAct_9fa48("850") ? "" : (stryCov_9fa48("850"), "/setup/restaurant-minimal"), stryMutAct_9fa48("851") ? "" : (stryCov_9fa48("851"), "/welcome"), stryMutAct_9fa48("852") ? "" : (stryCov_9fa48("852"), "/onboarding"), stryMutAct_9fa48("853") ? "" : (stryCov_9fa48("853"), "/trial-guide"), stryMutAct_9fa48("854") ? "" : (stryCov_9fa48("854"), "/trial"), stryMutAct_9fa48("855") ? "" : (stryCov_9fa48("855"), "/help/start-local")]),
  BOOTSTRAP_REQUIRED: BOOTSTRAP_ALLOWED_ROUTES,
  BOOTSTRAP_IN_PROGRESS: BOOTSTRAP_ALLOWED_ROUTES,
  READY_TO_OPERATE: stryMutAct_9fa48("856") ? ["Stryker was here"] : (stryCov_9fa48("856"), []) // todas permitidas (tratado em isPathAllowedForState)
});

/** Destino canónico para redirecionamento quando a rota não é permitida. NAVIGATION_CONTRACT: sem org → /welcome. */
const CANONICAL_DESTINATION: Record<RestaurantLifecycleState, string> = stryMutAct_9fa48("857") ? {} : (stryCov_9fa48("857"), {
  VISITOR: stryMutAct_9fa48("858") ? "" : (stryCov_9fa48("858"), "/"),
  BOOTSTRAP_REQUIRED: stryMutAct_9fa48("859") ? "" : (stryCov_9fa48("859"), "/welcome"),
  BOOTSTRAP_IN_PROGRESS: stryMutAct_9fa48("860") ? "" : (stryCov_9fa48("860"), "/welcome"),
  READY_TO_OPERATE: stryMutAct_9fa48("861") ? "" : (stryCov_9fa48("861"), "/dashboard")
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
  if (stryMutAct_9fa48("862")) {
    {}
  } else {
    stryCov_9fa48("862");
    const {
      pathname,
      isAuthenticated,
      hasOrganization
    } = params;
    if (stryMutAct_9fa48("864") ? false : stryMutAct_9fa48("863") ? true : (stryCov_9fa48("863", "864"), hasOrganization)) {
      if (stryMutAct_9fa48("865")) {
        {}
      } else {
        stryCov_9fa48("865");
        return stryMutAct_9fa48("866") ? "" : (stryCov_9fa48("866"), "READY_TO_OPERATE");
      }
    }
    if (stryMutAct_9fa48("868") ? false : stryMutAct_9fa48("867") ? true : (stryCov_9fa48("867", "868"), isAuthenticated)) {
      if (stryMutAct_9fa48("869")) {
        {}
      } else {
        stryCov_9fa48("869");
        if (stryMutAct_9fa48("872") ? pathname === "/bootstrap" && pathname === "/setup/restaurant-minimal" : stryMutAct_9fa48("871") ? false : stryMutAct_9fa48("870") ? true : (stryCov_9fa48("870", "871", "872"), (stryMutAct_9fa48("874") ? pathname !== "/bootstrap" : stryMutAct_9fa48("873") ? false : (stryCov_9fa48("873", "874"), pathname === (stryMutAct_9fa48("875") ? "" : (stryCov_9fa48("875"), "/bootstrap")))) || (stryMutAct_9fa48("877") ? pathname !== "/setup/restaurant-minimal" : stryMutAct_9fa48("876") ? false : (stryCov_9fa48("876", "877"), pathname === (stryMutAct_9fa48("878") ? "" : (stryCov_9fa48("878"), "/setup/restaurant-minimal")))))) {
          if (stryMutAct_9fa48("879")) {
            {}
          } else {
            stryCov_9fa48("879");
            return stryMutAct_9fa48("880") ? "" : (stryCov_9fa48("880"), "BOOTSTRAP_IN_PROGRESS");
          }
        }
        return stryMutAct_9fa48("881") ? "" : (stryCov_9fa48("881"), "BOOTSTRAP_REQUIRED");
      }
    }
    return stryMutAct_9fa48("882") ? "" : (stryCov_9fa48("882"), "VISITOR");
  }
}

/**
 * Indica se a rota atual é permitida para o estado dado.
 */
export function isPathAllowedForState(pathname: string, state: RestaurantLifecycleState): boolean {
  if (stryMutAct_9fa48("883")) {
    {}
  } else {
    stryCov_9fa48("883");
    if (stryMutAct_9fa48("886") ? state !== "READY_TO_OPERATE" : stryMutAct_9fa48("885") ? false : stryMutAct_9fa48("884") ? true : (stryCov_9fa48("884", "885", "886"), state === (stryMutAct_9fa48("887") ? "" : (stryCov_9fa48("887"), "READY_TO_OPERATE")))) {
      if (stryMutAct_9fa48("888")) {
        {}
      } else {
        stryCov_9fa48("888");
        return stryMutAct_9fa48("889") ? false : (stryCov_9fa48("889"), true);
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
  if (stryMutAct_9fa48("890")) {
    {}
  } else {
    stryCov_9fa48("890");
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
  if (stryMutAct_9fa48("891")) {
    {}
  } else {
    stryCov_9fa48("891");
    if (stryMutAct_9fa48("894") ? !params.hasOrganization && !params.isBootstrapComplete : stryMutAct_9fa48("893") ? false : stryMutAct_9fa48("892") ? true : (stryCov_9fa48("892", "893", "894"), (stryMutAct_9fa48("895") ? params.hasOrganization : (stryCov_9fa48("895"), !params.hasOrganization)) || (stryMutAct_9fa48("896") ? params.isBootstrapComplete : (stryCov_9fa48("896"), !params.isBootstrapComplete)))) return stryMutAct_9fa48("897") ? "" : (stryCov_9fa48("897"), "SETUP");
    const b = stryMutAct_9fa48("898") ? (params.billingStatus ?? "trial").toUpperCase() : (stryCov_9fa48("898"), (stryMutAct_9fa48("899") ? params.billingStatus && "trial" : (stryCov_9fa48("899"), params.billingStatus ?? (stryMutAct_9fa48("900") ? "" : (stryCov_9fa48("900"), "trial")))).toLowerCase());
    if (stryMutAct_9fa48("903") ? (b === "trial" || b === "") && b === "free" : stryMutAct_9fa48("902") ? false : stryMutAct_9fa48("901") ? true : (stryCov_9fa48("901", "902", "903"), (stryMutAct_9fa48("905") ? b === "trial" && b === "" : stryMutAct_9fa48("904") ? false : (stryCov_9fa48("904", "905"), (stryMutAct_9fa48("907") ? b !== "trial" : stryMutAct_9fa48("906") ? false : (stryCov_9fa48("906", "907"), b === (stryMutAct_9fa48("908") ? "" : (stryCov_9fa48("908"), "trial")))) || (stryMutAct_9fa48("910") ? b !== "" : stryMutAct_9fa48("909") ? false : (stryCov_9fa48("909", "910"), b === (stryMutAct_9fa48("911") ? "Stryker was here!" : (stryCov_9fa48("911"), "")))))) || (stryMutAct_9fa48("913") ? b !== "free" : stryMutAct_9fa48("912") ? false : (stryCov_9fa48("912", "913"), b === (stryMutAct_9fa48("914") ? "" : (stryCov_9fa48("914"), "free")))))) return stryMutAct_9fa48("915") ? "" : (stryCov_9fa48("915"), "TRIAL");
    if (stryMutAct_9fa48("918") ? b === "active" && b === "paid" : stryMutAct_9fa48("917") ? false : stryMutAct_9fa48("916") ? true : (stryCov_9fa48("916", "917", "918"), (stryMutAct_9fa48("920") ? b !== "active" : stryMutAct_9fa48("919") ? false : (stryCov_9fa48("919", "920"), b === (stryMutAct_9fa48("921") ? "" : (stryCov_9fa48("921"), "active")))) || (stryMutAct_9fa48("923") ? b !== "paid" : stryMutAct_9fa48("922") ? false : (stryCov_9fa48("922", "923"), b === (stryMutAct_9fa48("924") ? "" : (stryCov_9fa48("924"), "paid")))))) return stryMutAct_9fa48("925") ? "" : (stryCov_9fa48("925"), "ACTIVE");
    return stryMutAct_9fa48("926") ? "" : (stryCov_9fa48("926"), "SUSPENDED");
  }
}