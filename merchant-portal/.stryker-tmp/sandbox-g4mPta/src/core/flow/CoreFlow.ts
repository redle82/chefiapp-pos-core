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
  return path === "/welcome" || path.startsWith("/onboarding") || path === "/app/activation";
}

/**
 * Rotas da WEB DE CONFIGURAÇÃO / OPERAÇÃO. Sempre ALLOW para hasOrg; nunca bloquear por billing/dados.
 * Instalação TPV/KDS: integrado no Hub Módulos (/admin/modules); /admin/devices e /app/install redirecionam.
 */
export function isWebConfigPath(path: string): boolean {
  return path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules" || path === "/menu-builder" || path === "/app/install" || path.startsWith("/app/billing") || path === "/billing/success";
}
export function resolveNextRoute(state: UserState): FlowDecision {
  const {
    isAuthenticated,
    hasOrganization,
    hasRestaurant,
    currentPath,
    systemState
  } = state;
  const hasOrg = stryMutAct_9fa48("0") ? hasRestaurant && hasOrganization : (stryCov_9fa48("0"), hasRestaurant ?? hasOrganization);

  // --- 0. PUBLIC VOID PROTOCOL ---
  // /public/* é customer-facing (cardápio, mesa, status pedido). Sempre permitido,
  // independente de autenticação, ativação ou estado do sistema.
  if (stryMutAct_9fa48("3") ? currentPath.endsWith("/public") : stryMutAct_9fa48("2") ? false : stryMutAct_9fa48("1") ? true : (stryCov_9fa48("1", "2", "3"), currentPath.startsWith(stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), "/public")))) return stryMutAct_9fa48("5") ? {} : (stryCov_9fa48("5"), {
    type: stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), "ALLOW")
  });

  // --- 1. BARREIRA DE AUTENTICAÇÃO ---
  if (stryMutAct_9fa48("9") ? false : stryMutAct_9fa48("8") ? true : stryMutAct_9fa48("7") ? isAuthenticated : (stryCov_9fa48("7", "8", "9"), !isAuthenticated)) {
    console.log(stryMutAct_9fa48("10") ? "" : (stryCov_9fa48("10"), "[CoreFlow] 🛑 Not Authenticated at:"), currentPath);

    // Landing, Auth (telefone) e trial guide são públicas
    if (currentPath === "/" || currentPath === "/auth" || currentPath === "/auth/phone" || currentPath === "/auth/verify" || currentPath === "/trial-guide" || currentPath === "/trial") return {
      type: "ALLOW"
    };

    // Qualquer outra rota requer autenticação
    return {
      type: "REDIRECT",
      to: "/auth/phone",
      reason: "Auth required"
    };
  }

  // Se autenticado e está em /auth ou /, redireciona para o fluxo correto
  if (currentPath === "/auth" || currentPath === "/") {
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