-- =============================================================================
-- PHASE 3B: RLS for Phase 2 Tables + RPC Role Restrictions
-- =============================================================================
-- Adds RLS policies to gm_refunds and gm_fiscal_documents.
-- Hardens RPC functions with role-based access checks.
--
-- Pattern matches existing RLS from 20260212_fix_tenancy_rls_hardening.sql:
--   - authenticated: has_restaurant_access(restaurant_id)
--   - service_role: full access (BYPASSRLS, but explicit policies for clarity)
--   - anon: NO access to financial tables
--
-- DEPENDS ON: 20260212_auth_roles_jwt.sql (roles + auth functions)
-- DEPENDS ON: 20260212_gm_refunds.sql, 20260212_gm_fiscal_documents.sql
-- =============================================================================

BEGIN;

-- ========================================================================
-- 1. RLS on gm_refunds (conditional — table may not exist yet)
-- ========================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'gm_refunds') THEN
        ALTER TABLE public.gm_refunds ENABLE ROW LEVEL SECURITY;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gm_refunds' AND policyname = 'refunds_select') THEN
            CREATE POLICY "refunds_select" ON public.gm_refunds
                FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gm_refunds' AND policyname = 'refunds_insert_service') THEN
            CREATE POLICY "refunds_insert_service" ON public.gm_refunds
                FOR INSERT TO service_role WITH CHECK (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gm_refunds' AND policyname = 'refunds_update') THEN
            CREATE POLICY "refunds_update" ON public.gm_refunds
                FOR UPDATE TO authenticated
                USING (has_restaurant_access(restaurant_id))
                WITH CHECK (has_restaurant_access(restaurant_id));
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gm_refunds' AND policyname = 'refunds_service') THEN
            CREATE POLICY "refunds_service" ON public.gm_refunds
                FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;

        EXECUTE 'REVOKE ALL ON public.gm_refunds FROM anon';
        RAISE NOTICE 'RLS configured for gm_refunds';
    ELSE
        RAISE NOTICE 'SKIPPED: gm_refunds does not exist yet';
    END IF;
END $$;

-- ========================================================================
-- 2. RLS on gm_fiscal_documents (conditional — table may not exist yet)
-- ========================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'gm_fiscal_documents') THEN
        ALTER TABLE public.gm_fiscal_documents ENABLE ROW LEVEL SECURITY;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gm_fiscal_documents' AND policyname = 'fiscal_docs_select') THEN
            CREATE POLICY "fiscal_docs_select" ON public.gm_fiscal_documents
                FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gm_fiscal_documents' AND policyname = 'fiscal_docs_insert_service') THEN
            CREATE POLICY "fiscal_docs_insert_service" ON public.gm_fiscal_documents
                FOR INSERT TO service_role WITH CHECK (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gm_fiscal_documents' AND policyname = 'fiscal_docs_update') THEN
            CREATE POLICY "fiscal_docs_update" ON public.gm_fiscal_documents
                FOR UPDATE TO authenticated
                USING (has_restaurant_access(restaurant_id))
                WITH CHECK (has_restaurant_access(restaurant_id));
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gm_fiscal_documents' AND policyname = 'fiscal_docs_service') THEN
            CREATE POLICY "fiscal_docs_service" ON public.gm_fiscal_documents
                FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;

        EXECUTE 'REVOKE ALL ON public.gm_fiscal_documents FROM anon';
        RAISE NOTICE 'RLS configured for gm_fiscal_documents';
    ELSE
        RAISE NOTICE 'SKIPPED: gm_fiscal_documents does not exist yet';
    END IF;
END $$;

-- ========================================================================
-- 3. RLS on gm_audit_logs (if not yet enabled)
-- ========================================================================
DO $$
BEGIN
    -- Ensure RLS is on for audit logs
    ALTER TABLE public.gm_audit_logs ENABLE ROW LEVEL SECURITY;

    -- Only if policies don't exist yet
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'gm_audit_logs' AND policyname = 'audit_logs_select'
    ) THEN
        CREATE POLICY "audit_logs_select"
            ON public.gm_audit_logs
            FOR SELECT TO authenticated
            USING (has_restaurant_access(restaurant_id));

        CREATE POLICY "audit_logs_insert_service"
            ON public.gm_audit_logs
            FOR INSERT TO service_role
            WITH CHECK (true);

        CREATE POLICY "audit_logs_service"
            ON public.gm_audit_logs
            FOR ALL TO service_role
            USING (true) WITH CHECK (true);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- gm_audit_logs might not exist yet, skip
    NULL;
END $$;

-- ========================================================================
-- 4. Harden core financial RPCs — require authenticated role
-- ========================================================================

-- Wrapper: check that caller is authenticated before executing financial RPCs
CREATE OR REPLACE FUNCTION public.require_authenticated()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_setting('role', true) = 'anon' THEN
        RAISE EXCEPTION 'AUTH_REQUIRED: This operation requires authentication'
            USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
END;
$$;

