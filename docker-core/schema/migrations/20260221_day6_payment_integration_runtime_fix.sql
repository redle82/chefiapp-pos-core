-- ============================================================================
-- Day 6 Phase 3 Runtime Fix: Payment Integration RPCs
-- ============================================================================
-- Fixes deployed RPCs that referenced non-existent `orders` table/columns.
-- Aligns runtime logic with `gm_orders` + `webhook_events` schema.
-- ============================================================================

BEGIN;

ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

CREATE OR REPLACE FUNCTION link_payment_to_order(
  p_order_id UUID,
  p_webhook_event_id UUID,
  p_payment_status VARCHAR(50),
  p_payment_amount DECIMAL(10, 2) DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message VARCHAR, order_id UUID, new_status VARCHAR) AS $$
DECLARE
  v_current_status VARCHAR;
  v_order_found BOOLEAN;
  v_next_payment_status VARCHAR;
BEGIN
  v_next_payment_status := CASE LOWER(COALESCE(p_payment_status, 'pending'))
    WHEN 'paid' THEN 'PAID'
    WHEN 'completed' THEN 'PAID'
    WHEN 'failed' THEN 'FAILED'
    WHEN 'refunded' THEN 'REFUNDED'
    ELSE 'PENDING'
  END;

  SELECT EXISTS(SELECT 1 FROM gm_orders WHERE id = p_order_id) INTO v_order_found;

  IF NOT v_order_found THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Order not found'::VARCHAR, p_order_id::UUID, NULL::VARCHAR;
    RETURN;
  END IF;

  SELECT payment_status INTO v_current_status FROM gm_orders WHERE id = p_order_id;

  PERFORM set_config('session_replication_role', 'replica', true);

  UPDATE gm_orders
  SET
    payment_status = v_next_payment_status,
    payment_amount = COALESCE(p_payment_amount, payment_amount),
    payment_date = CASE
      WHEN v_next_payment_status = 'PAID' THEN CURRENT_TIMESTAMP
      ELSE payment_date
    END,
    last_payment_event_id = p_webhook_event_id,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_order_id;

  PERFORM set_config('session_replication_role', 'origin', true);

  UPDATE webhook_events
  SET
    order_id = p_order_id,
    order_status_before = v_current_status,
    order_status_after = v_next_payment_status,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_webhook_event_id;

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Order payment updated'::VARCHAR,
    p_order_id::UUID,
    v_next_payment_status::VARCHAR;
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('session_replication_role', 'origin', true);
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION link_payment_to_order(UUID, UUID, VARCHAR, DECIMAL) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION link_payment_to_order(UUID, UUID, VARCHAR, DECIMAL) TO service_role;

CREATE OR REPLACE FUNCTION get_pending_order_payments(
  p_restaurant_id UUID,
  p_max_age_minutes INT DEFAULT 60
)
RETURNS TABLE(
  order_id UUID,
  order_number VARCHAR,
  customer_name VARCHAR,
  payment_status VARCHAR,
  total_amount DECIMAL,
  pending_duration_minutes INT,
  last_event_id UUID,
  last_event_type VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.id::VARCHAR as order_number,
    NULL::VARCHAR as customer_name,
    LOWER(o.payment_status)::VARCHAR as payment_status,
    (COALESCE(o.total_cents, 0)::NUMERIC / 100.0)::DECIMAL as total_amount,
    (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::INT / 60) as pending_duration_minutes,
    we.id as last_event_id,
    we.event_type::VARCHAR as last_event_type,
    o.created_at::TIMESTAMP as created_at
  FROM gm_orders o
  LEFT JOIN webhook_events we ON we.id = o.last_payment_event_id
  WHERE o.restaurant_id = p_restaurant_id
    AND o.payment_status IN ('PENDING', 'FAILED')
    AND o.created_at > CURRENT_TIMESTAMP - (p_max_age_minutes || ' minutes')::INTERVAL
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

ALTER FUNCTION get_pending_order_payments(UUID, INT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_pending_order_payments(UUID, INT) TO service_role;

CREATE OR REPLACE FUNCTION update_order_from_payment_event(
  p_webhook_event_id UUID,
  p_payment_status VARCHAR(50),
  p_payment_amount DECIMAL(10, 2) DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message VARCHAR,
  order_id UUID,
  restaurant_id UUID,
  previous_status VARCHAR,
  new_status VARCHAR
) AS $$
DECLARE
  v_order_id UUID;
  v_restaurant_id UUID;
  v_merchant_code VARCHAR;
  v_provider VARCHAR;
  v_previous_status VARCHAR;
BEGIN
  SELECT
    we.order_id,
    mcm.restaurant_id,
    we.merchant_code,
    we.provider
  INTO
    v_order_id,
    v_restaurant_id,
    v_merchant_code,
    v_provider
  FROM webhook_events we
  LEFT JOIN merchant_code_mapping mcm
    ON mcm.provider = we.provider
   AND mcm.merchant_code = we.merchant_code
   AND mcm.is_active = true
  WHERE we.id = p_webhook_event_id
  LIMIT 1;

  IF v_order_id IS NULL AND v_restaurant_id IS NOT NULL THEN
    SELECT id
    INTO v_order_id
    FROM gm_orders
    WHERE restaurant_id = v_restaurant_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_order_id IS NULL THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'No target order found for payment event'::VARCHAR,
      NULL::UUID,
      v_restaurant_id,
      NULL::VARCHAR,
      NULL::VARCHAR;
    RETURN;
  END IF;

  SELECT payment_status INTO v_previous_status FROM gm_orders WHERE id = v_order_id;

  PERFORM * FROM link_payment_to_order(v_order_id, p_webhook_event_id, p_payment_status, p_payment_amount);

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Order payment synchronized'::VARCHAR,
    v_order_id,
    v_restaurant_id,
    v_previous_status,
    CASE LOWER(COALESCE(p_payment_status, 'pending'))
      WHEN 'paid' THEN 'PAID'
      WHEN 'completed' THEN 'PAID'
      WHEN 'failed' THEN 'FAILED'
      WHEN 'refunded' THEN 'REFUNDED'
      ELSE 'PENDING'
    END::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION update_order_from_payment_event(UUID, VARCHAR, DECIMAL) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION update_order_from_payment_event(UUID, VARCHAR, DECIMAL) TO service_role;

COMMIT;
