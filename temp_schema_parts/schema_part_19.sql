-- Migration: 20260116000002_fiscal_event_store.sql
-- Purpose: Fiscal Event Store (GATE 5.1) - Impressão Fiscal
-- Date: 2026-01-16
-- Note: Independent from Core Schema (but references it)

-- FISCAL SCHEMA (GATE 5.1)
-- The "Eye of Sauron" approach: Fiscal Module sees everything, but touches nothing.

-- 1. Fiscal Event Store
CREATE TABLE IF NOT EXISTS public.fiscal_event_store (
    fiscal_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_sequence_id BIGSERIAL NOT NULL,
    
    -- Global Fiscal Ordering
    -- Linkage to Truth (The Check-Mate)
    -- Note: These references are optional for MVP (can be NULL if tables don't exist yet)
    ref_seal_id VARCHAR(255), -- References legal_seals(seal_id) if exists
    ref_event_id UUID, -- References event_store(event_id) if exists
    
    -- Linkage to Orders (for MVP, we link directly to orders)
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    -- Fiscal Details
    doc_type VARCHAR(50) NOT NULL, -- 'TICKETBAI', 'SAF-T', 'MOCK', etc.
    gov_protocol VARCHAR(255), -- Protocol # from Government
    
    -- Payloads (Evidence)
    payload_sent JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_received JSONB,
    
    -- Status
    fiscal_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'REPORTED', 'REJECTED', 'QUEUED', 'OFFLINE_STORED'
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Idempotency: One successful fiscal document per Order (for MVP)
    -- In production, this might be per Legal Seal
    UNIQUE(order_id, doc_type)
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_restaurant ON public.fiscal_event_store(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_order ON public.fiscal_event_store(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_status ON public.fiscal_event_store(fiscal_status);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_created_at ON public.fiscal_event_store(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_seal ON public.fiscal_event_store(ref_seal_id) WHERE ref_seal_id IS NOT NULL;

-- 3. Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_fiscal_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fiscal_modtime ON public.fiscal_event_store;
CREATE TRIGGER update_fiscal_modtime
    BEFORE UPDATE ON public.fiscal_event_store
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_timestamp();

-- 4. RLS Policies
ALTER TABLE public.fiscal_event_store ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant members can view fiscal events for their restaurant
CREATE POLICY "Restaurant members can view fiscal events"
ON public.fiscal_event_store FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.gm_restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can insert fiscal events
CREATE POLICY "Restaurant members can insert fiscal events"
ON public.fiscal_event_store FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM public.gm_restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can update fiscal events (for status updates)
CREATE POLICY "Restaurant members can update fiscal events"
ON public.fiscal_event_store FOR UPDATE
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.gm_restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- 5. Comments (Documentação)
COMMENT ON TABLE public.fiscal_event_store IS 'Fiscal Event Store (GATE 5.1) - Immutable log of fiscal documents sent to government';
COMMENT ON COLUMN public.fiscal_event_store.ref_seal_id IS 'Link to legal_seals table (if exists) - The immutable legal seal';
COMMENT ON COLUMN public.fiscal_event_store.ref_event_id IS 'Link to event_store table (if exists) - The immutable financial fact';
COMMENT ON COLUMN public.fiscal_event_store.order_id IS 'Link to gm_orders - For MVP, we link directly to orders';
COMMENT ON COLUMN public.fiscal_event_store.doc_type IS 'Type of fiscal document: TICKETBAI (Spain), SAF-T (Portugal), MOCK (testing)';
COMMENT ON COLUMN public.fiscal_event_store.gov_protocol IS 'Protocol number received from government API';
COMMENT ON COLUMN public.fiscal_event_store.payload_sent IS 'Exact payload sent to government (XML/JSON) - Evidence for audit';
COMMENT ON COLUMN public.fiscal_event_store.response_received IS 'Response received from government API';
COMMENT ON COLUMN public.fiscal_event_store.fiscal_status IS 'Status: PENDING, REPORTED, REJECTED, QUEUED, OFFLINE_STORED';
;
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
    UNIQUE(restaurant_id, email),
    UNIQUE(restaurant_id, phone)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_restaurant ON public.customer_profiles(restaurant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_email ON public.customer_profiles(restaurant_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_phone ON public.customer_profiles(restaurant_id, phone) WHERE phone IS NOT NULL;

-- RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers of their restaurants"
    ON public.customer_profiles FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert customers for their restaurants"
    ON public.customer_profiles FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update customers of their restaurants"
    ON public.customer_profiles FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
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
    expires_at TIMESTAMPTZ

);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_restaurant ON public.loyalty_cards(restaurant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_cards_customer ON public.loyalty_cards(restaurant_id, customer_id) WHERE customer_id IS NOT NULL;

-- RLS
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty cards of their restaurants"
    ON public.loyalty_cards FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage loyalty cards of their restaurants"
    ON public.loyalty_cards FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
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
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage tier configs of their restaurants"
    ON public.loyalty_tier_configs FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
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
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage rewards of their restaurants"
    ON public.loyalty_rewards FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
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
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage redemptions of their restaurants"
    ON public.loyalty_redemptions FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
    );
;
-- Migration: Mark Test User Onboarding as Complete
-- Purpose: Allow TestSprite tests to bypass onboarding flow
-- Date: 2026-01-17

-- Find the restaurant for the test user (contact@goldmonkey.studio)
-- and mark onboarding as complete

DO $$
DECLARE
    test_user_id UUID;
    test_restaurant_id UUID;
BEGIN
    -- Find test user by email
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'contact@goldmonkey.studio'
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Test user not found. Skipping onboarding completion.';
        RETURN;
    END IF;

    -- Find restaurant for test user
    SELECT restaurant_id INTO test_restaurant_id
    FROM gm_restaurant_members
    WHERE user_id = test_user_id
    LIMIT 1;

    IF test_restaurant_id IS NULL THEN
        RAISE NOTICE 'No restaurant found for test user. Skipping onboarding completion.';
        RETURN;
    END IF;

    -- Mark onboarding as complete
    UPDATE gm_restaurants
    SET 
        onboarding_completed = true,
        onboarding_completed_at = NOW(),
        wizard_completed_at = COALESCE(wizard_completed_at, NOW()),
        setup_status = COALESCE(setup_status::text, 'advanced_done')::text,
        status = COALESCE(status, 'active')
    WHERE id = test_restaurant_id;

    RAISE NOTICE 'Onboarding marked as complete for test user restaurant: %', test_restaurant_id;
END $$;
;
