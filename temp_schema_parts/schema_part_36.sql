
-- 1. Restaurant Groups
CREATE TABLE IF NOT EXISTS gm_restaurant_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb, -- shared_menu, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Group Members (Junction Table)
CREATE TABLE IF NOT EXISTS gm_restaurant_group_members (
    group_id UUID REFERENCES gm_restaurant_groups(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- primary (HQ), member (Branch)
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, restaurant_id)
);

-- RLS POLICIES

-- Groups
ALTER TABLE gm_restaurant_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their groups" ON gm_restaurant_groups
    FOR ALL
    USING (auth.uid() = owner_id);

-- Group Members
ALTER TABLE gm_restaurant_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage group members" ON gm_restaurant_group_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM gm_restaurant_groups
            WHERE id = gm_restaurant_group_members.group_id
            AND owner_id = auth.uid()
        )
    );

-- Allow reading members if you are a member of the restaurant? 
-- This is tricky. For now, strict Owner control is safer for Phase 1.
;
-- Onda 2 · A1 — Alinhar gm_audit_logs à AUDIT_LOG_SPEC
-- Adiciona event_type, actor_type, result; reforça imutabilidade com trigger.
-- Ref: docs/architecture/AUDIT_LOG_SPEC.md

-- 1. Novas colunas (compatíveis com registos existentes)
alter table gm_audit_logs
  add column if not exists event_type text default '',
  add column if not exists actor_type text default 'user',
  add column if not exists result text;

comment on column gm_audit_logs.event_type is 'AUDIT_LOG_SPEC: e.g. login_success, config_changed, payment_recorded';
comment on column gm_audit_logs.actor_type is 'AUDIT_LOG_SPEC: user | system | support_admin';
comment on column gm_audit_logs.result is 'AUDIT_LOG_SPEC: success | failure (optional)';

-- 2. Índice para consultas por event_type (auditoria e export)
create index if not exists idx_audit_logs_event_type
  on gm_audit_logs(tenant_id, event_type, created_at desc)
  where event_type <> '';

-- 3. Imutabilidade a nível de base de dados: proibir UPDATE e DELETE
create or replace function gm_audit_logs_immutable()
returns trigger
language plpgsql
security invoker
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'gm_audit_logs: updates not allowed (immutable audit trail)';
  end if;
  if tg_op = 'DELETE' then
    raise exception 'gm_audit_logs: deletes not allowed (immutable audit trail). Use authorised purge job.';
  end if;
  return null;
end;
$$;

drop trigger if exists tr_gm_audit_logs_immutable on gm_audit_logs;
create trigger tr_gm_audit_logs_immutable
  before update or delete on gm_audit_logs
  for each row execute function gm_audit_logs_immutable();
;
-- Onda 2 · A2 — Instrumentar RPCs críticos para escrever em gm_audit_logs (AUDIT_LOG_SPEC).
-- Eventos: order_created, payment_recorded, user_disabled, user_reenabled.
-- Ref: docs/architecture/AUDIT_LOG_SPEC.md

-- ==============================================================================
-- 1. create_order_atomic — audit após criação do pedido (apenas quando actor conhecido)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_total_cents INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_short_id TEXT;
    v_count INTEGER;
BEGIN
    IF auth.uid() IS NOT NULL AND auth.role() = 'authenticated' THEN
        IF NOT (
            EXISTS (SELECT 1 FROM public.gm_restaurants WHERE id = p_restaurant_id AND owner_id = auth.uid())
            OR public.is_user_member_of_restaurant(p_restaurant_id)
        ) THEN
            RAISE EXCEPTION 'Access Denied: You are not a member of this restaurant.';
        END IF;
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_cents := v_total_cents + v_item_total;
    END LOOP;

    SELECT count(*) + 1 INTO v_count
    FROM public.gm_orders WHERE restaurant_id = p_restaurant_id;
    v_short_id := '#' || v_count::TEXT;

    INSERT INTO public.gm_orders (restaurant_id, short_id, status, total_cents, payment_status, payment_method, sync_metadata)
    VALUES (p_restaurant_id, v_short_id, 'PENDING', v_total_cents, 'PENDING', p_payment_method, p_sync_metadata)
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.gm_order_items (order_id, product_id, name_snapshot, quantity, price_snapshot, subtotal_cents)
        VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'name',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::INTEGER,
            (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER
        );
    END LOOP;

    -- Audit (AUDIT_LOG_SPEC): apenas quando há actor (utilizador autenticado)
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'ORDER_CREATED',
            'order',
            v_order_id::text,
            jsonb_build_object('short_id', v_short_id, 'total_cents', v_total_cents),
            'order_created',
            'user',
            'success'
        );
    END IF;

    RETURN jsonb_build_object('id', v_order_id, 'short_id', v_short_id, 'total_cents', v_total_cents, 'status', 'PENDING');
