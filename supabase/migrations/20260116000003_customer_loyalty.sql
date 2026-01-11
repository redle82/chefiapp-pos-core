-- Migration: 20260116000003_customer_loyalty.sql
-- Purpose: FASE 3 - CRM e Loyalty System
-- Date: 2026-01-16

-- =============================================================================
-- 1. CUSTOMER PROFILES (CRM)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    full_name TEXT,
    preferred_name TEXT,
    date_of_birth DATE,
    dietary_restrictions TEXT[],
    preferences JSONB DEFAULT '{}'::jsonb,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, email) WHERE email IS NOT NULL,
    UNIQUE(restaurant_id, phone) WHERE phone IS NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_restaurant ON public.customer_profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON public.customer_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON public.customer_profiles(phone) WHERE phone IS NOT NULL;

-- RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers of their restaurants"
    ON public.customer_profiles FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can insert customers for their restaurants"
    ON public.customer_profiles FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can update customers of their restaurants"
    ON public.customer_profiles FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- =============================================================================
-- 2. LOYALTY CARDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
    card_type TEXT NOT NULL DEFAULT 'digital' CHECK (card_type IN ('physical', 'digital')),
    current_tier TEXT NOT NULL DEFAULT 'silver' CHECK (current_tier IN ('silver', 'gold', 'platinum')),
    current_points DECIMAL(10,2) DEFAULT 0,
    points_earned DECIMAL(10,2) DEFAULT 0,
    points_redeemed DECIMAL(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tier_upgraded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    UNIQUE(restaurant_id, customer_id) WHERE customer_id IS NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_restaurant ON public.loyalty_cards(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer ON public.loyalty_cards(customer_id) WHERE customer_id IS NOT NULL;

-- RLS
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty cards of their restaurants"
    ON public.loyalty_cards FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can manage loyalty cards of their restaurants"
    ON public.loyalty_cards FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- =============================================================================
-- 3. LOYALTY TIER CONFIG
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_tier_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    points_per_euro DECIMAL(5,2) DEFAULT 1.0,
    silver_threshold DECIMAL(10,2) DEFAULT 0,
    gold_threshold DECIMAL(10,2) DEFAULT 100,
    platinum_threshold DECIMAL(10,2) DEFAULT 500,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id)
);

-- RLS
ALTER TABLE public.loyalty_tier_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tier configs of their restaurants"
    ON public.loyalty_tier_configs FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can manage tier configs of their restaurants"
    ON public.loyalty_tier_configs FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- =============================================================================
-- 4. LOYALTY REWARDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    points_cost DECIMAL(10,2) NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'free_item', 'cashback', 'other')),
    reward_value JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rewards of their restaurants"
    ON public.loyalty_rewards FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can manage rewards of their restaurants"
    ON public.loyalty_rewards FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- =============================================================================
-- 5. LOYALTY REDEMPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    loyalty_card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE SET NULL,
    points_used DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view redemptions of their restaurants"
    ON public.loyalty_redemptions FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can manage redemptions of their restaurants"
    ON public.loyalty_redemptions FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );
