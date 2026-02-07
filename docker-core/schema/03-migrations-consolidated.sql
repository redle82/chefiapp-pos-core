-- =============================================================================
-- CHEFIAPP CORE - MIGRAÇÕES CONSOLIDADAS (initdb.d)
-- =============================================================================
-- Aplicado após 01-core-schema.sql e 02-seeds-dev.sql.
-- Ordem: tabelas base → colunas → task engine → pagamentos/caixa → RPCs.
-- Data: 2026-02-03
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. gm_order_items.updated_at (exigido por mark_item_ready)
-- -----------------------------------------------------------------------------
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- ADD PREP TIME TO PRODUCTS AND ORDER ITEMS
-- =============================================================================
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS prep_time_seconds INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS prep_category TEXT DEFAULT 'main' CHECK (prep_category IN ('drink', 'starter', 'main', 'dessert'));

ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS prep_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS prep_category TEXT;

COMMENT ON COLUMN public.gm_products.prep_time_seconds IS 'Tempo esperado de preparo em segundos';
COMMENT ON COLUMN public.gm_products.prep_category IS 'Categoria de preparo: drink, starter, main, dessert';
COMMENT ON COLUMN public.gm_order_items.prep_time_seconds IS 'Snapshot do prep_time_seconds do produto no momento da criação do pedido';
COMMENT ON COLUMN public.gm_order_items.prep_category IS 'Snapshot do prep_category do produto no momento da criação do pedido';

UPDATE public.gm_products
SET prep_time_seconds = CASE
  WHEN prep_category = 'drink' THEN 45
  WHEN prep_category = 'starter' THEN 240
  WHEN prep_category = 'main' THEN 720
  WHEN prep_category = 'dessert' THEN 300
  ELSE 300
END
WHERE prep_time_seconds IS NULL OR prep_time_seconds = 300;

-- =============================================================================
-- ADD STATION (BAR vs KITCHEN)
-- =============================================================================
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS station TEXT DEFAULT 'KITCHEN' CHECK (station IN ('BAR', 'KITCHEN'));

ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS station TEXT CHECK (station IN ('BAR', 'KITCHEN'));

COMMENT ON COLUMN public.gm_products.station IS 'Estação de preparo: BAR ou KITCHEN';
COMMENT ON COLUMN public.gm_order_items.station IS 'Snapshot do station do produto no momento da criação do pedido';

UPDATE public.gm_products
SET station = CASE
  WHEN prep_category = 'drink' THEN 'BAR'
  ELSE 'KITCHEN'
END
WHERE station IS NULL OR station = 'KITCHEN';

-- =============================================================================
-- ADD ready_at TO ORDER ITEMS
-- =============================================================================
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

COMMENT ON COLUMN public.gm_order_items.ready_at IS 'Timestamp quando o item foi marcado como pronto';

-- =============================================================================
-- ADD AUTHORSHIP TO gm_order_items
-- =============================================================================
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS created_by_user_id UUID,
ADD COLUMN IF NOT EXISTS created_by_role TEXT,
ADD COLUMN IF NOT EXISTS device_id TEXT;

CREATE INDEX IF NOT EXISTS idx_order_items_author
ON public.gm_order_items(order_id, created_by_user_id, created_by_role);

CREATE INDEX IF NOT EXISTS idx_order_items_device
ON public.gm_order_items(device_id) WHERE device_id IS NOT NULL;

COMMENT ON COLUMN public.gm_order_items.created_by_user_id IS 'ID do usuário que criou o item (para divisão de conta)';
COMMENT ON COLUMN public.gm_order_items.created_by_role IS 'Role do criador: waiter, manager, owner, QR_MESA, etc.';
COMMENT ON COLUMN public.gm_order_items.device_id IS 'Identificador do dispositivo (opcional, usado para QR Mesa)';

