-- ============================================================================
-- Day 6 Phase 2: Payment to Order Integration Infrastructure
-- ============================================================================
-- Purpose: Link payment webhooks to order management, create merchant code
--          mappings, and enable order status synchronization
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Create merchant_code_mapping Table
-- ============================================================================
-- Maps external payment provider merchant codes to internal restaurant IDs
-- Supports multi-provider setup (Stripe, SumUp, Square, PayPal, etc.)

CREATE TABLE IF NOT EXISTS merchant_code_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,  -- 'stripe', 'sumup', 'square', 'paypal', 'custom'
  merchant_code VARCHAR(255) NOT NULL,  -- External provider merchant ID
  merchant_name VARCHAR(255),  -- Display name from provider
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,  -- User who added mapping

  CONSTRAINT unique_provider_merchant UNIQUE(provider, merchant_code),
  CONSTRAINT valid_provider CHECK(provider IN ('stripe', 'sumup', 'square', 'paypal', 'custom'))
);

-- Add RLS policy for merchant_code_mapping (service_role bypass for payment webhooks)
ALTER TABLE merchant_code_mapping ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view/edit merchant codes for their restaurants
CREATE POLICY merchant_code_mapping_access ON merchant_code_mapping
  FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM gm_staff
      WHERE active = true
    )
  );

-- Allow service role (webhooks) to read merchant codes
CREATE POLICY merchant_code_mapping_service_read ON merchant_code_mapping
  FOR SELECT
  TO service_role
  USING (is_active = true);

-- ============================================================================
-- 2. Add webhook_event_mapping to webhook_events
-- ============================================================================
-- Track which order payment event corresponds to

ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES gm_orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS merchant_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS order_status_before VARCHAR(50),
ADD COLUMN IF NOT EXISTS order_status_after VARCHAR(50);

