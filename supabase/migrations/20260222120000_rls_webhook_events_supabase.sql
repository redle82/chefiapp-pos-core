-- RLS on webhook_events (Supabase baseline)
-- DoD 2026 B1: webhook_events is system table (no restaurant_id); only service_role should access.
-- Ref: docs/audit/RLS_AUDIT_2026.md

BEGIN;

ALTER TABLE IF EXISTS public.webhook_events ENABLE ROW LEVEL SECURITY;

-- service_role: full access (Edge Functions / RPC process_webhook_event)
CREATE POLICY "webhook_events_service_all"
  ON public.webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- anon: no direct access (webhooks are processed server-side only)
-- If anon had grants from baseline, revoke:
REVOKE ALL ON public.webhook_events FROM anon;

COMMIT;
