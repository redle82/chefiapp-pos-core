/**
 * Billing State Machine
 * 
 * Estados de Subscription e transições válidas
 * 
 * TRIAL → ACTIVE → PAST_DUE → SUSPENDED → CANCELLED
 *                     ↓            ↑
 *                 CANCELLED ←──────┘
 *                     ↑
 *         (direct cancel from any state)
 */

import { SubscriptionStatus, BillingEventType } from './types';

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

export interface SubscriptionTransition {
    readonly from: SubscriptionStatus;
    readonly to: SubscriptionStatus;
    readonly event: BillingEventType;
    readonly conditions?: string[];
}

/**
 * Transições válidas de estado de subscription
 * IMUTÁVEL após lançamento
 */
export const SUBSCRIPTION_TRANSITIONS: readonly SubscriptionTransition[] = [
    // Trial
    { from: 'TRIAL', to: 'ACTIVE', event: 'SUBSCRIPTION_ACTIVATED', conditions: ['payment_succeeded'] },
    { from: 'TRIAL', to: 'CANCELLED', event: 'SUBSCRIPTION_CANCELLED' },
    { from: 'TRIAL', to: 'SUSPENDED', event: 'SUBSCRIPTION_TRIAL_ENDED', conditions: ['no_payment_method'] },
    
    // Active
    { from: 'ACTIVE', to: 'PAST_DUE', event: 'PAYMENT_FAILED' },
    { from: 'ACTIVE', to: 'CANCELLED', event: 'SUBSCRIPTION_CANCELLED' },
    { from: 'ACTIVE', to: 'ACTIVE', event: 'SUBSCRIPTION_RENEWED' },
    { from: 'ACTIVE', to: 'ACTIVE', event: 'PLAN_UPGRADED' },
    { from: 'ACTIVE', to: 'ACTIVE', event: 'PLAN_DOWNGRADED' },
    
    // Past Due (grace period)
    { from: 'PAST_DUE', to: 'ACTIVE', event: 'PAYMENT_SUCCEEDED' },
    { from: 'PAST_DUE', to: 'SUSPENDED', event: 'SUBSCRIPTION_SUSPENDED', conditions: ['grace_period_expired'] },
    { from: 'PAST_DUE', to: 'CANCELLED', event: 'SUBSCRIPTION_CANCELLED' },
    
    // Suspended
    { from: 'SUSPENDED', to: 'ACTIVE', event: 'SUBSCRIPTION_REACTIVATED', conditions: ['payment_succeeded'] },
    { from: 'SUSPENDED', to: 'CANCELLED', event: 'SUBSCRIPTION_CANCELLED' },
    { from: 'SUSPENDED', to: 'CANCELLED', event: 'SUBSCRIPTION_EXPIRED', conditions: ['suspended_too_long'] },
] as const;

// ============================================================================
// GRACE PERIODS
// ============================================================================

export const BILLING_GRACE_PERIODS = {
    /** Dias após falha de pagamento antes de suspender */
    PAST_DUE_DAYS: 7,
    
    /** Dias suspenso antes de cancelar automaticamente */
    SUSPENDED_DAYS: 30,
    
    /** Dias de aviso antes do fim do período */
    RENEWAL_WARNING_DAYS: 3,
    
    /** Tentativas de cobrança antes de suspender */
    PAYMENT_RETRY_ATTEMPTS: 3,
    
    /** Intervalo entre tentativas de cobrança (dias) */
    PAYMENT_RETRY_INTERVAL_DAYS: 2,
} as const;

// ============================================================================
// STATE MACHINE
// ============================================================================

export class SubscriptionStateMachine {
    private static transitionMap: Map<string, SubscriptionTransition[]>;
    
    static {
        this.transitionMap = new Map();
        for (const transition of SUBSCRIPTION_TRANSITIONS) {
            const key = transition.from;
            const existing = this.transitionMap.get(key) || [];
            existing.push(transition);
            this.transitionMap.set(key, existing);
        }
    }
    
    /**
     * Verifica se uma transição é válida
     */
    static canTransition(
        from: SubscriptionStatus,
        to: SubscriptionStatus,
        event: BillingEventType
    ): boolean {
        const transitions = this.transitionMap.get(from) || [];
        return transitions.some(t => t.to === to && t.event === event);
    }
    
