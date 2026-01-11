/**
 * Restaurant Onboarding Flow
 * 
 * FLUXO COMPLETO:
 * 1. Restaurant cria conta
 * 2. Escolhe plano
 * 3. (Opcional) Inicia trial
 * 4. Configura método de pagamento (SEU billing)
 * 5. Configura gateway do restaurante (Stripe/SumUp DELE)
 * 6. TPV liberado
 * 
 * SEPARAÇÃO CLARA:
 * - Billing = SEU Stripe (você cobra o restaurante)
 * - Gateway = Stripe/SumUp do RESTAURANTE (cliente paga o restaurante)
 */

import { v4 as uuid } from 'uuid';
import {
    Subscription,
    SubscriptionStatus,
    Plan,
    PlanTier,
    GatewayType,
    ConfiguredGateway,
    BillingEvent,
    DEFAULT_PLANS,
} from './types';
import { SubscriptionStateMachine } from './state-machine';

// ============================================================================
// ONBOARDING SERVICE
// ============================================================================

export interface OnboardingRepository {
    saveSubscription(subscription: Subscription): Promise<void>;
    updateSubscription(subscription: Subscription): Promise<void>;
    findSubscription(restaurantId: string): Promise<Subscription | null>;
    appendEvent(event: BillingEvent): Promise<void>;
}

export interface OnboardingConfig {
    defaultPlanId: string;
    autoStartTrial: boolean;
}

export class RestaurantOnboardingService {
    constructor(
        private readonly repo: OnboardingRepository,
        private readonly config: OnboardingConfig = {
            defaultPlanId: 'plan_professional_v1',
            autoStartTrial: true,
        }
    ) {}
    
    // ========================================================================
    // STEP 1: CREATE SUBSCRIPTION
    // ========================================================================
    
    /**
     * Cria nova subscription para restaurante
     * 
     * @param input Dados do restaurante e plano escolhido
     * @returns Subscription criada
     */
    async createSubscription(input: CreateSubscriptionInput): Promise<OnboardingResult> {
        const existingSubscription = await this.repo.findSubscription(input.restaurant_id);
        
        if (existingSubscription) {
            return {
                success: false,
                error: 'Restaurant already has a subscription',
                subscription: existingSubscription,
            };
        }
        
        const plan = DEFAULT_PLANS.find(p => p.plan_id === input.plan_id) 
            || DEFAULT_PLANS.find(p => p.plan_id === this.config.defaultPlanId)!;
        
        const now = new Date();
        const trialEndsAt = this.config.autoStartTrial
            ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
            : undefined;
        
        const periodEnd = trialEndsAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const subscription: Subscription = {
            subscription_id: uuid(),
            restaurant_id: input.restaurant_id,
            plan_id: plan.plan_id,
            plan_tier: plan.tier,
            status: this.config.autoStartTrial ? 'TRIAL' : 'ACTIVE',
            created_at: now,
            trial_ends_at: trialEndsAt,
            current_period_start: now,
            current_period_end: periodEnd,
            next_payment_at: periodEnd,
            active_addons: [],
            configured_gateways: [],
            enabled_features: [...plan.features],
            max_terminals: plan.max_terminals,
            max_tables: plan.max_tables,
        };
        
        await this.repo.saveSubscription(subscription);
        
        // Emit event
        await this.repo.appendEvent({
            event_id: uuid(),
            type: this.config.autoStartTrial ? 'SUBSCRIPTION_TRIAL_STARTED' : 'SUBSCRIPTION_CREATED',
            subscription_id: subscription.subscription_id,
            restaurant_id: input.restaurant_id,
            occurred_at: now,
            payload: {
                plan_id: plan.plan_id,
                plan_tier: plan.tier,
                trial_days: plan.trial_days,
            },
            metadata: {
                source: 'API',
                actor_id: input.actor_id,
            },
        });
        
        return {
            success: true,
            subscription,
            next_step: 'CONFIGURE_PAYMENT_METHOD',
        };
    }
    
    // ========================================================================
    // STEP 2: CONFIGURE BILLING PAYMENT (SEU STRIPE)
    // ========================================================================
    
    /**
     * Configura método de pagamento para billing
     * 
     * Este é o Stripe SEU - para cobrar assinatura do restaurante
     */
    async configurePaymentMethod(input: ConfigurePaymentInput): Promise<OnboardingResult> {
        const subscription = await this.repo.findSubscription(input.restaurant_id);
        
        if (!subscription) {
            return { success: false, error: 'Subscription not found' };
        }
        
        // TODO: Integrar com SEU Stripe para salvar payment method
        // stripe.paymentMethods.attach(input.payment_method_id, { customer: ... })
        
        const updated: Subscription = {
            ...subscription,
            payment_method_id: input.payment_method_id,
        };
        
        await this.repo.updateSubscription(updated);
        
        return {
            success: true,
            subscription: updated,
            next_step: 'CONFIGURE_RESTAURANT_GATEWAY',
        };
    }
    
