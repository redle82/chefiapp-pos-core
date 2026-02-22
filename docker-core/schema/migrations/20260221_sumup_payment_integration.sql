-- Migration: 20260221_sumup_payment_integration.sql
-- Purpose: Add SumUp payment integration columns to gm_payments
-- Phase: Europe (SumUp EUR) card payment support
-- Date: 2026-02-21
--
-- WHAT THIS ADDS:
-- 1. payment_provider: Identifies external payment provider (sumup, stripe, mercadopago, etc.)
-- 2. external_checkout_id: SumUp checkout ID for tracking during payment flow
-- 3. external_payment_id: Final transaction ID after payment completion
-- 4. metadata: JSONB for provider-specific data (checkout_url, qr_code, etc.)
--
-- BACKWARDS COMPATIBLE: All columns nullable, existing data unaffected

-- =============================================================================
-- 1. Add payment provider tracking columns
-- =============================================================================

ALTER TABLE public.gm_payments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =============================================================================
-- 2. Add indexes for external payment lookups
-- =============================================================================

-- Index for SumUp checkout status queries
CREATE INDEX IF NOT EXISTS idx_gm_payments_external_checkout
  ON public.gm_payments(external_checkout_id)
  WHERE external_checkout_id IS NOT NULL;

-- Index for provider-specific queries (e.g., "all SumUp payments")
CREATE INDEX IF NOT EXISTS idx_gm_payments_provider
  ON public.gm_payments(payment_provider, created_at DESC)
  WHERE payment_provider IS NOT NULL;

-- Index for external payment ID lookups (webhook reconciliation)
CREATE INDEX IF NOT EXISTS idx_gm_payments_external_payment
  ON public.gm_payments(external_payment_id)
  WHERE external_payment_id IS NOT NULL;

-- =============================================================================
-- 3. Add comments for documentation
-- =============================================================================

COMMENT ON COLUMN public.gm_payments.payment_provider IS
  'External payment provider (sumup, stripe, mercadopago, etc.). NULL = direct cash/card.';

COMMENT ON COLUMN public.gm_payments.external_checkout_id IS
  'Provider checkout session ID (e.g., SumUp checkout ID during payment flow).';

COMMENT ON COLUMN public.gm_payments.external_payment_id IS
  'Provider transaction ID after payment completion (e.g., SumUp transaction ID).';

COMMENT ON COLUMN public.gm_payments.metadata IS
  'Provider-specific metadata (checkout_url, qr_code, expiry, etc.).';

-- =============================================================================
-- 4. Verification
-- =============================================================================

DO $$
BEGIN
    -- Verify columns exist
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
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'gm_payments'
          AND column_name = 'external_payment_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'gm_payments'
          AND column_name = 'metadata'
    ) THEN
        RAISE NOTICE '✓ SumUp payment integration columns added successfully';
    ELSE
        RAISE EXCEPTION '✗ Failed to add SumUp payment integration columns';
    END IF;

    -- Verify indexes exist
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'gm_payments'
          AND indexname = 'idx_gm_payments_external_checkout'
    ) AND EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'gm_payments'
          AND indexname = 'idx_gm_payments_provider'
    ) AND EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'gm_payments'
          AND indexname = 'idx_gm_payments_external_payment'
    ) THEN
        RAISE NOTICE '✓ Payment provider indexes created successfully';
    ELSE
        RAISE EXCEPTION '✗ Failed to create payment provider indexes';
    END IF;
END $$;

-- =============================================================================
-- 5. Example usage (for documentation)
-- =============================================================================

-- Example: Insert SumUp payment record during checkout creation
/*
INSERT INTO public.gm_payments (
    restaurant_id,
    order_id,
    amount_cents,
    currency,
    payment_method,
    payment_provider,
    external_checkout_id,
    status,
    metadata
) VALUES (
    'uuid-restaurant-id',
    'uuid-order-id',
    2550, -- €25.50
    'EUR',
    'card',
    'sumup',
    '5a64a64b-ea2c-4cff-916c-34b0ab7023f1', -- SumUp checkout ID
    'pending',
    jsonb_build_object(
        'checkout_url', 'https://pay.sumup.com/...',
        'valid_until', '2026-02-21T23:45:00Z',
        'merchant_code', 'MNAAKKUV'
    )
);
*/

-- Example: Update payment after webhook confirmation
/*
UPDATE public.gm_payments
SET
    status = 'paid',
    external_payment_id = 'TXID-ABC123', -- SumUp transaction ID
    metadata = metadata || jsonb_build_object(
        'completed_at', '2026-02-21T23:30:15Z',
        'card_last4', '1234',
        'card_type', 'MASTERCARD'
    ),
    updated_at = NOW()
WHERE external_checkout_id = '5a64a64b-ea2c-4cff-916c-34b0ab7023f1';
*/