END;
$$;

-- ==============================================================================
-- 2. process_order_payment — audit após pagamento registado (AUDIT_LOG_SPEC payment_recorded)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_order_payment(
        p_restaurant_id UUID,
        p_order_id UUID,
        p_cash_register_id UUID,
        p_operator_id UUID,
        p_amount_cents INTEGER,
        p_method TEXT,
        p_idempotency_key TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_order_status TEXT;
    v_order_total INTEGER;
    v_register_status TEXT;
    v_total_paid INTEGER := 0;
    v_new_total_paid INTEGER;
    v_payment_status TEXT;
    v_order_payment_status TEXT;
    v_payment_id UUID;
BEGIN
    SELECT status INTO v_register_status
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id
        AND restaurant_id = p_restaurant_id;

    IF v_register_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register not found');
    END IF;

    IF v_register_status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register must be OPEN to process payments');
    END IF;

    SELECT status, total_cents INTO v_order_status, v_order_total
    FROM public.gm_orders
    WHERE id = p_order_id
        AND restaurant_id = p_restaurant_id
    FOR UPDATE;

    IF v_order_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    IF v_order_status IN ('paid', 'cancelled') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is already final (' || v_order_status || ')');
    END IF;

    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
    FROM public.gm_payments
    WHERE order_id = p_order_id
        AND status = 'paid';

    v_new_total_paid := v_total_paid + p_amount_cents;

    IF v_new_total_paid > v_order_total THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment amount (' || p_amount_cents || ') exceeds remaining balance (' || (v_order_total - v_total_paid) || ')');
    END IF;

    INSERT INTO public.gm_payments (
            tenant_id, restaurant_id, order_id, cash_register_id, operator_id,
            amount_cents, currency, payment_method, status, idempotency_key, created_at
        )
    VALUES (
            p_restaurant_id, p_restaurant_id, p_order_id, p_cash_register_id, p_operator_id,
            p_amount_cents, 'EUR', p_method, 'paid', p_idempotency_key, NOW()
        )
    RETURNING id INTO v_payment_id;

    IF v_new_total_paid >= v_order_total THEN
        v_order_payment_status := 'paid';
        v_order_status := 'paid';
    ELSE
        v_order_payment_status := 'partially_paid';
        v_order_status := 'OPEN';
    END IF;

    UPDATE public.gm_orders
    SET status = v_order_status, payment_status = v_order_payment_status,
        version = version + 1, updated_at = NOW()
    WHERE id = p_order_id;

    UPDATE public.gm_cash_registers
    SET total_sales_cents = COALESCE(total_sales_cents, 0) + p_amount_cents, updated_at = NOW()
    WHERE id = p_cash_register_id;

    PERFORM public.fn_log_payment_attempt(
        p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method,
        'success', NULL, NULL, p_idempotency_key, NULL, NULL, NULL
    );

    -- Audit (AUDIT_LOG_SPEC payment_recorded)
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'PAYMENT_RECORDED',
            'payment',
            v_payment_id::text,
            jsonb_build_object('order_id', p_order_id, 'amount_cents', p_amount_cents, 'method', p_method),
            'payment_recorded',
            'user',
            'success'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_id', v_payment_id,
        'payment_status', v_order_payment_status,
        'total_paid', v_new_total_paid,
        'remaining', v_order_total - v_new_total_paid
    );