    // ========================================================================
    // STEP 3: CONFIGURE RESTAURANT GATEWAY (STRIPE/SUMUP DO RESTAURANTE)
    // ========================================================================
    
    /**
     * Configura gateway de pagamento DO RESTAURANTE
     * 
     * IMPORTANTE: Esta é a conta Stripe/SumUp DO RESTAURANTE
     * O dinheiro do cliente vai DIRETO para lá
     * ChefI NÃO toca nesse dinheiro
     */
    async configureRestaurantGateway(input: ConfigureGatewayInput): Promise<OnboardingResult> {
        const subscription = await this.repo.findSubscription(input.restaurant_id);
        
        if (!subscription) {
            return { success: false, error: 'Subscription not found' };
        }
        
        // Verificar se plano permite esse gateway
        const plan = DEFAULT_PLANS.find(p => p.plan_id === subscription.plan_id);
        if (!plan?.allowed_gateways.includes(input.gateway_type)) {
            return {
                success: false,
                error: `Gateway ${input.gateway_type} not available on ${plan?.name} plan`,
                upgrade_hint: 'Upgrade to Professional or Enterprise plan',
            };
        }
        
        // Verificar se já existe esse gateway configurado
        const existingIndex = subscription.configured_gateways.findIndex(
            g => g.gateway_type === input.gateway_type
        );
        
        const newGateway: ConfiguredGateway = {
            gateway_type: input.gateway_type,
            gateway_account_id: input.account_id,
            api_key_hash: this.hashSecret(input.api_key),
            webhook_secret_hash: input.webhook_secret 
                ? this.hashSecret(input.webhook_secret)
                : undefined,
            configured_at: new Date(),
            verified: false,  // Será verificado no próximo passo
        };
        
        const gateways = [...subscription.configured_gateways];
        if (existingIndex >= 0) {
            gateways[existingIndex] = newGateway;
        } else {
            gateways.push(newGateway);
        }
        
        const updated: Subscription = {
            ...subscription,
            configured_gateways: gateways,
        };
        
        await this.repo.updateSubscription(updated);
        
        await this.repo.appendEvent({
            event_id: uuid(),
            type: 'GATEWAY_CONFIGURED',
            subscription_id: subscription.subscription_id,
            restaurant_id: input.restaurant_id,
            occurred_at: new Date(),
            payload: {
                gateway_type: input.gateway_type,
                account_id: input.account_id,
            },
            metadata: {
                source: 'API',
                actor_id: input.actor_id,
            },
        });
        
        return {
            success: true,
            subscription: updated,
            next_step: 'VERIFY_GATEWAY',
        };
    }
    
    // ========================================================================
    // STEP 4: VERIFY GATEWAY
    // ========================================================================
    
    /**
     * Verifica se gateway está funcionando
     * 
     * Tenta criar um PaymentIntent de €0.50 (mínimo Stripe) e cancela
     * Isso valida que as credenciais estão corretas
     */
    async verifyGateway(input: VerifyGatewayInput): Promise<OnboardingResult> {
        const subscription = await this.repo.findSubscription(input.restaurant_id);
        
        if (!subscription) {
            return { success: false, error: 'Subscription not found' };
        }
        
        const gateway = subscription.configured_gateways.find(
            g => g.gateway_type === input.gateway_type
        );
        
        if (!gateway) {
            return { success: false, error: `Gateway ${input.gateway_type} not configured` };
        }
        
        // TODO: Fazer verificação real com o gateway
        // - Criar PaymentIntent de teste
        // - Verificar webhook endpoint
        // - Cancelar PaymentIntent
        
        const verifiedGateway: ConfiguredGateway = {
            ...gateway,
            verified: true,
            last_verified_at: new Date(),
        };
        
        const gateways = subscription.configured_gateways.map(g =>
            g.gateway_type === input.gateway_type ? verifiedGateway : g
        );
        
        const updated: Subscription = {
            ...subscription,
            configured_gateways: gateways,
        };
        
        await this.repo.updateSubscription(updated);
        
        await this.repo.appendEvent({
            event_id: uuid(),
            type: 'GATEWAY_VERIFIED',
            subscription_id: subscription.subscription_id,
            restaurant_id: input.restaurant_id,
            occurred_at: new Date(),
            payload: {
                gateway_type: input.gateway_type,
            },
            metadata: {
                source: 'API',
                actor_id: input.actor_id,
            },
        });
        
        // Verificar se onboarding está completo
        const hasPaymentMethod = !!subscription.payment_method_id;
        const hasVerifiedGateway = gateways.some(g => g.verified);
        const isComplete = hasPaymentMethod && hasVerifiedGateway;
        
        return {
            success: true,
            subscription: updated,
            next_step: isComplete ? 'COMPLETE' : 'CONFIGURE_PAYMENT_METHOD',
            onboarding_complete: isComplete,
        };
    }
    
