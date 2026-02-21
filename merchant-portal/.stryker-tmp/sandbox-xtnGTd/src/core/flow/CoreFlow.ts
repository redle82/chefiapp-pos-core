/**
 * CORE FLOW LOGIC
 *
 * 🔒 ARQUITETURA LOCKED (E2E_FLOW = LOCKED)
 *
 * Implementação da Sequência Canônica v1.0 (8 passos):
 * docs/contracts/FUNIL_VIDA_CLIENTE.md#sequência-canônica-oficial-v10
 * Código: core/flow/canonicalFlow.ts
 *
 * Implementação pura do Contrato de Navegação.
 * Veja FLOW_CORE.md para as regras de negócio.
 *
 * WEB vs OPERAÇÃO: rotas WEB (dashboard, config, billing, onboarding) sempre
 * ALLOW para hasOrg; rotas OPERAÇÃO (TPV/KDS) bloqueadas em SETUP. Nunca return null na web.
 * Trial não bloqueia operação (TRIAL_TO_PAID_CONTRACT); billing não é pré-requisito para operar.
 *
 * SOBERANIA: Este é o ÚNICO lugar que decide fluxo.
 *
 * ⚠️ PROTEÇÃO CONTRA REGRESSÃO:
 * - NUNCA criar lógica de fluxo fora daqui
 * - NUNCA depender de dados opcionais (profiles, system_config)
 * - NUNCA permitir múltiplas autoridades de decisão
 *
 * Ver: ARCHITECTURE_FLOW_LOCKED.md
 */

/** Rotas permitidas como "última área" ao reentrar (activated). Nunca TPV por defeito. */function stryNS_9fa48() {
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
const ALLOWED_LAST_ROUTES = ["/dashboard", "/app/dashboard", "/admin/config", "/admin/reports/overview", "/op/tpv", "/op/kds", "/op/cash", "/app/staff/home"];
export type UserState = {
  isAuthenticated: boolean;
  hasOrganization: boolean;
  /**
   * Identidade primária: ter restaurante criado.
   * Alias de hasOrganization para manter compatibilidade interna.
   */
  hasRestaurant?: boolean;
  currentPath: string;
  /** FASE E: estado do sistema; quando SETUP, rotas TPV/KDS redirecionam para o Centro de Ativação. */
  systemState?: "SETUP" | "TRIAL" | "ACTIVE" | "SUSPENDED";
  /**
   * Restaurante ativado (onboarding_completed_at != null).
   * Quando false: entrada → /app/activation (Centro de Ativação); quando true: entrada → última área (ex. /app/dashboard).
   */
  activated?: boolean;
  /**
   * Última rota usada (chefiapp_lastRoute). Quando activated e entrada, redirecionar para aqui se permitida; senão /app/dashboard.
   */
  lastRoute?: string | null;
  /**
   * Query string (ex.: location.search). Quando inclui mode=trial, permite /op/tpv em SETUP para "Testar pedido" no Centro de Ativação.
   */
  currentSearch?: string;
};
export type FlowDecision = {
  type: "ALLOW";
} | {
  type: "REDIRECT";
  to: string;
  reason: string;
};

/**
 * Rotas de OPERAÇÃO (TPV/KDS/POS). Em SETUP → redirect para Centro de Ativação.
 * /op/pos é alias de /op/tpv (redirect em OperationalRoutes).
 */
function isOperationalPath(path: string): boolean {
  return path.startsWith("/op/tpv") || path.startsWith("/op/pos") || path.startsWith("/op/kds") || path.startsWith("/app/tpv") || path.startsWith("/app/kds");
}

/**
 * Rotas da camada de Ativação (/welcome, /onboarding, /app/activation).
 * Quando not_activated, o utilizador pode permanecer nestas rotas.
 */
export function isActivationLayerPath(path: string): boolean {
  return path === "/welcome" || (stryMutAct_9fa48("0") ? path.endsWith("/onboarding") : (stryCov_9fa48("0"), path.startsWith(stryMutAct_9fa48("1") ? "" : (stryCov_9fa48("1"), "/onboarding")))) || (stryMutAct_9fa48("3") ? path !== "/app/activation" : stryMutAct_9fa48("2") ? false : (stryCov_9fa48("2", "3"), path === (stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), "/app/activation"))));
}

/**
 * Rotas da WEB DE CONFIGURAÇÃO / OPERAÇÃO. Sempre ALLOW para hasOrg; nunca bloquear por billing/dados.
 * Instalação TPV/KDS: integrado no Hub Módulos (/admin/modules); /admin/devices e /app/install redirecionam.
 */
