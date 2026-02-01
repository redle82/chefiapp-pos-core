/**
 * Billing Core Types
 * 
 * PRINCÍPIO: SEU DINHEIRO, SUA REGRA
 * 
 * Este módulo controla:
 * - Assinaturas (Subscription)
 * - Planos (Plan)
 * - Add-ons
 * - Features liberadas
 * - Gateways permitidos
 * 
 * NÃO participa do fluxo financeiro do restaurante.
 * O dinheiro do cliente final vai direto para o restaurante.
 */

// ============================================================================
// PLANS & ADD-ONS
// ============================================================================

export type PlanTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface Plan {
    readonly plan_id: string;
    readonly tier: PlanTier;
    readonly name: string;
    readonly price_cents: number;          // Monthly price in cents (EUR)
    readonly currency: 'EUR';
    readonly billing_period: 'MONTHLY' | 'YEARLY';
    readonly max_terminals: number;        // -1 = unlimited
    readonly max_tables: number;           // -1 = unlimited
    readonly features: FeatureFlag[];
    readonly allowed_gateways: GatewayType[];
    readonly trial_days: number;
}

export type AddOnType = 
    | 'RESERVATIONS'      // Sistema de reservas
    | 'WEB_PAGE'          // Página web/menu digital
    | 'WEB_EXPERIENCE'    // Upgrade premium: Web Experience
    | 'MULTI_LOCATION'    // Multi-filial
    | 'WHITE_LABEL'       // White-label
    | 'EXTRA_TERMINAL'    // Terminal adicional
    | 'FISCAL_ADVANCED'   // Fiscal avançado (SAF-T, etc.)
    | 'ANALYTICS_PRO';    // Analytics avançado

export interface AddOn {
    readonly addon_id: string;
    readonly type: AddOnType;
    readonly name: string;
    readonly price_cents: number;
    readonly currency: 'EUR';
    readonly billing_period: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
    readonly features: FeatureFlag[];
}

// ============================================================================
// FEATURES
// ============================================================================

export type FeatureFlag =
    // Core Features
    | 'CORE_POS'           // TPV básico
    | 'CORE_ORDERS'        // Gestão de pedidos
    | 'CORE_TABLES'        // Gestão de mesas
    | 'CORE_PAYMENTS'      // Processamento de pagamentos
    | 'CORE_AUDIT'         // Auditoria básica
    
    // Payment Gateways
    | 'GATEWAY_STRIPE'     // Stripe integration
    | 'GATEWAY_SUMUP'      // SumUp integration
    | 'GATEWAY_CASH'       // Cash payments
    
    // Add-on Features
    | 'RESERVATIONS'       // Sistema de reservas
    | 'WEB_PAGE'           // Página web
    | 'MULTI_LOCATION'     // Multi-filial
    | 'WHITE_LABEL'        // Branding removido
    | 'FISCAL_ADVANCED'    // SAF-T, etc.
    | 'ANALYTICS_PRO'      // Analytics avançado
    | 'API_ACCESS';        // API pública

export type GatewayType = 'STRIPE' | 'SUMUP' | 'CASH' | 'MULTIBANCO';

// ============================================================================
// SUBSCRIPTION
// ============================================================================

export type SubscriptionStatus = 
    | 'TRIAL'              // Em período de teste
    | 'ACTIVE'             // Pagamento em dia
    | 'PAST_DUE'           // Pagamento atrasado (grace period)
    | 'SUSPENDED'          // Suspenso por falta de pagamento
    | 'CANCELLED';         // Cancelado

export interface Subscription {
    readonly subscription_id: string;
    readonly restaurant_id: string;
    
    // Plan
    readonly plan_id: string;
    readonly plan_tier: PlanTier;
    
    // Status
    readonly status: SubscriptionStatus;
    readonly status_reason?: string;
    
