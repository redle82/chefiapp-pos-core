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
    | 'not_started'
    | 'identity'
    | 'authority'
    | 'topology'
    | 'flow'
    | 'cash'
    | 'team'
    | 'completed';

export type UserState = {
    isAuthenticated: boolean;
    hasOrganization: boolean;
    onboardingStatus: OnboardingStatus;
    currentPath: string;
};

export type FlowDecision =
    | { type: 'ALLOW' }
    | { type: 'REDIRECT', to: string, reason: string };

/**
 * resolveNextRoute
 * 
 * Função pura e determinística.
 * Implementa a REGRA DE OURO das 7 Telas Douradas.
 */
export function resolveNextRoute(state: UserState): FlowDecision {
    const { isAuthenticated, hasOrganization, onboardingStatus, currentPath } = state;

    // --- 1. BARREIRA DE AUTENTICAÇÃO ---
    if (!isAuthenticated) {
        // Public Void Protocol: Allow access to /public/* (The Menu)
        if (currentPath.startsWith('/public')) return { type: 'ALLOW' };

        // Landing e Auth são públicas
        if (currentPath === '/' || currentPath === '/auth') return { type: 'ALLOW' };

        // Qualquer outra rota requer autenticação
        return { type: 'REDIRECT', to: '/auth', reason: 'Auth required' };
    }

    // Se autenticado e está em /auth ou /, redireciona para o fluxo correto
    if (currentPath === '/auth' || currentPath === '/') {
        // O switch abaixo vai pegar o destino
    }

    // --- 2. BARREIRA DE ORGANIZAÇÃO (Tela 1 implícita) ---
    // Se não tem organização, o status deve ser forçado para 'identity' ou 'not_started'
    // Mas vamos confiar no onboardingStatus vindo do FlowGate
    if (!hasOrganization && onboardingStatus !== 'identity' && onboardingStatus !== 'not_started') {
        // Inconsistência grave. Resetar para identity.
        return { type: 'REDIRECT', to: '/onboarding/identity', reason: 'Organization missing' };
    }

    // --- 3. A REGRA SUPREMA DAS 7 TELAS DOURADAS ---
    // Se não está completo, deve estar na tela correta.

    if (onboardingStatus !== 'completed') {
        // Mapeamento Estado -> Rota Obrigatória
        // 🔓 UPDATE: Relaxing strictness for Cloud DB Schema Lag.
        // If we represent a valid partial state (identity..team), allow ANY onboarding step.
        // The Wizard UI will handle the step progression sequence.

        // 🛡️ SECURITY UPDATE: Relaxing strictness for Onboarding Flow.
        // If the user is in the onboarding funnel, we delegate control to the Wizard UI.
        // This prevents CoreFlow from fighting with local React Router logic.
        // We explicitly ALLOW all /onboarding paths if the user is not completed.

        // Debug Log (Temporary)
        // console.log(`[CoreFlow] 🚦 Onboarding Check: Status=${onboardingStatus}, Path=${currentPath}`);

        if (currentPath.startsWith('/onboarding')) {
            return { type: 'ALLOW' };
        }

        // Strict fallback for 'not_started' or unexpected paths -> Force Decision Gate
        const targetRoute = '/onboarding/start';

        // Se está em qualquer outro lugar, redireciona impiedosamente.
        return { type: 'REDIRECT', to: targetRoute, reason: `Strict Protocol: ${onboardingStatus}` };
    }

    // --- 4. ESTADO SOBERANO (COMPLETED) ---
    // O sistema nasceu.

    // 📱 SOVEREIGN LAW: MOBILE HANDOFF
    // Se está no celular, NÃO pode acessar o Dashboard de Operação.
    // Deve permanecer na Tela de Fundação.
    if (isMobileDevice()) {
        if (currentPath === '/onboarding/foundation') {
            return { type: 'ALLOW' };
        }
        // Se tentar ir para qualquer lugar (exceto static public), volta para fundação
        if (!currentPath.startsWith('/public')) {
            return { type: 'REDIRECT', to: '/onboarding/foundation', reason: 'Mobile Handoff Required' };
        }
    }

    // Bloqueia volta ao onboarding (exceto se explicitamente desejar configurações, 
    // mas onboarding é criação, não edição. Edição é em /settings)
    if (currentPath.startsWith('/onboarding')) {
        // SOVEREIGN UPDATE: Strict Block. Mobile users are handled in the block above.
        // Desktop users must leave Onboarding immediately if completed.
        return { type: 'REDIRECT', to: '/app/dashboard', reason: 'System is already active' };
    }

    // Auth/Root/App Entry -> Dashboard
    // 🎯 /app é o ponto de entrada único da Landing Page
    // ⚠️ LOCKED: Nunca remover /app deste check. É o portal de entrada.
    if (currentPath === '/auth' || currentPath === '/' || currentPath === '/app') {
        return { type: 'REDIRECT', to: '/app/dashboard', reason: 'Auth & Setup complete' };
    }

    // Tudo permitido (Dashboard, TPV, etc)
    return { type: 'ALLOW' };
}

/**
 * Detects if the device is likely mobile (Phone/Tablet).
 * Crude but effective check for "Compact Environment".
 */
function isMobileDevice(): boolean {
    // SOVEREIGN: Phones are Companions (locked to Foundation). Tablets are Operational (allowed).
    // Removed 'iPad' and 'Android' (generic) to allow tablets. 
    // Focusing on small screens and explicit phone UAs.
    const ua = window.navigator.userAgent;
    const isPhone = /iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (window.innerWidth < 600);
    return isPhone;
}
