-- =============================================================================
-- PHASE 4A/B: Backup Management + Ops Health Infrastructure
-- =============================================================================
-- Provides:
--  - gm_backup_runs (backup registry)
--  - gm_ops_integrity_snapshots (ops health snapshots)
--  - start_backup_run / complete_backup_run RPCs
--  - record_ops_integrity_snapshot / get_ops_health_summary RPCs
--
-- Depends on: 20260212_auth_roles_jwt.sql (roles + auth functions)
-- Depends on: 20260212_event_store_hash_chain.sql (check_hash_chain_integrity)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Backup runs registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_backup_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope           TEXT NOT NULL CHECK (scope IN ('GLOBAL', 'RESTAURANT')),
    restaurant_id   UUID REFERENCES public.gm_restaurants(id) ON DELETE RESTRICT,
    backup_type     TEXT NOT NULL CHECK (backup_type IN ('LOGICAL', 'PHYSICAL', 'WAL')),
    status          TEXT NOT NULL CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),

    requested_by    UUID,
    requested_via   TEXT NOT NULL DEFAULT 'MANUAL'
                    CHECK (requested_via IN ('MANUAL', 'SCHEDULED', 'SYSTEM')),

    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,

    target_uri      TEXT,
    size_bytes      BIGINT,
    checksum        TEXT,

    error_code      TEXT,
    error_message   TEXT,

    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gm_backup_runs IS
'Backup registry for logical/physical/WAL backups. Used for audit, compliance, and recovery tracking.';

