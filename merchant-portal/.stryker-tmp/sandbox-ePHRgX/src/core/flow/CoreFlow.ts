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
// @ts-nocheck


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
const ALLOWED_LAST_ROUTES = stryMutAct_9fa48("0") ? [] : (stryCov_9fa48("0"), [stryMutAct_9fa48("1") ? "" : (stryCov_9fa48("1"), "/dashboard"), stryMutAct_9fa48("2") ? "" : (stryCov_9fa48("2"), "/app/dashboard"), stryMutAct_9fa48("3") ? "" : (stryCov_9fa48("3"), "/admin/config"), stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), "/admin/reports/overview"), stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), "/op/tpv"), stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), "/op/kds"), stryMutAct_9fa48("7") ? "" : (stryCov_9fa48("7"), "/op/cash"), stryMutAct_9fa48("8") ? "" : (stryCov_9fa48("8"), "/app/staff/home")]);
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
  if (stryMutAct_9fa48("9")) {
    {}
  } else {
    stryCov_9fa48("9");
    return stryMutAct_9fa48("12") ? (path.startsWith("/op/tpv") || path.startsWith("/op/pos") || path.startsWith("/op/kds") || path.startsWith("/app/tpv")) && path.startsWith("/app/kds") : stryMutAct_9fa48("11") ? false : stryMutAct_9fa48("10") ? true : (stryCov_9fa48("10", "11", "12"), (stryMutAct_9fa48("14") ? (path.startsWith("/op/tpv") || path.startsWith("/op/pos") || path.startsWith("/op/kds")) && path.startsWith("/app/tpv") : stryMutAct_9fa48("13") ? false : (stryCov_9fa48("13", "14"), (stryMutAct_9fa48("16") ? (path.startsWith("/op/tpv") || path.startsWith("/op/pos")) && path.startsWith("/op/kds") : stryMutAct_9fa48("15") ? false : (stryCov_9fa48("15", "16"), (stryMutAct_9fa48("18") ? path.startsWith("/op/tpv") && path.startsWith("/op/pos") : stryMutAct_9fa48("17") ? false : (stryCov_9fa48("17", "18"), (stryMutAct_9fa48("19") ? path.endsWith("/op/tpv") : (stryCov_9fa48("19"), path.startsWith(stryMutAct_9fa48("20") ? "" : (stryCov_9fa48("20"), "/op/tpv")))) || (stryMutAct_9fa48("21") ? path.endsWith("/op/pos") : (stryCov_9fa48("21"), path.startsWith(stryMutAct_9fa48("22") ? "" : (stryCov_9fa48("22"), "/op/pos")))))) || (stryMutAct_9fa48("23") ? path.endsWith("/op/kds") : (stryCov_9fa48("23"), path.startsWith(stryMutAct_9fa48("24") ? "" : (stryCov_9fa48("24"), "/op/kds")))))) || (stryMutAct_9fa48("25") ? path.endsWith("/app/tpv") : (stryCov_9fa48("25"), path.startsWith(stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), "/app/tpv")))))) || (stryMutAct_9fa48("27") ? path.endsWith("/app/kds") : (stryCov_9fa48("27"), path.startsWith(stryMutAct_9fa48("28") ? "" : (stryCov_9fa48("28"), "/app/kds")))));
  }
}

/**
 * Rotas da camada de Ativação (/welcome, /onboarding, /app/activation).
 * Quando not_activated, o utilizador pode permanecer nestas rotas.
 */
export function isActivationLayerPath(path: string): boolean {
  if (stryMutAct_9fa48("29")) {
    {}
  } else {
    stryCov_9fa48("29");
    return stryMutAct_9fa48("32") ? (path === "/welcome" || path.startsWith("/onboarding")) && path === "/app/activation" : stryMutAct_9fa48("31") ? false : stryMutAct_9fa48("30") ? true : (stryCov_9fa48("30", "31", "32"), (stryMutAct_9fa48("34") ? path === "/welcome" && path.startsWith("/onboarding") : stryMutAct_9fa48("33") ? false : (stryCov_9fa48("33", "34"), (stryMutAct_9fa48("36") ? path !== "/welcome" : stryMutAct_9fa48("35") ? false : (stryCov_9fa48("35", "36"), path === (stryMutAct_9fa48("37") ? "" : (stryCov_9fa48("37"), "/welcome")))) || (stryMutAct_9fa48("38") ? path.endsWith("/onboarding") : (stryCov_9fa48("38"), path.startsWith(stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), "/onboarding")))))) || (stryMutAct_9fa48("41") ? path !== "/app/activation" : stryMutAct_9fa48("40") ? false : (stryCov_9fa48("40", "41"), path === (stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), "/app/activation")))));
  }
}