-- Wrapper: check caller has specific restaurant role (owner/manager)
CREATE OR REPLACE FUNCTION public.require_restaurant_role(
    p_restaurant_id UUID,
    p_required_roles TEXT[] DEFAULT ARRAY['owner', 'manager']
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- service_role always passes
    IF current_setting('role', true) = 'service_role' THEN
        RETURN;
    END IF;

    -- Check user has required role for this restaurant
    SELECT role INTO v_user_role
    FROM public.restaurant_users
    WHERE user_id = auth.uid()
      AND restaurant_id = p_restaurant_id
      AND deleted_at IS NULL
      AND active = true;

    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'ACCESS_DENIED: No access to restaurant %', p_restaurant_id
            USING ERRCODE = '42501';
    END IF;

    IF v_user_role != ALL(p_required_roles) THEN
        RAISE EXCEPTION 'INSUFFICIENT_ROLE: Requires % but has %',
            array_to_string(p_required_roles, '/'), v_user_role
            USING ERRCODE = '42501';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.require_authenticated() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.require_restaurant_role(UUID, TEXT[]) TO authenticated, service_role;

-- ========================================================================
-- 5. Role-gate refund operations (conditional — create_refund_atomic may not exist)
-- ========================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_refund_atomic'
               AND pronamespace = 'public'::regnamespace) THEN
        -- Wrapper will be created outside DO block
        RAISE NOTICE 'create_refund_atomic exists — request_refund wrapper will be created';
    ELSE
        RAISE NOTICE 'SKIPPED: create_refund_atomic does not exist yet — request_refund wrapper deferred';
    END IF;
END $$;

-- Create request_refund only if create_refund_atomic exists
-- (we use a conditional CREATE via DO block since CREATE FUNCTION can't be inside IF)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_refund_atomic'
               AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE $fn$
            CREATE OR REPLACE FUNCTION public.request_refund(
                p_restaurant_id     UUID,
                p_payment_id        UUID,
                p_amount_cents      BIGINT,
                p_reason            TEXT        DEFAULT 'customer_request',
                p_reason_detail     TEXT        DEFAULT NULL,
                p_idempotency_key   TEXT        DEFAULT NULL
            )
            RETURNS JSONB
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $inner$
            BEGIN
                PERFORM public.require_restaurant_role(
                    p_restaurant_id,
                    ARRAY['owner', 'manager']
                );
                RETURN public.create_refund_atomic(
                    p_restaurant_id     := p_restaurant_id,
                    p_payment_id        := p_payment_id,
                    p_amount_cents      := p_amount_cents,
                    p_reason            := p_reason,
                    p_reason_detail     := p_reason_detail,
                    p_operator_id       := auth.uid(),
                    p_operator_role     := (
                        SELECT role FROM public.restaurant_users
                        WHERE user_id = auth.uid()
                          AND restaurant_id = p_restaurant_id
                          AND deleted_at IS NULL
                        LIMIT 1
                    ),
                    p_authorized_by     := auth.uid(),
                    p_authorization_method := 'direct',
                    p_idempotency_key   := p_idempotency_key
                );
            END;
            $inner$
        $fn$;
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.request_refund(UUID, UUID, BIGINT, TEXT, TEXT, TEXT) TO authenticated';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.request_refund(UUID, UUID, BIGINT, TEXT, TEXT, TEXT) FROM anon';
        RAISE NOTICE 'request_refund wrapper created';
    END IF;
END $$;

-- ========================================================================
-- 6. Role-gate payment operations
-- ========================================================================

-- Payments require at least waiter role
CREATE OR REPLACE FUNCTION public.request_payment(
    p_order_id          UUID,
    p_restaurant_id     UUID,
    p_cash_register_id  UUID,
    p_method            TEXT,
    p_amount_cents      INTEGER,
    p_idempotency_key   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Waiters, managers, and owners can process payments
    PERFORM public.require_restaurant_role(
        p_restaurant_id,
        ARRAY['owner', 'manager', 'waiter']
    );

    RETURN public.process_order_payment(
        p_order_id          := p_order_id,
        p_restaurant_id     := p_restaurant_id,
        p_cash_register_id  := p_cash_register_id,
        p_method            := p_method,
        p_amount_cents      := p_amount_cents,
        p_operator_id       := auth.uid(),
        p_idempotency_key   := p_idempotency_key
    );
END;
$$;

COMMENT ON FUNCTION public.request_payment IS
'Public-facing payment RPC. Validates caller has waiter/manager/owner role.';

GRANT EXECUTE ON FUNCTION public.request_payment(UUID, UUID, UUID, TEXT, INTEGER, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.request_payment(UUID, UUID, UUID, TEXT, INTEGER, TEXT) FROM anon;

-- ========================================================================
-- 7. Role-gate cash register operations
-- ========================================================================

-- Cash register open/close requires manager/owner
CREATE OR REPLACE FUNCTION public.request_open_cash_register(
    p_restaurant_id UUID,
    p_name TEXT DEFAULT 'Caixa Principal',
    p_opening_balance_cents BIGINT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.require_restaurant_role(
        p_restaurant_id,
        ARRAY['owner', 'manager']
    );

    RETURN public.open_cash_register_atomic(
        p_restaurant_id         := p_restaurant_id,
        p_name                  := p_name,
        p_opened_by             := auth.uid()::TEXT,
        p_opening_balance_cents := p_opening_balance_cents
    );
END;
$$;

COMMENT ON FUNCTION public.request_open_cash_register IS
'Public-facing cash register open RPC. Requires manager/owner role.';

GRANT EXECUTE ON FUNCTION public.request_open_cash_register(UUID, TEXT, BIGINT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.request_open_cash_register(UUID, TEXT, BIGINT) FROM anon;

-- ========================================================================
-- 8. Revoke direct access to internal RPCs from anon (conditional)
-- ========================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_refund_atomic'
               AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.create_refund_atomic(UUID, UUID, BIGINT, TEXT, TEXT, UUID, TEXT, UUID, TEXT, UUID, TEXT) FROM anon';
        RAISE NOTICE 'Revoked anon from create_refund_atomic';
    ELSE
        RAISE NOTICE 'SKIPPED: create_refund_atomic does not exist yet';
    END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.process_order_payment(
    UUID, UUID, UUID, TEXT, INTEGER, UUID, TEXT
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.open_cash_register_atomic(
    UUID, TEXT, TEXT, BIGINT
) FROM anon;

COMMIT;