EXCEPTION
    WHEN unique_violation THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method,
            'fail', 'IDEMPOTENCY', 'Duplicate Transaction', p_idempotency_key
        );
        RETURN jsonb_build_object('success', false, 'error', 'Duplicate transaction (Idempotency Key used)');
    WHEN OTHERS THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method,
            'fail', 'UNKNOWN', SQLERRM, p_idempotency_key
        );
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ==============================================================================
-- 3. admin_disable_staff_member — audit em gm_audit_logs além de app_logs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_disable_staff_member(
    p_target_user_id UUID,
    p_restaurant_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT;
    v_target_role TEXT;
    v_active_owners_count BIGINT;
BEGIN
    SELECT role INTO v_caller_role
    FROM public.gm_restaurant_members m
    WHERE m.restaurant_id = p_restaurant_id AND m.user_id = v_caller_id AND m.disabled_at IS NULL;

    IF v_caller_role IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
    END IF;

    IF p_target_user_id = v_caller_id THEN
        RETURN jsonb_build_object('ok', false, 'error', 'CANNOT_DISABLE_SELF');
    END IF;

    SELECT role INTO v_target_role
    FROM public.gm_restaurant_members
    WHERE restaurant_id = p_restaurant_id AND user_id = p_target_user_id AND disabled_at IS NULL;

    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'TARGET_NOT_MEMBER');
    END IF;

    IF v_caller_role = 'manager' AND v_target_role IN ('owner', 'manager') THEN
        RETURN jsonb_build_object('ok', false, 'error', 'MANAGER_CANNOT_DISABLE_OWNER_OR_MANAGER');
    END IF;

    IF v_target_role = 'owner' THEN
        SELECT count(*) INTO v_active_owners_count
        FROM public.gm_restaurant_members
        WHERE restaurant_id = p_restaurant_id AND role = 'owner' AND disabled_at IS NULL;
        IF v_active_owners_count <= 1 THEN
            RETURN jsonb_build_object('ok', false, 'error', 'CANNOT_DISABLE_LAST_OWNER');
        END IF;
    END IF;

    UPDATE public.gm_restaurant_members
    SET disabled_at = now(), updated_at = now()
    WHERE restaurant_id = p_restaurant_id AND user_id = p_target_user_id AND disabled_at IS NULL;

    INSERT INTO public.app_logs (level, message, details, restaurant_id)
    VALUES (
        'info', 'user_disabled',
        jsonb_build_object('action', 'user_disabled', 'target_user_id', p_target_user_id, 'restaurant_id', p_restaurant_id, 'performed_by', v_caller_id, 'reason', coalesce(p_reason, '')),
        p_restaurant_id
    );

    INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
    VALUES (
        p_restaurant_id,
        v_caller_id,
        'USER_DISABLED',
        'member',
        p_target_user_id::text,
        jsonb_build_object('reason', coalesce(p_reason, '')),
        'user_disabled',
        'user',
        'success'
    );

    RETURN jsonb_build_object('ok', true, 'updated', true);
END;
$$;

-- ==============================================================================
-- 4. admin_reenable_staff_member — audit em gm_audit_logs além de app_logs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_reenable_staff_member(
    p_target_user_id UUID,
    p_restaurant_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_owner_or_manager BOOLEAN;
    v_updated BIGINT;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.gm_restaurant_members m
        WHERE m.restaurant_id = p_restaurant_id
          AND m.user_id = v_caller_id
          AND m.role IN ('owner', 'manager')
          AND m.disabled_at IS NULL
    ) INTO v_is_owner_or_manager;

    IF NOT v_is_owner_or_manager THEN
        RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
    END IF;

    UPDATE public.gm_restaurant_members
    SET disabled_at = NULL, updated_at = now()
    WHERE restaurant_id = p_restaurant_id
      AND user_id = p_target_user_id
      AND disabled_at IS NOT NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    INSERT INTO public.app_logs (level, message, details, restaurant_id)
    VALUES (
        'info',
        'user_reenabled',
        jsonb_build_object(
            'action', 'user_reenabled',
            'target_user_id', p_target_user_id,
            'restaurant_id', p_restaurant_id,
            'performed_by', v_caller_id,
            'reason', coalesce(p_reason, '')
        ),
        p_restaurant_id
    );

    INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
    VALUES (
        p_restaurant_id,
        v_caller_id,
        'USER_REENABLED',
        'member',
        p_target_user_id::text,
        jsonb_build_object('reason', coalesce(p_reason, '')),
        'user_reenabled',
        'user',
        'success'
    );

    RETURN jsonb_build_object('ok', true, 'updated', (v_updated > 0));
END;
$$;

COMMENT ON FUNCTION public.create_order_atomic(UUID, JSONB, TEXT, JSONB) IS
  'Cria pedido atómico. Audit: order_created em gm_audit_logs quando actor autenticado.';
COMMENT ON FUNCTION public.process_order_payment(UUID, UUID, UUID, UUID, INTEGER, TEXT, TEXT) IS
  'Regista pagamento. Audit: payment_recorded em gm_audit_logs (AUDIT_LOG_SPEC).';
COMMENT ON FUNCTION public.admin_disable_staff_member(UUID, UUID, TEXT) IS
  'Desativa membro (kill switch). Audit: app_logs + gm_audit_logs user_disabled.';
COMMENT ON FUNCTION public.admin_reenable_staff_member(UUID, UUID, TEXT) IS
  'Reativa membro. Audit: app_logs + gm_audit_logs user_reenabled.';
;
