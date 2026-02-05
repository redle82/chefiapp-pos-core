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
