-- 20260228100000_add_staff_disable_and_audit.sql
-- Incident Playbook: Dispositivo roubado — kill switch por membro + audit trail.
-- - Coluna disabled_at em gm_restaurant_members
-- - Helpers RLS passam a considerar apenas membros ativos (disabled_at IS NULL)
-- - RPCs admin_disable_staff_member / admin_reenable_staff_member + app_logs

-- ==============================================================================
-- 1. Coluna disabled_at em gm_restaurant_members
-- ==============================================================================
ALTER TABLE public.gm_restaurant_members
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.gm_restaurant_members.disabled_at IS
  'When set, member is excluded from RLS (stolen device / block staff).';

-- ==============================================================================
-- 2. Helpers RLS: considerar apenas membros ativos
-- ==============================================================================

-- user_restaurant_ids() — usado em gm_orders e outras policies
CREATE OR REPLACE FUNCTION public.user_restaurant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT restaurant_id
    FROM public.gm_restaurant_members
    WHERE user_id = auth.uid()
      AND disabled_at IS NULL;
$$;

-- get_user_restaurant_id()
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT restaurant_id
    FROM public.gm_restaurant_members
    WHERE user_id = auth.uid()
      AND disabled_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1;
$$;

-- get_user_restaurants()
CREATE OR REPLACE FUNCTION public.get_user_restaurants()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT restaurant_id
    FROM public.gm_restaurant_members
    WHERE user_id = auth.uid()
      AND disabled_at IS NULL;
$$;

-- is_user_member_of_restaurant(p_restaurant_id)
CREATE OR REPLACE FUNCTION public.is_user_member_of_restaurant(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.gm_restaurant_members
        WHERE user_id = auth.uid()
          AND restaurant_id = p_restaurant_id
          AND disabled_at IS NULL
    );
$$;

-- ==============================================================================
-- 3. RPC: admin_disable_staff_member (owner/manager only, audit em app_logs)
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
    v_is_owner_or_manager BOOLEAN;
    v_updated BIGINT;
BEGIN
    -- Apenas owner ou manager do restaurante podem desativar
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

    -- Não permitir desativar a si mesmo se for o único owner
    IF p_target_user_id = v_caller_id THEN
        RETURN jsonb_build_object('ok', false, 'error', 'CANNOT_DISABLE_SELF');
    END IF;

    UPDATE public.gm_restaurant_members
    SET disabled_at = now(), updated_at = now()
    WHERE restaurant_id = p_restaurant_id
      AND user_id = p_target_user_id
      AND disabled_at IS NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    -- Audit: app_logs (service_role ou inserção com details contendo user_id)
    INSERT INTO public.app_logs (level, message, details, restaurant_id)
    VALUES (
        'info',
        'user_disabled',
        jsonb_build_object(
            'action', 'user_disabled',
            'target_user_id', p_target_user_id,
            'restaurant_id', p_restaurant_id,
            'performed_by', v_caller_id,
            'reason', coalesce(p_reason, '')
        ),
        p_restaurant_id
    );

    RETURN jsonb_build_object('ok', true, 'updated', (v_updated > 0));
END;
$$;

COMMENT ON FUNCTION public.admin_disable_staff_member(UUID, UUID, TEXT) IS
  'Incident playbook: disable staff member (stolen device). Owner/manager only. Audit in app_logs.';

-- ==============================================================================
-- 4. RPC: admin_reenable_staff_member (owner/manager only, audit em app_logs)
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

    RETURN jsonb_build_object('ok', true, 'updated', (v_updated > 0));
END;
$$;

COMMENT ON FUNCTION public.admin_reenable_staff_member(UUID, UUID, TEXT) IS
  'Incident playbook: re-enable staff member after recovery. Owner/manager only. Audit in app_logs.';
;
-- 20260228110000_disabled_at_policies_and_rpc_hardening.sql
-- Validação incident playbook: garantir que disabled_at é aplicado em todas as rotas sensíveis
-- e que os RPCs admin_disable/reenable estão blindados (manager só staff, nunca último owner).

-- ==============================================================================
-- 1. gm_restaurant_members: policies exigem membro ATIVO (disabled_at IS NULL)
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view members of their restaurants" ON public.gm_restaurant_members;
CREATE POLICY "Users can view members of their restaurants" ON public.gm_restaurant_members
FOR SELECT USING (
    restaurant_id IN (SELECT public.get_user_restaurants())
);

DROP POLICY IF EXISTS "Owners can manage members" ON public.gm_restaurant_members;
CREATE POLICY "Owners can manage members" ON public.gm_restaurant_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.gm_restaurant_members m
        WHERE m.restaurant_id = gm_restaurant_members.restaurant_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
          AND m.disabled_at IS NULL
    )
);

-- ==============================================================================
-- 2. Hardening audit (cash_registers, orders delete): EXISTS com disabled_at IS NULL
-- ==============================================================================

