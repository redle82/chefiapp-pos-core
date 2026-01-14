-- ============================================================================
-- P1.1 FIX: ATOMIC SPLIT BILL PAYMENT
-- Risk: R-021 (🔴 Critical)
-- 
-- This RPC ensures atomic balance check + payment in a single transaction.
-- No race condition between checking remaining and processing payment.
-- ============================================================================

-- Function: process_split_payment_atomic
-- Returns: payment_id on success, raises exception on overpayment
CREATE OR REPLACE FUNCTION process_split_payment_atomic(
    p_order_id uuid,
    p_restaurant_id uuid,
    p_cash_register_id uuid,
    p_method text,
    p_amount_cents integer,
    p_operator_id uuid DEFAULT NULL,
    p_idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_total integer;
    v_paid_sum integer;
    v_remaining integer;
    v_payment_id uuid;
    v_new_paid_sum integer;
    v_is_fully_paid boolean;
    v_existing_payment_id uuid;
BEGIN
    -- ========================================================================
    -- IDEMPOTENCY CHECK: If same key was used, return existing payment
    -- ========================================================================
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_payment_id
        FROM gm_payments
        WHERE order_id = p_order_id
          AND metadata->>'idempotency_key' = p_idempotency_key;
        
        IF v_existing_payment_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'payment_id', v_existing_payment_id,
                'idempotent', true,
                'message', 'Payment already processed with this key'
            );
        END IF;
    END IF;

    -- ========================================================================
    -- ATOMIC LOCK: Lock the order row to prevent concurrent payments
    -- ========================================================================
    SELECT total_amount INTO v_order_total
    FROM gm_orders
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id
    FOR UPDATE;  -- Row-level lock

    IF v_order_total IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Order % not found', p_order_id;
    END IF;

    -- ========================================================================
    -- CALCULATE REMAINING: Sum all PAID payments
    -- ========================================================================
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_paid_sum
    FROM gm_payments
    WHERE order_id = p_order_id
      AND status = 'paid';

    v_remaining := v_order_total - v_paid_sum;

    -- ========================================================================
    -- GUARD: Check if payment exceeds remaining
    -- ========================================================================
    IF p_amount_cents > v_remaining THEN
        RAISE EXCEPTION 'OVERPAYMENT: Amount % exceeds remaining %. Order: %',
            p_amount_cents, v_remaining, p_order_id;
    END IF;

    IF v_remaining <= 0 THEN
        RAISE EXCEPTION 'ALREADY_PAID: Order % is already fully paid', p_order_id;
    END IF;

    -- ========================================================================
    -- INSERT PAYMENT
    -- ========================================================================
    INSERT INTO gm_payments (
        tenant_id,
        order_id,
        amount_cents,
        currency,
        method,
        status,
        metadata
    ) VALUES (
        p_restaurant_id,
        p_order_id,
        p_amount_cents,
        'EUR',
        p_method,
        'paid',
        jsonb_build_object(
            'operator_id', p_operator_id,
            'cash_register_id', p_cash_register_id,
            'idempotency_key', p_idempotency_key,
            'is_partial', true,
            'remaining_before', v_remaining
        )
    )
    RETURNING id INTO v_payment_id;

    -- ========================================================================
    -- UPDATE ORDER STATUS IF FULLY PAID
    -- ========================================================================
    v_new_paid_sum := v_paid_sum + p_amount_cents;
    v_is_fully_paid := v_new_paid_sum >= v_order_total;

    IF v_is_fully_paid THEN
        UPDATE gm_orders
        SET payment_status = 'PAID',
            status = 'delivered',
            updated_at = NOW()
        WHERE id = p_order_id;
    ELSE
        UPDATE gm_orders
        SET payment_status = 'PARTIALLY_PAID',
            updated_at = NOW()
        WHERE id = p_order_id;
    END IF;

    -- ========================================================================
    -- LOG TO CASH REGISTER
    -- ========================================================================
    IF p_cash_register_id IS NOT NULL THEN
        UPDATE gm_cash_registers
        SET current_amount = current_amount + p_amount_cents,
            transactions_count = transactions_count + 1,
            updated_at = NOW()
        WHERE id = p_cash_register_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'amount_paid', p_amount_cents,
        'remaining_after', v_remaining - p_amount_cents,
        'is_fully_paid', v_is_fully_paid,
        'order_id', p_order_id
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION process_split_payment_atomic TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'process_split_payment_atomic'
    ) THEN
        RAISE NOTICE '✓ Function process_split_payment_atomic created successfully';
    ELSE
        RAISE EXCEPTION '✗ Failed to create function process_split_payment_atomic';
    END IF;
END $$;

COMMENT ON FUNCTION process_split_payment_atomic IS 
    'P1 Fix: Atomic split bill payment with row-level locking to prevent race conditions. ' ||
    'Risk: R-021 | Status: ENFORCED | Date: 2026-01-14';
