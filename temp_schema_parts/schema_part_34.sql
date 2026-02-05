-- Migration: Criar tabelas do billing-core (FASE 1)
-- Data: 2026-01-30
-- Objetivo: Criar estrutura de dados do billing-core (subscriptions, billing_events, billing_payments)

-- ============================================================================
-- BILLING CORE SCHEMA
-- Separado do Core de pedidos/pagamentos
-- ============================================================================

-- Billing Events (Event-Sourced)
CREATE TABLE IF NOT EXISTS public.billing_events (
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
    ON public.billing_events(subscription_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_billing_events_restaurant 
    ON public.billing_events(restaurant_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_billing_events_type 
    ON public.billing_events(type, occurred_at);

-- Subscriptions (Current State)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    subscription_id UUID PRIMARY KEY,
    restaurant_id UUID UNIQUE NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
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
    ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment 
    ON public.subscriptions(next_payment_at) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends 
    ON public.subscriptions(trial_ends_at) WHERE status = 'TRIAL';
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant 
    ON public.subscriptions(restaurant_id);

-- Billing Payments (SEU Stripe)
CREATE TABLE IF NOT EXISTS public.billing_payments (
    payment_id UUID PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(subscription_id) ON DELETE CASCADE,
    
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
    ON public.billing_payments(subscription_id, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_payments_stripe 
    ON public.billing_payments(stripe_payment_intent_id);

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

DROP TRIGGER IF EXISTS billing_events_immutable ON public.billing_events;
CREATE TRIGGER billing_events_immutable
    BEFORE UPDATE OR DELETE ON public.billing_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_billing_event_mutation();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;

-- Policies para subscriptions
CREATE POLICY "Users can view their restaurant's subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can insert subscriptions for their restaurants"
ON public.subscriptions
FOR INSERT
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can update subscriptions for their restaurants"
ON public.subscriptions
FOR UPDATE
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
)
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

-- Policies para billing_events
CREATE POLICY "Users can view their restaurant's billing events"
ON public.billing_events
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

-- Policies para billing_payments
CREATE POLICY "Users can view their restaurant's billing payments"
ON public.billing_payments
FOR SELECT
USING (
  subscription_id IN (
    SELECT subscription_id FROM public.subscriptions 
    WHERE restaurant_id IN (SELECT public.get_user_restaurants())
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.billing_events IS 'Event-sourced billing history - IMMUTABLE';
COMMENT ON TABLE public.subscriptions IS 'Current subscription state - derived from events';
COMMENT ON TABLE public.billing_payments IS 'Payment records for ChefI billing (not restaurant payments)';
;
-- Migration: Create employees table with RLS policies
-- Date: 2026-01-30
-- Purpose: Enable staff management functionality

-- ==============================================================================
-- 1. CREATE EMPLOYEES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'worker')),
    position TEXT NOT NULL CHECK (position IN ('kitchen', 'waiter', 'cleaning', 'cashier', 'manager')),
    pin TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. CREATE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_employees_restaurant_id ON public.employees(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(restaurant_id, active) WHERE active = true;

-- Unique constraint: Um usuário não pode ser funcionário duas vezes no mesmo restaurante
CREATE UNIQUE INDEX IF NOT EXISTS employees_unique_user_per_restaurant
ON public.employees (restaurant_id, user_id)
WHERE user_id IS NOT NULL;

-- ==============================================================================
-- 3. ENABLE RLS
-- ==============================================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. RLS POLICIES
-- ==============================================================================

-- Policy: Users can SELECT employees from their restaurants
DROP POLICY IF EXISTS "Users can view employees of their restaurants" ON public.employees;
CREATE POLICY "Users can view employees of their restaurants"
ON public.employees
FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid()
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Owners and managers can INSERT employees
DROP POLICY IF EXISTS "Owners and managers can create employees" ON public.employees;
CREATE POLICY "Owners and managers can create employees"
ON public.employees
FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Owners and managers can UPDATE employees
DROP POLICY IF EXISTS "Owners and managers can update employees" ON public.employees;
CREATE POLICY "Owners and managers can update employees"
ON public.employees
FOR UPDATE
USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Owners and managers can DELETE employees (soft delete via UPDATE)
-- Note: We use UPDATE to set active = false instead of DELETE
DROP POLICY IF EXISTS "Owners and managers can delete employees" ON public.employees;
CREATE POLICY "Owners and managers can delete employees"
ON public.employees
FOR DELETE
USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- ==============================================================================
-- 5. COMMENTS
-- ==============================================================================
COMMENT ON TABLE public.employees IS 'Staff/Employee management table for restaurants';
COMMENT ON COLUMN public.employees.restaurant_id IS 'Reference to the restaurant';
COMMENT ON COLUMN public.employees.user_id IS 'Optional link to user profile (for authenticated staff)';
COMMENT ON COLUMN public.employees.pin IS 'Optional PIN for quick access';
COMMENT ON COLUMN public.employees.active IS 'Soft delete flag - false means employee is inactive';
;
-- FASE 4: Gamificação Interna - Tabelas de Pontos e Achievements
-- Data: 2026-01-30

-- Tabela de pontuação dos usuários
CREATE TABLE IF NOT EXISTS public.user_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    weekly_points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    user_name TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- Tabela de achievements dos usuários
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id, achievement_id)
);

-- Tabela de histórico de pontos (para tracking)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    action_type TEXT, -- 'task_completed', 'payment_processed', 'achievement', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_scores_restaurant ON public.user_scores(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_points ON public.user_scores(restaurant_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_scores_weekly ON public.user_scores(restaurant_id, weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id, restaurant_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON public.point_transactions(user_id, restaurant_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios scores e dos colegas do mesmo restaurante
CREATE POLICY "Users can view scores in their restaurant"
    ON public.user_scores FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.restaurant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Sistema pode inserir/atualizar scores (via service)
CREATE POLICY "Service can manage scores"
    ON public.user_scores FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policy: Usuários podem ver achievements do mesmo restaurante
CREATE POLICY "Users can view achievements in their restaurant"
    ON public.user_achievements FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.restaurant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Sistema pode inserir achievements
CREATE POLICY "Service can manage achievements"
    ON public.user_achievements FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policy: Usuários podem ver transações do mesmo restaurante
CREATE POLICY "Users can view transactions in their restaurant"
    ON public.point_transactions FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.restaurant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Sistema pode inserir transações
CREATE POLICY "Service can insert transactions"
    ON public.point_transactions FOR INSERT
    WITH CHECK (true);

-- Função para resetar pontos semanais (executar via cron)
CREATE OR REPLACE FUNCTION public.reset_weekly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_scores
    SET weekly_points = 0
    WHERE weekly_points > 0;
END;
$$;

-- Comentários
COMMENT ON TABLE public.user_scores IS 'Pontuação dos usuários por restaurante';
COMMENT ON TABLE public.user_achievements IS 'Achievements desbloqueados pelos usuários';
COMMENT ON TABLE public.point_transactions IS 'Histórico de transações de pontos';
;
