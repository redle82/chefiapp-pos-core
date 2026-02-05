-- 033_fiscal_reports.sql
-- ESTABLISHES THE SOVEREIGN FISCAL OUTPUT LAYER
-- Table: gm_daily_closings (Z-Reports)
CREATE TABLE IF NOT EXISTS public.gm_daily_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    -- Period Definition
    opened_at TIMESTAMPTZ,
    -- Start of the fiscal period (derived from last close)
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    -- Point of closure
    -- Financial Totals (The Truth)
    total_gross_cents INTEGER NOT NULL,
    -- Total accumulated
    total_net_cents INTEGER NOT NULL,
    -- Total after deductions
    orders_count INTEGER NOT NULL DEFAULT 0,
    -- Breakdown (Structured Truth)
    -- Format: { "cash": 1000, "card": 2000, "pix": 500 }
    payment_method_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('closed', 'audited')),
    notes TEXT
);
-- RLS POLICIES
ALTER TABLE public.gm_daily_closings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view daily closings" ON public.gm_daily_closings FOR
SELECT USING (
        auth.uid() IN (
            SELECT p.id
            FROM public.profiles p
                JOIN public.gm_restaurants r ON r.owner_id = p.id
            WHERE r.id = gm_daily_closings.tenant_id
        )
    );
CREATE POLICY "Owners can create daily closings" ON public.gm_daily_closings FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT p.id
            FROM public.profiles p
                JOIN public.gm_restaurants r ON r.owner_id = p.id
            WHERE r.id = gm_daily_closings.tenant_id
        )
    );
-- INDEXES
CREATE INDEX idx_daily_closings_tenant ON public.gm_daily_closings(tenant_id);
CREATE INDEX idx_daily_closings_date ON public.gm_daily_closings(closed_at);
-- SOVEREIGN CALCULATION FUNCTION
-- This calculates the Z-Report values from the Immutable Ledger.
-- Frontend should calling this, then submitting the result to close the day.
CREATE OR REPLACE FUNCTION public.fn_get_daily_closing_preview(p_tenant_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_last_closing TIMESTAMPTZ;
v_result JSONB;
BEGIN -- Security Check: Ensure caller owns the tenant
IF NOT EXISTS (
    SELECT 1
    FROM public.gm_restaurants
    WHERE id = p_tenant_id
        AND owner_id = auth.uid()
) THEN RAISE EXCEPTION 'Access denied to this tenant configuration';
END IF;
-- 1. Find last closing time
SELECT closed_at INTO v_last_closing
FROM public.gm_daily_closings
WHERE tenant_id = p_tenant_id
ORDER BY closed_at DESC
LIMIT 1;
-- Default to epoch if no closing found
IF v_last_closing IS NULL THEN v_last_closing := '1970-01-01 00:00:00+00';
END IF;
-- 2. Aggregate from payments (The Sovereign Calculation)
SELECT jsonb_build_object(
        'start_time',
        v_last_closing,
        'end_time',
        NOW(),
        'orders_count',
        COALESCE(COUNT(DISTINCT order_id), 0),
        'total_gross_cents',
        COALESCE(SUM(amount_cents), 0),
        'method_breakdown',
        COALESCE(
            (
                SELECT jsonb_object_agg(method, total)
                FROM (
                        SELECT method,
                            SUM(amount_cents) as total
                        FROM public.gm_payments
                        WHERE tenant_id = p_tenant_id
                            AND created_at > v_last_closing
                            AND status = 'paid'
                        GROUP BY method
                    ) t
            ),
            '{}'::jsonb
        )
    ) INTO v_result
FROM public.gm_payments
WHERE tenant_id = p_tenant_id
    AND created_at > v_last_closing
    AND status = 'paid';
RETURN v_result;
END;
$$;