/**
 * CORE FLOW LOGIC
 *
 * 🔒 ARQUITETURA LOCKED (E2E_FLOW = LOCKED)
 *
 * Implementação pura do Contrato de Navegação.
 * Veja FLOW_CORE.md para as regras de negócio.
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

export type OnboardingStatus =
  | "not_started"
  | "identity"
  | "authority"
  | "topology"
  | "flow"
  | "cash"
  | "team"
  | "completed";

export type UserState = {
  isAuthenticated: boolean;
  hasOrganization: boolean;
  onboardingStatus: OnboardingStatus;
  currentPath: string;
};

export type FlowDecision =
  | { type: "ALLOW" }
  | { type: "REDIRECT"; to: string; reason: string };

/**
 * resolveNextRoute
 *
 * Função pura e determinística.
 * Implementa a REGRA DE OURO das 7 Telas Douradas.
 */
export function resolveNextRoute(state: UserState): FlowDecision {
  const { isAuthenticated, hasOrganization, onboardingStatus, currentPath } =
    state;

  // --- 1. BARREIRA DE AUTENTICAÇÃO ---
  if (!isAuthenticated) {
    console.log("[CoreFlow] 🛑 Not Authenticated at:", currentPath);
    // Public Void Protocol: Allow access to /public/* (The Menu)
    if (currentPath.startsWith("/public")) return { type: "ALLOW" };

    // Landing e Auth são públicas
    if (currentPath === "/" || currentPath === "/auth")
      return { type: "ALLOW" };

    // Qualquer outra rota requer autenticação
    return { type: "REDIRECT", to: "/auth", reason: "Auth required" };
  }

  // Se autenticado e está em /auth ou /, redireciona para o fluxo correto
  if (currentPath === "/auth" || currentPath === "/") {
    // O switch abaixo vai pegar o destino
  }

  // --- 2. GLORIAFOOD MODEL: PORTAL CENTRAL — SEM GATE DE ONBOARDING ---
  // Sem organização: bootstrap (criar restaurante, Onda 4 A2) ou dashboard.
  if (!hasOrganization) {
    if (currentPath.startsWith("/app")) return { type: "ALLOW" };
    if (currentPath === "/bootstrap") return { type: "ALLOW" };
    if (currentPath === "/onboarding/first-product") return { type: "ALLOW" };
    return {
      type: "REDIRECT",
      to: "/app/dashboard",
      reason: "Portal central (organization missing → dashboard)",
    };
  }

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
    currentPath === "/" ||
    currentPath === "/app"
  ) {
    return {
      type: "REDIRECT",
      to: "/app/dashboard",
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
