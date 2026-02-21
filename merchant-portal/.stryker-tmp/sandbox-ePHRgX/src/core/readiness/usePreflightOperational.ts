/**
 * usePreflightOperational — Hook que expõe o Preflight Operacional
 *
 * Uma única fonte de verdade para a UI: coreStatus, blockers, operationReady.
 * Usado pelo Dashboard (cartão Operação) e TPV (estado vazio, botão Abrir Turno).
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
import { useMemo } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useCoreHealth } from "../health/useCoreHealth";
import { useShift } from "../shift/ShiftContext";
import type { PreflightOperationalResult } from "./preflightOperational";
import { computePreflight } from "./preflightOperational";
import { runtimeToRestaurant } from "../restaurant/runtimeToRestaurant";
import { deriveRestaurantReadiness } from "../restaurant/deriveRestaurantReadiness";
export interface UsePreflightOptions {
  /** Desativar polling do health (ex.: quando já há outro consumer). */
  healthAutoStart?: boolean;
}

/**
 * Retorna o estado de preflight operacional (Core, menu, identidade, caixa/turno).
 */
export function usePreflightOperational(options: UsePreflightOptions = {}): PreflightOperationalResult {
  if (stryMutAct_9fa48("1500")) {
    {}
  } else {
    stryCov_9fa48("1500");
    const {
      healthAutoStart = stryMutAct_9fa48("1501") ? false : (stryCov_9fa48("1501"), true)
    } = options;
    const {
      status: coreStatus
    } = useCoreHealth(stryMutAct_9fa48("1502") ? {} : (stryCov_9fa48("1502"), {
      autoStart: healthAutoStart,
      pollInterval: 60000,
      downPollInterval: 30000
    }));
    const {
      runtime
    } = useRestaurantRuntime();
    const shift = useShift();
    return useMemo((): PreflightOperationalResult => {
      if (stryMutAct_9fa48("1503")) {
        {}
      } else {
        stryCov_9fa48("1503");
        // Adapter config-first: Runtime → Restaurant → Readiness.
        const restaurant = runtimeToRestaurant(stryMutAct_9fa48("1504") ? {} : (stryCov_9fa48("1504"), {
          runtime,
          // TODO: mapear owner real quando o Core o expuser diretamente.
          ownerUserId: stryMutAct_9fa48("1505") ? "" : (stryCov_9fa48("1505"), "runtime-owner-unavailable"),
          ownerPhone: stryMutAct_9fa48("1506") ? "" : (stryCov_9fa48("1506"), "runtime-owner-phone-unavailable")
        }));
        const restaurantReadiness = deriveRestaurantReadiness(restaurant);
        const hasPublishedMenu = stryMutAct_9fa48("1509") ? restaurantReadiness.configStatus !== "READY" : stryMutAct_9fa48("1508") ? false : stryMutAct_9fa48("1507") ? true : (stryCov_9fa48("1507", "1508", "1509"), restaurantReadiness.configStatus === (stryMutAct_9fa48("1510") ? "" : (stryCov_9fa48("1510"), "READY")));
        const hasIdentity = stryMutAct_9fa48("1511") ? restaurantReadiness.blockingReasons.includes("Identidade") : (stryCov_9fa48("1511"), !restaurantReadiness.blockingReasons.includes(stryMutAct_9fa48("1512") ? "" : (stryCov_9fa48("1512"), "Identidade")));
        const isCashOpen = stryMutAct_9fa48("1513") ? shift?.isShiftOpen && false : (stryCov_9fa48("1513"), (stryMutAct_9fa48("1514") ? shift.isShiftOpen : (stryCov_9fa48("1514"), shift?.isShiftOpen)) ?? (stryMutAct_9fa48("1515") ? true : (stryCov_9fa48("1515"), false)));
        return computePreflight(stryMutAct_9fa48("1516") ? {} : (stryCov_9fa48("1516"), {
          coreStatus,
          hasPublishedMenu,
          hasIdentity,
          isCashOpen
        }));
      }
    }, stryMutAct_9fa48("1517") ? [] : (stryCov_9fa48("1517"), [coreStatus, stryMutAct_9fa48("1518") ? runtime.isPublished : (stryCov_9fa48("1518"), runtime?.isPublished), stryMutAct_9fa48("1520") ? runtime.setup_status?.identity : stryMutAct_9fa48("1519") ? runtime?.setup_status.identity : (stryCov_9fa48("1519", "1520"), runtime?.setup_status?.identity), stryMutAct_9fa48("1521") ? shift.isShiftOpen : (stryCov_9fa48("1521"), shift?.isShiftOpen)]));
  }
}