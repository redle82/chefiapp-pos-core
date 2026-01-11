-- Migration 019: Restore Cash Register and Payment Tables (Peristalsis)
-- 1. GM Cash Registers
CREATE TABLE IF NOT EXISTS public.gm_cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    name TEXT NOT NULL DEFAULT 'Caixa Principal',
    status TEXT NOT NULL DEFAULT 'closed',
    -- 'open', 'closed'
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opened_by TEXT,
    -- User ID or Name
    closed_by TEXT,
    opening_balance_cents BIGINT DEFAULT 0,
    closing_balance_cents BIGINT,
    total_sales_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- 2. GM Payments
CREATE TABLE IF NOT EXISTS public.gm_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.gm_orders(id),
    amount_cents BIGINT NOT NULL,
    payment_method TEXT NOT NULL,
    -- 'CASH', 'CARD', etc.
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    gateway_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- 3. GM Cash Register Transactions (Optional audit log for drops/additions, mostly for audit)
CREATE TABLE IF NOT EXISTS public.gm_cash_register_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_register_id UUID NOT NULL REFERENCES public.gm_cash_registers(id),
    type TEXT NOT NULL,
    -- 'OPEN', 'CLOSE', 'DROP', 'ADD', 'SALE'
    amount_cents BIGINT NOT NULL,
    description TEXT,
    performed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_cash_register_transactions ENABLE ROW LEVEL SECURITY;
-- Policies (Broad for MVP, refine for Sovereign)
-- Allow Authenticated Users full access (Tenant isolation handled by app logic for now, or add USING clause if strictly needed)
-- For Peristalsis speed, we allow authenticated.
CREATE POLICY "Enable all for authenticated" ON public.gm_cash_registers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON public.gm_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON public.gm_cash_register_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Grant Access to Postgres Roles
GRANT ALL ON public.gm_cash_registers TO authenticated;
GRANT ALL ON public.gm_payments TO authenticated;
GRANT ALL ON public.gm_cash_register_transactions TO authenticated;
GRANT ALL ON public.gm_cash_registers TO anon;
-- Just in case
GRANT ALL ON public.gm_payments TO anon;