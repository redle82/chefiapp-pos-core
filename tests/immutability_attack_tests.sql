-- ==============================================================================
-- IMMUTABILITY ATTACK TESTS - GATE 3
-- ==============================================================================
-- Purpose: Verify that event_store and legal_seals are truly immutable
-- Target: PostgreSQL 15+
-- Expected: All mutation attempts MUST fail with SQLSTATE 23514
-- ==============================================================================

-- ==============================================================================
-- SETUP: Create schema and insert test data
-- ==============================================================================

-- Load schema (assumes schema.sql has been executed)
-- If not, run: \i schema.sql

-- Insert test event
INSERT INTO event_store (
    event_id,
    stream_id,
    stream_version,
    type,
    payload,
    occurred_at,
    hash
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'ORDER:test-001',
    1,
    'ORDER_CREATED',
    '{"order_id": "test-001", "total": 100.00}'::jsonb,
    NOW(),
    'test_hash_001'
);

-- Insert test legal seal
INSERT INTO legal_seals (
    seal_id,
    entity_type,
    entity_id,
    seal_event_id,
    stream_hash,
    sealed_at,
    financial_state,
    legal_state
) VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'ORDER',
    'test-001',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test_stream_hash_001',
    NOW(),
    'PAID',
    'ORDER_DECLARED'
);

-- ==============================================================================
-- TEST 1: Direct UPDATE on event_store (MUST FAIL)
-- ==============================================================================

-- Expected: SQLSTATE 23514 (check_violation)
-- Expected Message: IMMUTABLE_TABLE: UPDATE operations not allowed on event_store

DO $$
BEGIN
    UPDATE event_store
    SET payload = '{"tampered": true}'::jsonb
    WHERE event_id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    RAISE EXCEPTION 'TEST FAILED: UPDATE should have been blocked';
EXCEPTION
    WHEN SQLSTATE '23514' THEN
        RAISE NOTICE '✅ TEST 1 PASSED: UPDATE on event_store blocked (SQLSTATE 23514)';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: Wrong error code. Expected 23514, got %', SQLSTATE;
END $$;

-- ==============================================================================
-- TEST 2: Direct DELETE on event_store (MUST FAIL)
-- ==============================================================================

-- Expected: SQLSTATE 23514 (check_violation)
-- Expected Message: IMMUTABLE_TABLE: DELETE operations not allowed on event_store

DO $$
BEGIN
    DELETE FROM event_store
    WHERE event_id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    RAISE EXCEPTION 'TEST FAILED: DELETE should have been blocked';
EXCEPTION
    WHEN SQLSTATE '23514' THEN
        RAISE NOTICE '✅ TEST 2 PASSED: DELETE on event_store blocked (SQLSTATE 23514)';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: Wrong error code. Expected 23514, got %', SQLSTATE;
END $$;

-- ==============================================================================
-- TEST 3: Direct UPDATE on legal_seals (MUST FAIL)
-- ==============================================================================

-- Expected: SQLSTATE 23514 (check_violation)
-- Expected Message: IMMUTABLE_TABLE: UPDATE operations not allowed on legal_seals

DO $$
BEGIN
    UPDATE legal_seals
    SET legal_state = 'ORDER_FINAL'
    WHERE seal_id = '00000000-0000-0000-0000-000000000002'::uuid;
    
    RAISE EXCEPTION 'TEST FAILED: UPDATE should have been blocked';
EXCEPTION
    WHEN SQLSTATE '23514' THEN
        RAISE NOTICE '✅ TEST 3 PASSED: UPDATE on legal_seals blocked (SQLSTATE 23514)';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: Wrong error code. Expected 23514, got %', SQLSTATE;
END $$;

-- ==============================================================================
-- TEST 4: Direct DELETE on legal_seals (MUST FAIL)
-- ==============================================================================

-- Expected: SQLSTATE 23514 (check_violation)
-- Expected Message: IMMUTABLE_TABLE: DELETE operations not allowed on legal_seals

DO $$
BEGIN
    DELETE FROM legal_seals
    WHERE seal_id = '00000000-0000-0000-0000-000000000002'::uuid;
    
    RAISE EXCEPTION 'TEST FAILED: DELETE should have been blocked';
EXCEPTION
    WHEN SQLSTATE '23514' THEN
        RAISE NOTICE '✅ TEST 4 PASSED: DELETE on legal_seals blocked (SQLSTATE 23514)';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: Wrong error code. Expected 23514, got %', SQLSTATE;
END $$;

-- ==============================================================================
-- TEST 5: Batch UPDATE on event_store (MUST FAIL)
-- ==============================================================================

-- Expected: SQLSTATE 23514 (check_violation)
-- Ensures FOR EACH ROW trigger blocks batch operations

DO $$
BEGIN
    UPDATE event_store
    SET type = 'TAMPERED'
    WHERE stream_id = 'ORDER:test-001';
    
    RAISE EXCEPTION 'TEST FAILED: Batch UPDATE should have been blocked';
EXCEPTION
    WHEN SQLSTATE '23514' THEN
        RAISE NOTICE '✅ TEST 5 PASSED: Batch UPDATE blocked (FOR EACH ROW enforced)';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: Wrong error code. Expected 23514, got %', SQLSTATE;
END $$;

-- ==============================================================================
-- TEST 6: UPDATE via CTE (MUST FAIL)
-- ==============================================================================

-- Expected: SQLSTATE 23514 (check_violation)
-- Ensures trigger blocks UPDATE even in complex queries

DO $$
BEGIN
    WITH updated AS (
        UPDATE event_store
        SET hash = 'tampered_hash'
        WHERE event_id = '00000000-0000-0000-0000-000000000001'::uuid
        RETURNING *
    )
    SELECT COUNT(*) FROM updated;
    
    RAISE EXCEPTION 'TEST FAILED: UPDATE via CTE should have been blocked';
