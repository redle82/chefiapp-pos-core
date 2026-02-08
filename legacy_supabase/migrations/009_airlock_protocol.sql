-- AIRLOCK PROTOCOL: The Customer Buffer Zone
-- Limits the contact surface between Public Actors and Sovereign Data.
-- Moved from 20260106 to 009 to ensure schema availability.
-- 1. Create the Request Table (The Queue)
CREATE TABLE IF NOT EXISTS public.gm_order_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.saas_tenants(id),
    -- Context
    table_id UUID REFERENCES public.gm_tables(id),
    customer_contact JSONB DEFAULT '{}'::jsonb,
    -- name, phone (volatile)
    -- Content (Denormalized)
    items JSONB NOT NULL,
    -- Array of requested items { product_id, quantity, notes }
    total_cents INTEGER NOT NULL,
    payment_method VARCHAR(50),
    -- 'CASH', 'PIX', 'CARD_MACHINE' (Intent)
    -- State
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- PENDING, ACCEPTED, REJECTED
    sovereign_order_id UUID REFERENCES public.gm_orders(id),
    -- Link to Order if Accepted
    -- Metadata
    request_source VARCHAR(50) DEFAULT 'PUBLIC_QR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Security Policies (RLS)
-- A. PUBLIC ACCESS (The Void)
ALTER TABLE public.gm_order_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert requests" ON public.gm_order_requests;
CREATE POLICY "Public can insert requests" ON public.gm_order_requests FOR
INSERT TO anon,
    authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view own" ON public.gm_order_requests;
CREATE POLICY "Public can view own" ON public.gm_order_requests FOR
SELECT TO anon,
    authenticated USING (true);
-- B. SOVEREIGN ACCESS (The Kernel)
DROP POLICY IF EXISTS "Sovereign can manage requests" ON public.gm_order_requests;
CREATE POLICY "Sovereign can manage requests" ON public.gm_order_requests FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.saas_tenants_members
        WHERE user_id = auth.uid()
            AND tenant_id = gm_order_requests.tenant_id
    )
);
-- 3. Indexes for TPV Polling
CREATE INDEX IF NOT EXISTS idx_requests_tenant_status ON public.gm_order_requests(tenant_id, status);