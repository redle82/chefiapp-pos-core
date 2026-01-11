-- Drop existing objects to ensure clean slate
DROP TABLE IF EXISTS public.gm_payments CASCADE;
DROP FUNCTION IF EXISTS public.process_order_payment;
-- Create gm_payments table
CREATE TABLE public.gm_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency TEXT DEFAULT 'EUR' NOT NULL,
    method TEXT NOT NULL,
    -- 'cash', 'card', 'pix'
    status TEXT NOT NULL,
    -- 'pending', 'paid', 'failed'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Indexes
CREATE INDEX idx_payments_tenant_created ON public.gm_payments(tenant_id, created_at DESC);
CREATE INDEX idx_payments_order ON public.gm_payments(order_id);
-- Enable RLS
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Enable read access for internal users'
        AND tablename = 'gm_payments'
) THEN CREATE POLICY "Enable read access for internal users" ON public.gm_payments FOR
SELECT USING (
        auth.uid() IN (
            SELECT user_id
            FROM public.restaurant_members
            WHERE restaurant_id = gm_payments.tenant_id
        )
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Enable insert access for internal users'
        AND tablename = 'gm_payments'
) THEN CREATE POLICY "Enable insert access for internal users" ON public.gm_payments FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id
            FROM public.restaurant_members
            WHERE restaurant_id = gm_payments.tenant_id
        )
    );
END IF;
END $$;
-- RPC: process_order_payment
-- Handles payment processing and order status update atomically
CREATE OR REPLACE FUNCTION public.process_order_payment(
        p_order_id UUID,
        p_restaurant_id UUID,
        p_cash_register_id UUID,
        -- Optional, but good for tracking
        p_method TEXT,
        p_amount_cents INTEGER,
        p_operator_id UUID DEFAULT NULL,
        p_idempotency_key TEXT DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE v_payment_id UUID;
v_order_total INTEGER;
v_order_status public.order_status;
BEGIN -- 1. Verify Order matches Restaurant and get Total
SELECT total_amount,
    status INTO v_order_total,
    v_order_status
FROM public.gm_orders
WHERE id = p_order_id
    AND restaurant_id = p_restaurant_id;
IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found');
END IF;
-- 2. Validate Amount (Simple exact match for now)
IF v_order_total != p_amount_cents THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Payment amount mismatch'
);
END IF;
-- 3. Check if already paid
IF v_order_status = 'paid'
OR v_order_status = 'delivered' THEN -- simplified check
RETURN jsonb_build_object('success', false, 'error', 'Order already paid');
END IF;
-- 4. Create Payment Record
INSERT INTO public.gm_payments (
        tenant_id,
        order_id,
        amount_cents,
        currency,
        method,
        status,
        metadata
    )
VALUES (
        p_restaurant_id,
        p_order_id,
        p_amount_cents,
        'EUR',
        p_method,
        'paid',
        -- Assume success for now (cash/external terminal)
        jsonb_build_object(
            'operator_id',
            p_operator_id,
            'cash_register_id',
            p_cash_register_id,
            'idempotency_key',
            p_idempotency_key
        )
    )
RETURNING id INTO v_payment_id;
-- 5. Update Order Status
UPDATE public.gm_orders
SET status = 'preparing',
    -- Move to preparing (kitchen)
    payment_status = 'paid',
    payment_method = p_method,
    updated_at = timezone('utc'::text, now())
WHERE id = p_order_id;
-- Return success
RETURN jsonb_build_object(
    'success',
    true,
    'payment_id',
    v_payment_id
);
END;
$function$;