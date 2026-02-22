-- ========================================
-- PRODUCTION DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ========================================
-- Project: kwgsmbrxfcezuvkwgvuf
-- URL: https://supabase.com/dashboard/project/kwgsmbrxfcezuvkwgvuf/sql/new
-- ========================================

-- Add SumUp payment provider columns
ALTER TABLE public.gm_payments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_gm_payments_external_checkout
  ON public.gm_payments(external_checkout_id)
  WHERE external_checkout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_payments_provider
  ON public.gm_payments(payment_provider, created_at DESC)
  WHERE payment_provider IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_payments_external_payment
  ON public.gm_payments(external_payment_id)
  WHERE external_payment_id IS NOT NULL;

-- Add documentation comments
COMMENT ON COLUMN public.gm_payments.payment_provider IS
  'External payment provider (sumup, stripe, mercadopago, etc.)';

COMMENT ON COLUMN public.gm_payments.external_checkout_id IS
  'Provider checkout session ID (SumUp checkout ID during payment)';

COMMENT ON COLUMN public.gm_payments.external_payment_id IS
  'Provider transaction ID after payment completion';

COMMENT ON COLUMN public.gm_payments.metadata IS
  'Provider-specific metadata (checkout_url, qr_code, etc.)';

-- Verification
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'gm_payments'
          AND column_name = 'payment_provider'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'gm_payments'
          AND column_name = 'external_checkout_id'
    ) THEN
        RAISE NOTICE '✓ SumUp payment columns added successfully';
    ELSE
        RAISE EXCEPTION '✗ Failed to add SumUp payment columns';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'gm_payments'
          AND indexname IN ('idx_gm_payments_external_checkout', 'idx_gm_payments_provider')
    ) THEN
        RAISE NOTICE '✓ Payment indexes created successfully';
    ELSE
        RAISE WARNING '⚠ Some indexes may not have been created';
    END IF;
END $$;

-- ========================================
-- Migration complete!
-- ========================================
-- Next: Deploy integration-gateway
-- ========================================
