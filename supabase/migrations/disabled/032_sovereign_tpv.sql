-- 032_sovereign_tpv.sql
-- ESTABLISHES THE SOVEREIGN FINANCIAL CORE
-- "Sales are Economic Events. Payments are Transactions."
-- 1. Ensure gm_orders has the correct sovereign columns
-- We assume it serves as the 'Sales' ledger.
-- status: 'PLACED' | 'IN_PREP' | 'READY' | 'COMPLETED' | 'CANCELLED'
-- payment_status: 'PENDING' | 'PAID' | 'FAILED' (Legacy, syncing with new table)
-- 2. CREATE PAYMENTS TABLE (The Ledger)
CREATE TABLE IF NOT EXISTS public.gm_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    order_id UUID NOT NULL REFERENCES public.gm_orders(id),
    amount_cents INTEGER NOT NULL,
    -- Stored as cents
    currency TEXT DEFAULT 'EUR',
    method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'pix')),
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);
-- 3. RLS POLICIES FOR PAYMENTS
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Owners can view payments" ON public.gm_payments;
CREATE POLICY "Owners can view payments" ON public.gm_payments FOR
SELECT USING (
        auth.uid() IN (
            SELECT p.id
            FROM public.profiles p
                JOIN public.gm_restaurants r ON r.owner_id = p.id
            WHERE r.id = gm_payments.tenant_id
        )
    );
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Authenticated TPV can create payments" ON public.gm_payments;
CREATE POLICY "Authenticated TPV can create payments" ON public.gm_payments FOR
INSERT WITH CHECK (
        -- Simple check: User must belong to the tenant (via generic profile/membership check if existed, 
        -- but here we assume Owner/Manager contexts which are usually effectively the same in early stage)
        -- Hardened: Ensure the tenant_id matches the restaurant the user owns/manages
        auth.uid() IN (
            SELECT p.id
            FROM public.profiles p
                JOIN public.gm_restaurants r ON r.owner_id = p.id
            WHERE r.id = gm_payments.tenant_id
        ) -- Note: ideally we check `gm_restaurant_members` too, but aiming for 'Minimum Sovereign'
    );
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.gm_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.gm_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.gm_payments(created_at);
-- 5. TRIGGER: Auto-Update Order Payment Status
-- When a payment is successfully inserted, we update the order to PAID/COMPLETED
CREATE OR REPLACE FUNCTION public.fn_process_payment_signal() RETURNS TRIGGER AS $$ BEGIN IF NEW.status = 'paid' THEN
UPDATE public.gm_orders
SET payment_status = 'PAID',
    status = 'COMPLETED',
    -- Auto-close sale loop as requested
    updated_at = NOW()
WHERE id = NEW.order_id
    AND restaurant_id = NEW.tenant_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS tr_process_payment ON public.gm_payments;
CREATE TRIGGER tr_process_payment
AFTER
INSERT ON public.gm_payments FOR EACH ROW EXECUTE FUNCTION public.fn_process_payment_signal();