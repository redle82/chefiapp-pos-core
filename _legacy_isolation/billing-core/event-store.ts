/**
 * Billing Event Store
 * 
 * Persistência event-sourced para billing
 * Separado do Core de pedidos/pagamentos
 * 
 * PRINCÍPIO: DOIS SISTEMAS, DUAS HISTÓRIAS
 * 
 * - billing_events = SEU dinheiro (assinaturas)
 * - core_events = dinheiro do RESTAURANTE (pedidos)
 */

import { BillingEvent, BillingEventType, Subscription } from './types';

// ============================================================================
// INTERFACES
// ============================================================================

export interface BillingEventStore {
    /**
     * Append event to stream
     */
    append(event: BillingEvent): Promise<void>;
    
    /**
     * Get all events for a subscription
     */
    getBySubscription(subscriptionId: string): Promise<BillingEvent[]>;
    
    /**
     * Get all events for a restaurant
     */
    getByRestaurant(restaurantId: string): Promise<BillingEvent[]>;
    
    /**
     * Get events by type
     */
    getByType(type: BillingEventType): Promise<BillingEvent[]>;
    
    /**
     * Get events in time range
     */
    getByTimeRange(start: Date, end: Date): Promise<BillingEvent[]>;
    
    /**
     * Get latest event for subscription
     */
    getLatest(subscriptionId: string): Promise<BillingEvent | null>;
}

export interface BillingSubscriptionStore {
    /**
     * Save new subscription
     */
    save(subscription: Subscription): Promise<void>;
    
    /**
     * Update existing subscription
     */
    update(subscription: Subscription): Promise<void>;
    
    /**
     * Find by subscription ID
     */
    findById(subscriptionId: string): Promise<Subscription | null>;
    
    /**
     * Find by restaurant ID
     */
    findByRestaurant(restaurantId: string): Promise<Subscription | null>;
    
    /**
     * Find all subscriptions by status
     */
    findByStatus(status: string): Promise<Subscription[]>;
    
    /**
     * Find subscriptions expiring soon
     */
    findExpiringSoon(days: number): Promise<Subscription[]>;
    
    /**
     * Find past due subscriptions
     */
    findPastDue(): Promise<Subscription[]>;
}

// ============================================================================
// IN-MEMORY IMPLEMENTATION (For testing)
// ============================================================================

export class InMemoryBillingEventStore implements BillingEventStore {
    private events: Map<string, BillingEvent> = new Map();
    
    async append(event: BillingEvent): Promise<void> {
        if (this.events.has(event.event_id)) {
            throw new Error(`Event ${event.event_id} already exists`);
        }
        this.events.set(event.event_id, event);
    }
    
    async getBySubscription(subscriptionId: string): Promise<BillingEvent[]> {
        return Array.from(this.events.values())
            .filter(e => e.subscription_id === subscriptionId)
            .sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime());
    }
    
    async getByRestaurant(restaurantId: string): Promise<BillingEvent[]> {
        return Array.from(this.events.values())
            .filter(e => e.restaurant_id === restaurantId)
            .sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime());
    }
    
    async getByType(type: BillingEventType): Promise<BillingEvent[]> {
        return Array.from(this.events.values())
            .filter(e => e.type === type)
            .sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime());
    }
    
    async getByTimeRange(start: Date, end: Date): Promise<BillingEvent[]> {
        return Array.from(this.events.values())
            .filter(e => e.occurred_at >= start && e.occurred_at <= end)
            .sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime());
    }
    
    async getLatest(subscriptionId: string): Promise<BillingEvent | null> {
        const events = await this.getBySubscription(subscriptionId);
        return events.length > 0 ? events[events.length - 1] : null;
    }
    
    // For testing
    clear(): void {
        this.events.clear();
    }
    
    size(): number {
        return this.events.size;
    }
}

export class InMemorySubscriptionStore implements BillingSubscriptionStore {
    private subscriptions: Map<string, Subscription> = new Map();
    private byRestaurant: Map<string, string> = new Map();
    
    async save(subscription: Subscription): Promise<void> {
        if (this.subscriptions.has(subscription.subscription_id)) {
            throw new Error(`Subscription ${subscription.subscription_id} already exists`);
        }
        if (this.byRestaurant.has(subscription.restaurant_id)) {
            throw new Error(`Restaurant ${subscription.restaurant_id} already has a subscription`);
        }
        
        this.subscriptions.set(subscription.subscription_id, subscription);
        this.byRestaurant.set(subscription.restaurant_id, subscription.subscription_id);
    }
    
    async update(subscription: Subscription): Promise<void> {
        if (!this.subscriptions.has(subscription.subscription_id)) {
            throw new Error(`Subscription ${subscription.subscription_id} not found`);
        }
        this.subscriptions.set(subscription.subscription_id, subscription);
    }
    
    async findById(subscriptionId: string): Promise<Subscription | null> {
        return this.subscriptions.get(subscriptionId) || null;
    }
    
    async findByRestaurant(restaurantId: string): Promise<Subscription | null> {
        const subscriptionId = this.byRestaurant.get(restaurantId);
        if (!subscriptionId) return null;
        return this.subscriptions.get(subscriptionId) || null;
    }
    
    async findByStatus(status: string): Promise<Subscription[]> {
        return Array.from(this.subscriptions.values())
            .filter(s => s.status === status);
    }
    