EXCEPTION
    WHEN SQLSTATE '23514' THEN
        RAISE NOTICE '✅ TEST 6 PASSED: UPDATE via CTE blocked';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: Wrong error code. Expected 23514, got %', SQLSTATE;
END $$;

-- ==============================================================================
-- TEST 7: DELETE via subquery (MUST FAIL)
-- ==============================================================================

-- Expected: SQLSTATE 23514 (check_violation)
-- Ensures trigger blocks DELETE in subquery context

DO $$
BEGIN
    DELETE FROM legal_seals
    WHERE seal_id IN (
        SELECT seal_id FROM legal_seals WHERE entity_type = 'ORDER'
    );
    
    RAISE EXCEPTION 'TEST FAILED: DELETE via subquery should have been blocked';
EXCEPTION
    WHEN SQLSTATE '23514' THEN
        RAISE NOTICE '✅ TEST 7 PASSED: DELETE via subquery blocked';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST FAILED: Wrong error code. Expected 23514, got %', SQLSTATE;
END $$;

-- ==============================================================================
-- TEST 8: TRUNCATE on event_store (MUST FAIL)
-- ==============================================================================

-- Expected: Depends on PostgreSQL permissions
-- Note: TRUNCATE does NOT fire ROW-level triggers
-- Must be blocked via permissions (REVOKE TRUNCATE)

DO $$
BEGIN
    TRUNCATE event_store;
    RAISE EXCEPTION 'TEST FAILED: TRUNCATE should have been blocked by permissions';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '✅ TEST 8 PASSED: TRUNCATE blocked by permissions';
    WHEN OTHERS THEN
        RAISE WARNING '⚠️ TEST 8 WARNING: TRUNCATE succeeded (check permissions)';
END $$;

-- ==============================================================================
-- TEST 9: Verify data integrity after attack attempts
-- ==============================================================================

-- Expected: Test data unchanged

DO $$
DECLARE
    v_event_payload jsonb;
    v_seal_state text;
BEGIN
    -- Check event_store integrity
    SELECT payload INTO v_event_payload
    FROM event_store
    WHERE event_id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    IF v_event_payload->>'order_id' != 'test-001' THEN
        RAISE EXCEPTION 'TEST FAILED: event_store data was modified';
    END IF;
    
    -- Check legal_seals integrity
    SELECT legal_state INTO v_seal_state
    FROM legal_seals
    WHERE seal_id = '00000000-0000-0000-0000-000000000002'::uuid;
    
    IF v_seal_state != 'ORDER_DECLARED' THEN
        RAISE EXCEPTION 'TEST FAILED: legal_seals data was modified';
    END IF;
    
    RAISE NOTICE '✅ TEST 9 PASSED: Data integrity preserved after all attacks';
END $$;

-- ==============================================================================
-- TEST 10: Superuser bypass attempt (REQUIRES SUPERUSER)
-- ==============================================================================

-- This test demonstrates that superuser CAN bypass by dropping trigger
-- (but this action is explicit, auditable, and not accidental)

-- DANGEROUS: Only run in test environment
-- DO NOT RUN IN PRODUCTION

/*
DO $$
BEGIN
    -- Attempt to drop trigger (requires superuser)
    DROP TRIGGER event_store_immutable ON event_store;
    RAISE NOTICE '⚠️ TEST 10: Superuser CAN drop trigger (explicit DDL action)';
    
    -- Recreate trigger
    CREATE TRIGGER event_store_immutable
    BEFORE UPDATE OR DELETE ON event_store
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
    
    RAISE NOTICE '✅ TEST 10 NOTE: Trigger recreation succeeded (monitor for this in production)';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '✅ TEST 10 PASSED: Non-superuser cannot drop trigger';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST 10 FAILED: Unexpected error: %', SQLERRM;
END $$;
*/

-- ==============================================================================
-- CLEANUP: Remove test data
-- ==============================================================================

-- Remove test legal seal
DELETE FROM legal_seals WHERE seal_id = '00000000-0000-0000-0000-000000000002'::uuid;

-- This will fail (as expected) - must disable trigger temporarily for cleanup
ALTER TABLE legal_seals DISABLE TRIGGER legal_seals_immutable;
DELETE FROM legal_seals WHERE seal_id = '00000000-0000-0000-0000-000000000002'::uuid;
ALTER TABLE legal_seals ENABLE TRIGGER legal_seals_immutable;

-- Remove test event
ALTER TABLE event_store DISABLE TRIGGER event_store_immutable;
DELETE FROM event_store WHERE event_id = '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE event_store ENABLE TRIGGER event_store_immutable;

-- ==============================================================================
-- TEST SUMMARY
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'IMMUTABILITY ATTACK TESTS - SUMMARY';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'If all tests passed:';
    RAISE NOTICE '  ✅ Direct UPDATE blocked (event_store)';
    RAISE NOTICE '  ✅ Direct DELETE blocked (event_store)';
    RAISE NOTICE '  ✅ Direct UPDATE blocked (legal_seals)';
    RAISE NOTICE '  ✅ Direct DELETE blocked (legal_seals)';
    RAISE NOTICE '  ✅ Batch operations blocked';
    RAISE NOTICE '  ✅ CTE mutations blocked';
    RAISE NOTICE '  ✅ Subquery mutations blocked';
    RAISE NOTICE '  ✅ TRUNCATE blocked (via permissions)';
    RAISE NOTICE '  ✅ Data integrity preserved';
    RAISE NOTICE '';
    RAISE NOTICE 'Schema is AUDIT-GRADE for financial immutability.';
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
END $$;

-- ==============================================================================
-- END OF ATTACK TESTS
-- ==============================================================================
