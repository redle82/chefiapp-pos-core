/**
 * Preflight Operacional — Fonte de verdade para "operações prontas?"
 *
 * Um único módulo que expõe: coreStatus, canLoadProducts, hasPublishedMenu,
 * hasIdentity, isShiftActive, isCashOpen, blockers[].
 * Usado pelo Dashboard (cartão Operação) e TPV (estado vazio / Abrir Turno).
 *
 * Regras: não altera regras de negócio; apenas agrega estado para UX clara.
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
import type { CoreHealthStatus } from "../health/useCoreHealth";

/** Códigos de blocker acionáveis (mensagens claras para o humano). */
export type PreflightBlockerCode = "CORE_OFFLINE" | "NO_PUBLISHED_MENU" | "SHIFT_REQUIRED" | "CASH_REQUIRED" | "NO_IDENTITY";
export interface PreflightBlocker {
  code: PreflightBlockerCode;
  message: string;
}
export interface PreflightOperationalResult {
  /** UP = Core acessível; DOWN/UNKNOWN/DEGRADED = problemas. */
  coreStatus: CoreHealthStatus;
  /** true só quando coreStatus === 'UP' (catálogo pode ser carregado). */
  canLoadProducts: boolean;
  /** Menu publicado (restaurante operacional para venda). */
  hasPublishedMenu: boolean;
  /** Identidade do restaurante preenchida (setup identity). */
  hasIdentity: boolean;
  /** Turno/caixa aberto (gm_cash_registers status=open). */
  isShiftActive: boolean;
  /** Alias de isShiftActive (mesma autoridade: caixa = turno). */
  isCashOpen: boolean;
  /** Lista de blockers; vazia = operação pronta. */
  blockers: PreflightBlocker[];
  /** true quando não há blockers (operações TPV/KDS permitidas). */
  operationReady: boolean;
}
const BLOCKER_MESSAGES: Record<PreflightBlockerCode, string> = stryMutAct_9fa48("1055") ? {} : (stryCov_9fa48("1055"), {
  CORE_OFFLINE: stryMutAct_9fa48("1056") ? "" : (stryCov_9fa48("1056"), "Core está offline. Inicie o Docker Core para operar TPV/KDS."),
  NO_PUBLISHED_MENU: stryMutAct_9fa48("1057") ? "" : (stryCov_9fa48("1057"), "Menu não publicado. Publica no Menu Builder."),
  SHIFT_REQUIRED: stryMutAct_9fa48("1058") ? "" : (stryCov_9fa48("1058"), "Turno necessário. Abra o turno."),
  CASH_REQUIRED: stryMutAct_9fa48("1059") ? "" : (stryCov_9fa48("1059"), "Caixa fechado. Abra o caixa."),
  NO_IDENTITY: stryMutAct_9fa48("1060") ? "" : (stryCov_9fa48("1060"), "Identidade do restaurante incompleta. Configura em Config.")
});

/**
 * Calcula o resultado do preflight a partir do estado atual (função pura).
 * Fonte de verdade para derivar blockers e operationReady.
 */
