/**
 * Capability Matrix - The "Commercial Logic" of ChefIApp
 * 
 * Este módulo traduz a estratégia de Planos (Standard, Pro, Premium)
 * em permissões técnicas granulares (Capabilities).
 * 
 * É a fonte da verdade para o que cada plano pode ou não fazer.
 */

export type PlanType = 'STANDARD' | 'PRO' | 'PREMIUM' | 'ENTERPRISE';

export type Capability =
    // --- CORE POS ---
    | 'pos.basic_sales'          // Vender no balcão
    | 'pos.table_management'     // Mapa de mesas

    // --- WEB & ONLINE ---
    | 'web.public_page'          // Ter página pública
    | 'web.custom_domain'        // Usar domínio próprio
    | 'web.remove_branding'      // Remover "Powered by ChefIApp"
    | 'web.themes'               // Temas avançados

    // --- INTEGRATIONS (THE MIGRATION ENGINE) ---
    | 'integration.gloriafood'   // Receber pedidos do GloriaFood
    | 'integration.ifood'        // Receber pedidos do iFood
    | 'integration.webhooks'     // Webhooks genéricos

    // --- INTELLIGENCE (TIME MACHINE) ---
    | 'analytics.basic'          // Relatórios do dia
    | 'analytics.historical'     // Time Machine (Legacy Data)
    | 'analytics.forecasting'    // Previsão de vendas (AI)

    // --- STAFF ---
    | 'staff.roles'              // Papéis básicos
    | 'staff.tasks'              // Sistema de tarefas
    | 'staff.gamification'       // Gamificação avançada

    // --- MONETIZATION ---
    | 'adtech.supplier_banners'; // Monetizar cardápio

/**
 * Definição dos Planos
 */
const CAPABILITY_MATRIX: Record<PlanType, Capability[]> = {

    // 🟢 STANDARD: O "Entrada" (Grátis ou Barato)
    // Foco: Tirar o restaurante do papel/zap.
    STANDARD: [
        'pos.basic_sales',
        'pos.table_management',
        'web.public_page',
        'staff.roles',
        'analytics.basic'
    ],

    // 🔵 PRO: O "Operacional" (O Sweet Spot da Migração)
    // Foco: Quem já tem GloriaFood e quer "profissionalizar".
    PRO: [
        // Standard accumulated
        'pos.basic_sales',
        'pos.table_management',
        'web.public_page',
        'staff.roles',
        'analytics.basic',

        // Pro Features
        'web.custom_domain',
        'integration.gloriafood',  // <--- O "Trojan Horse" vive aqui
        'analytics.historical',    // <--- A "Time Machine" vive aqui
        'staff.tasks',
    ],

    // 🟣 PREMIUM: O "Empire" (Franquias e High-End)
    // Foco: Escala, Marca e IA.
    PREMIUM: [
        // Pro accumulated
        'pos.basic_sales',
        'pos.table_management',
        'web.public_page',
        'staff.roles',
        'analytics.basic',
        'web.custom_domain',
        'integration.gloriafood',
        'analytics.historical',
        'staff.tasks',

        // Premium Features
        'integration.ifood',       // Integração complexa
        'web.remove_branding',
        'web.themes',
        'analytics.forecasting',
        'staff.gamification',
        'adtech.supplier_banners'
    ],

    // ⚫ ENTERPRISE (Custom)
    ENTERPRISE: [
        'pos.basic_sales', 'pos.table_management', 'web.public_page', 'staff.roles', 'analytics.basic',
        'web.custom_domain', 'integration.gloriafood', 'analytics.historical', 'staff.tasks',
        'integration.ifood', 'web.remove_branding', 'web.themes', 'analytics.forecasting',
        'staff.gamification', 'adtech.supplier_banners',
        // + Custom logic allowed
        'integration.webhooks'
    ]
};

/**
 * Engine de Verificação
 */
export class CapabilityEngine {

    static getCapabilities(plan: PlanType): Capability[] {
        return CAPABILITY_MATRIX[plan] || CAPABILITY_MATRIX.STANDARD;
    }

    static has(plan: PlanType, capability: Capability): boolean {
        const caps = this.getCapabilities(plan);
        return caps.includes(capability);
    }

    /**
     * Helper para UX: Retorna qual plano mínimo é necessário para uma feature.
     * Útil para o botão "Upgrade to Unlock".
     */
    static requiredPlanFor(capability: Capability): PlanType {
        if (CAPABILITY_MATRIX.STANDARD.includes(capability)) return 'STANDARD';
        if (CAPABILITY_MATRIX.PRO.includes(capability)) return 'PRO';
        if (CAPABILITY_MATRIX.PREMIUM.includes(capability)) return 'PREMIUM';
        return 'ENTERPRISE';
    }
}
