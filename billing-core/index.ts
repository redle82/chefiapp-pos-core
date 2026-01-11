/**
 * Billing Core - Index
 * 
 * Exports centralizados do módulo de billing
 */

// Types
export * from './types';

// State Machine
export {
    SubscriptionStateMachine,
    SUBSCRIPTION_TRANSITIONS,
    BILLING_GRACE_PERIODS,
    FEATURE_BLOCKING_RULES,
    getBlockedFeatures,
    isFeatureBlocked,
    calculateBillingCycle,
} from './state-machine';

// Feature Gate
export {
    FeatureGateService,
    requireFeature,
    requireGateway,
    type BillingInfo,
    type FeatureCheckResult,
    type SubscriptionRepository,
} from './feature-gate';

// Onboarding
export {
    RestaurantOnboardingService,
    getOnboardingStatus,
    type OnboardingRepository,
    type OnboardingConfig,
    type OnboardingResult,
    type OnboardingStatus,
    type CreateSubscriptionInput,
    type ConfigurePaymentInput,
    type ConfigureGatewayInput,
    type VerifyGatewayInput,
    type ChangePlanInput,
} from './onboarding';

// Event Store
export {
    InMemoryBillingEventStore,
    InMemorySubscriptionStore,
    BILLING_SCHEMA_SQL,
    type BillingEventStore,
    type BillingSubscriptionStore,
} from './event-store';

// Stripe Billing Service
export {
    StripeBillingService,
    type StripeBillingConfig,
    type BusinessType,
    type CreateCustomerInput,
    type StripeCustomer,
    type CreateSubscriptionInput as StripeCreateSubscriptionInput,
    type StripeSubscriptionResult,
    type SubscriptionUpdate,
    type BillingWebhookResult,
    type StripeInvoice,
} from './StripeBillingService';

// Feature Gate Service (Runtime)
export {
    FeatureGateService as RuntimeFeatureGate,
    TIER_FEATURES,
    ADDON_FEATURES,
    ALLOWED_STATUSES,
    requireFeature as requireFeatureDecorator,
    featureGuard,
    loadSubscriptionContext,
    FeatureBlockedError,
    type SubscriptionContext,
} from './FeatureGateService';