export function isWebConfigPath(path: string): boolean {
  if (stryMutAct_9fa48("5")) {
    {}
  } else {
    stryCov_9fa48("5");
    return stryMutAct_9fa48("8") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules" || path === "/menu-builder" || path === "/app/install" || path.startsWith("/app/billing")) && path === "/billing/success" : stryMutAct_9fa48("7") ? false : stryMutAct_9fa48("6") ? true : (stryCov_9fa48("6", "7", "8"), (stryMutAct_9fa48("10") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules" || path === "/menu-builder" || path === "/app/install") && path.startsWith("/app/billing") : stryMutAct_9fa48("9") ? false : (stryCov_9fa48("9", "10"), (stryMutAct_9fa48("12") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules" || path === "/menu-builder") && path === "/app/install" : stryMutAct_9fa48("11") ? false : (stryCov_9fa48("11", "12"), (stryMutAct_9fa48("14") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules") && path === "/menu-builder" : stryMutAct_9fa48("13") ? false : (stryCov_9fa48("13", "14"), (stryMutAct_9fa48("16") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config")) && path === "/admin/modules" : stryMutAct_9fa48("15") ? false : (stryCov_9fa48("15", "16"), (stryMutAct_9fa48("18") ? (path === "/dashboard" || path === "/app/dashboard") && path.startsWith("/admin/config") : stryMutAct_9fa48("17") ? false : (stryCov_9fa48("17", "18"), (stryMutAct_9fa48("20") ? path === "/dashboard" && path === "/app/dashboard" : stryMutAct_9fa48("19") ? false : (stryCov_9fa48("19", "20"), (stryMutAct_9fa48("22") ? path !== "/dashboard" : stryMutAct_9fa48("21") ? false : (stryCov_9fa48("21", "22"), path === (stryMutAct_9fa48("23") ? "" : (stryCov_9fa48("23"), "/dashboard")))) || (stryMutAct_9fa48("25") ? path !== "/app/dashboard" : stryMutAct_9fa48("24") ? false : (stryCov_9fa48("24", "25"), path === (stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), "/app/dashboard")))))) || (stryMutAct_9fa48("27") ? path.endsWith("/admin/config") : (stryCov_9fa48("27"), path.startsWith(stryMutAct_9fa48("28") ? "" : (stryCov_9fa48("28"), "/admin/config")))))) || (stryMutAct_9fa48("30") ? path !== "/admin/modules" : stryMutAct_9fa48("29") ? false : (stryCov_9fa48("29", "30"), path === (stryMutAct_9fa48("31") ? "" : (stryCov_9fa48("31"), "/admin/modules")))))) || (stryMutAct_9fa48("33") ? path !== "/menu-builder" : stryMutAct_9fa48("32") ? false : (stryCov_9fa48("32", "33"), path === (stryMutAct_9fa48("34") ? "" : (stryCov_9fa48("34"), "/menu-builder")))))) || (stryMutAct_9fa48("36") ? path !== "/app/install" : stryMutAct_9fa48("35") ? false : (stryCov_9fa48("35", "36"), path === (stryMutAct_9fa48("37") ? "" : (stryCov_9fa48("37"), "/app/install")))))) || (stryMutAct_9fa48("38") ? path.endsWith("/app/billing") : (stryCov_9fa48("38"), path.startsWith(stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), "/app/billing")))))) || (stryMutAct_9fa48("41") ? path !== "/billing/success" : stryMutAct_9fa48("40") ? false : (stryCov_9fa48("40", "41"), path === (stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), "/billing/success")))));
  }
}
export function resolveNextRoute(state: UserState): FlowDecision {
  const {
    isAuthenticated,
    hasOrganization,
    hasRestaurant,
    currentPath,
    systemState
  } = state;
  const hasOrg = stryMutAct_9fa48("43") ? hasRestaurant && hasOrganization : (stryCov_9fa48("43"), hasRestaurant ?? hasOrganization);

  // --- 0. PUBLIC VOID PROTOCOL ---
  // /public/* é customer-facing (cardápio, mesa, status pedido). Sempre permitido,
  // independente de autenticação, ativação ou estado do sistema.
  if (stryMutAct_9fa48("46") ? currentPath.endsWith("/public") : stryMutAct_9fa48("45") ? false : stryMutAct_9fa48("44") ? true : (stryCov_9fa48("44", "45", "46"), currentPath.startsWith(stryMutAct_9fa48("47") ? "" : (stryCov_9fa48("47"), "/public")))) return stryMutAct_9fa48("48") ? {} : (stryCov_9fa48("48"), {
    type: stryMutAct_9fa48("49") ? "" : (stryCov_9fa48("49"), "ALLOW")
  });

  // --- 1. BARREIRA DE AUTENTICAÇÃO ---
  if (stryMutAct_9fa48("52") ? false : stryMutAct_9fa48("51") ? true : stryMutAct_9fa48("50") ? isAuthenticated : (stryCov_9fa48("50", "51", "52"), !isAuthenticated)) {
    if (stryMutAct_9fa48("53")) {
      {}
    } else {
      stryCov_9fa48("53");
      console.log(stryMutAct_9fa48("54") ? "" : (stryCov_9fa48("54"), "[CoreFlow] 🛑 Not Authenticated at:"), currentPath);

      // Landing, Auth (telefone) e trial guide são públicas
      if (stryMutAct_9fa48("57") ? (currentPath === "/" || currentPath === "/auth" || currentPath === "/auth/phone" || currentPath === "/auth/verify" || currentPath === "/trial-guide") && currentPath === "/trial" : stryMutAct_9fa48("56") ? false : stryMutAct_9fa48("55") ? true : (stryCov_9fa48("55", "56", "57"), (stryMutAct_9fa48("59") ? (currentPath === "/" || currentPath === "/auth" || currentPath === "/auth/phone" || currentPath === "/auth/verify") && currentPath === "/trial-guide" : stryMutAct_9fa48("58") ? false : (stryCov_9fa48("58", "59"), (stryMutAct_9fa48("61") ? (currentPath === "/" || currentPath === "/auth" || currentPath === "/auth/phone") && currentPath === "/auth/verify" : stryMutAct_9fa48("60") ? false : (stryCov_9fa48("60", "61"), (stryMutAct_9fa48("63") ? (currentPath === "/" || currentPath === "/auth") && currentPath === "/auth/phone" : stryMutAct_9fa48("62") ? false : (stryCov_9fa48("62", "63"), (stryMutAct_9fa48("65") ? currentPath === "/" && currentPath === "/auth" : stryMutAct_9fa48("64") ? false : (stryCov_9fa48("64", "65"), (stryMutAct_9fa48("67") ? currentPath !== "/" : stryMutAct_9fa48("66") ? false : (stryCov_9fa48("66", "67"), currentPath === (stryMutAct_9fa48("68") ? "" : (stryCov_9fa48("68"), "/")))) || (stryMutAct_9fa48("70") ? currentPath !== "/auth" : stryMutAct_9fa48("69") ? false : (stryCov_9fa48("69", "70"), currentPath === (stryMutAct_9fa48("71") ? "" : (stryCov_9fa48("71"), "/auth")))))) || (stryMutAct_9fa48("73") ? currentPath !== "/auth/phone" : stryMutAct_9fa48("72") ? false : (stryCov_9fa48("72", "73"), currentPath === (stryMutAct_9fa48("74") ? "" : (stryCov_9fa48("74"), "/auth/phone")))))) || (stryMutAct_9fa48("76") ? currentPath !== "/auth/verify" : stryMutAct_9fa48("75") ? false : (stryCov_9fa48("75", "76"), currentPath === (stryMutAct_9fa48("77") ? "" : (stryCov_9fa48("77"), "/auth/verify")))))) || (stryMutAct_9fa48("79") ? currentPath !== "/trial-guide" : stryMutAct_9fa48("78") ? false : (stryCov_9fa48("78", "79"), currentPath === (stryMutAct_9fa48("80") ? "" : (stryCov_9fa48("80"), "/trial-guide")))))) || (stryMutAct_9fa48("82") ? currentPath !== "/trial" : stryMutAct_9fa48("81") ? false : (stryCov_9fa48("81", "82"), currentPath === (stryMutAct_9fa48("83") ? "" : (stryCov_9fa48("83"), "/trial")))))) return stryMutAct_9fa48("84") ? {} : (stryCov_9fa48("84"), {
        type: stryMutAct_9fa48("85") ? "" : (stryCov_9fa48("85"), "ALLOW")
      });

      // Qualquer outra rota requer autenticação
      return stryMutAct_9fa48("86") ? {} : (stryCov_9fa48("86"), {
        type: stryMutAct_9fa48("87") ? "" : (stryCov_9fa48("87"), "REDIRECT"),
        to: stryMutAct_9fa48("88") ? "" : (stryCov_9fa48("88"), "/auth/phone"),
        reason: stryMutAct_9fa48("89") ? "" : (stryCov_9fa48("89"), "Auth required")
      });
    }
  }

  // Se autenticado e está em /auth ou /, redireciona para o fluxo correto
  if (stryMutAct_9fa48("92") ? currentPath === "/auth" && currentPath === "/" : stryMutAct_9fa48("91") ? false : stryMutAct_9fa48("90") ? true : (stryCov_9fa48("90", "91", "92"), (stryMutAct_9fa48("94") ? currentPath !== "/auth" : stryMutAct_9fa48("93") ? false : (stryCov_9fa48("93", "94"), currentPath === (stryMutAct_9fa48("95") ? "" : (stryCov_9fa48("95"), "/auth")))) || (stryMutAct_9fa48("97") ? currentPath !== "/" : stryMutAct_9fa48("96") ? false : (stryCov_9fa48("96", "97"), currentPath === (stryMutAct_9fa48("98") ? "" : (stryCov_9fa48("98"), "/")))))) {
    // O switch abaixo vai pegar o destino
  }

  // --- 2. BOOTSTRAP GATE (CONTRATO VIDA RESTAURANTE) ---
  // Sem restaurante: welcome, onboarding ou setup mínimo. Nunca /dashboard direto.
  if (!hasOrg) {
    if (currentPath === "/bootstrap" || currentPath === "/setup/restaurant-minimal" || currentPath === "/welcome" || currentPath.startsWith("/onboarding")) return {
      type: "ALLOW"
    };
    if (currentPath === "/app/select-tenant" || currentPath === "/app/access-denied") return {
      type: "ALLOW"
    };
    return {
      type: "REDIRECT",
      to: "/welcome",
      reason: "No org → Bem-vindo (primeira tela pós-auth)"
    };
  }

  // --- 2.5 OPERAÇÃO: TPV/KDS bloqueados em SETUP. Redirect para Centro de Ativação. Exceção: mode=trial para "Testar pedido". ---
  if (systemState === "SETUP" && isOperationalPath(currentPath)) {
    const search = state.currentSearch ?? "";
    if (currentPath.startsWith("/op/tpv") && search.includes("mode=trial")) {
      return {
        type: "ALLOW"
      };
    }
    return {
      type: "REDIRECT",
      to: "/app/activation",
      reason: "Complete o setup no Centro de Ativação para aceder ao TPV/KDS"
    };
  }

  // --- 2.6 CAMADA DE ATIVAÇÃO: se not_activated e já na camada de ativação, ALLOW. ---
  const activated = state.activated ?? false;
  if (hasOrg && !activated && isActivationLayerPath(currentPath)) {
    return {
      type: "ALLOW"
    };
  }
  // --- 2.7 NOT_ACTIVATED fora da camada de ativação → Centro de Ativação (nunca dashboard/TPV). ---
  if (hasOrg && !activated && !isActivationLayerPath(currentPath)) {
    return {
      type: "REDIRECT",
      to: "/app/activation",
      reason: "Not activated → Centro de Ativação (checklist)"
    };
  }
  // Web de configuração (dashboard, config, billing, etc.): ALLOW quando activated; sem gate por systemState.

  // --- 3. GLORIAFOOD MODEL: GESTÃO SEMPRE ACESSÍVEL ---
  // Bloqueios apenas na camada operacional (TPV/KDS via RequireOperational).

  // 📱 MOBILE: Portal central, primeiro produto (Onda 4 A3) ou /garcom (operacional)
  if (isMobileDevice()) {
    if (currentPath.startsWith("/garcom") || currentPath.startsWith("/app") || currentPath === "/onboarding/first-product") {
      return {
        type: "ALLOW"
      };
    }
    return {
      type: "REDIRECT",
      to: "/app/dashboard",
      reason: "Portal central (mobile default)"
    };
  }

  // 🎯 REDIRECIONAMENTO DE ENTRADA (3 camadas: not_activated → Centro de Ativação; activated → dashboard/last area)
  if (currentPath === "/auth" || currentPath === "/auth/phone" || currentPath === "/auth/verify" || currentPath === "/" || currentPath === "/app") {
    const activated = state.activated ?? false;
    if (!hasOrg) {
      return {
        type: "REDIRECT",
        to: "/welcome",
        reason: "No org → Bem-vindo (primeira tela pós-auth)"
      };
    }
    if (!activated) {
      return {
        type: "REDIRECT",
        to: "/app/activation",
        reason: "Not activated → Centro de Ativação (checklist)"
      };
    }
    const lastRoute = state.lastRoute;
    const to = lastRoute && ALLOWED_LAST_ROUTES.includes(lastRoute) ? lastRoute : "/app/dashboard";
    return {
      type: "REDIRECT",
      to,
      reason: "Activated → última área (default dashboard)"
    };
  }

  // ALLOW ALL for authenticated desktop users with organizations.
  // Requirement gates (ManagementAdvisor, RequireOperational) will handle specific blocks.
  return {
    type: "ALLOW"
  };
}

/**
 * Detects if the device is likely mobile (Phone/Tablet).
 * Crude but effective check for "Compact Environment".
 */
export function isMobileDevice(): boolean {
  // SOVEREIGN: Phones are Companions (locked to Foundation). Tablets are Operational (allowed).
  // Removed 'iPad' and 'Android' (generic) to allow tablets.
  // Focusing on small screens and explicit phone UAs.
  const ua = window.navigator.userAgent;
  const isPhone = /iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 600;
  return isPhone;
}