-- ============================================================================
-- 3. Add payment columns to gm_orders (if not exists)
-- ============================================================================

ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_payment_event_id UUID REFERENCES webhook_events(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. Create RPC: resolve_restaurant_from_merchant_code
-- ============================================================================
-- Look up restaurant_id from a payment provider merchant code

CREATE OR REPLACE FUNCTION resolve_restaurant_from_merchant_code(
  p_merchant_code VARCHAR(255),
  p_provider VARCHAR(50) DEFAULT 'stripe'
)
RETURNS TABLE(restaurant_id UUID, merchant_name VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mcm.restaurant_id::UUID,
    mcm.merchant_name::VARCHAR
  FROM merchant_code_mapping mcm
  WHERE mcm.merchant_code = p_merchant_code
    AND mcm.provider = p_provider
    AND mcm.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

ALTER FUNCTION resolve_restaurant_from_merchant_code(VARCHAR, VARCHAR) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION resolve_restaurant_from_merchant_code(VARCHAR, VARCHAR) TO service_role;

-- ============================================================================
-- 5. Create RPC: link_payment_to_order
-- ============================================================================
-- Associate a payment webhook event with an order, update order status

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
BEGIN
  -- Verify order exists
  SELECT EXISTS(SELECT 1 FROM orders WHERE id = p_order_id) INTO v_order_found;

  IF NOT v_order_found THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Order not found'::VARCHAR, p_order_id::UUID, NULL::VARCHAR;
    RETURN;
  END IF;

  -- Get current order status
  SELECT payment_status INTO v_current_status FROM orders WHERE id = p_order_id;

  -- Update order with payment info
  UPDATE orders
  SET
    payment_status = p_payment_status,
    payment_amount = COALESCE(p_payment_amount, payment_amount),
    payment_date = CASE
      WHEN p_payment_status = 'completed' THEN CURRENT_TIMESTAMP
      ELSE payment_date
    END,
    last_payment_event_id = p_webhook_event_id,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_order_id;

  -- Update webhook_events with order reference
  UPDATE webhook_events
  SET
    order_id = p_order_id,
    order_status_before = v_current_status,
    order_status_after = p_payment_status,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_webhook_event_id;

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Order payment updated'::VARCHAR,
    p_order_id::UUID,
    p_payment_status::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION link_payment_to_order(UUID, UUID, VARCHAR, DECIMAL) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION link_payment_to_order(UUID, UUID, VARCHAR, DECIMAL) TO service_role;

-- ============================================================================
-- 6. Create RPC: get_pending_order_payments
-- ============================================================================
-- Find orders awaiting payment confirmation

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
    o.order_number,
    o.customer_name,
    o.payment_status,
    o.total_amount,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::INT / 60 as duration,
    wd.id,
    wd.event_type,
    o.created_at
  FROM orders o
  LEFT JOIN webhook_events wd ON wd.id = o.last_payment_event_id
  WHERE o.restaurant_id = p_restaurant_id
    AND o.payment_status IN ('pending', 'processing', 'failed')
    AND o.created_at > CURRENT_TIMESTAMP - (p_max_age_minutes || ' minutes')::INTERVAL
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

ALTER FUNCTION get_pending_order_payments(UUID, INT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_pending_order_payments(UUID, INT) TO service_role;

-- ============================================================================
-- 7. Create RPC: update_order_from_payment_event
-- ============================================================================
-- Main integration: processes a payment webhook and updates order

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
  v_event_data JSONB;
  v_previous_status VARCHAR;
BEGIN
  -- Get webhook event details
  SELECT id, restaurant_id, merchant_code, jsonb_build_object('type', event_type, 'data', event_data)
    INTO v_order_id, v_restaurant_id, v_merchant_code, v_provider, v_event_data
    FROM webhook_events
    WHERE id = p_webhook_event_id;

  IF v_order_id IS NULL THEN
    -- Try to resolve restaurant from merchant code
    SELECT restaurant_id INTO v_restaurant_id
    FROM resolve_restaurant_from_merchant_code(v_merchant_code, 'stripe');
  END IF;

  IF v_restaurant_id IS NULL THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'Cannot resolve restaurant from payment event'::VARCHAR,
      NULL::UUID,
      NULL::UUID,
      NULL::VARCHAR,
      NULL::VARCHAR;
    RETURN;
  END IF;

  -- Get current status
  SELECT payment_status INTO v_previous_status FROM orders WHERE id = v_order_id;

  -- Update order payment status (using previously created function)
  PERFORM * FROM link_payment_to_order(v_order_id, p_webhook_event_id, p_payment_status, p_payment_amount);

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Order payment synchronized'::VARCHAR,
    v_order_id,
    v_restaurant_id,
    v_previous_status,
    p_payment_status::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION update_order_from_payment_event(UUID, VARCHAR, DECIMAL) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION update_order_from_payment_event(UUID, VARCHAR, DECIMAL) TO service_role;

-- ============================================================================
-- 8. Create Indexes for Payment Integration Queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_merchant_code_mapping_restaurant
  ON merchant_code_mapping(restaurant_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_merchant_code_mapping_provider_code
  ON merchant_code_mapping(provider, merchant_code)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_gm_orders_payment_status_restaurant
  ON gm_orders(restaurant_id, payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id
  ON webhook_events(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_orders_last_payment_event
  ON gm_orders(last_payment_event_id)
  WHERE last_payment_event_id IS NOT NULL;

-- ============================================================================
-- 9. Grant Table Permissions to service_role
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON merchant_code_mapping TO service_role;
GRANT SELECT ON gm_orders TO service_role;
GRANT SELECT ON webhook_events TO service_role;

-- ============================================================================
-- 10. Summary and Verification
-- ============================================================================

-- Verify tables created
SELECT 'merchant_code_mapping table' as entity, 'CREATED' as status
WHERE EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='merchant_code_mapping')
UNION ALL
SELECT 'order_id column in webhook_events', 'CREATED'
WHERE EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='webhook_events' AND column_name='order_id')
UNION ALL
SELECT 'payment columns in gm_orders', 'CREATED'
WHERE EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='gm_orders' AND column_name='payment_method');

COMMIT;