/**
 * Rotas da WEB DE CONFIGURAÇÃO / OPERAÇÃO. Sempre ALLOW para hasOrg; nunca bloquear por billing/dados.
 * Instalação TPV/KDS: integrado no Hub Módulos (/admin/modules); /admin/devices e /app/install redirecionam.
 */
export function isWebConfigPath(path: string): boolean {
  if (stryMutAct_9fa48("43")) {
    {}
  } else {
    stryCov_9fa48("43");
    return stryMutAct_9fa48("46") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules" || path === "/menu-builder" || path === "/app/install" || path.startsWith("/app/billing")) && path === "/billing/success" : stryMutAct_9fa48("45") ? false : stryMutAct_9fa48("44") ? true : (stryCov_9fa48("44", "45", "46"), (stryMutAct_9fa48("48") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules" || path === "/menu-builder" || path === "/app/install") && path.startsWith("/app/billing") : stryMutAct_9fa48("47") ? false : (stryCov_9fa48("47", "48"), (stryMutAct_9fa48("50") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules" || path === "/menu-builder") && path === "/app/install" : stryMutAct_9fa48("49") ? false : (stryCov_9fa48("49", "50"), (stryMutAct_9fa48("52") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config") || path === "/admin/modules") && path === "/menu-builder" : stryMutAct_9fa48("51") ? false : (stryCov_9fa48("51", "52"), (stryMutAct_9fa48("54") ? (path === "/dashboard" || path === "/app/dashboard" || path.startsWith("/admin/config")) && path === "/admin/modules" : stryMutAct_9fa48("53") ? false : (stryCov_9fa48("53", "54"), (stryMutAct_9fa48("56") ? (path === "/dashboard" || path === "/app/dashboard") && path.startsWith("/admin/config") : stryMutAct_9fa48("55") ? false : (stryCov_9fa48("55", "56"), (stryMutAct_9fa48("58") ? path === "/dashboard" && path === "/app/dashboard" : stryMutAct_9fa48("57") ? false : (stryCov_9fa48("57", "58"), (stryMutAct_9fa48("60") ? path !== "/dashboard" : stryMutAct_9fa48("59") ? false : (stryCov_9fa48("59", "60"), path === (stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), "/dashboard")))) || (stryMutAct_9fa48("63") ? path !== "/app/dashboard" : stryMutAct_9fa48("62") ? false : (stryCov_9fa48("62", "63"), path === (stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), "/app/dashboard")))))) || (stryMutAct_9fa48("65") ? path.endsWith("/admin/config") : (stryCov_9fa48("65"), path.startsWith(stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), "/admin/config")))))) || (stryMutAct_9fa48("68") ? path !== "/admin/modules" : stryMutAct_9fa48("67") ? false : (stryCov_9fa48("67", "68"), path === (stryMutAct_9fa48("69") ? "" : (stryCov_9fa48("69"), "/admin/modules")))))) || (stryMutAct_9fa48("71") ? path !== "/menu-builder" : stryMutAct_9fa48("70") ? false : (stryCov_9fa48("70", "71"), path === (stryMutAct_9fa48("72") ? "" : (stryCov_9fa48("72"), "/menu-builder")))))) || (stryMutAct_9fa48("74") ? path !== "/app/install" : stryMutAct_9fa48("73") ? false : (stryCov_9fa48("73", "74"), path === (stryMutAct_9fa48("75") ? "" : (stryCov_9fa48("75"), "/app/install")))))) || (stryMutAct_9fa48("76") ? path.endsWith("/app/billing") : (stryCov_9fa48("76"), path.startsWith(stryMutAct_9fa48("77") ? "" : (stryCov_9fa48("77"), "/app/billing")))))) || (stryMutAct_9fa48("79") ? path !== "/billing/success" : stryMutAct_9fa48("78") ? false : (stryCov_9fa48("78", "79"), path === (stryMutAct_9fa48("80") ? "" : (stryCov_9fa48("80"), "/billing/success")))));
  }
}
export function resolveNextRoute(state: UserState): FlowDecision {
  if (stryMutAct_9fa48("81")) {
    {}
  } else {
    stryCov_9fa48("81");
    const {
      isAuthenticated,
      hasOrganization,
      hasRestaurant,
      currentPath,
      systemState
    } = state;
    const hasOrg = stryMutAct_9fa48("82") ? hasRestaurant && hasOrganization : (stryCov_9fa48("82"), hasRestaurant ?? hasOrganization);

    // --- 0. PUBLIC VOID PROTOCOL ---
    // /public/* é customer-facing (cardápio, mesa, status pedido). Sempre permitido,
    // independente de autenticação, ativação ou estado do sistema.
    if (stryMutAct_9fa48("85") ? currentPath.endsWith("/public") : stryMutAct_9fa48("84") ? false : stryMutAct_9fa48("83") ? true : (stryCov_9fa48("83", "84", "85"), currentPath.startsWith(stryMutAct_9fa48("86") ? "" : (stryCov_9fa48("86"), "/public")))) return stryMutAct_9fa48("87") ? {} : (stryCov_9fa48("87"), {
      type: stryMutAct_9fa48("88") ? "" : (stryCov_9fa48("88"), "ALLOW")
    });

    // --- 1. BARREIRA DE AUTENTICAÇÃO ---
    if (stryMutAct_9fa48("91") ? false : stryMutAct_9fa48("90") ? true : stryMutAct_9fa48("89") ? isAuthenticated : (stryCov_9fa48("89", "90", "91"), !isAuthenticated)) {
      if (stryMutAct_9fa48("92")) {
        {}
      } else {
        stryCov_9fa48("92");
        console.log(stryMutAct_9fa48("93") ? "" : (stryCov_9fa48("93"), "[CoreFlow] 🛑 Not Authenticated at:"), currentPath);

        // Landing, Auth (telefone) e trial guide são públicas
        if (stryMutAct_9fa48("96") ? (currentPath === "/" || currentPath === "/auth" || currentPath === "/auth/phone" || currentPath === "/auth/verify" || currentPath === "/trial-guide") && currentPath === "/trial" : stryMutAct_9fa48("95") ? false : stryMutAct_9fa48("94") ? true : (stryCov_9fa48("94", "95", "96"), (stryMutAct_9fa48("98") ? (currentPath === "/" || currentPath === "/auth" || currentPath === "/auth/phone" || currentPath === "/auth/verify") && currentPath === "/trial-guide" : stryMutAct_9fa48("97") ? false : (stryCov_9fa48("97", "98"), (stryMutAct_9fa48("100") ? (currentPath === "/" || currentPath === "/auth" || currentPath === "/auth/phone") && currentPath === "/auth/verify" : stryMutAct_9fa48("99") ? false : (stryCov_9fa48("99", "100"), (stryMutAct_9fa48("102") ? (currentPath === "/" || currentPath === "/auth") && currentPath === "/auth/phone" : stryMutAct_9fa48("101") ? false : (stryCov_9fa48("101", "102"), (stryMutAct_9fa48("104") ? currentPath === "/" && currentPath === "/auth" : stryMutAct_9fa48("103") ? false : (stryCov_9fa48("103", "104"), (stryMutAct_9fa48("106") ? currentPath !== "/" : stryMutAct_9fa48("105") ? false : (stryCov_9fa48("105", "106"), currentPath === (stryMutAct_9fa48("107") ? "" : (stryCov_9fa48("107"), "/")))) || (stryMutAct_9fa48("109") ? currentPath !== "/auth" : stryMutAct_9fa48("108") ? false : (stryCov_9fa48("108", "109"), currentPath === (stryMutAct_9fa48("110") ? "" : (stryCov_9fa48("110"), "/auth")))))) || (stryMutAct_9fa48("112") ? currentPath !== "/auth/phone" : stryMutAct_9fa48("111") ? false : (stryCov_9fa48("111", "112"), currentPath === (stryMutAct_9fa48("113") ? "" : (stryCov_9fa48("113"), "/auth/phone")))))) || (stryMutAct_9fa48("115") ? currentPath !== "/auth/verify" : stryMutAct_9fa48("114") ? false : (stryCov_9fa48("114", "115"), currentPath === (stryMutAct_9fa48("116") ? "" : (stryCov_9fa48("116"), "/auth/verify")))))) || (stryMutAct_9fa48("118") ? currentPath !== "/trial-guide" : stryMutAct_9fa48("117") ? false : (stryCov_9fa48("117", "118"), currentPath === (stryMutAct_9fa48("119") ? "" : (stryCov_9fa48("119"), "/trial-guide")))))) || (stryMutAct_9fa48("121") ? currentPath !== "/trial" : stryMutAct_9fa48("120") ? false : (stryCov_9fa48("120", "121"), currentPath === (stryMutAct_9fa48("122") ? "" : (stryCov_9fa48("122"), "/trial")))))) return stryMutAct_9fa48("123") ? {} : (stryCov_9fa48("123"), {
          type: stryMutAct_9fa48("124") ? "" : (stryCov_9fa48("124"), "ALLOW")
        });

        // Qualquer outra rota requer autenticação
        return stryMutAct_9fa48("125") ? {} : (stryCov_9fa48("125"), {
          type: stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), "REDIRECT"),
          to: stryMutAct_9fa48("127") ? "" : (stryCov_9fa48("127"), "/auth/phone"),
          reason: stryMutAct_9fa48("128") ? "" : (stryCov_9fa48("128"), "Auth required")
        });
      }
    }

    // Se autenticado e está em /auth ou /, redireciona para o fluxo correto
    if (stryMutAct_9fa48("131") ? currentPath === "/auth" && currentPath === "/" : stryMutAct_9fa48("130") ? false : stryMutAct_9fa48("129") ? true : (stryCov_9fa48("129", "130", "131"), (stryMutAct_9fa48("133") ? currentPath !== "/auth" : stryMutAct_9fa48("132") ? false : (stryCov_9fa48("132", "133"), currentPath === (stryMutAct_9fa48("134") ? "" : (stryCov_9fa48("134"), "/auth")))) || (stryMutAct_9fa48("136") ? currentPath !== "/" : stryMutAct_9fa48("135") ? false : (stryCov_9fa48("135", "136"), currentPath === (stryMutAct_9fa48("137") ? "" : (stryCov_9fa48("137"), "/")))))) {
      // O switch abaixo vai pegar o destino
    }

    // --- 2. BOOTSTRAP GATE (CONTRATO VIDA RESTAURANTE) ---
    // Sem restaurante: welcome, onboarding ou setup mínimo. Nunca /dashboard direto.
    if (stryMutAct_9fa48("140") ? false : stryMutAct_9fa48("139") ? true : stryMutAct_9fa48("138") ? hasOrg : (stryCov_9fa48("138", "139", "140"), !hasOrg)) {
      if (stryMutAct_9fa48("141")) {
        {}
      } else {
        stryCov_9fa48("141");
        if (stryMutAct_9fa48("144") ? (currentPath === "/bootstrap" || currentPath === "/setup/restaurant-minimal" || currentPath === "/welcome") && currentPath.startsWith("/onboarding") : stryMutAct_9fa48("143") ? false : stryMutAct_9fa48("142") ? true : (stryCov_9fa48("142", "143", "144"), (stryMutAct_9fa48("146") ? (currentPath === "/bootstrap" || currentPath === "/setup/restaurant-minimal") && currentPath === "/welcome" : stryMutAct_9fa48("145") ? false : (stryCov_9fa48("145", "146"), (stryMutAct_9fa48("148") ? currentPath === "/bootstrap" && currentPath === "/setup/restaurant-minimal" : stryMutAct_9fa48("147") ? false : (stryCov_9fa48("147", "148"), (stryMutAct_9fa48("150") ? currentPath !== "/bootstrap" : stryMutAct_9fa48("149") ? false : (stryCov_9fa48("149", "150"), currentPath === (stryMutAct_9fa48("151") ? "" : (stryCov_9fa48("151"), "/bootstrap")))) || (stryMutAct_9fa48("153") ? currentPath !== "/setup/restaurant-minimal" : stryMutAct_9fa48("152") ? false : (stryCov_9fa48("152", "153"), currentPath === (stryMutAct_9fa48("154") ? "" : (stryCov_9fa48("154"), "/setup/restaurant-minimal")))))) || (stryMutAct_9fa48("156") ? currentPath !== "/welcome" : stryMutAct_9fa48("155") ? false : (stryCov_9fa48("155", "156"), currentPath === (stryMutAct_9fa48("157") ? "" : (stryCov_9fa48("157"), "/welcome")))))) || (stryMutAct_9fa48("158") ? currentPath.endsWith("/onboarding") : (stryCov_9fa48("158"), currentPath.startsWith(stryMutAct_9fa48("159") ? "" : (stryCov_9fa48("159"), "/onboarding")))))) return stryMutAct_9fa48("160") ? {} : (stryCov_9fa48("160"), {
          type: stryMutAct_9fa48("161") ? "" : (stryCov_9fa48("161"), "ALLOW")
        });
        if (stryMutAct_9fa48("164") ? currentPath === "/app/select-tenant" && currentPath === "/app/access-denied" : stryMutAct_9fa48("163") ? false : stryMutAct_9fa48("162") ? true : (stryCov_9fa48("162", "163", "164"), (stryMutAct_9fa48("166") ? currentPath !== "/app/select-tenant" : stryMutAct_9fa48("165") ? false : (stryCov_9fa48("165", "166"), currentPath === (stryMutAct_9fa48("167") ? "" : (stryCov_9fa48("167"), "/app/select-tenant")))) || (stryMutAct_9fa48("169") ? currentPath !== "/app/access-denied" : stryMutAct_9fa48("168") ? false : (stryCov_9fa48("168", "169"), currentPath === (stryMutAct_9fa48("170") ? "" : (stryCov_9fa48("170"), "/app/access-denied")))))) return stryMutAct_9fa48("171") ? {} : (stryCov_9fa48("171"), {
          type: stryMutAct_9fa48("172") ? "" : (stryCov_9fa48("172"), "ALLOW")
        });
        return stryMutAct_9fa48("173") ? {} : (stryCov_9fa48("173"), {
          type: stryMutAct_9fa48("174") ? "" : (stryCov_9fa48("174"), "REDIRECT"),
          to: stryMutAct_9fa48("175") ? "" : (stryCov_9fa48("175"), "/welcome"),
          reason: stryMutAct_9fa48("176") ? "" : (stryCov_9fa48("176"), "No org → Bem-vindo (primeira tela pós-auth)")
        });
      }
    }

    // --- 2.5 OPERAÇÃO: TPV/KDS bloqueados em SETUP. Redirect para Centro de Ativação. Exceção: mode=trial para "Testar pedido". ---
    if (stryMutAct_9fa48("179") ? systemState === "SETUP" || isOperationalPath(currentPath) : stryMutAct_9fa48("178") ? false : stryMutAct_9fa48("177") ? true : (stryCov_9fa48("177", "178", "179"), (stryMutAct_9fa48("181") ? systemState !== "SETUP" : stryMutAct_9fa48("180") ? true : (stryCov_9fa48("180", "181"), systemState === (stryMutAct_9fa48("182") ? "" : (stryCov_9fa48("182"), "SETUP")))) && isOperationalPath(currentPath))) {
      if (stryMutAct_9fa48("183")) {
        {}
      } else {
        stryCov_9fa48("183");
        const search = stryMutAct_9fa48("184") ? state.currentSearch && "" : (stryCov_9fa48("184"), state.currentSearch ?? (stryMutAct_9fa48("185") ? "Stryker was here!" : (stryCov_9fa48("185"), "")));
        if (stryMutAct_9fa48("188") ? currentPath.startsWith("/op/tpv") || search.includes("mode=trial") : stryMutAct_9fa48("187") ? false : stryMutAct_9fa48("186") ? true : (stryCov_9fa48("186", "187", "188"), (stryMutAct_9fa48("189") ? currentPath.endsWith("/op/tpv") : (stryCov_9fa48("189"), currentPath.startsWith(stryMutAct_9fa48("190") ? "" : (stryCov_9fa48("190"), "/op/tpv")))) && search.includes(stryMutAct_9fa48("191") ? "" : (stryCov_9fa48("191"), "mode=trial")))) {
          if (stryMutAct_9fa48("192")) {
            {}
          } else {
            stryCov_9fa48("192");
            return stryMutAct_9fa48("193") ? {} : (stryCov_9fa48("193"), {
              type: stryMutAct_9fa48("194") ? "" : (stryCov_9fa48("194"), "ALLOW")
            });
          }
        }
        return stryMutAct_9fa48("195") ? {} : (stryCov_9fa48("195"), {
          type: stryMutAct_9fa48("196") ? "" : (stryCov_9fa48("196"), "REDIRECT"),
          to: stryMutAct_9fa48("197") ? "" : (stryCov_9fa48("197"), "/app/activation"),
          reason: stryMutAct_9fa48("198") ? "" : (stryCov_9fa48("198"), "Complete o setup no Centro de Ativação para aceder ao TPV/KDS")
        });
      }
    }

    // --- 2.6 CAMADA DE ATIVAÇÃO: se not_activated e já na camada de ativação, ALLOW. ---
    const activated = stryMutAct_9fa48("199") ? state.activated && false : (stryCov_9fa48("199"), state.activated ?? (stryMutAct_9fa48("200") ? true : (stryCov_9fa48("200"), false)));
    if (stryMutAct_9fa48("203") ? hasOrg && !activated || isActivationLayerPath(currentPath) : stryMutAct_9fa48("202") ? false : stryMutAct_9fa48("201") ? true : (stryCov_9fa48("201", "202", "203"), (stryMutAct_9fa48("205") ? hasOrg || !activated : stryMutAct_9fa48("204") ? true : (stryCov_9fa48("204", "205"), hasOrg && (stryMutAct_9fa48("206") ? activated : (stryCov_9fa48("206"), !activated)))) && isActivationLayerPath(currentPath))) {
      if (stryMutAct_9fa48("207")) {
        {}
      } else {
        stryCov_9fa48("207");
        return stryMutAct_9fa48("208") ? {} : (stryCov_9fa48("208"), {
          type: stryMutAct_9fa48("209") ? "" : (stryCov_9fa48("209"), "ALLOW")
        });
      }
    }
    // --- 2.7 NOT_ACTIVATED fora da camada de ativação → Centro de Ativação (nunca dashboard/TPV). ---
    if (stryMutAct_9fa48("212") ? hasOrg && !activated || !isActivationLayerPath(currentPath) : stryMutAct_9fa48("211") ? false : stryMutAct_9fa48("210") ? true : (stryCov_9fa48("210", "211", "212"), (stryMutAct_9fa48("214") ? hasOrg || !activated : stryMutAct_9fa48("213") ? true : (stryCov_9fa48("213", "214"), hasOrg && (stryMutAct_9fa48("215") ? activated : (stryCov_9fa48("215"), !activated)))) && (stryMutAct_9fa48("216") ? isActivationLayerPath(currentPath) : (stryCov_9fa48("216"), !isActivationLayerPath(currentPath))))) {
      if (stryMutAct_9fa48("217")) {
        {}
      } else {
        stryCov_9fa48("217");
        return stryMutAct_9fa48("218") ? {} : (stryCov_9fa48("218"), {
          type: stryMutAct_9fa48("219") ? "" : (stryCov_9fa48("219"), "REDIRECT"),
          to: stryMutAct_9fa48("220") ? "" : (stryCov_9fa48("220"), "/app/activation"),
          reason: stryMutAct_9fa48("221") ? "" : (stryCov_9fa48("221"), "Not activated → Centro de Ativação (checklist)")
        });
      }
    }
    // Web de configuração (dashboard, config, billing, etc.): ALLOW quando activated; sem gate por systemState.

    // --- 3. GLORIAFOOD MODEL: GESTÃO SEMPRE ACESSÍVEL ---
    // Bloqueios apenas na camada operacional (TPV/KDS via RequireOperational).

    // 📱 MOBILE: Portal central, primeiro produto (Onda 4 A3) ou /garcom (operacional)
    if (stryMutAct_9fa48("223") ? false : stryMutAct_9fa48("222") ? true : (stryCov_9fa48("222", "223"), isMobileDevice())) {
      if (stryMutAct_9fa48("224")) {
        {}
      } else {
        stryCov_9fa48("224");
        if (stryMutAct_9fa48("227") ? (currentPath.startsWith("/garcom") || currentPath.startsWith("/app")) && currentPath === "/onboarding/first-product" : stryMutAct_9fa48("226") ? false : stryMutAct_9fa48("225") ? true : (stryCov_9fa48("225", "226", "227"), (stryMutAct_9fa48("229") ? currentPath.startsWith("/garcom") && currentPath.startsWith("/app") : stryMutAct_9fa48("228") ? false : (stryCov_9fa48("228", "229"), (stryMutAct_9fa48("230") ? currentPath.endsWith("/garcom") : (stryCov_9fa48("230"), currentPath.startsWith(stryMutAct_9fa48("231") ? "" : (stryCov_9fa48("231"), "/garcom")))) || (stryMutAct_9fa48("232") ? currentPath.endsWith("/app") : (stryCov_9fa48("232"), currentPath.startsWith(stryMutAct_9fa48("233") ? "" : (stryCov_9fa48("233"), "/app")))))) || (stryMutAct_9fa48("235") ? currentPath !== "/onboarding/first-product" : stryMutAct_9fa48("234") ? false : (stryCov_9fa48("234", "235"), currentPath === (stryMutAct_9fa48("236") ? "" : (stryCov_9fa48("236"), "/onboarding/first-product")))))) {
          if (stryMutAct_9fa48("237")) {
            {}
          } else {
            stryCov_9fa48("237");
            return stryMutAct_9fa48("238") ? {} : (stryCov_9fa48("238"), {
              type: stryMutAct_9fa48("239") ? "" : (stryCov_9fa48("239"), "ALLOW")
            });
          }
        }
        return stryMutAct_9fa48("240") ? {} : (stryCov_9fa48("240"), {
          type: stryMutAct_9fa48("241") ? "" : (stryCov_9fa48("241"), "REDIRECT"),
          to: stryMutAct_9fa48("242") ? "" : (stryCov_9fa48("242"), "/app/dashboard"),
          reason: stryMutAct_9fa48("243") ? "" : (stryCov_9fa48("243"), "Portal central (mobile default)")
        });
      }
    }

    // 🎯 REDIRECIONAMENTO DE ENTRADA (3 camadas: not_activated → Centro de Ativação; activated → dashboard/last area)
    if (stryMutAct_9fa48("246") ? (currentPath === "/auth" || currentPath === "/auth/phone" || currentPath === "/auth/verify" || currentPath === "/") && currentPath === "/app" : stryMutAct_9fa48("245") ? false : stryMutAct_9fa48("244") ? true : (stryCov_9fa48("244", "245", "246"), (stryMutAct_9fa48("248") ? (currentPath === "/auth" || currentPath === "/auth/phone" || currentPath === "/auth/verify") && currentPath === "/" : stryMutAct_9fa48("247") ? false : (stryCov_9fa48("247", "248"), (stryMutAct_9fa48("250") ? (currentPath === "/auth" || currentPath === "/auth/phone") && currentPath === "/auth/verify" : stryMutAct_9fa48("249") ? false : (stryCov_9fa48("249", "250"), (stryMutAct_9fa48("252") ? currentPath === "/auth" && currentPath === "/auth/phone" : stryMutAct_9fa48("251") ? false : (stryCov_9fa48("251", "252"), (stryMutAct_9fa48("254") ? currentPath !== "/auth" : stryMutAct_9fa48("253") ? false : (stryCov_9fa48("253", "254"), currentPath === (stryMutAct_9fa48("255") ? "" : (stryCov_9fa48("255"), "/auth")))) || (stryMutAct_9fa48("257") ? currentPath !== "/auth/phone" : stryMutAct_9fa48("256") ? false : (stryCov_9fa48("256", "257"), currentPath === (stryMutAct_9fa48("258") ? "" : (stryCov_9fa48("258"), "/auth/phone")))))) || (stryMutAct_9fa48("260") ? currentPath !== "/auth/verify" : stryMutAct_9fa48("259") ? false : (stryCov_9fa48("259", "260"), currentPath === (stryMutAct_9fa48("261") ? "" : (stryCov_9fa48("261"), "/auth/verify")))))) || (stryMutAct_9fa48("263") ? currentPath !== "/" : stryMutAct_9fa48("262") ? false : (stryCov_9fa48("262", "263"), currentPath === (stryMutAct_9fa48("264") ? "" : (stryCov_9fa48("264"), "/")))))) || (stryMutAct_9fa48("266") ? currentPath !== "/app" : stryMutAct_9fa48("265") ? false : (stryCov_9fa48("265", "266"), currentPath === (stryMutAct_9fa48("267") ? "" : (stryCov_9fa48("267"), "/app")))))) {
      if (stryMutAct_9fa48("268")) {
        {}
      } else {
        stryCov_9fa48("268");
        const activated = stryMutAct_9fa48("269") ? state.activated && false : (stryCov_9fa48("269"), state.activated ?? (stryMutAct_9fa48("270") ? true : (stryCov_9fa48("270"), false)));
        if (stryMutAct_9fa48("273") ? false : stryMutAct_9fa48("272") ? true : stryMutAct_9fa48("271") ? hasOrg : (stryCov_9fa48("271", "272", "273"), !hasOrg)) {
          if (stryMutAct_9fa48("274")) {
            {}
          } else {
            stryCov_9fa48("274");
            return stryMutAct_9fa48("275") ? {} : (stryCov_9fa48("275"), {
              type: stryMutAct_9fa48("276") ? "" : (stryCov_9fa48("276"), "REDIRECT"),
              to: stryMutAct_9fa48("277") ? "" : (stryCov_9fa48("277"), "/welcome"),
              reason: stryMutAct_9fa48("278") ? "" : (stryCov_9fa48("278"), "No org → Bem-vindo (primeira tela pós-auth)")
            });
          }
        }
        if (stryMutAct_9fa48("281") ? false : stryMutAct_9fa48("280") ? true : stryMutAct_9fa48("279") ? activated : (stryCov_9fa48("279", "280", "281"), !activated)) {
          if (stryMutAct_9fa48("282")) {
            {}
          } else {
            stryCov_9fa48("282");
            return stryMutAct_9fa48("283") ? {} : (stryCov_9fa48("283"), {
              type: stryMutAct_9fa48("284") ? "" : (stryCov_9fa48("284"), "REDIRECT"),
              to: stryMutAct_9fa48("285") ? "" : (stryCov_9fa48("285"), "/app/activation"),
              reason: stryMutAct_9fa48("286") ? "" : (stryCov_9fa48("286"), "Not activated → Centro de Ativação (checklist)")
            });
          }
        }
        const lastRoute = state.lastRoute;
        const to = (stryMutAct_9fa48("289") ? lastRoute || ALLOWED_LAST_ROUTES.includes(lastRoute) : stryMutAct_9fa48("288") ? false : stryMutAct_9fa48("287") ? true : (stryCov_9fa48("287", "288", "289"), lastRoute && ALLOWED_LAST_ROUTES.includes(lastRoute))) ? lastRoute : stryMutAct_9fa48("290") ? "" : (stryCov_9fa48("290"), "/app/dashboard");
        return stryMutAct_9fa48("291") ? {} : (stryCov_9fa48("291"), {
          type: stryMutAct_9fa48("292") ? "" : (stryCov_9fa48("292"), "REDIRECT"),
          to,
          reason: stryMutAct_9fa48("293") ? "" : (stryCov_9fa48("293"), "Activated → última área (default dashboard)")
        });
      }
    }

    // ALLOW ALL for authenticated desktop users with organizations.
    // Requirement gates (ManagementAdvisor, RequireOperational) will handle specific blocks.
    return stryMutAct_9fa48("294") ? {} : (stryCov_9fa48("294"), {
      type: stryMutAct_9fa48("295") ? "" : (stryCov_9fa48("295"), "ALLOW")
    });
  }
}

/**
 * Detects if the device is likely mobile (Phone/Tablet).
 * Crude but effective check for "Compact Environment".
 */
export function isMobileDevice(): boolean {
  if (stryMutAct_9fa48("296")) {
    {}
  } else {
    stryCov_9fa48("296");
    // SOVEREIGN: Phones are Companions (locked to Foundation). Tablets are Operational (allowed).
    // Removed 'iPad' and 'Android' (generic) to allow tablets.
    // Focusing on small screens and explicit phone UAs.
    const ua = window.navigator.userAgent;
    const isPhone = stryMutAct_9fa48("299") ? /iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) && window.innerWidth < 600 : stryMutAct_9fa48("298") ? false : stryMutAct_9fa48("297") ? true : (stryCov_9fa48("297", "298", "299"), /iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (stryMutAct_9fa48("302") ? window.innerWidth >= 600 : stryMutAct_9fa48("301") ? window.innerWidth <= 600 : stryMutAct_9fa48("300") ? false : (stryCov_9fa48("300", "301", "302"), window.innerWidth < 600)));
    return isPhone;
  }
}