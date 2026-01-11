/**
 * Feature Gate System
 * 
 * Sistema de bloqueio/liberação de features em runtime
 * 
 * PRINCÍPIO: SEM FEATURE = SEM ACESSO
 * 
 * Verifica:
 * 1. Subscription está ativa?
 * 2. Plano inclui a feature?
 * 3. Add-on está ativo?
 * 4. Limites não foram excedidos?
 */

import {
    FeatureFlag,
    GatewayType,
    Subscription,
    SubscriptionStatus,
    Plan,
    DEFAULT_PLANS,
    DEFAULT_ADDONS,
    FeatureGate,
} from './types';
import { isFeatureBlocked, SubscriptionStateMachine } from './state-machine';

// ============================================================================
// FEATURE GATE IMPLEMENTATION
// ============================================================================

export interface SubscriptionRepository {
    findByRestaurantId(restaurantId: string): Promise<Subscription | null>;
}

export class FeatureGateService implements FeatureGate {
    constructor(
        private readonly subscriptionRepo: SubscriptionRepository
    ) {}
    
    /**
     * Verifica se uma feature está liberada
     */
    async hasFeature(restaurantId: string, feature: FeatureFlag): Promise<boolean> {
        const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);
        
        if (!subscription) {
            return false;
        }
        
        // 1. Subscription está ativa?
        if (!SubscriptionStateMachine.isOperational(subscription.status)) {
            // Se suspenso/cancelado, verificar regras de bloqueio
            if (isFeatureBlocked(subscription.status, feature)) {
                return false;
            }
        }
        
        // 2. Feature está na lista de features ativas?
        return subscription.enabled_features.includes(feature);
    }
    
    /**
     * Verifica se pode usar um gateway específico
     */
    async canUseGateway(restaurantId: string, gateway: GatewayType): Promise<boolean> {
        const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);
        
        if (!subscription) {
            return false;
        }
        
        // 1. Subscription operacional?
        if (!SubscriptionStateMachine.isOperational(subscription.status)) {
            return false;
        }
        
        // 2. Gateway está configurado?
        const configured = subscription.configured_gateways.find(g => g.gateway_type === gateway);
        if (!configured || !configured.verified) {
            return false;
        }
        
        // 3. Plano permite esse gateway?
        const plan = DEFAULT_PLANS.find(p => p.plan_id === subscription.plan_id);
        if (!plan || !plan.allowed_gateways.includes(gateway)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Retorna todas as features ativas
     */
    async getActiveFeatures(restaurantId: string): Promise<FeatureFlag[]> {
        const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);
        
        if (!subscription) {
            return [];
        }
        
        // Filtrar features bloqueadas pelo status
        return subscription.enabled_features.filter(
            feature => !isFeatureBlocked(subscription.status, feature)
        );
    }
    
    /**
     * Verifica limite de terminais
     */
    async canAddTerminal(restaurantId: string): Promise<{ allowed: boolean; current: number; max: number }> {
        const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);
        
        if (!subscription) {
            return { allowed: false, current: 0, max: 0 };
        }
        
        const currentTerminals = await this.countTerminals(restaurantId);
        const maxTerminals = subscription.max_terminals;
        
        // -1 significa ilimitado
        const allowed = maxTerminals === -1 || currentTerminals < maxTerminals;
        
        return {
            allowed,
            current: currentTerminals,
            max: maxTerminals,
        };
    }
    
    /**
     * Verifica se subscription está ativa
     */
    async isSubscriptionActive(restaurantId: string): Promise<boolean> {
        const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);
        
        if (!subscription) {
            return false;
        }
        
        return SubscriptionStateMachine.isOperational(subscription.status);
    }
    
    /**
     * Obtém informações completas de billing
     */
    async getBillingInfo(restaurantId: string): Promise<BillingInfo | null> {
        const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);
        
        if (!subscription) {
            return null;
        }
        
        const plan = DEFAULT_PLANS.find(p => p.plan_id === subscription.plan_id);
        
        return {
            subscription_id: subscription.subscription_id,
            restaurant_id: restaurantId,
            status: subscription.status,
            plan: plan ? {
                id: plan.plan_id,
                name: plan.name,
                tier: plan.tier,
                price_cents: plan.price_cents,
            } : null,
            enabled_features: await this.getActiveFeatures(restaurantId),
            configured_gateways: subscription.configured_gateways.map(g => ({
                type: g.gateway_type,
                verified: g.verified,
            })),
            terminals: await this.canAddTerminal(restaurantId),
            current_period_end: subscription.current_period_end,
            is_trial: subscription.status === 'TRIAL',
            trial_ends_at: subscription.trial_ends_at,
        };
    }
    
    // Private helpers
    private async countTerminals(restaurantId: string): Promise<number> {
        // TODO: Implementar contagem real de terminais ativos
        return 0;
    }
}