    // Dates
    readonly created_at: Date;
    readonly trial_ends_at?: Date;
    readonly current_period_start: Date;
    readonly current_period_end: Date;
    readonly cancelled_at?: Date;
    
    // Payment
    readonly payment_method_id?: string;
    readonly last_payment_at?: Date;
    readonly next_payment_at: Date;
    
    // Add-ons
    readonly active_addons: ActiveAddOn[];
    
    // Gateway Configuration (restaurante)
    readonly configured_gateways: ConfiguredGateway[];
    
    // Derived
    readonly enabled_features: FeatureFlag[];
    readonly max_terminals: number;
    readonly max_tables: number;
}

export interface ActiveAddOn {
    readonly addon_id: string;
    readonly type: AddOnType;
    readonly activated_at: Date;
    readonly expires_at?: Date;
    readonly quantity: number;  // Para EXTRA_TERMINAL
}

export interface ConfiguredGateway {
    readonly gateway_type: GatewayType;
    readonly gateway_account_id: string;    // Stripe account ID, SumUp merchant code
    readonly api_key_hash: string;          // Hashed, NUNCA raw
    readonly webhook_secret_hash?: string;  // Hashed
    readonly configured_at: Date;
    readonly verified: boolean;
    readonly last_verified_at?: Date;
}

// ============================================================================
// BILLING EVENTS (Event-Sourced)
// ============================================================================

export type BillingEventType =
    // Subscription Lifecycle
    | 'SUBSCRIPTION_CREATED'
    | 'SUBSCRIPTION_ACTIVATED'
    | 'SUBSCRIPTION_TRIAL_STARTED'
    | 'SUBSCRIPTION_TRIAL_ENDED'
    | 'SUBSCRIPTION_RENEWED'
    | 'SUBSCRIPTION_PAST_DUE'
    | 'SUBSCRIPTION_SUSPENDED'
    | 'SUBSCRIPTION_REACTIVATED'
    | 'SUBSCRIPTION_CANCELLED'
    | 'SUBSCRIPTION_EXPIRED'
    
    // Plan Changes
    | 'PLAN_UPGRADED'
    | 'PLAN_DOWNGRADED'
    
    // Add-ons
    | 'ADDON_ACTIVATED'
    | 'ADDON_DEACTIVATED'
    | 'ADDON_RENEWED'
    
    // Payments (SEU billing)
    | 'PAYMENT_ATTEMPTED'
    | 'PAYMENT_SUCCEEDED'
    | 'PAYMENT_FAILED'
    | 'PAYMENT_REFUNDED'
    
    // Gateway Configuration
    | 'GATEWAY_CONFIGURED'
    | 'GATEWAY_VERIFIED'
    | 'GATEWAY_VERIFICATION_FAILED'
    | 'GATEWAY_REMOVED';

export interface BillingEvent {
    readonly event_id: string;
    readonly type: BillingEventType;
    readonly subscription_id: string;
    readonly restaurant_id: string;
    readonly occurred_at: Date;
    readonly payload: Record<string, unknown>;
    readonly metadata?: {
        readonly source: 'API' | 'WEBHOOK' | 'SYSTEM' | 'ADMIN';
        readonly actor_id?: string;
        readonly ip_address?: string;
    };
}

// ============================================================================
// FEATURE GATE (Runtime Check)
// ============================================================================

export interface FeatureGate {
    /**
     * Verifica se uma feature está liberada para o restaurante
     */
    hasFeature(restaurantId: string, feature: FeatureFlag): Promise<boolean>;
    
    /**
     * Verifica se um gateway está configurado e liberado
     */
    canUseGateway(restaurantId: string, gateway: GatewayType): Promise<boolean>;
    
    /**
     * Retorna todas as features ativas
     */
    getActiveFeatures(restaurantId: string): Promise<FeatureFlag[]>;
    
    /**
     * Verifica limite de terminais
     */
    canAddTerminal(restaurantId: string): Promise<{ allowed: boolean; current: number; max: number }>;
    
