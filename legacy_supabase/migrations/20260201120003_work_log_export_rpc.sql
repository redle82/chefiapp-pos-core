-- Onda 2 · B1 — Export de work log (formato WORK_LOG_EXPORT + EXPORT_FORMATS v1).
-- RPC get_work_log_export: JSON com users, shifts, check_ins, tasks; regista export_requested em gm_audit_logs.
-- Ref: docs/architecture/WORK_LOG_EXPORT.md, docs/architecture/EXPORT_FORMATS.md

CREATE OR REPLACE FUNCTION public.get_work_log_export(
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
    v_export_id UUID := gen_random_uuid();
    v_generated_at TIMESTAMPTZ := now();
    v_result JSONB;
    v_users JSONB;
    v_shifts JSONB;
    v_check_ins JSONB;
BEGIN
    -- Apenas owner ou membro ativo (WORK_LOG_EXPORT: responsável por tenant)
    IF NOT (
        EXISTS (SELECT 1 FROM public.gm_restaurants r WHERE r.id = p_restaurant_id AND r.owner_id = auth.uid())
        OR public.is_user_member_of_restaurant(p_restaurant_id)
    ) THEN
        RAISE EXCEPTION 'Access Denied: You are not a member of this restaurant.';
    END IF;

    IF p_from IS NULL OR p_to IS NULL THEN
        RAISE EXCEPTION 'Period required: p_from and p_to must be set.';
    END IF;

    IF p_from > p_to THEN
        RAISE EXCEPTION 'Invalid period: p_from must be <= p_to.';
    END IF;

    -- Users: utilizadores com atividade (turn_sessions) no período
    SELECT COALESCE(
        jsonb_agg(jsonb_build_object(
            'user_id', u.user_id,
            'role', u.role
        )),
        '[]'::jsonb
    ) INTO v_users
    FROM (
        SELECT DISTINCT t.user_id, m.role
        FROM public.turn_sessions t
        JOIN public.gm_restaurant_members m
          ON m.restaurant_id = t.restaurant_id AND m.user_id = t.user_id AND m.disabled_at IS NULL
        WHERE t.restaurant_id = p_restaurant_id
          AND t.started_at >= p_from
          AND t.started_at <= p_to
    ) u;

    -- Shifts: turnos no período (turn_sessions = check-in/check-out)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'shift_id', t.id,
                'user_id', t.user_id,
                'start', t.started_at,
                'end', t.ended_at,
                'status', t.status::text,
                'role_at_turn', t.role_at_turn,
                'operational_mode', t.operational_mode::text,
                'device_id', t.device_id
            )
            ORDER BY t.started_at
        ),
        '[]'::jsonb
    ) INTO v_shifts
    FROM public.turn_sessions t
    WHERE t.restaurant_id = p_restaurant_id
      AND t.started_at >= p_from
      AND t.started_at <= p_to;

    -- Check-ins: eventos check_in (started_at) e check_out (ended_at) no período
    SELECT COALESCE(
        jsonb_agg(ev ORDER BY (ev->>'timestamp')),
        '[]'::jsonb
    ) INTO v_check_ins
    FROM (
        SELECT jsonb_build_object(
            'event_type', 'check_in',
            'user_id', t.user_id,
            'timestamp', t.started_at,
            'session_id', t.id
        ) AS ev
        FROM public.turn_sessions t
        WHERE t.restaurant_id = p_restaurant_id
          AND t.started_at >= p_from
          AND t.started_at <= p_to
        UNION ALL
        SELECT jsonb_build_object(
            'event_type', 'check_out',
            'user_id', t.user_id,
            'timestamp', t.ended_at,
            'session_id', t.id
        ) AS ev
        FROM public.turn_sessions t
        WHERE t.restaurant_id = p_restaurant_id
          AND t.started_at >= p_from
          AND t.started_at <= p_to
          AND t.ended_at IS NOT NULL
    ) sub(ev);

    v_result := jsonb_build_object(
        'schema_version', 'work_log_v1',
        'tenant_id', p_restaurant_id,
        'period', jsonb_build_object('start', p_from, 'end', p_to),
        'generated_at', v_generated_at,
        'export_id', v_export_id,
        'users', v_users,
        'shifts', v_shifts,
        'check_ins', v_check_ins,
        'tasks', '[]'::jsonb
    );

    -- Audit: registar pedido de export (AUDIT_LOG_SPEC export_requested)
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'EXPORT_REQUESTED',
            'work_log',
            v_export_id::text,
            jsonb_build_object(
                'export_type', 'work_log',
                'period_start', p_from,
                'period_end', p_to,
                'format', 'json',
                'export_id', v_export_id
            ),
            'export_requested',
            'user',
            'success'
        );
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_work_log_export(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
  'Export work log (turnos, check-in/check-out) em JSON v1. Conforme WORK_LOG_EXPORT e EXPORT_FORMATS. Regista export_requested em gm_audit_logs.';
