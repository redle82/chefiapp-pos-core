-- Migration: Sprint 8 Financial Intelligence
-- Date: 2026-02-05
-- Description: Adds cost tracking columns to orders for COGS analysis.

-- 1. Add Cost Columns to Orders
ALTER TABLE public.gm_orders 
ADD COLUMN IF NOT EXISTS total_cost_cents INTEGER DEFAULT 0;

ALTER TABLE public.gm_orders 
ADD COLUMN IF NOT EXISTS gross_margin_cents INTEGER DEFAULT 0;

-- 2. Index for Reporting
CREATE INDEX IF NOT EXISTS idx_orders_created_at_cost ON public.gm_orders(created_at, total_cost_cents);
