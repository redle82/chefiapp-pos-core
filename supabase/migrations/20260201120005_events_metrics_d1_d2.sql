-- Onda 2 · D1 + D2 — Eventos shift_started/shift_ended (EVENT_TAXONOMY) e RPC métricas operacionais (METRICS_DICTIONARY).
-- Ref: docs/architecture/EVENT_TAXONOMY.md, docs/architecture/METRICS_DICTIONARY.md

-- ==============================================================================
-- D1: shift_started em start_turn
-- ==============================================================================
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

    -- EVENT_TAXONOMY: shift_started
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'SHIFT_STARTED',
            'turn_session',
            v_new_session_id::text,
            jsonb_build_object('device_id', p_device_id, 'operational_mode', p_operational_mode::text),
            'shift_started',
            'user',
            'success'
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'session_id', v_new_session_id, 'resumed', false);
END;
$$;

-- ==============================================================================
-- D1: shift_ended — trigger quando turn_sessions passa a closed/force_closed
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.gm_audit_shift_ended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.status = 'active' AND NEW.status IN ('closed', 'force_closed') THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            NEW.restaurant_id,
            COALESCE(auth.uid(), OLD.user_id),
            'SHIFT_ENDED',
            'turn_session',
            NEW.id::text,
            jsonb_build_object('user_id', OLD.user_id, 'ended_at', NEW.ended_at),
            'shift_ended',
            'user',
            'success'
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_turn_sessions_audit_shift_ended ON public.turn_sessions;
CREATE TRIGGER tr_turn_sessions_audit_shift_ended
    AFTER UPDATE OF status ON public.turn_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.gm_audit_shift_ended();

-- ==============================================================================
-- D2: RPC get_operational_metrics (METRICS_DICTIONARY — por tenant e período)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_operational_metrics(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_orders_created_total BIGINT;
    v_orders_cancelled_total BIGINT;
    v_payments_recorded_total BIGINT;
    v_payments_amount_cents BIGINT;
    v_active_shifts_count BIGINT;
    v_export_requested_count BIGINT;
BEGIN
    IF NOT (
        EXISTS (SELECT 1 FROM public.gm_restaurants r WHERE r.id = p_restaurant_id AND r.owner_id = auth.uid())
        OR public.is_user_member_of_restaurant(p_restaurant_id)
    ) THEN
        RAISE EXCEPTION 'Access Denied: You are not a member of this restaurant.';
    END IF;

    IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
        RAISE EXCEPTION 'Invalid period: p_from and p_to required, p_from <= p_to.';
    END IF;

    SELECT COUNT(*) INTO v_orders_created_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*) INTO v_orders_cancelled_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to
      AND (status = 'cancelled' OR status = 'CANCELLED');

    SELECT COUNT(*), COALESCE(SUM(amount_cents), 0) INTO v_payments_recorded_total, v_payments_amount_cents
    FROM public.gm_payments
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*) INTO v_active_shifts_count
    FROM public.turn_sessions
    WHERE restaurant_id = p_restaurant_id AND status = 'active';

    SELECT COUNT(*) INTO v_export_requested_count
    FROM public.gm_audit_logs
    WHERE tenant_id = p_restaurant_id
      AND event_type = 'export_requested'
      AND created_at >= p_from AND created_at <= p_to;

    RETURN jsonb_build_object(
        'schema_version', 'operational_metrics_v1',
        'tenant_id', p_restaurant_id,
        'period', jsonb_build_object('start', p_from, 'end', p_to),
        'orders_created_total', v_orders_created_total,
        'orders_cancelled_total', v_orders_cancelled_total,
        'payments_recorded_total', v_payments_recorded_total,
        'payments_amount_cents', v_payments_amount_cents,
        'active_shifts_count', v_active_shifts_count,
        'export_requested_count', v_export_requested_count,
        'daily_revenue_cents', v_payments_amount_cents,
        'daily_orders_count', v_orders_created_total,
        'avg_order_value_cents', CASE WHEN v_orders_created_total > 0 THEN (v_payments_amount_cents / v_orders_created_total) ELSE 0 END
    );
END;
$$;

COMMENT ON FUNCTION public.get_operational_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
  'Métricas operacionais por tenant e período (METRICS_DICTIONARY). orders_created_total, payments_recorded_total, active_shifts_count, etc.';
