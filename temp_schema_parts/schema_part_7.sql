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
$$;;
-- 022_payment_observability.sql
-- Fiscal Observability & Audit Logs
-- 1. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.gm_payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    -- Logical link
    order_id UUID,
    operator_id UUID,
    amount_cents INTEGER,
    method TEXT,
    result TEXT NOT NULL,
    -- 'success', 'fail', 'timeout'
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT,
    payment_id UUID,
    duration_ms INTEGER,
    client_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Optimize for queries
    CONSTRAINT fk_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE -- No foreign key on payment_id because it might fail to create
);
-- Index for quick health checks
CREATE INDEX IF NOT EXISTS idx_payment_audit_restaurant_date ON public.gm_payment_audit_logs(restaurant_id, created_at);
-- 2. Log Attempt RPC
CREATE OR REPLACE FUNCTION public.fn_log_payment_attempt(
        p_order_id UUID,
        p_restaurant_id UUID,
        p_operator_id UUID,
        p_amount_cents INTEGER,
        p_method TEXT,
        p_result TEXT,
        p_error_code TEXT DEFAULT NULL,
        p_error_message TEXT DEFAULT NULL,
        p_idempotency_key TEXT DEFAULT NULL,
        p_payment_id UUID DEFAULT NULL,
        p_duration_ms INTEGER DEFAULT NULL,
        p_client_info JSONB DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_log_id UUID;
BEGIN
INSERT INTO public.gm_payment_audit_logs (
        order_id,
        restaurant_id,
        operator_id,
        amount_cents,
        method,
        result,
        error_code,
        error_message,
        idempotency_key,
        payment_id,
        duration_ms,
        client_info
    )
VALUES (
        p_order_id,
        p_restaurant_id,
        p_operator_id,
        p_amount_cents,
        p_method,
        p_result,
        p_error_code,
        p_error_message,
        p_idempotency_key,
        p_payment_id,
        p_duration_ms,
        p_client_info
    )
RETURNING id INTO v_log_id;
RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
EXCEPTION
WHEN OTHERS THEN -- Fail safe: don't break flow if log fails? 
-- Actually, for sovereign logs, we might want to know. 
-- But usually logging is best-effort for non-critical path, but critical for audit.
-- Let's return error but not raise.
RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
-- 3. Get Payment Health RPC
CREATE OR REPLACE FUNCTION public.get_payment_health(p_restaurant_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_attempts_24h INTEGER;
v_success_24h INTEGER;
v_fail_24h INTEGER;
v_avg_duration_ms NUMERIC;
v_total_processed_cents BIGINT;
v_most_common_error TEXT;
v_success_rate NUMERIC;
BEGIN -- Time Window: Last 24h
WITH window_stats AS (
    SELECT result,
        duration_ms,
        amount_cents,
        error_code
    FROM public.gm_payment_audit_logs
    WHERE restaurant_id = p_restaurant_id
        AND created_at >= NOW() - INTERVAL '24 hours'
)
SELECT COUNT(*) AS attempts,
    COUNT(*) FILTER (
        WHERE result = 'success'
    ) AS successes,
    COUNT(*) FILTER (
        WHERE result != 'success'
    ) AS failures,
    AVG(duration_ms) FILTER (
        WHERE result = 'success'
    )::NUMERIC(10, 2) AS avg_dur,
    SUM(amount_cents) FILTER (
        WHERE result = 'success'
    ) AS total_cents,
    mode() WITHIN GROUP (
        ORDER BY error_code
    ) FILTER (
        WHERE result != 'success'
    ) AS common_err INTO v_attempts_24h,
    v_success_24h,
    v_fail_24h,
    v_avg_duration_ms,
    v_total_processed_cents,
    v_most_common_error
FROM window_stats;
-- Calculate Rate
IF v_attempts_24h > 0 THEN v_success_rate := (v_success_24h::NUMERIC / v_attempts_24h::NUMERIC) * 100;
ELSE v_success_rate := 100;
END IF;
RETURN jsonb_build_object(
    'attempts_24h',
    COALESCE(v_attempts_24h, 0),
    'success_24h',
    COALESCE(v_success_24h, 0),
    'fail_24h',
    COALESCE(v_fail_24h, 0),
    'success_rate',
    TRUNC(v_success_rate, 2),
    'avg_duration_ms',
    COALESCE(v_avg_duration_ms, 0),
    'total_processed_cents',
    COALESCE(v_total_processed_cents, 0),
    'most_common_error',
    v_most_common_error
);
END;
$$;;
-- 023_dashboard_metrics.sql
-- The Brain: Aggregated Metrics for Dashboard
CREATE OR REPLACE FUNCTION public.get_daily_metrics(
        p_restaurant_id UUID,
        p_timezone TEXT DEFAULT 'Europe/Lisbon' -- Default to Lisbon/Portugal
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_total_sales_cents BIGINT;
v_total_orders INTEGER;
v_avg_ticket_cents NUMERIC;
v_sales_by_hour JSONB;
v_top_products JSONB;
v_start_of_day TIMESTAMPTZ;
BEGIN -- Define "Today" in the restaurant's timezone
-- For simplicity, we use NOW() at UTC and truncate, but dealing with timezone is better.
-- Let's stick to UTC day for now to avoid complexity, or allow param.
v_start_of_day := DATE_TRUNC('day', NOW());
-- Improvements: convert timezone if needed.
-- 1. Aggregate Sales & Orders (Paid/Served)
SELECT COALESCE(SUM(total_cents), 0),
    COUNT(*) INTO v_total_sales_cents,
    v_total_orders
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id
    AND (
        status = 'paid'
        OR status = 'served'
    )
    AND created_at >= v_start_of_day;
-- 2. Average Ticket
IF v_total_orders > 0 THEN v_avg_ticket_cents := TRUNC(v_total_sales_cents / v_total_orders);
ELSE v_avg_ticket_cents := 0;
END IF;
-- 3. Sales by Hour (Graph Data)
WITH hourly_data AS (
    SELECT EXTRACT(
            HOUR
            FROM created_at
        ) as hour,
        SUM(total_cents) as total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
        AND (
            status = 'paid'
            OR status = 'served'
        )
        AND created_at >= v_start_of_day
    GROUP BY 1
    ORDER BY 1 ASC
)
SELECT jsonb_agg(
        jsonb_build_object('hour', hour, 'total_cents', total)
    ) INTO v_sales_by_hour
FROM hourly_data;
-- 4. Top Products (If order items available)
-- This requires joining gm_order_items.
-- Skipped for now to keep query light, focusing on financial pulse first.
RETURN jsonb_build_object(
    'total_sales_cents',
    v_total_sales_cents,
    'total_orders',
    v_total_orders,
    'avg_ticket_cents',
    v_avg_ticket_cents,
    'sales_by_hour',
    COALESCE(v_sales_by_hour, '[]'::jsonb)
);
END;
$$;;
