-- Migration: 054_reservations_system.sql
-- Purpose: Reservations system inspired by CoverManager
-- Date: 2025-01-02

-- 1. Reservation Sources (Online, Phone, Walk-in, External channels)
CREATE TABLE IF NOT EXISTS public.reservation_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('online', 'phone', 'walk_in', 'external_channel', 'appstaff')),
    external_channel_name TEXT, -- 'OpenTable', 'TheFork', etc.
    external_channel_id TEXT, -- External channel identifier
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb, -- API keys, webhooks, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, source_type, external_channel_name)
);

-- 2. Customer Profiles (CRM)
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    full_name TEXT,
    preferred_name TEXT,
    date_of_birth DATE,
    dietary_restrictions TEXT[], -- ['vegetarian', 'gluten-free', etc.]
    preferences JSONB DEFAULT '{}'::jsonb, -- {favorite_table: '7', preferred_time: '20:00', etc.}
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    notes TEXT, -- Internal notes about customer
    tags TEXT[], -- ['VIP', 'regular', 'no-show-risk', etc.]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, email) WHERE email IS NOT NULL,
    UNIQUE(restaurant_id, phone) WHERE phone IS NOT NULL
);

-- 3. Reservations
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
    source_id UUID REFERENCES public.reservation_sources(id) ON DELETE SET NULL,
    reservation_code TEXT NOT NULL, -- Unique code for customer reference
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    table_id UUID, -- Assigned table (from gm_tables)
    special_requests TEXT,
    pre_payment_amount DECIMAL(10,2), -- Optional pre-payment
    pre_payment_status TEXT CHECK (pre_payment_status IN ('pending', 'paid', 'refunded')),
    confirmation_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    seated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    no_show_at TIMESTAMPTZ,
    external_reservation_id TEXT, -- If from external channel
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, reservation_code)
);

-- 4. Waitlist Entries (OnTheGo - Virtual Queue)
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    customer_name TEXT,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    position INTEGER NOT NULL, -- Position in queue
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'seated', 'cancelled', 'expired')),
    estimated_wait_time INTEGER, -- Minutes
    notified_at TIMESTAMPTZ,
    seated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Auto-expire after X hours
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Reservation Payments
CREATE TABLE IF NOT EXISTS public.reservation_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    payment_method TEXT CHECK (payment_method IN ('card', 'transfer', 'cash', 'other')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_intent_id TEXT, -- Stripe/Payment gateway ID
    refunded_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Reservation Channels (External integrations)
CREATE TABLE IF NOT EXISTS public.reservation_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL, -- 'OpenTable', 'TheFork', 'Resy', etc.
    channel_type TEXT NOT NULL CHECK (channel_type IN ('api', 'webhook', 'manual')),
    api_credentials_enc BYTEA, -- Encrypted API credentials
    webhook_url TEXT,
    webhook_secret TEXT,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, channel_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_date ON public.reservations(restaurant_id, reservation_date, reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON public.reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON public.reservations(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_restaurant_status ON public.waitlist_entries(restaurant_id, status, position);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_restaurant ON public.customer_profiles(restaurant_id, email, phone);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_visit ON public.customer_profiles(restaurant_id, last_visit_at DESC);

-- RLS Policies
ALTER TABLE public.reservation_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_channels ENABLE ROW LEVEL SECURITY;

-- Members can view all reservation data for their restaurant
CREATE POLICY "Members can view reservation sources" ON public.reservation_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reservation_sources.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view customer profiles" ON public.customer_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = customer_profiles.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view reservations" ON public.reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reservations.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view waitlist" ON public.waitlist_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = waitlist_entries.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view reservation payments" ON public.reservation_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reservations
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = reservations.restaurant_id
            WHERE reservations.id = reservation_payments.reservation_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view channels" ON public.reservation_channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reservation_channels.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Owners/Managers can manage all reservation data
CREATE POLICY "Owners can manage reservation sources" ON public.reservation_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reservation_sources.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage customer profiles" ON public.customer_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = customer_profiles.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage reservations" ON public.reservations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reservations.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager', 'waiter')
        )
    );

CREATE POLICY "Owners can manage waitlist" ON public.waitlist_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = waitlist_entries.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager', 'waiter')
        )
    );

CREATE POLICY "Owners can manage reservation payments" ON public.reservation_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.reservations
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = reservations.restaurant_id
            WHERE reservations.id = reservation_payments.reservation_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage channels" ON public.reservation_channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = reservation_channels.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

-- Comments
COMMENT ON TABLE public.reservation_sources IS 'Sources of reservations (online, phone, walk-in, external)';
COMMENT ON TABLE public.customer_profiles IS 'CRM: Customer profiles with history and preferences';
COMMENT ON TABLE public.reservations IS 'Reservations with status tracking';
COMMENT ON TABLE public.waitlist_entries IS 'Virtual waitlist for walk-in customers (OnTheGo)';
COMMENT ON TABLE public.reservation_payments IS 'Pre-payments for reservations';
COMMENT ON TABLE public.reservation_channels IS 'External reservation channel integrations';

