-- 20260302000000_phase4_admin_hardening.sql
-- Purpose: Close all remaining RLS policy gaps and normalize SECURITY DEFINER functions.
-- Phase 4 of the Sovereign Kernel Data Layer transformation.

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Close tenant table policy gaps (4 tables with restaurant_id)
-- ═══════════════════════════════════════════════════════════════════════════

DO $p1$
DECLARE
    t TEXT;
    tenant_tables TEXT[] := ARRAY[
        'gm_menu_categories', 'gm_product_bom', 'gm_staff', 'gm_terminals'
    ];
BEGIN
    FOREACH t IN ARRAY tenant_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "sovereign_tenant_isolation" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "sovereign_tenant_isolation" ON public.%I FOR ALL USING (has_restaurant_access(restaurant_id));', t);
    END LOOP;
END $p1$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Lock down system/infra tables (deny all via RLS, service_role bypasses)
-- ═══════════════════════════════════════════════════════════════════════════

DO $p2$
DECLARE
    t TEXT;
    system_tables TEXT[] := ARRAY[
        'event_store', 'legal_seals', 'saas_tenants', 'webhook_events'
    ];
BEGIN
    FOREACH t IN ARRAY system_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "system_service_role_only" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "system_service_role_only" ON public.%I FOR ALL USING (false);', t);
    END LOOP;
END $p2$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: Normalize search_path for all remaining SECURITY DEFINER functions
-- ═══════════════════════════════════════════════════════════════════════════

DO $p3$
BEGIN
    EXECUTE 'ALTER FUNCTION public.get_shift_history(uuid, timestamp with time zone, timestamp with time zone) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.mark_item_ready(uuid, uuid) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.mark_webhook_processed(uuid, character varying) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.open_cash_register_atomic(uuid, text, text, bigint) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.process_inventory_deduction(uuid) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.process_order_payment(uuid, uuid, uuid, text, integer, uuid, text) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.process_split_payment_atomic(uuid, uuid, uuid, text, integer, uuid, text) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.process_webhook_event(character varying, character varying, character varying, jsonb, character varying) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.reject_task(uuid, text, uuid, uuid) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.rls_auto_enable() SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.simulate_order_stock_impact(uuid, jsonb) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.start_task(uuid, uuid, uuid) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.update_order_from_payment_event(uuid, character varying, bigint) SET search_path = public';
    EXECUTE 'ALTER FUNCTION public.update_order_status(uuid, uuid, text) SET search_path = public';
END $p3$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: Admin safeguard — Last-owner lockout prevention
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_disable_staff_member(
    p_restaurant_id uuid,
    p_member_id uuid
) RETURNS jsonb AS $function$
DECLARE
    v_target_role text;
    v_active_owners int;
BEGIN
    -- Verify caller has access
    IF NOT has_restaurant_access(p_restaurant_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'ACCESS_DENIED');
    END IF;

    -- Get the target member role
    SELECT role INTO v_target_role
    FROM public.gm_restaurant_members
    WHERE id = p_member_id AND restaurant_id = p_restaurant_id AND disabled_at IS NULL;

    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'MEMBER_NOT_FOUND_OR_ALREADY_DISABLED');
    END IF;

    -- If disabling an owner, check for last-owner lockout
    IF v_target_role = 'owner' THEN
        SELECT COUNT(*) INTO v_active_owners
        FROM public.gm_restaurant_members
        WHERE restaurant_id = p_restaurant_id
        AND role = 'owner'
        AND disabled_at IS NULL
        AND id != p_member_id;

        IF v_active_owners = 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'LAST_OWNER_LOCKOUT', 'message', 'Cannot disable the last active owner');
        END IF;
    END IF;

    -- Perform the disable
    UPDATE public.gm_restaurant_members
    SET disabled_at = now()
    WHERE id = p_member_id AND restaurant_id = p_restaurant_id;

    RETURN jsonb_build_object('success', true, 'disabled_member_id', p_member_id);
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
