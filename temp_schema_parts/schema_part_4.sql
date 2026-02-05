-- ==========================================
-- TELEMETRY & IDENTITY HARDENING (Phase 1.5)
-- ==========================================
-- 1. Ensure onboarding_events is open for telemetry
-- We allow ANONYMOUS inserts because some events happen during the transition
-- but we restrict it to just 'onboarding' related data.
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.onboarding_events;
CREATE POLICY "Enable insert for everyone" ON public.onboarding_events FOR
INSERT TO anon,
    authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view their own events" ON public.onboarding_events;
CREATE POLICY "Users can view their own events" ON public.onboarding_events FOR
SELECT TO authenticated USING (auth.uid() = user_id);
-- 2. Audit Index (Ensure timeline performance)
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON public.onboarding_events(created_at DESC);
-- 3. Ensure repair-membership can see gm_restaurants
-- (Usually exists, but let's be safe with permissions)
GRANT SELECT ON public.gm_restaurants TO authenticated;
GRANT ALL ON public.restaurant_members TO service_role;;
-- 012_create_onboarding_events.sql
-- Purpose: Define the core telemetry table for onboarding tracking.
CREATE TABLE IF NOT EXISTS public.onboarding_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    restaurant_id UUID,
    -- Optional at birth
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS already handled in 011 or will be applied by 011 re-run
-- But let's define the base permissions here for completeness
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.onboarding_events;
CREATE POLICY "Enable insert for everyone" ON public.onboarding_events FOR
INSERT TO anon,
    authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view their own events" ON public.onboarding_events;
CREATE POLICY "Users can view their own events" ON public.onboarding_events FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON public.onboarding_events(created_at DESC);;
-- 013_external_connectors.sql
-- Purpose: Manage external destinations for stability signals.
CREATE TABLE IF NOT EXISTS public.external_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    connector_type TEXT NOT NULL,
    -- 'generic_webhook', 'marketing_api', 'review_bot'
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.external_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage their own connectors" ON public.external_connectors FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.restaurant_members
        WHERE restaurant_id = external_connectors.restaurant_id
            AND user_id = auth.uid()
            AND role = 'owner'
    )
);
CREATE INDEX IF NOT EXISTS idx_external_connectors_restaurant ON public.external_connectors(restaurant_id);;