DROP POLICY IF EXISTS "users_modify_own_restaurant_cash_registers" ON public.gm_cash_registers;
CREATE POLICY "users_modify_own_restaurant_cash_registers"
    ON public.gm_cash_registers FOR ALL
    USING (
        restaurant_id IN (SELECT public.user_restaurant_ids())
        AND EXISTS (
             SELECT 1 FROM public.gm_restaurant_members m
             WHERE m.user_id = auth.uid()
               AND m.restaurant_id = public.gm_cash_registers.restaurant_id
               AND m.role IN ('owner', 'manager')
               AND m.disabled_at IS NULL
        )
    );

DROP POLICY IF EXISTS "managers_delete_own_restaurant_orders" ON public.gm_orders;
CREATE POLICY "managers_delete_own_restaurant_orders"
    ON public.gm_orders FOR DELETE
    USING (
        restaurant_id IN (SELECT public.user_restaurant_ids())
        AND EXISTS (
             SELECT 1 FROM public.gm_restaurant_members m
             WHERE m.user_id = auth.uid()
               AND m.restaurant_id = public.gm_orders.restaurant_id
               AND m.role IN ('owner', 'manager')
               AND m.disabled_at IS NULL
        )
    );

-- ==============================================================================
-- 3. fix_staff_rls (gm_orders, gm_order_items, integration_orders): AND disabled_at IS NULL
-- ==============================================================================

DROP POLICY IF EXISTS "Staff can manage orders" ON public.gm_orders;
CREATE POLICY "Staff can manage orders" ON public.gm_orders FOR ALL USING (
    auth.uid() IN (
        SELECT r.owner_id FROM public.gm_restaurants r WHERE r.id = gm_orders.restaurant_id
    )
    OR EXISTS (
        SELECT 1 FROM public.gm_restaurant_members rm
        WHERE rm.restaurant_id = gm_orders.restaurant_id
          AND rm.user_id = auth.uid()
          AND rm.disabled_at IS NULL
    )
);

DROP POLICY IF EXISTS "Staff can manage order items" ON public.gm_order_items;
CREATE POLICY "Staff can manage order items" ON public.gm_order_items FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.gm_orders o
        JOIN public.gm_restaurants r ON r.id = o.restaurant_id
        LEFT JOIN public.gm_restaurant_members rm ON rm.restaurant_id = r.id AND rm.disabled_at IS NULL
        WHERE o.id = gm_order_items.order_id
          AND (r.owner_id = auth.uid() OR rm.user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Staff can view integration orders" ON public.integration_orders;
CREATE POLICY "Staff can view integration orders" ON public.integration_orders
FOR SELECT USING (
    restaurant_id IN (SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.gm_restaurant_members rm
        WHERE rm.restaurant_id = integration_orders.restaurant_id
          AND rm.user_id = auth.uid()
          AND rm.disabled_at IS NULL
    )
);

-- ==============================================================================
-- 4. turn_sessions: policies e start_turn RPC com disabled_at IS NULL
-- ==============================================================================

DROP POLICY IF EXISTS "Managers can view all sessions for their restaurant" ON public.turn_sessions;
CREATE POLICY "Managers can view all sessions for their restaurant" ON public.turn_sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.gm_restaurant_members m
        WHERE m.user_id = auth.uid()
          AND m.restaurant_id = public.turn_sessions.restaurant_id
          AND m.role IN ('owner', 'manager')
          AND m.disabled_at IS NULL
    )
);