// ============================================================================
// TYPES
// ============================================================================

export interface BillingInfo {
    readonly subscription_id: string;
    readonly restaurant_id: string;
    readonly status: SubscriptionStatus;
    readonly plan: {
        readonly id: string;
        readonly name: string;
        readonly tier: string;
        readonly price_cents: number;
    } | null;
    readonly enabled_features: FeatureFlag[];
    readonly configured_gateways: {
        readonly type: GatewayType;
        readonly verified: boolean;
    }[];
    readonly terminals: {
        readonly allowed: boolean;
        readonly current: number;
        readonly max: number;
    };
    readonly current_period_end: Date;
    readonly is_trial: boolean;
    readonly trial_ends_at?: Date;
}

// ============================================================================
// MIDDLEWARE (Para uso em rotas/handlers)
// ============================================================================

/**
 * Middleware que verifica feature antes de executar
 */
export function requireFeature(feature: FeatureFlag) {
    return async (
        restaurantId: string,
        featureGate: FeatureGate
    ): Promise<FeatureCheckResult> => {
        const hasAccess = await featureGate.hasFeature(restaurantId, feature);
        
        if (!hasAccess) {
            return {
                allowed: false,
                reason: `Feature '${feature}' not available for this subscription`,
                upgrade_hint: getUpgradeHint(feature),
            };
        }
        
        return { allowed: true };
    };
}

/**
 * Middleware que verifica gateway antes de processar pagamento
 */
export function requireGateway(gateway: GatewayType) {
    return async (
        restaurantId: string,
        featureGate: FeatureGate
    ): Promise<FeatureCheckResult> => {
        const canUse = await featureGate.canUseGateway(restaurantId, gateway);
        
        if (!canUse) {
            return {
                allowed: false,
                reason: `Gateway '${gateway}' not configured or not available`,
                upgrade_hint: `Configure ${gateway} in your dashboard or upgrade your plan`,
            };
        }
        
        return { allowed: true };
    };
}

export interface FeatureCheckResult {
    readonly allowed: boolean;
    readonly reason?: string;
    readonly upgrade_hint?: string;
}

function getUpgradeHint(feature: FeatureFlag): string {
    const hints: Record<FeatureFlag, string> = {
        'CORE_POS': 'Contact support',
        'CORE_ORDERS': 'Contact support',
        'CORE_TABLES': 'Contact support',
        'CORE_PAYMENTS': 'Update your payment method',
        'CORE_AUDIT': 'Contact support',
        'GATEWAY_STRIPE': 'Upgrade to Professional plan',
        'GATEWAY_SUMUP': 'Available on all plans',
        'GATEWAY_CASH': 'Available on all plans',
        'RESERVATIONS': 'Add Reservations add-on (€19/month)',
        'WEB_PAGE': 'Add Web Page add-on (€29/month)',
        'MULTI_LOCATION': 'Upgrade to Enterprise plan',
        'WHITE_LABEL': 'Add White Label add-on (€99/month)',
        'FISCAL_ADVANCED': 'Upgrade to Enterprise plan',
        'ANALYTICS_PRO': 'Upgrade to Professional plan',
        'API_ACCESS': 'Upgrade to Enterprise plan',
    };
    
    return hints[feature] || 'Upgrade your plan';
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    FeatureFlag,
    GatewayType,
    SubscriptionStatus,
} from './types';
