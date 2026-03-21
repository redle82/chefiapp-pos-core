CREATE OR REPLACE FUNCTION public.update_order_from_payment_event(p_webhook_event_id uuid, p_payment_status character varying, p_payment_amount bigint DEFAULT NULL::bigint)
 RETURNS TABLE(payment_id uuid, order_id uuid, old_status character varying, new_status character varying, order_payment_status character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
DECLARE
    v_checkout_id text;
    v_payment_id uuid;
    v_order_id uuid;
    v_old_status text;
    v_mapped_status text;
    v_order_pay_status text;
BEGIN
    v_mapped_status := CASE
        WHEN p_payment_status IN ('PAID', 'SUCCESSFUL', 'paid', 'successful') THEN 'paid'
        WHEN p_payment_status IN ('FAILED', 'EXPIRED', 'failed', 'expired') THEN 'failed'
        WHEN p_payment_status IN ('REFUNDED', 'refunded') THEN 'refunded'
        WHEN p_payment_status IN ('PENDING', 'pending') THEN 'pending'
        ELSE 'pending'
    END;
    SELECT
        COALESCE(
            we.raw_payload->>'id',
            we.raw_payload->>'checkout_id'
        )
    INTO v_checkout_id
    FROM webhook_events we
    WHERE we.id = p_webhook_event_id;
    IF v_checkout_id IS NULL THEN
        RAISE NOTICE 'No checkout_id found in webhook event %', p_webhook_event_id;
        RETURN;
    END IF;
    SELECT p.id, p.order_id, p.status
    INTO v_payment_id, v_order_id, v_old_status
    FROM gm_payments p
    WHERE p.external_checkout_id = v_checkout_id;
    IF v_payment_id IS NULL THEN
        RAISE NOTICE 'No payment found for checkout_id %', v_checkout_id;
        RETURN;
    END IF;
    UPDATE gm_payments
    SET status = v_mapped_status,
        updated_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'webhook_event_id', p_webhook_event_id::text,
            'status_updated_at', NOW()::text,
            'previous_status', v_old_status
        )
    WHERE id = v_payment_id;
    IF p_payment_amount IS NOT NULL AND p_payment_amount > 0 THEN
        UPDATE gm_payments
        SET amount_cents = p_payment_amount
        WHERE id = v_payment_id;
    END IF;
    v_order_pay_status := CASE
        WHEN v_mapped_status = 'paid' THEN 'PAID'
        WHEN v_mapped_status = 'failed' THEN 'FAILED'
        WHEN v_mapped_status = 'refunded' THEN 'REFUNDED'
        ELSE 'PENDING'
    END;
    UPDATE gm_orders
    SET payment_status = v_order_pay_status,
        updated_at = NOW()
    WHERE id = v_order_id;
    UPDATE webhook_events
    SET status = 'PROCESSED',
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_webhook_event_id;
    RETURN QUERY
    SELECT v_payment_id, v_order_id, v_old_status::varchar, v_mapped_status::varchar, v_order_pay_status::varchar;
END;
$function$;
