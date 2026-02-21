/**
 * Condição canónica de "restaurante válido para operação".
 *
 * Uma única fonte de verdade para "tenho um restaurante operacional?"
 * Evita dispersão de runtime.restaurant_id, identity?.name, TenantContext e IDs seed.
 *
 * @see docs/contracts/OPERATIONAL_NAVIGATION_SOVEREIGNTY.md
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
import { BackendType, getBackendType } from "../infra/backendAdapter";

/** IDs de seed/placeholder que não existem no Core; tratados como sem org para evitar 404. */
export const INVALID_OR_SEED_RESTAURANT_IDS = new Set<string>(stryMutAct_9fa48("1019") ? [] : (stryCov_9fa48("1019"), [stryMutAct_9fa48("1020") ? "" : (stryCov_9fa48("1020"), "00000000-0000-0000-0000-000000000100"), stryMutAct_9fa48("1021") ? "" : (stryCov_9fa48("1021"), "10000000-0000-0000-0000-000000000000")]));

/** Restaurante real (Sofia Gastrobar). Em Docker existe no Core (06-seed-enterprise, 20260226). */
export const SOFIA_RESTAURANT_ID = stryMutAct_9fa48("1022") ? "" : (stryCov_9fa48("1022"), "00000000-0000-0000-0000-000000000100");

/** @deprecated Use SOFIA_RESTAURANT_ID. Mantido para compatibilidade. */
export const SEED_RESTAURANT_ID = SOFIA_RESTAURANT_ID;

/** Restaurante de trial "Seu restaurante". Em Docker existe no Core (20260227). */
export const TRIAL_RESTAURANT_ID = stryMutAct_9fa48("1023") ? "" : (stryCov_9fa48("1023"), "00000000-0000-0000-0000-000000000099");
export interface OperationalRestaurantInput {
  restaurant_id: string | null;
  loading?: boolean;
}

/** Identity opcional para futuras regras (ex.: nome presente). */
export interface OperationalRestaurantIdentity {
  name?: string;
}

/**
 * Devolve true apenas se existe restaurant_id não vazio e não pertencente ao conjunto de IDs inválidos/seed.
 * Quando loading === true, pode devolver false para evitar decisões prematuras (uso opcional).
 * Em backend Docker, o restaurante de seed é considerado válido (existe no Core).
 */
export function hasOperationalRestaurant(runtime: OperationalRestaurantInput, _identity?: OperationalRestaurantIdentity | null): boolean {
  if (stryMutAct_9fa48("1024")) {
    {}
  } else {
    stryCov_9fa48("1024");
    if (stryMutAct_9fa48("1026") ? false : stryMutAct_9fa48("1025") ? true : (stryCov_9fa48("1025", "1026"), runtime.loading)) return stryMutAct_9fa48("1027") ? true : (stryCov_9fa48("1027"), false);
    const id = runtime.restaurant_id;
    if (stryMutAct_9fa48("1030") ? (!id || typeof id !== "string") && id.trim() === "" : stryMutAct_9fa48("1029") ? false : stryMutAct_9fa48("1028") ? true : (stryCov_9fa48("1028", "1029", "1030"), (stryMutAct_9fa48("1032") ? !id && typeof id !== "string" : stryMutAct_9fa48("1031") ? false : (stryCov_9fa48("1031", "1032"), (stryMutAct_9fa48("1033") ? id : (stryCov_9fa48("1033"), !id)) || (stryMutAct_9fa48("1035") ? typeof id === "string" : stryMutAct_9fa48("1034") ? false : (stryCov_9fa48("1034", "1035"), typeof id !== (stryMutAct_9fa48("1036") ? "" : (stryCov_9fa48("1036"), "string")))))) || (stryMutAct_9fa48("1038") ? id.trim() !== "" : stryMutAct_9fa48("1037") ? false : (stryCov_9fa48("1037", "1038"), (stryMutAct_9fa48("1039") ? id : (stryCov_9fa48("1039"), id.trim())) === (stryMutAct_9fa48("1040") ? "Stryker was here!" : (stryCov_9fa48("1040"), "")))))) return stryMutAct_9fa48("1041") ? true : (stryCov_9fa48("1041"), false);
    if (stryMutAct_9fa48("1044") ? getBackendType() !== BackendType.docker : stryMutAct_9fa48("1043") ? false : stryMutAct_9fa48("1042") ? true : (stryCov_9fa48("1042", "1043", "1044"), getBackendType() === BackendType.docker)) {
      if (stryMutAct_9fa48("1045")) {
        {}
      } else {
        stryCov_9fa48("1045");
        if (stryMutAct_9fa48("1048") ? id === SOFIA_RESTAURANT_ID && id === TRIAL_RESTAURANT_ID : stryMutAct_9fa48("1047") ? false : stryMutAct_9fa48("1046") ? true : (stryCov_9fa48("1046", "1047", "1048"), (stryMutAct_9fa48("1050") ? id !== SOFIA_RESTAURANT_ID : stryMutAct_9fa48("1049") ? false : (stryCov_9fa48("1049", "1050"), id === SOFIA_RESTAURANT_ID)) || (stryMutAct_9fa48("1052") ? id !== TRIAL_RESTAURANT_ID : stryMutAct_9fa48("1051") ? false : (stryCov_9fa48("1051", "1052"), id === TRIAL_RESTAURANT_ID)))) return stryMutAct_9fa48("1053") ? false : (stryCov_9fa48("1053"), true);
      }
    }
    return stryMutAct_9fa48("1054") ? INVALID_OR_SEED_RESTAURANT_IDS.has(id) : (stryCov_9fa48("1054"), !INVALID_OR_SEED_RESTAURANT_IDS.has(id));
  }
}