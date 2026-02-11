-- Migration: 20260213_server_side_idempotency.sql
-- Purpose: Add database-enforced idempotency to order creation, payment processing, and shift operations
-- Scope: gm_orders, gm_payments (extend), shift_logs
-- Risk: Low (schema-only changes, no data modification)
-- Dependencies: A1 (RLS) must be deployed first
--
-- Idempotency Pattern:
-- 1. Client sends: {restaurant_id, order_data, idempotency_key}
-- 2. RPC checks: Is there an existing order with this key?
-- 3. If YES: Return existing order (idempotent; safe to retry)
-- 4. If NO: Create new order, mark with key, log to audit
-- 5. Database enforces: UNIQUE(idempotency_key) prevents race conditions
--
-- Benefits:
-- - Client can safely retry failed requests (no duplicate orders)
-- - Network timeout doesn't create duplicate charges
-- - Eventual consistency becomes safe

BEGIN;

-- ========================================================================
-- PHASE 1: Add Idempotency to gm_orders
-- ========================================================================

-- Add idempotency_key column
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

COMMENT ON COLUMN public.gm_orders.idempotency_key IS
  'Idempotency key for order creation. Unique within (restaurant_id, idempotency_key). Prevents duplicate orders on retry.';

-- Enforce idempotency at database level
-- UNIQUE index on (restaurant_id, idempotency_key) where key is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_orders_idempotency_key
  ON public.gm_orders(restaurant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON INDEX idx_gm_orders_idempotency_key IS
  'Enforces uniqueness of idempotency_key per restaurant. Protects against duplicate order creation.';

-- ========================================================================
-- PHASE 2: Extend gm_payments Idempotency (already exists, reinforce)
-- ========================================================================

-- Verify gm_payments has idempotency_key
ALTER TABLE public.gm_payments
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Reinforce index if not already exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_payments_idempotency_key
  ON public.gm_payments(restaurant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ========================================================================
-- PHASE 3: Add Idempotency to shift_logs (shift completion)
-- ========================================================================

-- Add idempotency_key for shift closure operations
ALTER TABLE public.shift_logs
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

COMMENT ON COLUMN public.shift_logs.idempotency_key IS
  'Idempotency key for shift close operation. Prevents duplicate shift closures on retry.';

-- Enforce uniqueness per restaurant per shift
CREATE UNIQUE INDEX IF NOT EXISTS idx_shift_logs_idempotency_key
  ON public.shift_logs(restaurant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ========================================================================
-- PHASE 4: RPC for Idempotent Order Creation
-- ========================================================================

CREATE OR REPLACE FUNCTION public.create_order_idempotent(
  p_restaurant_id UUID,
  p_table_id UUID DEFAULT NULL,
  p_table_number INTEGER DEFAULT NULL,
  p_source TEXT DEFAULT 'tpv',
  p_operator_id UUID DEFAULT NULL,
  p_cash_register_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_existing_order_id UUID;
  v_restaurant_exists BOOLEAN;
BEGIN
  -- ============================================================
  -- 1. VALIDATION: Restaurant exists and user has access
  -- ============================================================
  SELECT EXISTS (
    SELECT 1 FROM public.gm_restaurants
    WHERE id = p_restaurant_id
  ) INTO v_restaurant_exists;

  IF NOT v_restaurant_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Restaurant not found',
      'code', 'RESTAURANT_NOT_FOUND'
    );
  END IF;

  -- Verify user has access to this restaurant (via RLS helper)
  IF NOT public.has_restaurant_access(p_restaurant_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized access to restaurant',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- ============================================================
  -- 2. IDEMPOTENCY CHECK: Return existing order if key exists
  -- ============================================================
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_order_id
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND idempotency_key = p_idempotency_key;

    IF v_existing_order_id IS NOT NULL THEN
      -- Idempotent response: return existing order
      RETURN jsonb_build_object(
        'success', true,
        'idempotent', true,
        'order_id', v_existing_order_id,
        'message', 'Order already exists for this idempotency key. Returning cached result.'
      );
    END IF;
  END IF;

  -- ============================================================
  -- 3. CREATE ORDER (atomic)
  -- ============================================================
  v_order_id := gen_random_uuid();

  INSERT INTO public.gm_orders (
    id,
    restaurant_id,
    table_id,
    table_number,
    status,
    payment_status,
    source,
    operator_id,
    cash_register_id,
    notes,
    metadata,
    idempotency_key,
    created_at
  ) VALUES (
    v_order_id,
    p_restaurant_id,
    p_table_id,
    p_table_number,
    'OPEN', -- Status is always OPEN on creation
    'PENDING', -- Payment status is always PENDING initially
    p_source,
    p_operator_id,
    p_cash_register_id,
    p_notes,
    p_metadata,
    p_idempotency_key,
    NOW()
  );

  -- ============================================================
  -- 4. AUDIT: Log order creation
  -- ============================================================
  INSERT INTO public.gm_audit_logs (
    restaurant_id,
    action,
    actor_id,
    table_name,
    affected_row_id,
    new_values
  ) VALUES (
    p_restaurant_id,
    'ORDER_CREATED',
    p_operator_id,
    'gm_orders',
    v_order_id,
    jsonb_build_object(
      'table_id', p_table_id,
      'table_number', p_table_number,
      'source', p_source,
      'idempotency_key', p_idempotency_key
    )
  );

  -- ============================================================
  -- 5. RESPONSE
  -- ============================================================
  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'order_id', v_order_id,
    'message', 'Order created successfully'
  );

EXCEPTION WHEN unique_violation THEN
  -- Race condition: Another request created order with same key
  -- Retrieve and return the existing order
  SELECT id INTO v_existing_order_id
  FROM public.gm_orders
  WHERE restaurant_id = p_restaurant_id
    AND idempotency_key = p_idempotency_key;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', true,
    'order_id', v_existing_order_id,
    'message', 'Order created by concurrent request. Returning their result (idempotent).'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'ORDER_CREATION_ERROR'
  );
END;
$$;

COMMENT ON FUNCTION public.create_order_idempotent IS
  'Create an order with idempotency guarantee. If idempotency_key exists, returns cached order instead of creating duplicate.';

-- ========================================================================
-- PHASE 5: RPC for Idempotent Payment Processing
-- ========================================================================

-- Extend existing process_order_payment RPC to ensure idempotency handling
CREATE OR REPLACE FUNCTION public.process_order_payment(
  p_order_id UUID,
  p_restaurant_id UUID,
  p_method TEXT,
  p_amount_cents INTEGER,
  p_cash_register_id UUID,
  p_operator_id UUID DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
  v_order_status TEXT;
  v_register_status TEXT;
  v_existing_payment_id UUID;
BEGIN
  -- ============================================================
  -- 1. VALIDATION: Cash Register must be OPEN
  -- ============================================================
  SELECT status INTO v_register_status
  FROM public.gm_cash_registers
  WHERE id = p_cash_register_id
    AND restaurant_id = p_restaurant_id;

  IF v_register_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cash Register not found',
      'code', 'REGISTER_NOT_FOUND'
    );
  END IF;

  IF v_register_status != 'open' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cash Register is CLOSED',
      'code', 'REGISTER_CLOSED'
    );
  END IF;

  -- ============================================================
  -- 2. VALIDATION: Order must NOT be PAID already
  -- ============================================================
  SELECT status INTO v_order_status
  FROM public.gm_orders
  WHERE id = p_order_id
    AND restaurant_id = p_restaurant_id;

  IF v_order_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found',
      'code', 'ORDER_NOT_FOUND'
    );
  END IF;

  IF v_order_status IN ('CLOSED', 'CANCELLED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order is already final (' || v_order_status || ')',
      'code', 'ORDER_FINAL'
    );
  END IF;

  -- ============================================================
  -- 3. IDEMPOTENCY CHECK: Return existing payment if key exists
  -- ============================================================
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_payment_id
    FROM public.gm_payments
    WHERE restaurant_id = p_restaurant_id
      AND idempotency_key = p_idempotency_key;

    IF v_existing_payment_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent', true,
        'payment_id', v_existing_payment_id,
        'message', 'Payment already processed for this idempotency key (idempotent response)'
      );
    END IF;
  END IF;

  -- ============================================================
  -- 4. CREATE PAYMENT (atomic)
  -- ============================================================
  v_payment_id := gen_random_uuid();

  INSERT INTO public.gm_payments (
    id,
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
  ) VALUES (
    v_payment_id,
    p_restaurant_id,
    p_order_id,
    p_cash_register_id,
    p_operator_id,
    p_amount_cents,
    'BRL', -- Default currency
    p_method,
    'completed',
    p_idempotency_key,
    NOW()
  );

  -- Update order payment status
  UPDATE public.gm_orders
  SET
    payment_status = 'PAID',
    status = 'CLOSED',
    updated_at = NOW()
  WHERE id = p_order_id;

  -- ============================================================
  -- 5. AUDIT: Log payment
  -- ============================================================
  INSERT INTO public.gm_audit_logs (
    restaurant_id,
    action,
    actor_id,
    table_name,
    affected_row_id,
    new_values
  ) VALUES (
    p_restaurant_id,
    'PAYMENT_PROCESSED',
    p_operator_id,
    'gm_payments',
    v_payment_id,
    jsonb_build_object(
      'amount_cents', p_amount_cents,
      'method', p_method,
      'order_id', p_order_id,
      'idempotency_key', p_idempotency_key
    )
  );

  -- ============================================================
  -- 6. RESPONSE
  -- ============================================================
  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'payment_id', v_payment_id,
    'order_id', p_order_id,
    'message', 'Payment processed successfully'
  );

