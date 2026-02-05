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
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON public.onboarding_events(created_at DESC);