    /**
     * Obtém próximo estado baseado no evento
     */
    static getNextState(
        current: SubscriptionStatus,
        event: BillingEventType
    ): SubscriptionStatus | null {
        const transitions = this.transitionMap.get(current) || [];
        const transition = transitions.find(t => t.event === event);
        return transition?.to ?? null;
    }
    
    /**
     * Lista transições possíveis do estado atual
     */
    static getPossibleTransitions(
        current: SubscriptionStatus
    ): SubscriptionTransition[] {
        return this.transitionMap.get(current) || [];
    }
    
    /**
     * Verifica se subscription está "ativa" (pode usar o sistema)
     */
    static isOperational(status: SubscriptionStatus): boolean {
        return status === 'TRIAL' || status === 'ACTIVE';
    }
    
    /**
     * Verifica se subscription está em risco (precisa de ação)
     */
    static isAtRisk(status: SubscriptionStatus): boolean {
        return status === 'PAST_DUE' || status === 'SUSPENDED';
    }
}

// ============================================================================
// FEATURE BLOCKING RULES
// ============================================================================

export interface FeatureBlockingRule {
    readonly status: SubscriptionStatus;
    readonly blocked_features: string[];
    readonly message: string;
}

/**
 * Regras de bloqueio de features por status
 */
export const FEATURE_BLOCKING_RULES: readonly FeatureBlockingRule[] = [
    {
        status: 'TRIAL',
        blocked_features: [],  // Trial tem acesso total
        message: 'Trial period active',
    },
    {
        status: 'ACTIVE',
        blocked_features: [],  // Ativo tem acesso total
        message: 'Subscription active',
    },
    {
        status: 'PAST_DUE',
        blocked_features: [
            'API_ACCESS',        // Bloqueia API externa
            'ANALYTICS_PRO',     // Bloqueia analytics avançado
        ],
        message: 'Payment overdue. Please update your payment method.',
    },
    {
        status: 'SUSPENDED',
        blocked_features: [
            'CORE_PAYMENTS',     // Bloqueia novos pagamentos
            'API_ACCESS',
            'ANALYTICS_PRO',
            'WEB_PAGE',
            'RESERVATIONS',
        ],
        message: 'Subscription suspended. Only viewing is allowed.',
    },
    {
        status: 'CANCELLED',
        blocked_features: ['*'],  // Bloqueia tudo
        message: 'Subscription cancelled. Please renew to continue.',
    },
] as const;

/**
 * Obtém features bloqueadas para um status
 */
export function getBlockedFeatures(status: SubscriptionStatus): string[] {
    const rule = FEATURE_BLOCKING_RULES.find(r => r.status === status);
    return rule?.blocked_features || [];
}

/**
 * Verifica se uma feature está bloqueada
 */
export function isFeatureBlocked(
    status: SubscriptionStatus,
    feature: string
): boolean {
    const blocked = getBlockedFeatures(status);
    return blocked.includes('*') || blocked.includes(feature);
}

// ============================================================================
// BILLING CYCLE
// ============================================================================

export interface BillingCycleInfo {
    readonly current_period_start: Date;
    readonly current_period_end: Date;
    readonly days_remaining: number;
    readonly days_until_renewal: number;
    readonly is_renewal_due: boolean;
    readonly is_trial: boolean;
    readonly trial_days_remaining?: number;
}

export function calculateBillingCycle(
    periodStart: Date,
    periodEnd: Date,
    trialEndsAt?: Date
): BillingCycleInfo {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / msPerDay));
    const daysUntilRenewal = daysRemaining;
    const isRenewalDue = daysRemaining <= BILLING_GRACE_PERIODS.RENEWAL_WARNING_DAYS;
    
    const isTrial = trialEndsAt ? now < trialEndsAt : false;
    const trialDaysRemaining = trialEndsAt 
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / msPerDay))
        : undefined;
    
    return {
        current_period_start: periodStart,
        current_period_end: periodEnd,
        days_remaining: daysRemaining,
        days_until_renewal: daysUntilRenewal,
        is_renewal_due: isRenewalDue,
        is_trial: isTrial,
        trial_days_remaining: trialDaysRemaining,
    };
}