EXCEPTION WHEN unique_violation THEN
  -- Race condition: payment already created
  SELECT id INTO v_existing_payment_id
  FROM public.gm_payments
  WHERE restaurant_id = p_restaurant_id
    AND idempotency_key = p_idempotency_key;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', true,
    'payment_id', v_existing_payment_id,
    'message', 'Payment processed by concurrent request (idempotent response)'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'PAYMENT_ERROR'
  );
END;
$$;

COMMENT ON FUNCTION public.process_order_payment IS
  'Process order payment with idempotency guarantee. Safe to retry on network failure.';

-- ========================================================================
-- PHASE 6: RPC for Idempotent Shift Closure
-- ========================================================================

CREATE OR REPLACE FUNCTION public.close_shift_idempotent(
  p_restaurant_id UUID,
  p_shift_id UUID,
  p_employee_id UUID,
  p_end_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift_record RECORD;
  v_duration_minutes INTEGER;
  v_existing_shift_id UUID;
BEGIN
  -- ============================================================
  -- 1. VALIDATION: Shift exists and is active
  -- ============================================================
  SELECT * INTO v_shift_record
  FROM public.shift_logs
  WHERE id = p_shift_id
    AND restaurant_id = p_restaurant_id
    AND employee_id = p_employee_id;

  IF v_shift_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Shift not found or access denied',
      'code', 'SHIFT_NOT_FOUND'
    );
  END IF;

  IF v_shift_record.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Shift is not active (status: ' || v_shift_record.status || ')',
      'code', 'SHIFT_NOT_ACTIVE'
    );
  END IF;

  -- ============================================================
  -- 2. IDEMPOTENCY CHECK: Return existing closure if key exists
  -- ============================================================
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_shift_id
    FROM public.shift_logs
    WHERE restaurant_id = p_restaurant_id
      AND id = p_shift_id
      AND idempotency_key = p_idempotency_key;

    IF v_existing_shift_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent', true,
        'shift_id', v_existing_shift_id,
        'message', 'Shift already closed for this idempotency key (idempotent response)'
      );
    END IF;
  END IF;

  -- ============================================================
  -- 3. CLOSE SHIFT (atomic)
  -- ============================================================
  v_duration_minutes := EXTRACT(EPOCH FROM (NOW() - v_shift_record.start_time)) / 60;

  UPDATE public.shift_logs
  SET
    end_time = NOW(),
    duration_minutes = v_duration_minutes,
    status = 'completed',
    idempotency_key = p_idempotency_key,
    meta = COALESCE(meta, '{}'::JSONB) || jsonb_build_object(
      'end_notes', p_end_notes,
      'closed_at', NOW()::TEXT,
      'additional_metadata', p_metadata
    ),
    updated_at = NOW()
  WHERE id = p_shift_id;

  -- ============================================================
  -- 4. AUDIT: Log shift closure
  -- ============================================================
  INSERT INTO public.gm_audit_logs (
    restaurant_id,
    action,
    actor_id,
    table_name,
    affected_row_id,
    new_values
  ) VALUES (
    p_restaurant_id,
    'SHIFT_CLOSED',
    p_employee_id,
    'shift_logs',
    p_shift_id,
    jsonb_build_object(
      'duration_minutes', v_duration_minutes,
      'end_notes', p_end_notes,
      'idempotency_key', p_idempotency_key
    )
  );

  -- ============================================================
  -- 5. RESPONSE
  -- ============================================================
  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'shift_id', p_shift_id,
    'duration_minutes', v_duration_minutes,
    'message', 'Shift closed successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'SHIFT_CLOSURE_ERROR'
  );
