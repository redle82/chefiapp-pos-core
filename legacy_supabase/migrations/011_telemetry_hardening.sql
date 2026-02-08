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
GRANT ALL ON public.restaurant_members TO service_role;