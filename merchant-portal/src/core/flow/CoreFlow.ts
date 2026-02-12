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

export type UserState = {
  isAuthenticated: boolean;
  hasOrganization: boolean;
  /**
   * Identidade primária: ter restaurante criado.
   * Alias de hasOrganization para manter compatibilidade interna.
   */
  hasRestaurant?: boolean;
  currentPath: string;
  /** FASE E: estado do sistema; quando SETUP, rotas TPV/KDS redirecionam para o Dashboard/config-first. */
  systemState?: "SETUP" | "TRIAL" | "ACTIVE" | "SUSPENDED";
};

export type FlowDecision =
  | { type: "ALLOW" }
  | { type: "REDIRECT"; to: string; reason: string };

/**
 * Rotas de OPERAÇÃO (TPV/KDS). Em SETUP → redirect; na web nunca aplicar este gate.
 */
function isOperationalPath(path: string): boolean {
  return (
    path.startsWith("/op/tpv") ||
    path.startsWith("/op/kds") ||
    path.startsWith("/app/tpv") ||
    path.startsWith("/app/kds")
  );
}

/**
 * Rotas da WEB DE CONFIGURAÇÃO / OPERAÇÃO. Sempre ALLOW para hasOrg; nunca bloquear por billing/dados.
 * /app/install é rota operacional (ritual de terminais); alinhado a OPERATIONAL_NAVIGATION_SOVEREIGNTY.
 */
export function isWebConfigPath(path: string): boolean {
  return (
    path === "/dashboard" ||
    path === "/app/dashboard" ||
    path.startsWith("/config") ||
    path === "/menu-builder" ||
    path === "/app/install" ||
    path.startsWith("/app/billing") ||
    path === "/billing/success"
  );
}

export function resolveNextRoute(state: UserState): FlowDecision {
  const {
    isAuthenticated,
    hasOrganization,
    hasRestaurant,
    currentPath,
    systemState,
  } = state;

  const hasOrg = hasRestaurant ?? hasOrganization;

  // --- 1. BARREIRA DE AUTENTICAÇÃO ---
  if (!isAuthenticated) {
    console.log("[CoreFlow] 🛑 Not Authenticated at:", currentPath);
    // Public Void Protocol: Allow access to /public/* (The Menu)
    if (currentPath.startsWith("/public")) return { type: "ALLOW" };

    // Landing, Auth (telefone) e trial guide são públicas
    if (
      currentPath === "/" ||
      currentPath === "/auth" ||
      currentPath === "/auth/phone" ||
      currentPath === "/auth/verify" ||
      currentPath === "/trial-guide" ||
      currentPath === "/trial"
    )
      return { type: "ALLOW" };

    // Qualquer outra rota requer autenticação
    return { type: "REDIRECT", to: "/auth/phone", reason: "Auth required" };
  }

  // Se autenticado e está em /auth ou /, redireciona para o fluxo correto
  if (currentPath === "/auth" || currentPath === "/") {
    // O switch abaixo vai pegar o destino
  }

  // --- 2. BOOTSTRAP GATE (CONTRATO VIDA RESTAURANTE) ---
  // Sem restaurante: apenas setup mínimo. Nunca /dashboard direto.
  if (!hasOrg) {
    if (
      currentPath === "/bootstrap" ||
      currentPath === "/setup/restaurant-minimal"
    )
      return { type: "ALLOW" };
    if (
      currentPath === "/app/select-tenant" ||
      currentPath === "/app/access-denied"
    )
      return { type: "ALLOW" };
    return {
      type: "REDIRECT",
      to: "/setup/restaurant-minimal",
      reason: "No org → setup mínimo (telefone/identidade) antes do Dashboard",
    };
  }

  // --- 2.5 OPERAÇÃO: TPV/KDS bloqueados em SETUP. Web de configuração nunca bloqueada aqui. ---
  if (systemState === "SETUP" && isOperationalPath(currentPath)) {
    return {
      type: "REDIRECT",
      to: "/dashboard",
      reason: "Complete o setup no Dashboard para aceder ao TPV/KDS",
    };
  }
  // Web de configuração (dashboard, config, billing, etc.): ALLOW; sem gate por systemState.

  // --- 3. GLORIAFOOD MODEL: GESTÃO SEMPRE ACESSÍVEL ---
  // Bloqueios apenas na camada operacional (TPV/KDS via RequireOperational).

  // 📱 MOBILE: Portal central, primeiro produto (Onda 4 A3) ou /garcom (operacional)
  if (isMobileDevice()) {
    if (
      currentPath.startsWith("/garcom") ||
      currentPath.startsWith("/app") ||
      currentPath === "/onboarding/first-product"
    ) {
      return { type: "ALLOW" };
    }
    return {
      type: "REDIRECT",
      to: "/app/dashboard",
      reason: "Portal central (mobile default)",
    };
  }

  // 🎯 REDIRECIONAMENTO DE ENTRADA
  if (
    currentPath === "/auth" ||
    currentPath === "/auth/phone" ||
    currentPath === "/auth/verify" ||
    currentPath === "/" ||
    currentPath === "/app"
  ) {
    return {
      type: "REDIRECT",
      to: hasOrg ? "/dashboard" : "/setup/restaurant-minimal",
      reason: "Sovereign Entry to Dashboard",
    };
  }

  // ALLOW ALL for authenticated desktop users with organizations.
  // Requirement gates (ManagementAdvisor, RequireOperational) will handle specific blocks.
  return { type: "ALLOW" };
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
  const isPhone =
    /iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    window.innerWidth < 600;
  return isPhone;
}
