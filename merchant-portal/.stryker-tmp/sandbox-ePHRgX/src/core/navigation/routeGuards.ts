/**
 * Route guards — API nomeada sobre CoreFlow (fonte única: resolveNextRoute).
 * Para uso em testes e documentação; não duplica regras.
 * Ref: docs/architecture/NAVIGATION_CONTRACT.md
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
export function resolveEntryRoute(session: SessionLike, runtime: RuntimeLike): string {
  if (stryMutAct_9fa48("994")) {
    {}
  } else {
    stryCov_9fa48("994");
    const state: UserState = stryMutAct_9fa48("995") ? {} : (stryCov_9fa48("995"), {
      isAuthenticated: session.isAuthenticated,
      hasOrganization: stryMutAct_9fa48("996") ? runtime.hasOrganization && false : (stryCov_9fa48("996"), runtime.hasOrganization ?? (stryMutAct_9fa48("997") ? true : (stryCov_9fa48("997"), false))),
      hasRestaurant: stryMutAct_9fa48("998") ? runtime.hasRestaurant && runtime.hasOrganization : (stryCov_9fa48("998"), runtime.hasRestaurant ?? runtime.hasOrganization),
      currentPath: stryMutAct_9fa48("999") ? "" : (stryCov_9fa48("999"), "/auth/phone"),
      systemState: runtime.systemState,
      activated: runtime.activated
    });
    const decision = resolveNextRoute(state);
    if (stryMutAct_9fa48("1002") ? decision.type !== "REDIRECT" : stryMutAct_9fa48("1001") ? false : stryMutAct_9fa48("1000") ? true : (stryCov_9fa48("1000", "1001", "1002"), decision.type === (stryMutAct_9fa48("1003") ? "" : (stryCov_9fa48("1003"), "REDIRECT")))) return decision.to;
    return stryMutAct_9fa48("1004") ? "" : (stryCov_9fa48("1004"), "/auth/phone");
  }
}

/**
 * True se o estado permite aceder a rotas /op/ (TPV, KDS).
 * Em SETUP ou não ativado, CoreFlow redireciona para /app/activation.
 */
export function guardOpsRoutes(state: UserState): boolean {
  if (stryMutAct_9fa48("1005")) {
    {}
  } else {
    stryCov_9fa48("1005");
    const decision = resolveNextRoute(stryMutAct_9fa48("1006") ? {} : (stryCov_9fa48("1006"), {
      ...state,
      currentPath: stryMutAct_9fa48("1007") ? "" : (stryCov_9fa48("1007"), "/op/tpv")
    }));
    return stryMutAct_9fa48("1010") ? decision.type !== "ALLOW" : stryMutAct_9fa48("1009") ? false : stryMutAct_9fa48("1008") ? true : (stryCov_9fa48("1008", "1009", "1010"), decision.type === (stryMutAct_9fa48("1011") ? "" : (stryCov_9fa48("1011"), "ALLOW")));
  }
}

/**
 * True se o estado permite aceder a /app/dashboard (hasOrg + ativado).
 */
export function guardDashboard(state: UserState): boolean {
  if (stryMutAct_9fa48("1012")) {
    {}
  } else {
    stryCov_9fa48("1012");
    const decision = resolveNextRoute(stryMutAct_9fa48("1013") ? {} : (stryCov_9fa48("1013"), {
      ...state,
      currentPath: stryMutAct_9fa48("1014") ? "" : (stryCov_9fa48("1014"), "/app/dashboard")
    }));
    return stryMutAct_9fa48("1017") ? decision.type !== "ALLOW" : stryMutAct_9fa48("1016") ? false : stryMutAct_9fa48("1015") ? true : (stryCov_9fa48("1015", "1016", "1017"), decision.type === (stryMutAct_9fa48("1018") ? "" : (stryCov_9fa48("1018"), "ALLOW")));
  }
}