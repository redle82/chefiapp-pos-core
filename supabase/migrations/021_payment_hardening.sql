-- 021_payment_hardening.sql
-- Enforce Sovereign Wallet Rules
-- 1. Ensure gm_payments has necessary columns
ALTER TABLE public.gm_payments
ADD COLUMN IF NOT EXISTS cash_register_id UUID REFERENCES public.gm_cash_registers(id),
    ADD COLUMN IF NOT EXISTS tenant_id UUID,
    -- Use weak link or FK if saas_tenants exists. Let's assume generic UUID for now to avoid dependency hell if saas_tenants is hidden.
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
    ADD COLUMN IF NOT EXISTS method TEXT,
    ADD COLUMN IF NOT EXISTS amount_cents INTEGER,
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS operator_id UUID;
-- 2. Enforce Idempotency
-- Ensure we don't process the same payment twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_payments_idempotency ON public.gm_payments(idempotency_key)
WHERE idempotency_key IS NOT NULL;
-- 3. Create Atomic Payment RPC
CREATE OR REPLACE FUNCTION public.process_order_payment(
        p_order_id UUID,
        p_restaurant_id UUID,
        p_method TEXT,
        p_amount_cents INTEGER,
        p_cash_register_id UUID,
        p_operator_id UUID DEFAULT NULL,
        p_idempotency_key TEXT DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_payment_id UUID;
v_order_status TEXT;
v_register_status TEXT;
BEGIN -- A. Validation: Cash Register must be OPEN
SELECT status INTO v_register_status
FROM public.gm_cash_registers
WHERE id = p_cash_register_id
    AND restaurant_id = p_restaurant_id;
IF v_register_status IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Cash Register not found'
);
END IF;
IF v_register_status != 'open' THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Cash Register is CLOSED'
);
END IF;
-- B. Validation: Order must NOT be PAID already
SELECT status INTO v_order_status
FROM public.gm_orders
WHERE id = p_order_id
    AND restaurant_id = p_restaurant_id;
IF v_order_status = 'paid'
OR v_order_status = 'served'
OR v_order_status = 'cancelled' THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Order is already final (' || v_order_status || ')'
);
END IF;
-- C. Idempotency Check (Fail fast if key exists)
-- Postgres Unique Index will catch race conditions, but we can check nicely too.
IF p_idempotency_key IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM public.gm_payments
    WHERE idempotency_key = p_idempotency_key
) THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Duplicate Transaction (Idempotency)'
);
END IF;
-- D. Insert Payment
INSERT INTO public.gm_payments (
        tenant_id,
        -- Mapping restaurant_id to tenant_id for consistency with schema
        restaurant_id,
        order_id,
        cash_register_id,
        operator_id,
        amount_cents,
        currency,
        payment_method,
        status,
        idempotency_key,
        created_at
    )
VALUES (
        p_restaurant_id,
        -- Assuming tenant_id = restaurant_id for now or column renamed. Using passed ID.
        p_restaurant_id,
        p_order_id,
        p_cash_register_id,
        p_operator_id,
        p_amount_cents,
        'EUR',
        p_method,
        'paid',
        p_idempotency_key,
        NOW()
    )
RETURNING id INTO v_payment_id;
-- E. Update Order Status
-- Sovereign Rule: Paid = Ready to Serve (or Served?)
-- Let's set to 'paid' as per OrderTypes.
UPDATE public.gm_orders
SET status = 'paid',
    updated_at = NOW()
WHERE id = p_order_id;
-- F. Update Cash Register Balance (Only if Cash)
IF p_method = 'cash' THEN
UPDATE public.gm_cash_registers
SET total_sales_cents = total_sales_cents + p_amount_cents,
    updated_at = NOW()
WHERE id = p_cash_register_id;
ELSE -- Still update total sales for record? Yes, usually Sales = Cash + Card + Pix
UPDATE public.gm_cash_registers
SET total_sales_cents = total_sales_cents + p_amount_cents,
    updated_at = NOW()
WHERE id = p_cash_register_id;
END IF;
-- G. Return Success
RETURN jsonb_build_object(
    'success',
    true,
    'payment_id',
    v_payment_id
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;