    /**
     * Verifica se subscription está ativa
     */
    isSubscriptionActive(restaurantId: string): Promise<boolean>;
}

// ============================================================================
// DEFAULT PLANS (Imutáveis após lançamento)
// ============================================================================

export const DEFAULT_PLANS: readonly Plan[] = [
    {
        plan_id: 'plan_starter_v1',
        tier: 'STARTER',
        name: 'Starter',
        price_cents: 2900,  // €29/mês
        currency: 'EUR',
        billing_period: 'MONTHLY',
        max_terminals: 1,
        max_tables: 20,
        trial_days: 14,
        features: [
            'CORE_POS',
            'CORE_ORDERS',
            'CORE_TABLES',
            'CORE_PAYMENTS',
            'CORE_AUDIT',
            'GATEWAY_CASH',
            'GATEWAY_SUMUP',
        ],
        allowed_gateways: ['CASH', 'SUMUP'],
    },
    {
        plan_id: 'plan_professional_v1',
        tier: 'PROFESSIONAL',
        name: 'Professional',
        price_cents: 5900,  // €59/mês
        currency: 'EUR',
        billing_period: 'MONTHLY',
        max_terminals: 3,
        max_tables: -1,  // Unlimited
        trial_days: 14,
        features: [
            'CORE_POS',
            'CORE_ORDERS',
            'CORE_TABLES',
            'CORE_PAYMENTS',
            'CORE_AUDIT',
            'GATEWAY_CASH',
            'GATEWAY_SUMUP',
            'GATEWAY_STRIPE',
            'ANALYTICS_PRO',
        ],
        allowed_gateways: ['CASH', 'SUMUP', 'STRIPE'],
    },
    {
        plan_id: 'plan_enterprise_v1',
        tier: 'ENTERPRISE',
        name: 'Enterprise',
        price_cents: 14900,  // €149/mês
        currency: 'EUR',
        billing_period: 'MONTHLY',
        max_terminals: -1,  // Unlimited
        max_tables: -1,
        trial_days: 30,
        features: [
            'CORE_POS',
            'CORE_ORDERS',
            'CORE_TABLES',
            'CORE_PAYMENTS',
            'CORE_AUDIT',
            'GATEWAY_CASH',
            'GATEWAY_SUMUP',
            'GATEWAY_STRIPE',
            'ANALYTICS_PRO',
            'MULTI_LOCATION',
            'API_ACCESS',
            'FISCAL_ADVANCED',
        ],
        allowed_gateways: ['CASH', 'SUMUP', 'STRIPE', 'MULTIBANCO'],
    },
] as const;

export const DEFAULT_ADDONS: readonly AddOn[] = [
    {
        addon_id: 'addon_reservations_v1',
        type: 'RESERVATIONS',
        name: 'Sistema de Reservas',
        price_cents: 1900,  // €19/mês
        currency: 'EUR',
        billing_period: 'MONTHLY',
        features: ['RESERVATIONS'],
    },
    {
        addon_id: 'addon_web_page_v1',
        type: 'WEB_PAGE',
        name: 'Página Web & Menu Digital',
        price_cents: 2900,  // €29/mês
        currency: 'EUR',
        billing_period: 'MONTHLY',
        features: ['WEB_PAGE'],
    },
    {
        addon_id: 'addon_extra_terminal_v1',
        type: 'EXTRA_TERMINAL',
        name: 'Terminal Adicional',
        price_cents: 1500,  // €15/mês por terminal
        currency: 'EUR',
        billing_period: 'MONTHLY',
        features: [],
    },
    {
        addon_id: 'addon_white_label_v1',
        type: 'WHITE_LABEL',
        name: 'White Label',
        price_cents: 9900,  // €99/mês
        currency: 'EUR',
        billing_period: 'MONTHLY',
        features: ['WHITE_LABEL'],
    },
] as const;