CREATE INDEX IF NOT EXISTS idx_backup_runs_status
    ON public.gm_backup_runs(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_runs_restaurant
    ON public.gm_backup_runs(restaurant_id, started_at DESC)
    WHERE restaurant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_backup_runs_scope
    ON public.gm_backup_runs(scope, started_at DESC);

-- ---------------------------------------------------------------------------
-- 1.1 Backup mutation guard (only status/completion fields may change)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_backup_run_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'IMMUTABLE_BACKUP_RUN: DELETE not allowed on gm_backup_runs'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.scope != NEW.scope
           OR OLD.restaurant_id IS DISTINCT FROM NEW.restaurant_id
           OR OLD.backup_type != NEW.backup_type
           OR OLD.requested_by IS DISTINCT FROM NEW.requested_by
           OR OLD.requested_via != NEW.requested_via
           OR OLD.started_at != NEW.started_at
           OR OLD.created_at != NEW.created_at THEN
            RAISE EXCEPTION 'IMMUTABLE_BACKUP_RUN: Immutable fields cannot be changed'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_backup_run_mutation ON public.gm_backup_runs;
CREATE TRIGGER trg_guard_backup_run_mutation
    BEFORE UPDATE OR DELETE ON public.gm_backup_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_backup_run_mutation();

-- ---------------------------------------------------------------------------
-- 1.2 RLS for backup runs
-- ---------------------------------------------------------------------------
ALTER TABLE public.gm_backup_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_runs_select"
    ON public.gm_backup_runs
    FOR SELECT TO authenticated
    USING (
        scope = 'GLOBAL'
        OR (restaurant_id IS NOT NULL AND has_restaurant_access(restaurant_id))
    );

CREATE POLICY "backup_runs_insert_service"
    ON public.gm_backup_runs
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "backup_runs_update_service"
    ON public.gm_backup_runs
    FOR UPDATE TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "backup_runs_service"
    ON public.gm_backup_runs
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_backup_runs FROM anon;

-- ---------------------------------------------------------------------------
-- 2. Ops integrity snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_ops_integrity_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope           TEXT NOT NULL CHECK (scope IN ('GLOBAL', 'RESTAURANT')),
    restaurant_id   UUID REFERENCES public.gm_restaurants(id) ON DELETE RESTRICT,

    snapshot_type   TEXT NOT NULL CHECK (snapshot_type IN (
        'OPS_HEALTH',
        'HASH_CHAIN',
        'PAYMENTS',
        'RECONCILIATION',
        'BACKUP'
    )),

    status          TEXT NOT NULL CHECK (status IN ('OK', 'WARN', 'FAIL')),
    details         JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gm_ops_integrity_snapshots IS
'Ops snapshots for auditability (hash chain, payments, reconciliation, backup status).';

CREATE INDEX IF NOT EXISTS idx_ops_integrity_restaurant
    ON public.gm_ops_integrity_snapshots(restaurant_id, created_at DESC)
    WHERE restaurant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ops_integrity_type
    ON public.gm_ops_integrity_snapshots(snapshot_type, created_at DESC);

-- RLS for snapshots
ALTER TABLE public.gm_ops_integrity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_integrity_select"
    ON public.gm_ops_integrity_snapshots
    FOR SELECT TO authenticated
    USING (
        scope = 'GLOBAL'
        OR (restaurant_id IS NOT NULL AND has_restaurant_access(restaurant_id))
    );

CREATE POLICY "ops_integrity_insert_service"
    ON public.gm_ops_integrity_snapshots
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "ops_integrity_service"
    ON public.gm_ops_integrity_snapshots
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_ops_integrity_snapshots FROM anon;

-- ---------------------------------------------------------------------------
-- 3. RPCs: backup lifecycle
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_backup_run(
    p_scope TEXT,
    p_restaurant_id UUID,
    p_backup_type TEXT,
    p_requested_by UUID,
    p_requested_via TEXT DEFAULT 'MANUAL',
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.gm_backup_runs (
        scope, restaurant_id, backup_type, status,
        requested_by, requested_via, started_at, metadata
    ) VALUES (
        p_scope, p_restaurant_id, p_backup_type, 'RUNNING',
        p_requested_by, p_requested_via, NOW(), COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'id', v_id,
        'status', 'RUNNING'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_backup_run(
    p_backup_id UUID,
    p_status TEXT,
    p_target_uri TEXT,
    p_size_bytes BIGINT,
    p_checksum TEXT,
    p_error_code TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gm_backup_runs
    SET
        status = p_status,
        target_uri = p_target_uri,
        size_bytes = p_size_bytes,
        checksum = p_checksum,
        error_code = p_error_code,
        error_message = p_error_message,
        completed_at = NOW(),
        metadata = COALESCE(p_metadata, '{}'::jsonb)
    WHERE id = p_backup_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_backup_run(
    TEXT, UUID, TEXT, UUID, TEXT, JSONB
) TO service_role;

GRANT EXECUTE ON FUNCTION public.complete_backup_run(
    UUID, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT, JSONB
) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. RPCs: ops integrity snapshots
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_ops_integrity_snapshot(
    p_scope TEXT,
    p_restaurant_id UUID,
    p_snapshot_type TEXT,
    p_status TEXT,
    p_details JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.gm_ops_integrity_snapshots (
        scope, restaurant_id, snapshot_type, status, details
    ) VALUES (
        p_scope, p_restaurant_id, p_snapshot_type, p_status, COALESCE(p_details, '{}'::jsonb)
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'id', v_id,
        'status', p_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_ops_integrity_snapshot(
    TEXT, UUID, TEXT, TEXT, JSONB
) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. RPC: ops health summary (dashboard)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ops_health_summary(
    p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_health JSONB;
    v_hash_integrity JSONB;
    v_open_registers INTEGER;
    v_last_backup JSONB;
BEGIN
    -- Payment health (last 24h)
    v_payment_health := public.get_payment_health(p_restaurant_id);

    -- Hash chain integrity (conditional — function may not exist yet)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_hash_chain_integrity'
               AND pronamespace = 'public'::regnamespace) THEN
        v_hash_integrity := public.check_hash_chain_integrity(NULL, p_restaurant_id);
    ELSE
        v_hash_integrity := jsonb_build_object('status', 'NOT_AVAILABLE', 'reason', 'check_hash_chain_integrity not deployed');
    END IF;

    -- Open cash registers
    SELECT COUNT(*) INTO v_open_registers
    FROM public.gm_cash_registers
    WHERE restaurant_id = p_restaurant_id
      AND status = 'open';

    -- Last backup status
    SELECT jsonb_build_object(
        'status', status,
        'completed_at', completed_at,
        'target_uri', target_uri
    ) INTO v_last_backup
    FROM public.gm_backup_runs
    WHERE (scope = 'GLOBAL' OR restaurant_id = p_restaurant_id)
    ORDER BY started_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'payment_health', v_payment_health,
        'hash_chain_integrity', v_hash_integrity,
        'open_cash_registers', v_open_registers,
        'last_backup_status', COALESCE(v_last_backup, '{}'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ops_health_summary(UUID) TO authenticated, service_role;

COMMIT;
