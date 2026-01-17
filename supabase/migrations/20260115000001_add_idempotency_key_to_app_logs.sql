-- 20260115000001_add_idempotency_key_to_app_logs.sql
-- 🛡️ SOVEREIGN LOGGING: idempotency_key to stop 409 storms (client can upsert safely)

ALTER TABLE public.app_logs
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Unique key for dedupe (nullable; only enforced when provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_logs_idempotency_key_unique
  ON public.app_logs(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN public.app_logs.idempotency_key IS 'Client/server deduplication key for log ingestion.';