    // ========================================================================
    // UPGRADE/DOWNGRADE
    // ========================================================================
    
    /**
     * Muda o plano da subscription
     */
    async changePlan(input: ChangePlanInput): Promise<OnboardingResult> {
        const subscription = await this.repo.findSubscription(input.restaurant_id);
        
        if (!subscription) {
            return { success: false, error: 'Subscription not found' };
        }
        
        const newPlan = DEFAULT_PLANS.find(p => p.plan_id === input.new_plan_id);
        
        if (!newPlan) {
            return { success: false, error: 'Plan not found' };
        }
        
        const currentPlan = DEFAULT_PLANS.find(p => p.plan_id === subscription.plan_id);
        const isUpgrade = newPlan.price_cents > (currentPlan?.price_cents || 0);
        
        const updated: Subscription = {
            ...subscription,
            plan_id: newPlan.plan_id,
            plan_tier: newPlan.tier,
            enabled_features: [...newPlan.features],
            max_terminals: newPlan.max_terminals,
            max_tables: newPlan.max_tables,
        };
        
        await this.repo.updateSubscription(updated);
        
        await this.repo.appendEvent({
            event_id: uuid(),
            type: isUpgrade ? 'PLAN_UPGRADED' : 'PLAN_DOWNGRADED',
            subscription_id: subscription.subscription_id,
            restaurant_id: input.restaurant_id,
            occurred_at: new Date(),
            payload: {
                old_plan_id: subscription.plan_id,
                new_plan_id: newPlan.plan_id,
                old_price_cents: currentPlan?.price_cents,
                new_price_cents: newPlan.price_cents,
            },
            metadata: {
                source: 'API',
                actor_id: input.actor_id,
            },
        });
        
        return {
            success: true,
            subscription: updated,
        };
    }
    
    // ========================================================================
    // HELPERS
    // ========================================================================
    
    private hashSecret(secret: string): string {
        // TODO: Use proper encryption (AES-256-GCM) with key from env
        // For now, just a placeholder hash
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(secret).digest('hex');
    }
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateSubscriptionInput {
    restaurant_id: string;
    plan_id?: string;
    actor_id?: string;
}

export interface ConfigurePaymentInput {
    restaurant_id: string;
    payment_method_id: string;
    actor_id?: string;
}

export interface ConfigureGatewayInput {
    restaurant_id: string;
    gateway_type: GatewayType;
    api_key: string;
    webhook_secret?: string;
    account_id: string;
    actor_id?: string;
}

export interface VerifyGatewayInput {
    restaurant_id: string;
    gateway_type: GatewayType;
    actor_id?: string;
}

export interface ChangePlanInput {
    restaurant_id: string;
    new_plan_id: string;
    actor_id?: string;
}

export interface OnboardingResult {
    success: boolean;
    error?: string;
    upgrade_hint?: string;
    subscription?: Subscription;
    next_step?: 'CONFIGURE_PAYMENT_METHOD' | 'CONFIGURE_RESTAURANT_GATEWAY' | 'VERIFY_GATEWAY' | 'COMPLETE';
    onboarding_complete?: boolean;
}

// ============================================================================
// ONBOARDING STATUS
// ============================================================================

export interface OnboardingStatus {
    restaurant_id: string;
    steps: {
        account_created: boolean;
        plan_selected: boolean;
        payment_method_configured: boolean;
        gateway_configured: boolean;
        gateway_verified: boolean;
    };
    current_step: number;
    total_steps: number;
    is_complete: boolean;
    can_use_pos: boolean;
}

export function getOnboardingStatus(subscription: Subscription | null): OnboardingStatus {
    if (!subscription) {
        return {
            restaurant_id: '',
            steps: {
                account_created: false,
                plan_selected: false,
                payment_method_configured: false,
                gateway_configured: false,
                gateway_verified: false,
            },
            current_step: 0,
            total_steps: 5,
            is_complete: false,
            can_use_pos: false,
        };
    }
    
    const steps = {
        account_created: true,
        plan_selected: true,
        payment_method_configured: !!subscription.payment_method_id,
        gateway_configured: subscription.configured_gateways.length > 0,
        gateway_verified: subscription.configured_gateways.some(g => g.verified),
    };
    
    const completedSteps = Object.values(steps).filter(Boolean).length;
    const isComplete = Object.values(steps).every(Boolean);
    
    // Pode usar POS se tiver gateway verificado (trial ou pago)
    const canUsePOS = steps.gateway_verified && 
        SubscriptionStateMachine.isOperational(subscription.status);
    
    return {
        restaurant_id: subscription.restaurant_id,
        steps,
        current_step: completedSteps,
        total_steps: 5,
        is_complete: isComplete,
        can_use_pos: canUsePOS,
    };
}