-- =============================================================================
-- TASK ENGINE (gm_tasks)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.gm_orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.gm_order_items(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'ATRASO_ITEM',
    'ACUMULO_BAR',
    'ENTREGA_PENDENTE',
    'ITEM_CRITICO',
    'PEDIDO_ESQUECIDO'
  )),
  station TEXT CHECK (station IN ('BAR', 'KITCHEN', 'SERVICE')),
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIA', 'ALTA', 'CRITICA')) DEFAULT 'MEDIA',
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  auto_generated BOOLEAN DEFAULT true,
  source_event TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_restaurant_status ON public.gm_tasks(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_station_priority ON public.gm_tasks(station, priority) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_tasks_order ON public.gm_tasks(order_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_tasks_order_item ON public.gm_tasks(order_item_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.gm_tasks(created_at DESC) WHERE status = 'OPEN';

COMMENT ON TABLE public.gm_tasks IS 'Tarefas automáticas geradas a partir de eventos operacionais';

-- =============================================================================
-- STOCK TASK TYPES + RPC simulate_order_stock_impact
-- =============================================================================
ALTER TABLE public.gm_tasks DROP CONSTRAINT IF EXISTS gm_tasks_task_type_check;

ALTER TABLE public.gm_tasks
ADD CONSTRAINT gm_tasks_task_type_check CHECK (task_type IN (
  'ATRASO_ITEM',
  'ACUMULO_BAR',
  'ENTREGA_PENDENTE',
  'ITEM_CRITICO',
  'PEDIDO_ESQUECIDO',
  'ESTOQUE_CRITICO',
  'RUPTURA_PREVISTA',
  'EQUIPAMENTO_CHECK'
));

COMMENT ON COLUMN public.gm_tasks.task_type IS 'Tipo de tarefa: ATRASO_ITEM, ACUMULO_BAR, ESTOQUE_CRITICO, etc';

CREATE OR REPLACE FUNCTION public.simulate_order_stock_impact(
  p_restaurant_id UUID,
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH req AS (
    SELECT
      (i->>'product_id')::UUID AS product_id,
      COALESCE((i->>'quantity')::INT, 1) AS qty
    FROM jsonb_array_elements(p_items) i
  ),
  needed AS (
    SELECT
      b.ingredient_id,
      b.station,
      SUM(b.qty_per_unit * r.qty) AS needed_qty
    FROM req r
    JOIN public.gm_product_bom b
      ON b.product_id = r.product_id AND b.restaurant_id = p_restaurant_id
    GROUP BY b.ingredient_id, b.station
  ),
  stock AS (
    SELECT
      sl.ingredient_id,
      SUM(sl.qty) AS available_qty,
      SUM(sl.min_qty) AS min_total
    FROM public.gm_stock_levels sl
    WHERE sl.restaurant_id = p_restaurant_id
    GROUP BY sl.ingredient_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'ingredient_id', n.ingredient_id,
    'needed_qty', n.needed_qty,
    'available_qty', COALESCE(s.available_qty, 0),
    'will_be', COALESCE(s.available_qty, 0) - n.needed_qty,
    'below_min', (COALESCE(s.available_qty, 0) - n.needed_qty) < COALESCE(s.min_total, 0),
    'station', n.station
  ))
  INTO v_result
  FROM needed n
  LEFT JOIN stock s ON s.ingredient_id = n.ingredient_id;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

COMMENT ON FUNCTION public.simulate_order_stock_impact IS 'Simula o impacto de um pedido no estoque. Requer gm_product_bom e gm_stock_levels.';

-- =============================================================================
-- CORE PAYMENTS AND CASH REGISTERS
-- =============================================================================
ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.gm_orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'));

CREATE TABLE IF NOT EXISTS public.gm_cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Caixa Principal',
    status TEXT NOT NULL DEFAULT 'closed',
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opened_by TEXT,
    closed_by TEXT,
    opening_balance_cents BIGINT DEFAULT 0,
    closing_balance_cents BIGINT,
    total_sales_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT gm_cash_registers_status_check CHECK (status IN ('open', 'closed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_cash_registers_one_open
  ON public.gm_cash_registers(restaurant_id)
  WHERE status = 'open';

CREATE TABLE IF NOT EXISTS public.gm_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    cash_register_id UUID REFERENCES public.gm_cash_registers(id),
    operator_id UUID,
    amount_cents BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid',
    idempotency_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT gm_payments_status_check CHECK (status IN ('paid', 'failed', 'refunded'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_payments_idempotency
  ON public.gm_payments(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.gm_payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    order_id UUID,
    operator_id UUID,
    amount_cents INTEGER,
    method TEXT,
    result TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT,
    payment_id UUID,
    duration_ms INTEGER,
    client_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_restaurant_date
  ON public.gm_payment_audit_logs(restaurant_id, created_at);

CREATE OR REPLACE FUNCTION public.open_cash_register_atomic(
    p_restaurant_id UUID,
    p_name TEXT DEFAULT 'Caixa Principal',
    p_opened_by TEXT DEFAULT NULL,
    p_opening_balance_cents BIGINT DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM public.gm_cash_registers WHERE restaurant_id = p_restaurant_id AND status = 'open') THEN
        RAISE EXCEPTION 'CASH_REGISTER_ALREADY_OPEN';
    END IF;
    INSERT INTO public.gm_cash_registers (restaurant_id, name, status, opened_at, opened_by, opening_balance_cents, updated_at)
    VALUES (p_restaurant_id, COALESCE(NULLIF(TRIM(p_name), ''), 'Caixa Principal'), 'open', NOW(), p_opened_by, COALESCE(p_opening_balance_cents, 0), NOW())
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('id', v_id, 'status', 'open');
END;
$$;

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
    p_client_info TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_log_id UUID;
BEGIN
    INSERT INTO public.gm_payment_audit_logs (
        order_id, restaurant_id, operator_id, amount_cents, method, result,
        error_code, error_message, idempotency_key, payment_id, duration_ms, client_info
    ) VALUES (
        p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, p_result,
        p_error_code, p_error_message, p_idempotency_key, p_payment_id, p_duration_ms,
        CASE WHEN p_client_info IS NOT NULL AND TRIM(p_client_info) != '' THEN (p_client_info::jsonb) ELSE NULL END
    )
    RETURNING id INTO v_log_id;
    RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_payment_health(p_restaurant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempts_24h INTEGER;
    v_success_24h INTEGER;
    v_fail_24h INTEGER;
    v_avg_duration_ms NUMERIC;
    v_total_processed_cents BIGINT;
    v_most_common_error TEXT;
    v_success_rate NUMERIC;
BEGIN
    WITH window_stats AS (
        SELECT result, duration_ms, amount_cents, error_code
        FROM public.gm_payment_audit_logs
        WHERE restaurant_id = p_restaurant_id AND created_at >= NOW() - INTERVAL '24 hours'
    )
    SELECT
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE result = 'success')::INTEGER,
        COUNT(*) FILTER (WHERE result != 'success')::INTEGER,
        AVG(duration_ms) FILTER (WHERE result = 'success')::NUMERIC(10,2),
        COALESCE(SUM(amount_cents) FILTER (WHERE result = 'success'), 0)::BIGINT,
        (array_agg(error_code) FILTER (WHERE result != 'success' AND error_code IS NOT NULL))[1]
    INTO v_attempts_24h, v_success_24h, v_fail_24h, v_avg_duration_ms, v_total_processed_cents, v_most_common_error
    FROM window_stats;
    IF v_attempts_24h > 0 THEN
        v_success_rate := (v_success_24h::NUMERIC / v_attempts_24h::NUMERIC) * 100;
    ELSE
        v_success_rate := 100;
    END IF;
    RETURN jsonb_build_object(
        'attempts_24h', COALESCE(v_attempts_24h, 0),
        'success_24h', COALESCE(v_success_24h, 0),
        'fail_24h', COALESCE(v_fail_24h, 0),
        'success_rate', TRUNC(v_success_rate, 2),
        'avg_duration_ms', COALESCE(v_avg_duration_ms, 0),
        'total_processed_cents', COALESCE(v_total_processed_cents, 0),
        'most_common_error', v_most_common_error
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_order_payment(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_cash_register_id UUID,
    p_method TEXT,
    p_amount_cents INTEGER,
    p_operator_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_status TEXT;
    v_order_total INTEGER;
    v_register_status TEXT;
    v_total_paid INTEGER := 0;
    v_new_total_paid INTEGER;
    v_order_payment_status TEXT;
    v_order_final_status TEXT;
    v_payment_id UUID;
BEGIN
    SELECT status INTO v_register_status
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id AND restaurant_id = p_restaurant_id;
    IF v_register_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register not found');
    END IF;
    IF v_register_status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register must be OPEN to process payments');
    END IF;

    SELECT status, total_cents INTO v_order_status, v_order_total
    FROM public.gm_orders
    WHERE id = p_order_id AND restaurant_id = p_restaurant_id
    FOR UPDATE;
    IF v_order_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    IF v_order_status IN ('CLOSED', 'CANCELLED') OR v_order_status = 'paid' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is already final (' || COALESCE(v_order_status, '') || ')');
    END IF;

    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
    FROM public.gm_payments
    WHERE order_id = p_order_id AND status = 'paid';
    v_new_total_paid := v_total_paid + p_amount_cents;
    IF v_new_total_paid > v_order_total THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment amount exceeds remaining balance');
    END IF;

    INSERT INTO public.gm_payments (
        restaurant_id, order_id, cash_register_id, operator_id, amount_cents, currency, payment_method, status, idempotency_key, updated_at
    ) VALUES (
        p_restaurant_id, p_order_id, p_cash_register_id, p_operator_id, p_amount_cents, 'EUR', p_method, 'paid', p_idempotency_key, NOW()
    )
    RETURNING id INTO v_payment_id;

    IF v_new_total_paid >= v_order_total THEN
        v_order_payment_status := 'PAID';
        v_order_final_status := 'CLOSED';
    ELSE
        v_order_payment_status := 'PARTIALLY_PAID';
        v_order_final_status := 'OPEN';
    END IF;

    UPDATE public.gm_orders
    SET status = v_order_final_status, payment_status = v_order_payment_status, updated_at = NOW()
    WHERE id = p_order_id;

    UPDATE public.gm_cash_registers
    SET total_sales_cents = COALESCE(total_sales_cents, 0) + p_amount_cents, updated_at = NOW()
    WHERE id = p_cash_register_id;

    PERFORM public.fn_log_payment_attempt(
        p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'success',
        NULL, NULL, p_idempotency_key, v_payment_id, NULL, NULL
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'payment_status', v_order_payment_status,
        'total_paid', v_new_total_paid,
        'remaining', v_order_total - v_new_total_paid
    );
EXCEPTION
    WHEN unique_violation THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'fail',
            'IDEMPOTENCY', 'Duplicate Transaction', p_idempotency_key, NULL, NULL, NULL
        );
        RETURN jsonb_build_object('success', false, 'error', 'Duplicate transaction (Idempotency Key used)');
    WHEN OTHERS THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'fail',
            'UNKNOWN', SQLERRM, p_idempotency_key, NULL, NULL, NULL
        );
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_split_payment_atomic(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_cash_register_id UUID,
    p_method TEXT,
    p_amount_cents INTEGER,
    p_operator_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.process_order_payment(
        p_order_id, p_restaurant_id, p_cash_register_id, p_method, p_amount_cents, p_operator_id, p_idempotency_key
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_inventory_deduction(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_updated INTEGER := 0;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.quantity
        FROM public.gm_order_items oi
        WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL
    LOOP
        UPDATE public.gm_products
        SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - v_item.quantity),
            updated_at = NOW()
        WHERE id = v_item.product_id AND track_stock = true;
        IF FOUND THEN
            v_updated := v_updated + 1;
        END IF;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'items_updated', v_updated);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON TABLE public.gm_cash_registers IS 'Financial Core: one open cash register per restaurant.';
COMMENT ON TABLE public.gm_payments IS 'Financial Core: all payments via RPC only.';

-- =============================================================================
-- BILLING CONFIGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.billing_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'sumup', 'pix', 'custom')),
    currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'BRL')),
    enabled BOOLEAN NOT NULL DEFAULT false,
    credentials_ref TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_billing_configs_restaurant_id ON public.billing_configs(restaurant_id);

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'trial'
  CHECK (billing_status IN ('trial', 'active', 'past_due', 'canceled'));

-- =============================================================================
-- PRODUCT MODE (gm_restaurants)
-- =============================================================================
ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS product_mode TEXT NOT NULL DEFAULT 'demo'
  CHECK (product_mode IN ('demo', 'pilot', 'live'));

COMMENT ON COLUMN public.gm_restaurants.product_mode IS 'Modo de produto: demo, pilot, live.';

-- =============================================================================
-- ONBOARDING: onboarding_completed_at (gm_restaurants)
-- =============================================================================
ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
COMMENT ON COLUMN public.gm_restaurants.onboarding_completed_at IS 'Data/hora em que o onboarding foi concluído (ex: primeiro produto). Usado pelo FlowGate e billing.';

-- =============================================================================
-- gm_terminals — Registro de terminais instalados/online
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_terminals (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('TPV', 'KDS', 'APPSTAFF', 'WEB', 'WAITER', 'BACKOFFICE', 'ADMIN')),
    name TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_gm_terminals_restaurant ON public.gm_terminals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gm_terminals_restaurant_type ON public.gm_terminals(restaurant_id, type);
COMMENT ON TABLE public.gm_terminals IS 'Terminais instalados/online por restaurante. Fluxo: terminal abre → regista/atualiza → owner vê na árvore. CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.';

-- =============================================================================
-- gm_staff — Staff operacional (sala, cozinha, gerente)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('waiter', 'kitchen', 'manager')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gm_staff_restaurant ON public.gm_staff(restaurant_id);
COMMENT ON TABLE public.gm_staff IS 'Staff operacional (sala, cozinha, gerente). Tarefas e KDS podem referenciar. Identidade detalhada em CORE_APPSTAFF_IDENTITY_CONTRACT.';

-- =============================================================================
-- RPC: get_operational_metrics, get_shift_history
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_operational_metrics(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_orders_created_total INTEGER;
    v_orders_cancelled_total INTEGER;
    v_payments_recorded_total INTEGER;
    v_payments_amount_cents BIGINT;
    v_active_shifts_count INTEGER;
    v_daily_revenue_cents BIGINT;
    v_daily_orders_count INTEGER;
    v_avg_order_value_cents INTEGER;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM public.gm_restaurants
    WHERE id = p_restaurant_id;
    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'schema_version', '1',
            'tenant_id', '',
            'period', jsonb_build_object('start', p_from, 'end', p_to),
            'orders_created_total', 0,
            'orders_cancelled_total', 0,
            'payments_recorded_total', 0,
            'payments_amount_cents', 0,
            'active_shifts_count', 0,
            'export_requested_count', 0,
            'daily_revenue_cents', 0,
            'daily_orders_count', 0,
            'avg_order_value_cents', 0
        );
    END IF;

    SELECT COUNT(*)::INTEGER INTO v_orders_created_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER INTO v_orders_cancelled_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND status = 'CANCELLED'
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER, COALESCE(SUM(amount_cents), 0)::BIGINT
    INTO v_payments_recorded_total, v_payments_amount_cents
    FROM public.gm_payments
    WHERE restaurant_id = p_restaurant_id
      AND status = 'paid'
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER INTO v_active_shifts_count
    FROM public.gm_cash_registers
    WHERE restaurant_id = p_restaurant_id AND status = 'open';

    SELECT COUNT(*)::INTEGER INTO v_daily_orders_count
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND status = 'CLOSED'
      AND payment_status IN ('PAID', 'PARTIALLY_PAID')
      AND updated_at >= p_from AND updated_at <= p_to;

    v_daily_revenue_cents := COALESCE(v_payments_amount_cents, 0);
    v_avg_order_value_cents := CASE
        WHEN v_daily_orders_count > 0 THEN (v_daily_revenue_cents / v_daily_orders_count)::INTEGER
        ELSE 0
    END;

    RETURN jsonb_build_object(
        'schema_version', '1',
        'tenant_id', v_tenant_id,
        'period', jsonb_build_object('start', p_from, 'end', p_to),
        'orders_created_total', v_orders_created_total,
        'orders_cancelled_total', v_orders_cancelled_total,
        'payments_recorded_total', v_payments_recorded_total,
        'payments_amount_cents', v_payments_amount_cents,
        'active_shifts_count', v_active_shifts_count,
        'export_requested_count', 0,
        'daily_revenue_cents', v_daily_revenue_cents,
        'daily_orders_count', v_daily_orders_count,
        'avg_order_value_cents', v_avg_order_value_cents
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shift_history(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
) RETURNS TABLE (
    shift_id UUID,
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    total_sales_cents BIGINT,
    orders_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cr.id AS shift_id,
        cr.opened_at AS opened_at,
        cr.closed_at AS closed_at,
        COALESCE(cr.total_sales_cents, 0)::BIGINT AS total_sales_cents,
        (SELECT COUNT(*)::BIGINT
         FROM public.gm_orders o
         WHERE o.cash_register_id = cr.id AND o.status = 'CLOSED') AS orders_count
    FROM public.gm_cash_registers cr
    WHERE cr.restaurant_id = p_restaurant_id
      AND cr.opened_at IS NOT NULL
      AND cr.opened_at <= p_to
      AND (cr.closed_at IS NULL OR cr.closed_at >= p_from)
    ORDER BY cr.opened_at DESC;
END;
$$;

-- =============================================================================
-- TASK TYPES: PEDIDO_NOVO, MODO_INTERNO
-- =============================================================================
ALTER TABLE public.gm_tasks DROP CONSTRAINT IF EXISTS gm_tasks_task_type_check;

ALTER TABLE public.gm_tasks
  ADD CONSTRAINT gm_tasks_task_type_check CHECK (task_type IN (
    'ATRASO_ITEM',
    'ACUMULO_BAR',
    'ENTREGA_PENDENTE',
    'ITEM_CRITICO',
    'PEDIDO_ESQUECIDO',
    'ESTOQUE_CRITICO',
    'RUPTURA_PREVISTA',
    'EQUIPAMENTO_CHECK',
    'PEDIDO_NOVO',
    'MODO_INTERNO'
  ));

COMMENT ON COLUMN public.gm_tasks.task_type IS 'Tipo de tarefa: PEDIDO_NOVO, MODO_INTERNO, ATRASO_ITEM, etc';

-- =============================================================================
-- RPC: mark_item_ready
-- =============================================================================
CREATE OR REPLACE FUNCTION public.mark_item_ready(
    p_item_id UUID,
    p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item_order_id UUID;
    v_all_items_ready BOOLEAN;
    v_updated_order_id UUID;
BEGIN
    UPDATE public.gm_order_items
    SET ready_at = NOW(), updated_at = NOW()
    WHERE id = p_item_id
      AND EXISTS (
          SELECT 1
          FROM public.gm_orders o
          WHERE o.id = gm_order_items.order_id
            AND o.restaurant_id = p_restaurant_id
      )
    RETURNING order_id INTO v_item_order_id;

    IF v_item_order_id IS NULL THEN
        RAISE EXCEPTION 'ITEM_NOT_FOUND: Item não encontrado ou não pertence ao restaurante';
    END IF;

    SELECT COUNT(*) = COUNT(CASE WHEN ready_at IS NOT NULL THEN 1 END)
    INTO v_all_items_ready
    FROM public.gm_order_items
    WHERE order_id = v_item_order_id;

    IF v_all_items_ready THEN
        UPDATE public.gm_orders
        SET status = 'READY',
            ready_at = CASE WHEN ready_at IS NULL THEN NOW() ELSE ready_at END,
            updated_at = NOW()
        WHERE id = v_item_order_id
          AND restaurant_id = p_restaurant_id
        RETURNING id INTO v_updated_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'item_id', p_item_id,
        'order_id', v_item_order_id,
        'all_items_ready', v_all_items_ready,
        'order_status_updated', v_updated_order_id IS NOT NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_item_ready TO postgres;

-- =============================================================================
-- RPC: update_order_status
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_new_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_id UUID;
BEGIN
    IF p_new_status NOT IN ('OPEN', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Status inválido: %', p_new_status;
    END IF;

    UPDATE public.gm_orders
    SET
        status = p_new_status,
        updated_at = NOW(),
        in_prep_at = CASE WHEN p_new_status = 'IN_PREP' AND in_prep_at IS NULL THEN NOW() ELSE in_prep_at END,
        ready_at = CASE WHEN p_new_status = 'READY' AND ready_at IS NULL THEN NOW() ELSE ready_at END
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_updated_id,
        'new_status', p_new_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status TO postgres;

-- =============================================================================
-- APPSTAFF TASK RPCs (TASKS_CONTRACT_v1, CORE_TASK_EXECUTION_CONTRACT)
-- =============================================================================
-- create_task, assign_task, start_task, complete_task, reject_task
-- gm_tasks: OPEN → ACKNOWLEDGED → RESOLVED | DISMISSED
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_task(
  p_restaurant_id UUID,
  p_task_type TEXT,
  p_message TEXT,
  p_station TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'MEDIA',
  p_order_id UUID DEFAULT NULL,
  p_order_item_id UUID DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_auto_generated BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.gm_tasks (
    restaurant_id, task_type, message, station, priority,
    order_id, order_item_id, context, status, auto_generated
  ) VALUES (
    p_restaurant_id, p_task_type, p_message,
    NULLIF(p_station, '')::TEXT,
    COALESCE(NULLIF(p_priority, ''), 'MEDIA'),
    p_order_id, p_order_item_id, COALESCE(p_context, '{}'::jsonb),
    'OPEN', p_auto_generated
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_task(
  p_task_id UUID,
  p_assigned_to UUID,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET assigned_to = p_assigned_to, updated_at = NOW()
  WHERE id = p_task_id AND status = 'OPEN';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not in OPEN status', p_task_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_task(
  p_task_id UUID,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET status = 'ACKNOWLEDGED', acknowledged_at = NOW(), updated_at = NOW()
  WHERE id = p_task_id AND status = 'OPEN';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not in OPEN status', p_task_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_id UUID,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET status = 'RESOLVED', resolved_at = COALESCE(resolved_at, NOW()), updated_at = NOW()
  WHERE id = p_task_id AND status IN ('OPEN', 'ACKNOWLEDGED');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or already terminal', p_task_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_task(
  p_task_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
  v_context JSONB;
BEGIN
  SELECT restaurant_id, context INTO v_restaurant_id, v_context FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET
    status = 'DISMISSED',
    resolved_at = COALESCE(resolved_at, NOW()),
    updated_at = NOW(),
    context = jsonb_set(COALESCE(context, '{}'::jsonb), '{reject_reason}', to_jsonb(COALESCE(p_reason, '')::TEXT))
  WHERE id = p_task_id AND status IN ('OPEN', 'ACKNOWLEDGED');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or already terminal', p_task_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_task TO postgres;
GRANT EXECUTE ON FUNCTION public.assign_task TO postgres;
GRANT EXECUTE ON FUNCTION public.start_task TO postgres;
GRANT EXECUTE ON FUNCTION public.complete_task TO postgres;
GRANT EXECUTE ON FUNCTION public.reject_task TO postgres;

-- =============================================================================
-- shift_logs — Registo de turnos (check-in/check-out) por funcionário
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.shift_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.gm_staff(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    meta JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shift_logs_restaurant_active ON public.shift_logs(restaurant_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_shift_logs_employee ON public.shift_logs(employee_id);
COMMENT ON TABLE public.shift_logs IS 'Registo de turnos (check-in/check-out). AppStaff LiveRoster e DEVICE_TURN_SHIFT_TASK_CONTRACT.';

-- =============================================================================
-- Menu digital: catálogo visual (gm_catalog_menus, gm_catalog_categories, gm_catalog_items)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS menu_catalog_enabled BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN public.gm_restaurants.menu_catalog_enabled IS 'Se true, o catálogo visual (menu digital) está ativo para este restaurante.';

CREATE TABLE IF NOT EXISTS public.gm_catalog_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gm_catalog_menus_restaurant ON public.gm_catalog_menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gm_catalog_menus_active ON public.gm_catalog_menus(restaurant_id, is_active) WHERE is_active = true;
COMMENT ON TABLE public.gm_catalog_menus IS 'Menu do catálogo visual (um ativo por restaurante é o caso comum).';

CREATE TABLE IF NOT EXISTS public.gm_catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.gm_catalog_menus(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gm_catalog_categories_menu ON public.gm_catalog_categories(menu_id);
COMMENT ON TABLE public.gm_catalog_categories IS 'Categorias do catálogo visual (ex.: Entrantes, Carnes).';

CREATE TABLE IF NOT EXISTS public.gm_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.gm_catalog_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  video_url TEXT,
  allergens JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gm_catalog_items_category ON public.gm_catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_gm_catalog_items_available ON public.gm_catalog_items(category_id, is_available) WHERE is_available = true;
COMMENT ON TABLE public.gm_catalog_items IS 'Prato do catálogo visual. Regra: sem image_url válido não exibir no catálogo.';
COMMENT ON COLUMN public.gm_catalog_items.allergens IS 'Array de códigos (ex.: gluten, lactose, huevos).';
COMMENT ON COLUMN public.gm_catalog_items.video_url IS 'Opcional; vídeo só carrega ao abrir o prato (performance).';

DROP TRIGGER IF EXISTS update_gm_catalog_menus_updated_at ON public.gm_catalog_menus;
CREATE TRIGGER update_gm_catalog_menus_updated_at
  BEFORE UPDATE ON public.gm_catalog_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gm_catalog_items_updated_at ON public.gm_catalog_items;
CREATE TRIGGER update_gm_catalog_items_updated_at
  BEFORE UPDATE ON public.gm_catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FIM 03-migrations-consolidated.sql
-- =============================================================================