export function computePreflight(params: {
  coreStatus: CoreHealthStatus;
  hasPublishedMenu: boolean;
  hasIdentity: boolean;
  isCashOpen: boolean;
}): PreflightOperationalResult {
  if (stryMutAct_9fa48("1061")) {
    {}
  } else {
    stryCov_9fa48("1061");
    const {
      coreStatus,
      hasPublishedMenu,
      hasIdentity,
      isCashOpen
    } = params;
    const isShiftActive = isCashOpen;
    const canLoadProducts = stryMutAct_9fa48("1064") ? coreStatus !== "UP" : stryMutAct_9fa48("1063") ? false : stryMutAct_9fa48("1062") ? true : (stryCov_9fa48("1062", "1063", "1064"), coreStatus === (stryMutAct_9fa48("1065") ? "" : (stryCov_9fa48("1065"), "UP")));
    const blockers: PreflightBlocker[] = stryMutAct_9fa48("1066") ? ["Stryker was here"] : (stryCov_9fa48("1066"), []);
    if (stryMutAct_9fa48("1069") ? coreStatus !== "UP" || coreStatus !== "DEGRADED" : stryMutAct_9fa48("1068") ? false : stryMutAct_9fa48("1067") ? true : (stryCov_9fa48("1067", "1068", "1069"), (stryMutAct_9fa48("1071") ? coreStatus === "UP" : stryMutAct_9fa48("1070") ? true : (stryCov_9fa48("1070", "1071"), coreStatus !== (stryMutAct_9fa48("1072") ? "" : (stryCov_9fa48("1072"), "UP")))) && (stryMutAct_9fa48("1074") ? coreStatus === "DEGRADED" : stryMutAct_9fa48("1073") ? true : (stryCov_9fa48("1073", "1074"), coreStatus !== (stryMutAct_9fa48("1075") ? "" : (stryCov_9fa48("1075"), "DEGRADED")))))) {
      if (stryMutAct_9fa48("1076")) {
        {}
      } else {
        stryCov_9fa48("1076");
        blockers.push(stryMutAct_9fa48("1077") ? {} : (stryCov_9fa48("1077"), {
          code: stryMutAct_9fa48("1078") ? "" : (stryCov_9fa48("1078"), "CORE_OFFLINE"),
          message: BLOCKER_MESSAGES.CORE_OFFLINE
        }));
      }
    }
    if (stryMutAct_9fa48("1081") ? false : stryMutAct_9fa48("1080") ? true : stryMutAct_9fa48("1079") ? hasPublishedMenu : (stryCov_9fa48("1079", "1080", "1081"), !hasPublishedMenu)) {
      if (stryMutAct_9fa48("1082")) {
        {}
      } else {
        stryCov_9fa48("1082");
        blockers.push(stryMutAct_9fa48("1083") ? {} : (stryCov_9fa48("1083"), {
          code: stryMutAct_9fa48("1084") ? "" : (stryCov_9fa48("1084"), "NO_PUBLISHED_MENU"),
          message: BLOCKER_MESSAGES.NO_PUBLISHED_MENU
        }));
      }
    }
    if (stryMutAct_9fa48("1087") ? false : stryMutAct_9fa48("1086") ? true : stryMutAct_9fa48("1085") ? hasIdentity : (stryCov_9fa48("1085", "1086", "1087"), !hasIdentity)) {
      if (stryMutAct_9fa48("1088")) {
        {}
      } else {
        stryCov_9fa48("1088");
        blockers.push(stryMutAct_9fa48("1089") ? {} : (stryCov_9fa48("1089"), {
          code: stryMutAct_9fa48("1090") ? "" : (stryCov_9fa48("1090"), "NO_IDENTITY"),
          message: BLOCKER_MESSAGES.NO_IDENTITY
        }));
      }
    }
    if (stryMutAct_9fa48("1093") ? false : stryMutAct_9fa48("1092") ? true : stryMutAct_9fa48("1091") ? isCashOpen : (stryCov_9fa48("1091", "1092", "1093"), !isCashOpen)) {
      if (stryMutAct_9fa48("1094")) {
        {}
      } else {
        stryCov_9fa48("1094");
        blockers.push(stryMutAct_9fa48("1095") ? {} : (stryCov_9fa48("1095"), {
          code: stryMutAct_9fa48("1096") ? "" : (stryCov_9fa48("1096"), "CASH_REQUIRED"),
          message: BLOCKER_MESSAGES.CASH_REQUIRED
        }));
        blockers.push(stryMutAct_9fa48("1097") ? {} : (stryCov_9fa48("1097"), {
          code: stryMutAct_9fa48("1098") ? "" : (stryCov_9fa48("1098"), "SHIFT_REQUIRED"),
          message: BLOCKER_MESSAGES.SHIFT_REQUIRED
        }));
      }
    }
    return stryMutAct_9fa48("1099") ? {} : (stryCov_9fa48("1099"), {
      coreStatus,
      canLoadProducts,
      hasPublishedMenu,
      hasIdentity,
      isShiftActive,
      isCashOpen,
      blockers,
      operationReady: stryMutAct_9fa48("1102") ? blockers.length !== 0 : stryMutAct_9fa48("1101") ? false : stryMutAct_9fa48("1100") ? true : (stryCov_9fa48("1100", "1101", "1102"), blockers.length === 0)
    });
  }
}