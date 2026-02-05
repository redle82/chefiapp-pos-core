-- Migration: Add sync_metadata to gm_orders
-- Date: 2026-01-23

ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT NULL;

ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
