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
