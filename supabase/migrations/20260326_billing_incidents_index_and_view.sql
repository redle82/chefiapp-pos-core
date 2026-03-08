-- =============================================================================
-- Billing incidents: unique index for deduplication (ON CONFLICT) and
-- view for last-24h monitoring.
-- Ref: docker-core/schema/migrations/20260326_billing_incidents_index_and_view.sql
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS billing_incidents_unique_event_reason
  ON public.billing_incidents (event_id, reason);

CREATE OR REPLACE VIEW public.billing_incidents_last_24h AS
SELECT *
FROM public.billing_incidents
WHERE created_at >= now() - interval '24 hours'
ORDER BY created_at DESC;