END;
$$;

COMMENT ON FUNCTION public.close_shift_idempotent IS
  'Close a shift with idempotency guarantee. Safe to retry on network timeout.';

-- ========================================================================
-- PHASE 7: Helper RPC to Check Idempotency Status
-- ========================================================================

CREATE OR REPLACE FUNCTION public.check_idempotency_status(
  p_restaurant_id UUID,
  p_operation_type TEXT, -- 'order' | 'payment' | 'shift'
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_operation_type = 'order' THEN
    SELECT jsonb_build_object(
      'found', true,
      'operation_type', 'order',
      'resource_id', id,
      'status', status,
      'created_at', created_at
    ) INTO v_result
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND idempotency_key = p_idempotency_key
    LIMIT 1;

  ELSIF p_operation_type = 'payment' THEN
    SELECT jsonb_build_object(
      'found', true,
      'operation_type', 'payment',
      'resource_id', id,
      'status', status,
      'created_at', created_at
    ) INTO v_result
    FROM public.gm_payments
    WHERE restaurant_id = p_restaurant_id
      AND idempotency_key = p_idempotency_key
    LIMIT 1;

  ELSIF p_operation_type = 'shift' THEN
    SELECT jsonb_build_object(
      'found', true,
      'operation_type', 'shift',
      'resource_id', id,
      'status', status,
      'duration_minutes', duration_minutes,
      'created_at', created_at
    ) INTO v_result
    FROM public.shift_logs
    WHERE restaurant_id = p_restaurant_id
      AND idempotency_key = p_idempotency_key
    LIMIT 1;

  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unknown operation type: ' || p_operation_type,
      'code', 'INVALID_OPERATION_TYPE'
    );
  END IF;

  -- Return result or not found
  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'found', false,
      'operation_type', p_operation_type,
      'idempotency_key', p_idempotency_key
    );
  ELSE
    RETURN v_result;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'CHECK_ERROR'
  );
