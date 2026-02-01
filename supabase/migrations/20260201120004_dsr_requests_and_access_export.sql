-- Onda 2 · C1 + C3 — Registo de pedidos DSR e export de acesso (dados do titular).
-- Tabela gm_dsr_requests; RPC get_dsr_access_export (acesso/portabilidade); RPC create_dsr_request (registo).
-- Ref: docs/architecture/DATA_SUBJECT_REQUESTS.md

-- ==============================================================================
-- 1. Tabela gm_dsr_requests (C3: rastreabilidade para DPO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gm_dsr_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN (
        'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
    )),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'rejected'
    )),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deadline_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gm_dsr_requests IS 'Pedidos do titular (DSR) — registo para DPO e auditoria. DATA_SUBJECT_REQUESTS.';

CREATE INDEX IF NOT EXISTS idx_dsr_requests_tenant_status
    ON public.gm_dsr_requests(tenant_id, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_dsr_requests_subject
    ON public.gm_dsr_requests(tenant_id, subject_id);

ALTER TABLE public.gm_dsr_requests ENABLE ROW LEVEL SECURITY;

-- Apenas owner/manager do restaurante podem ver e criar pedidos DSR
CREATE POLICY "Owner/manager can manage DSR requests"
    ON public.gm_dsr_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.gm_restaurant_members m
            WHERE m.restaurant_id = gm_dsr_requests.tenant_id
              AND m.user_id = auth.uid()
              AND m.role IN ('owner', 'manager')
              AND m.disabled_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gm_restaurant_members m
            WHERE m.restaurant_id = gm_dsr_requests.tenant_id
              AND m.user_id = auth.uid()
              AND m.role IN ('owner', 'manager')
              AND m.disabled_at IS NULL
        )
    );

-- ==============================================================================
-- 2. RPC get_dsr_access_export (C1: acesso / portabilidade — dados do titular)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_dsr_access_export(
    p_restaurant_id UUID,
    p_subject_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_export_id UUID := gen_random_uuid();
    v_generated_at TIMESTAMPTZ := now();
    v_membership JSONB;
    v_shifts JSONB;
    v_check_ins JSONB;
    v_result JSONB;
    v_request_id UUID;
BEGIN
    -- Apenas owner ou manager do restaurante
    IF NOT (
        EXISTS (SELECT 1 FROM public.gm_restaurants r WHERE r.id = p_restaurant_id AND r.owner_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.gm_restaurant_members m
            WHERE m.restaurant_id = p_restaurant_id AND m.user_id = auth.uid()
              AND m.role IN ('owner', 'manager') AND m.disabled_at IS NULL
        )
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only owner or manager can request DSR access export.';
    END IF;

    -- Titular deve ser membro do restaurante
    IF NOT EXISTS (
        SELECT 1 FROM public.gm_restaurant_members m
        WHERE m.restaurant_id = p_restaurant_id AND m.user_id = p_subject_user_id
    ) THEN
        RAISE EXCEPTION 'Subject is not a member of this restaurant.';
    END IF;

    -- Dados de membresia (dados mínimos do titular neste tenant)
    SELECT COALESCE(
        jsonb_agg(jsonb_build_object(
            'user_id', m.user_id,
            'restaurant_id', m.restaurant_id,
            'role', m.role,
            'created_at', m.created_at,
            'updated_at', m.updated_at,
            'disabled_at', m.disabled_at
        )),
        '[]'::jsonb
    ) INTO v_membership
    FROM public.gm_restaurant_members m
    WHERE m.restaurant_id = p_restaurant_id AND m.user_id = p_subject_user_id;

    -- Turnos do titular neste restaurante (sem limite temporal para acesso completo)
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
    WHERE t.restaurant_id = p_restaurant_id AND t.user_id = p_subject_user_id;

    -- Check-in/check-out do titular
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
        WHERE t.restaurant_id = p_restaurant_id AND t.user_id = p_subject_user_id
        UNION ALL
        SELECT jsonb_build_object(
            'event_type', 'check_out',
            'user_id', t.user_id,
            'timestamp', t.ended_at,
            'session_id', t.id
        ) AS ev
        FROM public.turn_sessions t
        WHERE t.restaurant_id = p_restaurant_id AND t.user_id = p_subject_user_id
          AND t.ended_at IS NOT NULL
    ) sub(ev);

    v_result := jsonb_build_object(
        'schema_version', 'dsr_access_v1',
        'tenant_id', p_restaurant_id,
        'subject_id', p_subject_user_id,
        'generated_at', v_generated_at,
        'export_id', v_export_id,
        'membership', v_membership,
        'shifts', v_shifts,
        'check_ins', v_check_ins
    );

    -- Registo do pedido DSR (C3)
    INSERT INTO public.gm_dsr_requests (
        tenant_id, subject_id, request_type, status,
        requested_by, completed_at, metadata
    ) VALUES (
        p_restaurant_id, p_subject_user_id, 'access', 'completed',
        auth.uid(), v_generated_at,
        jsonb_build_object('export_id', v_export_id, 'format', 'json')
    ) RETURNING id INTO v_request_id;

    -- Audit
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'DSR_ACCESS_EXPORT',
            'dsr_request',
            v_request_id::text,
            jsonb_build_object('subject_id', p_subject_user_id, 'export_id', v_export_id),
            'export_requested',
            'user',
            'success'
        );
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_dsr_access_export(UUID, UUID) IS
  'Export de dados do titular (acesso/portabilidade Art. 15/20 RGPD). Apenas owner/manager. Regista em gm_dsr_requests e gm_audit_logs.';

-- ==============================================================================
-- 3. RPC create_dsr_request (registo de pedido para execução manual ou posterior)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_dsr_request(
    p_restaurant_id UUID,
    p_subject_user_id UUID,
    p_request_type TEXT,
    p_notes TEXT DEFAULT NULL,
    p_deadline_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_deadline TIMESTAMPTZ;
BEGIN
    IF p_request_type IS NULL OR p_request_type NOT IN (
        'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
    ) THEN
        RAISE EXCEPTION 'Invalid request_type.';
    END IF;

    IF NOT (
        EXISTS (SELECT 1 FROM public.gm_restaurants r WHERE r.id = p_restaurant_id AND r.owner_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.gm_restaurant_members m
            WHERE m.restaurant_id = p_restaurant_id AND m.user_id = auth.uid()
              AND m.role IN ('owner', 'manager') AND m.disabled_at IS NULL
        )
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only owner or manager can create DSR requests.';
    END IF;

    v_deadline := COALESCE(p_deadline_at, now() + interval '30 days');

    INSERT INTO public.gm_dsr_requests (
        tenant_id, subject_id, request_type, status,
        requested_by, deadline_at, notes, updated_at
    ) VALUES (
        p_restaurant_id, p_subject_user_id, p_request_type, 'pending',
        auth.uid(), v_deadline, p_notes, now()
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('ok', true, 'id', v_id, 'deadline_at', v_deadline);
END;
$$;

COMMENT ON FUNCTION public.create_dsr_request(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) IS
  'Regista pedido DSR (qualquer tipo). DPO/owner pode depois executar manualmente ou via get_dsr_access_export para acesso.';
