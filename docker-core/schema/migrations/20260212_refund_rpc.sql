-- =============================================================================
-- PHASE 2C: create_refund_atomic() — Safe Refund Creation RPC
-- =============================================================================
-- Single atomic RPC that:
--   1. Validates payment exists + is paid + not over-refunded
--   2. Checks order is not sealed at ORDER_FINAL (legal boundary)
--   3. Creates gm_refunds row (CDC triggers handle event_store automatically)
--   4. Updates gm_payments.status if fully refunded
--   5. Updates gm_orders.payment_status
--   6. Adjusts gm_cash_registers.total_sales_cents
--   7. Logs audit entry
--   8. Returns structured result
--
-- Canonical error codes (for client):
--   PAYMENT_NOT_FOUND, PAYMENT_NOT_PAID, REFUND_EXCEEDS_BALANCE,
--   ORDER_SEALED, IDEMPOTENCY_DUPLICATE, CASH_REGISTER_CLOSED
--
-- Depends on: 20260212_gm_refunds.sql, 03-migrations-consolidated.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Main RPC: create_refund_atomic
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_refund_atomic(
    p_restaurant_id     UUID,
    p_payment_id        UUID,
    p_amount_cents      BIGINT,
    p_reason            TEXT        DEFAULT 'customer_request',
    p_reason_detail     TEXT        DEFAULT NULL,
    p_operator_id       UUID        DEFAULT NULL,
    p_operator_role     TEXT        DEFAULT NULL,
    p_authorized_by     UUID        DEFAULT NULL,
    p_authorization_method TEXT     DEFAULT 'direct',
    p_cash_register_id  UUID        DEFAULT NULL,
    p_idempotency_key   TEXT        DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment        RECORD;
    v_order          RECORD;
    v_total_refunded BIGINT;
    v_refundable     BIGINT;
    v_refund_id      UUID;
    v_refund_type    TEXT;
    v_new_payment_status TEXT;
    v_new_order_status   TEXT;
    v_register_status    TEXT;
    v_existing_refund_id UUID;
BEGIN
    -- -----------------------------------------------------------------------
    -- 0. Idempotency check
    -- -----------------------------------------------------------------------
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_refund_id
        FROM public.gm_refunds
        WHERE idempotency_key = p_idempotency_key;

        IF v_existing_refund_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'refund_id', v_existing_refund_id,
                'idempotent', true,
                'message', 'Refund already exists (idempotency key matched)'
            );
        END IF;
    END IF;

    -- -----------------------------------------------------------------------
    -- 1. Lock and validate payment
    -- -----------------------------------------------------------------------
    SELECT p.id, p.order_id, p.amount_cents, p.status, p.restaurant_id,
           p.cash_register_id, p.currency
    INTO v_payment
    FROM public.gm_payments p
    WHERE p.id = p_payment_id
      AND p.restaurant_id = p_restaurant_id
    FOR UPDATE;

    IF v_payment IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'PAYMENT_NOT_FOUND',
            'message', 'Payment not found or does not belong to this restaurant'
        );
    END IF;

    IF v_payment.status NOT IN ('paid') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'PAYMENT_NOT_PAID',
            'message', 'Cannot refund a payment with status: ' || v_payment.status
        );
    END IF;

    -- -----------------------------------------------------------------------
    -- 2. Check refund amount vs remaining balance
    -- -----------------------------------------------------------------------
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_refunded
    FROM public.gm_refunds
    WHERE payment_id = p_payment_id
      AND status != 'FAILED';

    v_refundable := v_payment.amount_cents - v_total_refunded;

    IF p_amount_cents > v_refundable THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'REFUND_EXCEEDS_BALANCE',
            'message', 'Refund amount exceeds refundable balance',
            'payment_amount_cents', v_payment.amount_cents,
            'already_refunded_cents', v_total_refunded,
            'refundable_cents', v_refundable,
            'requested_cents', p_amount_cents
        );
    END IF;

    IF p_amount_cents <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_AMOUNT',
            'message', 'Refund amount must be positive'
        );
    END IF;

    -- -----------------------------------------------------------------------
    -- 3. Check if order is sealed (legal boundary)
    -- -----------------------------------------------------------------------
    SELECT o.id, o.status, o.payment_status, o.total_cents
    INTO v_order
    FROM public.gm_orders o
    WHERE o.id = v_payment.order_id
    FOR UPDATE;

    -- Check if sealed at ORDER_FINAL (fully sealed, no more changes)
    IF EXISTS (
        SELECT 1 FROM public.legal_seals
        WHERE entity_type = 'ORDER'
          AND entity_id = v_payment.order_id::TEXT
          AND legal_state = 'ORDER_FINAL'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ORDER_SEALED',
            'message', 'Order is sealed at ORDER_FINAL — refund requires a credit note against the sealed document',
            'order_id', v_payment.order_id
        );
    END IF;

    -- -----------------------------------------------------------------------
    -- 4. Validate cash register (if provided)
    -- -----------------------------------------------------------------------
    IF p_cash_register_id IS NOT NULL THEN
        SELECT status INTO v_register_status
        FROM public.gm_cash_registers
        WHERE id = p_cash_register_id
          AND restaurant_id = p_restaurant_id;

        IF v_register_status IS NULL THEN
            -- Use the payment's original cash register
            p_cash_register_id := v_payment.cash_register_id;
        ELSIF v_register_status != 'open' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'CASH_REGISTER_CLOSED',
                'message', 'Cash register is not open'
            );
        END IF;
    ELSE
        -- Default to payment's original cash register
        p_cash_register_id := v_payment.cash_register_id;
    END IF;

    -- -----------------------------------------------------------------------
    -- 5. Determine refund type
    -- -----------------------------------------------------------------------
    IF p_amount_cents = v_refundable AND v_total_refunded = 0 THEN
        v_refund_type := 'FULL';
    ELSIF p_amount_cents = v_refundable THEN
        -- Final partial refund that completes the full amount
        v_refund_type := 'PARTIAL';
    ELSE
        v_refund_type := 'PARTIAL';
    END IF;

    -- -----------------------------------------------------------------------
    -- 6. Create the refund record (CDC trigger fires automatically)
    -- -----------------------------------------------------------------------
    INSERT INTO public.gm_refunds (
        restaurant_id, order_id, payment_id,
        amount_cents, currency, refund_type, reason, reason_detail,
        operator_id, operator_role, authorized_by, authorization_method,
        cash_register_id, status, idempotency_key
    ) VALUES (
        p_restaurant_id, v_payment.order_id, p_payment_id,
        p_amount_cents, v_payment.currency, v_refund_type, p_reason, p_reason_detail,
        p_operator_id, p_operator_role, p_authorized_by, p_authorization_method,
        p_cash_register_id, 'COMPLETED', p_idempotency_key
    )
    RETURNING id INTO v_refund_id;

    -- -----------------------------------------------------------------------
    -- 7. Update payment status (if fully refunded)
    -- -----------------------------------------------------------------------
    IF (v_total_refunded + p_amount_cents) >= v_payment.amount_cents THEN
        UPDATE public.gm_payments
        SET status = 'refunded', updated_at = NOW()
        WHERE id = p_payment_id;

        v_new_payment_status := 'refunded';
    ELSE
        v_new_payment_status := 'paid';
    END IF;

    -- -----------------------------------------------------------------------
    -- 8. Update order payment_status
    -- -----------------------------------------------------------------------
    -- Recalculate: total paid across all payments minus all refunds
    DECLARE
        v_total_order_paid   BIGINT;
        v_total_order_refund BIGINT;
        v_net_paid           BIGINT;
    BEGIN
        SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_order_paid
        FROM public.gm_payments
        WHERE order_id = v_payment.order_id AND status = 'paid';

        SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_order_refund
        FROM public.gm_refunds
        WHERE order_id = v_payment.order_id AND status != 'FAILED';

        v_net_paid := v_total_order_paid - v_total_order_refund;

        IF v_net_paid <= 0 THEN
            v_new_order_status := 'REFUNDED';
        ELSIF v_net_paid < v_order.total_cents THEN
            v_new_order_status := 'PARTIALLY_PAID';
        ELSE
            v_new_order_status := 'PAID';
        END IF;

        UPDATE public.gm_orders
        SET payment_status = v_new_order_status, updated_at = NOW()
        WHERE id = v_payment.order_id;
    END;

    -- -----------------------------------------------------------------------
    -- 9. Adjust cash register balance
    -- -----------------------------------------------------------------------
    IF p_cash_register_id IS NOT NULL THEN
        UPDATE public.gm_cash_registers
        SET total_sales_cents = GREATEST(0, COALESCE(total_sales_cents, 0) - p_amount_cents),
            updated_at = NOW()
        WHERE id = p_cash_register_id;
    END IF;

    -- -----------------------------------------------------------------------
    -- 10. Audit log
    -- -----------------------------------------------------------------------
    PERFORM public.fn_log_payment_attempt(
        v_payment.order_id,
        p_restaurant_id,
        p_operator_id,
        (-p_amount_cents)::INTEGER,  -- negative = refund
        'refund',
        'success',
        NULL, NULL,
        p_idempotency_key,
        v_refund_id,
        NULL, NULL
    );

    -- -----------------------------------------------------------------------
    -- 11. Return structured result
    -- -----------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', true,
        'refund_id', v_refund_id,
        'refund_type', v_refund_type,
        'amount_cents', p_amount_cents,
        'payment_id', p_payment_id,
        'order_id', v_payment.order_id,
        'payment_status', v_new_payment_status,
        'order_payment_status', v_new_order_status,
        'remaining_refundable_cents', v_refundable - p_amount_cents,
        'cash_register_adjusted', p_cash_register_id IS NOT NULL
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'IDEMPOTENCY_DUPLICATE',
            'message', 'Duplicate refund (idempotency key already used)'
        );
    WHEN OTHERS THEN
        -- Log the failure
        PERFORM public.fn_log_payment_attempt(
            v_payment.order_id,
            p_restaurant_id,
            p_operator_id,
            (-p_amount_cents)::INTEGER,
            'refund',
            'fail',
            'UNKNOWN', SQLERRM,
            p_idempotency_key,
            NULL, NULL, NULL
        );

        RETURN jsonb_build_object(
            'success', false,
            'error', 'REFUND_FAILED',
            'message', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION public.create_refund_atomic IS
'TPV Compliance: Atomic refund creation. Validates payment, checks legal seals, creates ledger entry, '
'updates payment/order status, adjusts cash register, and logs audit entry. '
'Canonical errors: PAYMENT_NOT_FOUND, PAYMENT_NOT_PAID, REFUND_EXCEEDS_BALANCE, ORDER_SEALED, '
'IDEMPOTENCY_DUPLICATE, CASH_REGISTER_CLOSED, INVALID_AMOUNT.';

GRANT EXECUTE ON FUNCTION public.create_refund_atomic(
    UUID, UUID, BIGINT, TEXT, TEXT, UUID, TEXT, UUID, TEXT, UUID, TEXT
) TO postgres;

-- ---------------------------------------------------------------------------
-- 2. create_credit_note_for_refund — Creates fiscal credit note for a refund
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_credit_note_for_refund(
    p_refund_id     UUID,
    p_jurisdiction  TEXT DEFAULT 'PT',
    p_fiscal_adapter TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_refund     RECORD;
    v_invoice    RECORD;
    v_doc_id     UUID;
    v_items      JSONB;
BEGIN
    -- Get refund details
    SELECT r.*, p.payment_method
    INTO v_refund
    FROM public.gm_refunds r
    JOIN public.gm_payments p ON p.id = r.payment_id
    WHERE r.id = p_refund_id;

    IF v_refund IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'REFUND_NOT_FOUND');
    END IF;

    -- Check if credit note already exists for this refund
    IF EXISTS (
        SELECT 1 FROM public.gm_fiscal_documents
        WHERE refund_id = p_refund_id AND doc_type = 'CREDIT_NOTE'
          AND status NOT IN ('ERROR', 'CANCELLED')
    ) THEN
        SELECT id INTO v_doc_id
        FROM public.gm_fiscal_documents
        WHERE refund_id = p_refund_id AND doc_type = 'CREDIT_NOTE'
          AND status NOT IN ('ERROR', 'CANCELLED')
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', true,
            'document_id', v_doc_id,
            'idempotent', true,
            'message', 'Credit note already exists for this refund'
        );
    END IF;

    -- Find the original invoice for this order
    SELECT id INTO v_invoice
    FROM public.gm_fiscal_documents
    WHERE order_id = v_refund.order_id
      AND doc_type IN ('INVOICE', 'SIMPLIFIED_INVOICE')
      AND status = 'ACCEPTED'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Get order items for snapshot (proportional to refund if partial)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', oi.name_snapshot,
        'quantity', oi.quantity,
        'price_cents', oi.price_snapshot,
        'subtotal_cents', oi.subtotal_cents
    )), '[]'::JSONB) INTO v_items
    FROM public.gm_order_items oi
    WHERE oi.order_id = v_refund.order_id;

    -- Create credit note (fiscal_number auto-assigned by trigger)
    INSERT INTO public.gm_fiscal_documents (
        restaurant_id, doc_type, fiscal_number,
        order_id, payment_id, refund_id,
        related_document_id, relation_type,
        gross_amount_cents, net_amount_cents, tax_amount_cents,
        currency, items_snapshot, jurisdiction, fiscal_adapter,
        status
    ) VALUES (
        v_refund.restaurant_id, 'CREDIT_NOTE', 0,  -- 0 = auto-assign
        v_refund.order_id, v_refund.payment_id, p_refund_id,
        v_invoice.id, CASE WHEN v_invoice.id IS NOT NULL THEN 'CORRECTS' ELSE NULL END,
        v_refund.amount_cents, v_refund.amount_cents, 0,  -- tax breakdown TBD by fiscal adapter
        v_refund.currency, v_items, p_jurisdiction, p_fiscal_adapter,
        'PENDING'
    )
    RETURNING id INTO v_doc_id;

    -- Link credit note back to refund
    UPDATE public.gm_refunds
    SET fiscal_document_id = v_doc_id,
        status = 'PENDING_FISCAL'
    WHERE id = p_refund_id;

    RETURN jsonb_build_object(
        'success', true,
        'document_id', v_doc_id,
        'doc_type', 'CREDIT_NOTE',
        'refund_id', p_refund_id,
        'amount_cents', v_refund.amount_cents,
        'related_invoice_id', v_invoice.id,
        'status', 'PENDING'
    );
END;
$$;

COMMENT ON FUNCTION public.create_credit_note_for_refund IS
'Creates a CREDIT_NOTE fiscal document for a refund. Idempotent — returns existing credit note if already created.';

GRANT EXECUTE ON FUNCTION public.create_credit_note_for_refund(UUID, TEXT, TEXT) TO postgres;

COMMIT;