END;
$$;

COMMENT ON FUNCTION public.check_idempotency_status IS
  'Check if an operation with given idempotency key has already been processed.';

-- ========================================================================
-- PHASE 8: Audit Log Entry
-- ========================================================================

INSERT INTO gm_audit_logs (
  restaurant_id,
  action,
  actor_id,
  table_name,
  affected_row_id,
  old_values,
  new_values,
  ip_address,
  user_agent
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SYSTEM_MIGRATION_IDEMPOTENCY',
  NULL,
  'schema_migrations',
  '20260213'::uuid,
  jsonb_build_object(
    'status', 'started',
    'scope', 'Add server-side idempotency to orders, payments, and shifts'
  ),
  jsonb_build_object(
    'status', 'completed',
    'enhancements', jsonb_build_object(
      'gm_orders_idempotency_added', true,
      'gm_payments_idempotency_extended', true,
      'shift_logs_idempotency_added', true,
      'rpcs_created', jsonb_build_array(
        'create_order_idempotent',
        'process_order_payment (extended)',
        'close_shift_idempotent',
        'check_idempotency_status'
      )
    )
  ),
  '0.0.0.0'::inet,
  'database-migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ========================================================================
-- POST-DEPLOYMENT VERIFICATION
-- ========================================================================
-- After applying this migration, verify:
--
-- 1. Verify idempotency columns exist:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'gm_orders' AND column_name = 'idempotency_key';
--
-- 2. Verify unique indexes are in place:
--    SELECT indexname FROM pg_indexes
--    WHERE table name IN ('gm_orders', 'gm_payments', 'shift_logs')
--    AND indexname LIKE '%idempotency%';
--
-- 3. Test idempotent order creation (should be same ID on retry):
--    SELECT create_order_idempotent(
--      p_restaurant_id := '<UUID>',
--      p_idempotency_key := 'test-key-123'
--    );
--    -- Second call with same key should return same order_id
--
-- 4. Check audit log for migration entry:
--    SELECT * FROM gm_audit_logs
--    WHERE action = 'SYSTEM_MIGRATION_IDEMPOTENCY'
--    ORDER BY created_at DESC LIMIT 1;
-- ========================================================================
