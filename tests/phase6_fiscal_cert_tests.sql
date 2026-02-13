-- ==============================================================================
-- PHASE 6 FISCAL CERTIFICATION TESTS (BASELINE)
-- ==============================================================================
-- Purpose: Validate baseline fiscal certification infrastructure
-- Expected: Tests fail before Phase 6 migrations, pass after
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
            'Fiscal Cert Test Restaurant',
            'active',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- ==============================================================================
-- TEST 1: gm_fiscal_certifications table exists with required columns
-- ==============================================================================
DO $$
DECLARE
    v_missing TEXT[];
BEGIN
    SELECT array_agg(col) INTO v_missing
    FROM (VALUES
        ('id'), ('restaurant_id'), ('jurisdiction'), ('status'),
        ('requested_by'), ('requested_at'),
        ('submitted_at'), ('approved_at'), ('rejected_at'),
        ('checklist'), ('notes'), ('metadata'),
        ('created_at'), ('updated_at')
    ) AS cols(col)
    WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'gm_fiscal_certifications'
          AND column_name = cols.col
    );

    IF v_missing IS NOT NULL THEN
        RAISE EXCEPTION 'TEST FAILED: gm_fiscal_certifications missing columns: %', v_missing;
    END IF;

    RAISE NOTICE 'TEST 1 PASSED: gm_fiscal_certifications columns present';
END $$;

-- ==============================================================================
-- TEST 2: request_fiscal_certification RPC exists
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'request_fiscal_certification'
          AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE EXCEPTION 'TEST FAILED: request_fiscal_certification() not found';
    END IF;

    RAISE NOTICE 'TEST 2 PASSED: request_fiscal_certification() exists';
END $$;

-- ==============================================================================
-- TEST 3: get_fiscal_certification_status RPC exists
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'get_fiscal_certification_status'
          AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE EXCEPTION 'TEST FAILED: get_fiscal_certification_status() not found';
    END IF;

    RAISE NOTICE 'TEST 3 PASSED: get_fiscal_certification_status() exists';
END $$;

-- ==============================================================================
-- TEST 4: record_fiscal_signature RPC exists
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'record_fiscal_signature'
          AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE EXCEPTION 'TEST FAILED: record_fiscal_signature() not found';
    END IF;

    RAISE NOTICE 'TEST 4 PASSED: record_fiscal_signature() exists';
END $$;

-- ==============================================================================
-- TEST 5: request_fiscal_certification creates a row
-- ==============================================================================
DO $$
DECLARE
    v_result JSONB;
    v_id UUID;
BEGIN
    v_result := public.request_fiscal_certification(
        '00000000-0000-0000-0000-000000000100'::uuid,
        'GENERIC',
        jsonb_build_object('phase', 'baseline'),
        'Baseline certification request',
        'cert-test-001'
    );

    v_id := (v_result->>'id')::uuid;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'TEST FAILED: request_fiscal_certification did not return id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.gm_fiscal_certifications WHERE id = v_id
    ) THEN
        RAISE EXCEPTION 'TEST FAILED: certification row not created';
    END IF;

    RAISE NOTICE 'TEST 5 PASSED: certification row created';
END $$;