    async findExpiringSoon(days: number): Promise<Subscription[]> {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + days);
        
        return Array.from(this.subscriptions.values())
            .filter(s => 
                s.status === 'ACTIVE' && 
                s.current_period_end <= threshold
            );
    }
    
    async findPastDue(): Promise<Subscription[]> {
        return Array.from(this.subscriptions.values())
            .filter(s => s.status === 'PAST_DUE');
    }
    
    // For testing
    clear(): void {
        this.subscriptions.clear();
        this.byRestaurant.clear();
    }
    
    size(): number {
        return this.subscriptions.size;
    }
}

// ============================================================================
// SCHEMA SQL (Para PostgreSQL)
// ============================================================================

export const BILLING_SCHEMA_SQL = `
-- ============================================================================
-- BILLING CORE SCHEMA
-- Separado do Core de pedidos/pagamentos
-- ============================================================================

-- Billing Events (Event-Sourced)
CREATE TABLE IF NOT EXISTS billing_events (
    event_id UUID PRIMARY KEY,
    type VARCHAR(64) NOT NULL,
    subscription_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB NOT NULL DEFAULT '{}',
    metadata JSONB,
    
    -- Indexes
    CONSTRAINT billing_events_type_check CHECK (type IN (
        'SUBSCRIPTION_CREATED',
        'SUBSCRIPTION_ACTIVATED',
        'SUBSCRIPTION_TRIAL_STARTED',
        'SUBSCRIPTION_TRIAL_ENDED',
        'SUBSCRIPTION_RENEWED',
        'SUBSCRIPTION_PAST_DUE',
        'SUBSCRIPTION_SUSPENDED',
        'SUBSCRIPTION_REACTIVATED',
        'SUBSCRIPTION_CANCELLED',
        'SUBSCRIPTION_EXPIRED',
        'PLAN_UPGRADED',
        'PLAN_DOWNGRADED',
        'ADDON_ACTIVATED',
        'ADDON_DEACTIVATED',
        'ADDON_RENEWED',
        'PAYMENT_ATTEMPTED',
        'PAYMENT_SUCCEEDED',
        'PAYMENT_FAILED',
        'PAYMENT_REFUNDED',
        'GATEWAY_CONFIGURED',
        'GATEWAY_VERIFIED',
        'GATEWAY_VERIFICATION_FAILED',
        'GATEWAY_REMOVED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_billing_events_subscription 
    ON billing_events(subscription_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_billing_events_restaurant 
    ON billing_events(restaurant_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_billing_events_type 
    ON billing_events(type, occurred_at);

-- Subscriptions (Current State)
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id UUID PRIMARY KEY,
    restaurant_id UUID UNIQUE NOT NULL,
    
    -- Plan
    plan_id VARCHAR(64) NOT NULL,
    plan_tier VARCHAR(32) NOT NULL,
    
    -- Status
    status VARCHAR(32) NOT NULL DEFAULT 'TRIAL',
    status_reason TEXT,
    
    -- Dates
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    
    -- Payment
    payment_method_id VARCHAR(255),
    last_payment_at TIMESTAMPTZ,
    next_payment_at TIMESTAMPTZ NOT NULL,
    
    -- Limits
    max_terminals INTEGER NOT NULL DEFAULT 1,
    max_tables INTEGER NOT NULL DEFAULT 20,
    
    -- JSON fields
    active_addons JSONB NOT NULL DEFAULT '[]',
    configured_gateways JSONB NOT NULL DEFAULT '[]',
    enabled_features JSONB NOT NULL DEFAULT '[]',
    
    -- Constraints
    CONSTRAINT subscriptions_status_check CHECK (status IN (
        'TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'
    )),
    CONSTRAINT subscriptions_tier_check CHECK (plan_tier IN (
        'STARTER', 'PROFESSIONAL', 'ENTERPRISE'
    ))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
    ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment 
    ON subscriptions(next_payment_at) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends 
    ON subscriptions(trial_ends_at) WHERE status = 'TRIAL';

-- Billing Payments (SEU Stripe)
CREATE TABLE IF NOT EXISTS billing_payments (
    payment_id UUID PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(subscription_id),
    
    -- Amount
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Status
    status VARCHAR(32) NOT NULL,
    failure_code VARCHAR(64),
    failure_message TEXT,
    
    -- Stripe
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    
    -- Dates
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    CONSTRAINT billing_payments_status_check CHECK (status IN (
        'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_subscription 
    ON billing_payments(subscription_id, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_payments_stripe 
    ON billing_payments(stripe_payment_intent_id);

-- ============================================================================
-- IMMUTABILITY TRIGGERS
-- ============================================================================

-- Billing events are immutable
CREATE OR REPLACE FUNCTION prevent_billing_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'billing_events table is immutable. UPDATE and DELETE are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS billing_events_immutable ON billing_events;
CREATE TRIGGER billing_events_immutable
    BEFORE UPDATE OR DELETE ON billing_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_billing_event_mutation();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE billing_events IS 'Event-sourced billing history - IMMUTABLE';
COMMENT ON TABLE subscriptions IS 'Current subscription state - derived from events';
COMMENT ON TABLE billing_payments IS 'Payment records for ChefI billing (not restaurant payments)';
`;