-- start_turn: checar membro ativo (disabled_at IS NULL) e tower apenas owner/manager ativos
CREATE OR REPLACE FUNCTION public.start_turn(
    p_restaurant_id uuid,
    p_operational_mode operational_mode,
    p_device_id text,
    p_device_name text,
    p_role_at_turn text,
    p_permissions_snapshot jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_session_id uuid;
    v_user_role text;
    v_new_session_id uuid;
BEGIN
    IF p_operational_mode = 'tower' THEN
        SELECT role INTO v_user_role
        FROM public.gm_restaurant_members
        WHERE user_id = auth.uid() AND restaurant_id = p_restaurant_id AND disabled_at IS NULL;

        IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'manager') THEN
            RETURN jsonb_build_object('success', false, 'error', 'TOWER_MODE_FORBIDDEN');
        END IF;
    END IF;

    SELECT id INTO v_existing_session_id
    FROM public.turn_sessions
    WHERE user_id = auth.uid() AND device_id = p_device_id AND status = 'active'
    LIMIT 1;

    IF v_existing_session_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'session_id', v_existing_session_id, 'resumed', true);
    END IF;

    IF NOT public.is_user_member_of_restaurant(p_restaurant_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_MEMBER');
    END IF;

    INSERT INTO public.turn_sessions (
        restaurant_id, user_id, role_at_turn, operational_mode,
        device_id, device_name, permissions_snapshot, status
    ) VALUES (
        p_restaurant_id, auth.uid(), p_role_at_turn, p_operational_mode,
        p_device_id, p_device_name, p_permissions_snapshot, 'active'
    ) RETURNING id INTO v_new_session_id;

    RETURN jsonb_build_object('success', true, 'session_id', v_new_session_id, 'resumed', false);
END;
$$;

-- ==============================================================================
-- 5. secure_rpcs: create_order_atomic e process_order_payment usam membro ATIVO
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

    RETURN jsonb_build_object('id', v_order_id, 'short_id', v_short_id, 'total_cents', v_total_cents, 'status', 'PENDING');
END;
$$;

-- process_order_payment: security check usa is_user_member_of_restaurant (membro ativo).
-- Nota: Se a função tiver sido alterada por outras migrations, o body completo pode divergir.
-- O importante é que o check de autorização use owner OU is_user_member_of_restaurant(p_restaurant_id).
-- A migration 20260114224500_secure_rpcs.sql define process_order_payment com EXISTS em gm_restaurant_members
-- sem disabled_at; ao aplicar esta migration, create_order_atomic já está corrigido.
-- Para process_order_payment: recomenda-se recriar a função com o mesmo body mas trocando o bloco
-- "IF NOT EXISTS (SELECT 1 FROM gm_restaurant_members...)" por
-- "IF NOT (EXISTS (owner) OR is_user_member_of_restaurant(p_restaurant_id)) THEN RAISE".

-- ==============================================================================
-- 6. RPC admin_disable_staff_member: blindado (manager só staff; nunca último owner)
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
    -- Caller must be active owner or manager of this restaurant
    SELECT role INTO v_caller_role
    FROM public.gm_restaurant_members m
    WHERE m.restaurant_id = p_restaurant_id AND m.user_id = v_caller_id AND m.disabled_at IS NULL;

    IF v_caller_role IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
    END IF;

    IF p_target_user_id = v_caller_id THEN
        RETURN jsonb_build_object('ok', false, 'error', 'CANNOT_DISABLE_SELF');
    END IF;

    -- Target must be a member of this restaurant
    SELECT role INTO v_target_role
    FROM public.gm_restaurant_members
    WHERE restaurant_id = p_restaurant_id AND user_id = p_target_user_id AND disabled_at IS NULL;

    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'TARGET_NOT_MEMBER');
    END IF;

    -- Manager can only disable staff (not owner, not manager)
    IF v_caller_role = 'manager' AND v_target_role IN ('owner', 'manager') THEN
        RETURN jsonb_build_object('ok', false, 'error', 'MANAGER_CANNOT_DISABLE_OWNER_OR_MANAGER');
    END IF;

    -- Never disable the last active owner
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

    RETURN jsonb_build_object('ok', true, 'updated', true);
END;
$$;

COMMENT ON FUNCTION public.admin_disable_staff_member(UUID, UUID, TEXT) IS
  'Incident playbook: disable staff. Manager only disables staff; owner can disable manager/staff. Never disable last owner.';
;
-- Onda 3 · E2 — Reaplicar validação de entrada + audit após 20260228110000 (hardening).
-- A migração 20260228110000 redefiniu create_order_atomic sem audit; esta restaura validação + audit.
-- Ref: docs/architecture/THREAT_MODEL.md, RATE_LIMITING_AND_INPUT_VALIDATION.md

-- ==============================================================================
-- 1. create_order_atomic — validação + autorização + audit
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
    v_idx INT;
    v_len INT;
BEGIN
    -- E2: Input validation (OWASP 5.1.x)
    IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' THEN
        RAISE EXCEPTION 'Invalid input: p_items must be a non-null JSON array.';
    END IF;
    v_len := jsonb_array_length(p_items);
    IF v_len < 1 OR v_len > 500 THEN
        RAISE EXCEPTION 'Invalid input: p_items must have between 1 and 500 elements, got %.', v_len;
    END IF;
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_idx := v_idx + 1;
        IF v_item->>'product_id' IS NULL OR v_item->>'product_id' = '' THEN
            RAISE EXCEPTION 'Invalid input: item % missing or empty product_id.', v_idx;
        END IF;
        IF v_item->>'name' IS NULL OR length(trim(v_item->>'name')) < 1 OR length(v_item->>'name') > 500 THEN
            RAISE EXCEPTION 'Invalid input: item % name must be 1-500 chars.', v_idx;
        END IF;
        IF v_item->>'quantity' IS NULL OR v_item->>'quantity' = '' OR v_item->>'quantity' !~ '^[0-9]+$' OR (v_item->>'quantity')::INTEGER < 1 OR (v_item->>'quantity')::INTEGER > 9999 THEN
            RAISE EXCEPTION 'Invalid input: item % quantity must be integer 1-9999.', v_idx;
        END IF;
        IF v_item->>'unit_price' IS NULL OR v_item->>'unit_price' = '' OR v_item->>'unit_price' !~ '^[0-9]+$' OR (v_item->>'unit_price')::INTEGER < 0 THEN
            RAISE EXCEPTION 'Invalid input: item % unit_price must be non-negative integer.', v_idx;
        END IF;
    END LOOP;
    IF p_payment_method IS NULL OR p_payment_method NOT IN ('cash', 'card', 'other', 'split') THEN
        RAISE EXCEPTION 'Invalid input: p_payment_method must be one of cash, card, other, split.';
    END IF;

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

COMMENT ON FUNCTION public.create_order_atomic(UUID, JSONB, TEXT, JSONB) IS
  'E2 Onda 3: input validation + audit. THREAT_MODEL mitigation.';
;
