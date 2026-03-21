-- =============================================================================
-- Migration: Enterprise Stripe Invoice Automation
-- Date: 2026-04-16
-- Purpose:
--   1) Persist Stripe invoice/payment IDs in gm_org_invoices
--   2) Track enterprise payment status lifecycle
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gm_org_invoices'
      AND column_name = 'stripe_invoice_id'
  ) THEN
    ALTER TABLE public.gm_org_invoices
      ADD COLUMN stripe_invoice_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gm_org_invoices'
      AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE public.gm_org_invoices
      ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gm_org_invoices'
      AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.gm_org_invoices
      ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (payment_status IN ('pending', 'paid', 'failed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gm_org_invoices'
      AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE public.gm_org_invoices
      ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gm_org_invoices_stripe_invoice_id
  ON public.gm_org_invoices(stripe_invoice_id);
