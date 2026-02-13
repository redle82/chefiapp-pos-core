-- ==============================================================================
-- PHASE 4 OPS + BACKUP TESTS
-- ==============================================================================
-- Purpose: Validate backup tracking + ops health functions
-- Expected: Tests fail before migrations, pass after
-- ==============================================================================

-- ==============================================================================
-- SETUP: Ensure a test restaurant exists
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.gm_restaurants
        WHERE id = '00000000-0000-0000-0000-000000000100'
    ) THEN
        INSERT INTO public.gm_restaurants (id, name, status, created_at, updated_at)
        VALUES (
            '00000000-0000-0000-0000-000000000100',
            'Ops Test Restaurant',
            'active',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- ==============================================================================
-- TEST 1: gm_backup_runs table exists with required columns
-- ==============================================================================
DO $$
DECLARE
    v_missing TEXT[];
BEGIN
    SELECT array_agg(col) INTO v_missing
    FROM (VALUES
        ('id'), ('scope'), ('restaurant_id'), ('backup_type'), ('status'),
        ('requested_by'), ('requested_via'), ('started_at'), ('completed_at'),
        ('target_uri'), ('size_bytes'), ('checksum'), ('error_code'),
        ('error_message'), ('metadata'), ('created_at'), ('updated_at')
    ) AS cols(col)
    WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'gm_backup_runs'
          AND column_name = cols.col
    );

    IF v_missing IS NOT NULL THEN
        RAISE EXCEPTION 'TEST FAILED: gm_backup_runs missing columns: %', v_missing;
    END IF;

    RAISE NOTICE 'TEST 1 PASSED: gm_backup_runs has required columns';
END $$;

-- ==============================================================================
-- TEST 2: start_backup_run creates RUNNING backup row
-- ==============================================================================
DO $$
DECLARE
    v_backup_id UUID;
    v_status TEXT;
BEGIN
    v_backup_id := (public.start_backup_run(
        'RESTAURANT',
        '00000000-0000-0000-0000-000000000100',
        'LOGICAL',
        '00000000-0000-0000-0000-000000000200',
        'MANUAL',
        '{}'::jsonb
    )->>'id')::uuid;

    SELECT status INTO v_status
    FROM public.gm_backup_runs
    WHERE id = v_backup_id;

    IF v_status IS DISTINCT FROM 'RUNNING' THEN
        RAISE EXCEPTION 'TEST FAILED: expected RUNNING status, got %', v_status;
    END IF;

    RAISE NOTICE 'TEST 2 PASSED: start_backup_run created RUNNING row';
END $$;

-- ==============================================================================
-- TEST 3: complete_backup_run finalizes backup
-- ==============================================================================
DO $$
DECLARE
    v_backup_id UUID;
    v_status TEXT;
    v_completed_at TIMESTAMPTZ;
BEGIN
    v_backup_id := (public.start_backup_run(
        'RESTAURANT',
        '00000000-0000-0000-0000-000000000100',
        'LOGICAL',
        '00000000-0000-0000-0000-000000000200',
        'MANUAL',
        '{}'::jsonb
    )->>'id')::uuid;

    PERFORM public.complete_backup_run(
        v_backup_id,
        'SUCCEEDED',
        's3://chefiapp/backups/test.sql',
        123456,
        'checksum-test',
        NULL,
        NULL,
        '{}'::jsonb
    );

    SELECT status, completed_at INTO v_status, v_completed_at
    FROM public.gm_backup_runs
    WHERE id = v_backup_id;

    IF v_status IS DISTINCT FROM 'SUCCEEDED' OR v_completed_at IS NULL THEN
        RAISE EXCEPTION 'TEST FAILED: expected SUCCEEDED with completed_at';
    END IF;

    RAISE NOTICE 'TEST 3 PASSED: complete_backup_run finalized backup';
END $$;

-- ==============================================================================
-- TEST 4: record_ops_integrity_snapshot inserts a row
-- ==============================================================================
DO $$
DECLARE
    v_snapshot_id UUID;
    v_found BOOLEAN;
BEGIN
    v_snapshot_id := (public.record_ops_integrity_snapshot(
        'RESTAURANT',
        '00000000-0000-0000-0000-000000000100',
        'OPS_HEALTH',
        'OK',
        jsonb_build_object('note', 'test')
    )->>'id')::uuid;

    SELECT EXISTS (
        SELECT 1 FROM public.gm_ops_integrity_snapshots WHERE id = v_snapshot_id
    ) INTO v_found;

    IF v_found IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'TEST FAILED: ops integrity snapshot not inserted';
    END IF;

    RAISE NOTICE 'TEST 4 PASSED: record_ops_integrity_snapshot inserted row';
END $$;

-- ==============================================================================
-- TEST 5: get_ops_health_summary returns expected keys
-- ==============================================================================
DO $$
DECLARE
    v_health JSONB;
BEGIN
    v_health := public.get_ops_health_summary('00000000-0000-0000-0000-000000000100');

    IF NOT (v_health ? 'payment_health')
       OR NOT (v_health ? 'hash_chain_integrity')
       OR NOT (v_health ? 'open_cash_registers')
       OR NOT (v_health ? 'last_backup_status') THEN
        RAISE EXCEPTION 'TEST FAILED: missing keys in ops health summary';
    END IF;

    RAISE NOTICE 'TEST 5 PASSED: get_ops_health_summary returns expected keys';
END $$;
