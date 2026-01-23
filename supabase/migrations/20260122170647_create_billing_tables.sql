-- Migration: Criar tabelas de billing
-- Data: 2026-01-22
-- Objetivo: Criar estrutura de dados para billing com Stripe
--
-- ⚠️ DEPRECATED: Esta migration é LEGADO
-- ✅ SCHEMA OFICIAL: Use migration 20260130000000_create_billing_core_tables.sql
-- 📋 FONTE DA VERDADE: docs/architecture/BILLING_FLOW.md
--
-- Esta migration é mantida apenas para histórico.
-- NÃO USE estas tabelas (gm_billing_subscriptions, gm_billing_invoices) em novo código.
-- Use as tabelas: subscriptions, billing_events, billing_payments

-- ============================================================================
-- TABELA: gm_billing_subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gm_billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'growth', 'professional', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(restaurant_id) -- Um restaurante só pode ter uma assinatura ativa
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_restaurant 
ON public.gm_billing_subscriptions(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe_subscription 
ON public.gm_billing_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status 
ON public.gm_billing_subscriptions(status);

-- ============================================================================
-- TABELA: gm_billing_invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gm_billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.gm_billing_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('paid', 'open', 'void', 'uncollectible')),
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billing_invoices_restaurant 
ON public.gm_billing_invoices(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_stripe_invoice 
ON public.gm_billing_invoices(stripe_invoice_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_status 
ON public.gm_billing_invoices(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription 
ON public.gm_billing_invoices(subscription_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.gm_billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_billing_invoices ENABLE ROW LEVEL SECURITY;

-- Policies para subscriptions
CREATE POLICY "Users can view their restaurant's subscriptions"
ON public.gm_billing_subscriptions
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can insert subscriptions for their restaurants"
ON public.gm_billing_subscriptions
FOR INSERT
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can update subscriptions for their restaurants"
ON public.gm_billing_subscriptions
FOR UPDATE
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
)
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

-- Policies para invoices
CREATE POLICY "Users can view their restaurant's invoices"
ON public.gm_billing_invoices
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can insert invoices for their restaurants"
ON public.gm_billing_invoices
FOR INSERT
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can update invoices for their restaurants"
ON public.gm_billing_invoices
FOR UPDATE
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
)
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.gm_billing_subscriptions IS 'Assinaturas Stripe por restaurante';
COMMENT ON TABLE public.gm_billing_invoices IS 'Faturas Stripe por restaurante';
COMMENT ON COLUMN public.gm_billing_subscriptions.restaurant_id IS 'Referência ao restaurante (tenant)';
COMMENT ON COLUMN public.gm_billing_invoices.restaurant_id IS 'Referência ao restaurante (tenant)';
