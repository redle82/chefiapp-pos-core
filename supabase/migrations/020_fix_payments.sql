-- Migration 020: Fix GM Payments Schema
ALTER TABLE public.gm_payments
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.gm_restaurants(id);
-- Also might be good to add tenant_id if required by RLS, but restaurant_id is key for TPV.