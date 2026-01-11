-- ==============================================================================
-- CHEFIAPP DATABASE INTEGRITY AUDIT
-- ==============================================================================
-- Purpose: Comprehensive integrity audit of ChefIApp database
-- Date: 2025-12-25
-- ==============================================================================

-- ==============================================================================
-- 1. EVENT STORE INTEGRITY
-- ==============================================================================

\echo '=== EVENT STORE AUDIT ==='

-- Total records
SELECT 'EVENT_STORE_COUNT' as metric, COUNT(*) as value FROM event_store;

-- Check for NULL violations
SELECT 'EVENT_STORE_NULL_CHECK' as test,
  COALESCE(SUM(CASE WHEN event_id IS NULL THEN 1 ELSE 0 END), 0) as null_event_id,
  COALESCE(SUM(CASE WHEN stream_id IS NULL THEN 1 ELSE 0 END), 0) as null_stream_id,
  COALESCE(SUM(CASE WHEN stream_version IS NULL THEN 1 ELSE 0 END), 0) as null_stream_version,
  COALESCE(SUM(CASE WHEN type IS NULL THEN 1 ELSE 0 END), 0) as null_type,
  COALESCE(SUM(CASE WHEN payload IS NULL THEN 1 ELSE 0 END), 0) as null_payload,
  COALESCE(SUM(CASE WHEN hash IS NULL THEN 1 ELSE 0 END), 0) as null_hash
FROM event_store;

-- Check hash chain continuity
WITH event_chain AS (
  SELECT
    event_id,
    stream_id,
    stream_version,
    hash_prev,
    hash,
    LAG(hash) OVER (PARTITION BY stream_id ORDER BY stream_version) as expected_prev_hash,
    occurred_at
  FROM event_store
),
broken_chains AS (
  SELECT
    stream_id,
    stream_version,
    hash_prev,
    expected_prev_hash
  FROM event_chain
  WHERE stream_version > 1
    AND (
      (hash_prev IS NULL AND expected_prev_hash IS NOT NULL) OR
      (hash_prev IS NOT NULL AND hash_prev != expected_prev_hash)
    )
)
SELECT
  'EVENT_STORE_HASH_CHAIN' as test,
  COUNT(*) as broken_chain_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM broken_chains;

-- Check for gaps in stream versions
WITH version_gaps AS (
  SELECT
    stream_id,
    stream_version,
    stream_version - LAG(stream_version) OVER (PARTITION BY stream_id ORDER BY stream_version) as gap
  FROM event_store
)
SELECT
  'EVENT_STORE_VERSION_GAPS' as test,
  stream_id,
  stream_version,
  gap
FROM version_gaps
WHERE gap > 1
ORDER BY stream_id, stream_version;

-- Check for duplicate (stream_id, stream_version) - should be impossible due to UNIQUE constraint
SELECT
  'EVENT_STORE_DUPLICATE_VERSIONS' as test,
  stream_id,
  stream_version,
  COUNT(*) as duplicate_count
FROM event_store
GROUP BY stream_id, stream_version
HAVING COUNT(*) > 1;

-- Check for invalid event types (should be documented types)
SELECT
  'EVENT_STORE_EVENT_TYPES' as metric,
  type,
  COUNT(*) as count
FROM event_store
GROUP BY type
ORDER BY count DESC;

-- ==============================================================================
-- 2. LEGAL SEALS INTEGRITY
-- ==============================================================================

\echo ''
\echo '=== LEGAL SEALS AUDIT ==='

-- Total records
SELECT 'LEGAL_SEALS_COUNT' as metric, COUNT(*) as value FROM legal_seals;

-- Check for NULL violations
SELECT 'LEGAL_SEALS_NULL_CHECK' as test,
  COALESCE(SUM(CASE WHEN seal_id IS NULL THEN 1 ELSE 0 END), 0) as null_seal_id,
  COALESCE(SUM(CASE WHEN entity_type IS NULL THEN 1 ELSE 0 END), 0) as null_entity_type,
  COALESCE(SUM(CASE WHEN entity_id IS NULL THEN 1 ELSE 0 END), 0) as null_entity_id,
  COALESCE(SUM(CASE WHEN seal_event_id IS NULL THEN 1 ELSE 0 END), 0) as null_seal_event_id,
  COALESCE(SUM(CASE WHEN stream_hash IS NULL THEN 1 ELSE 0 END), 0) as null_stream_hash
FROM legal_seals;

-- Check seal_event_id foreign key integrity
SELECT
  'LEGAL_SEALS_FK_EVENT_STORE' as test,
  COUNT(*) as orphan_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM legal_seals ls
LEFT JOIN event_store es ON ls.seal_event_id = es.event_id
WHERE es.event_id IS NULL;

-- Check sequence monotonicity (should be strictly increasing, gaps allowed)
WITH sequence_check AS (
  SELECT
    sequence,
    LAG(sequence) OVER (ORDER BY sequence) as prev_sequence
  FROM legal_seals
)
SELECT
  'LEGAL_SEALS_SEQUENCE_MONOTONIC' as test,
  COUNT(*) as non_monotonic_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM sequence_check
WHERE sequence <= prev_sequence;

-- Check for sequence gaps (informational, not an error)
WITH sequence_gaps AS (
  SELECT
    sequence,
    sequence - LAG(sequence) OVER (ORDER BY sequence) as gap
  FROM legal_seals
)
SELECT
  'LEGAL_SEALS_SEQUENCE_GAPS' as metric,
  COUNT(*) as gap_count,
  MAX(gap) as max_gap_size
FROM sequence_gaps
WHERE gap > 1;

-- Check for duplicate entity seals (should be prevented by UNIQUE constraint)
SELECT
  'LEGAL_SEALS_DUPLICATE_ENTITY' as test,
  entity_type,
  entity_id,
  legal_state,
  COUNT(*) as duplicate_count
FROM legal_seals
GROUP BY entity_type, entity_id, legal_state
HAVING COUNT(*) > 1;

-- ==============================================================================
-- 3. RESTAURANT WEB PROFILES INTEGRITY
-- ==============================================================================

\echo ''
\echo '=== RESTAURANT WEB PROFILES AUDIT ==='

-- Total records
SELECT 'RESTAURANT_WEB_PROFILES_COUNT' as metric, COUNT(*) as value FROM restaurant_web_profiles;

-- Check for NULL violations
SELECT 'RESTAURANT_WEB_PROFILES_NULL_CHECK' as test,
  COALESCE(SUM(CASE WHEN restaurant_id IS NULL THEN 1 ELSE 0 END), 0) as null_restaurant_id,
  COALESCE(SUM(CASE WHEN slug IS NULL THEN 1 ELSE 0 END), 0) as null_slug,
  COALESCE(SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END), 0) as null_status
FROM restaurant_web_profiles;

-- Check for duplicate slugs (should be prevented by UNIQUE constraint)
SELECT
  'RESTAURANT_WEB_PROFILES_DUPLICATE_SLUG' as test,
  slug,
  COUNT(*) as duplicate_count
FROM restaurant_web_profiles
GROUP BY slug
HAVING COUNT(*) > 1;

-- Check for duplicate domains (should be prevented by UNIQUE constraint)
SELECT
  'RESTAURANT_WEB_PROFILES_DUPLICATE_DOMAIN' as test,
  domain,
  COUNT(*) as duplicate_count
FROM restaurant_web_profiles
WHERE domain IS NOT NULL
GROUP BY domain
HAVING COUNT(*) > 1;

-- ==============================================================================
-- 4. MENU CATEGORIES / ITEMS INTEGRITY
-- ==============================================================================

\echo ''
\echo '=== MENU CATEGORIES/ITEMS AUDIT ==='

-- Total records
SELECT 'MENU_CATEGORIES_COUNT' as metric, COUNT(*) as value FROM menu_categories;
SELECT 'MENU_ITEMS_COUNT' as metric, COUNT(*) as value FROM menu_items;

-- Check for orphan categories (restaurant_id not in restaurant_web_profiles)
SELECT
  'MENU_CATEGORIES_ORPHAN' as test,
  COUNT(*) as orphan_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM menu_categories mc
LEFT JOIN restaurant_web_profiles rwp ON mc.restaurant_id = rwp.restaurant_id
WHERE rwp.restaurant_id IS NULL;

-- Check for orphan menu items (category_id not in menu_categories)
SELECT
  'MENU_ITEMS_ORPHAN_CATEGORY' as test,
  COUNT(*) as orphan_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.id IS NULL;

-- Check menu items restaurant_id consistency with category
SELECT
  'MENU_ITEMS_RESTAURANT_MISMATCH' as test,
  COUNT(*) as mismatch_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM menu_items mi
INNER JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.restaurant_id != mc.restaurant_id;

-- Check for negative prices
SELECT
  'MENU_ITEMS_NEGATIVE_PRICE' as test,
  COUNT(*) as count
FROM menu_items
WHERE price_cents < 0;

-- ==============================================================================
-- 5. MERCHANT GATEWAY CREDENTIALS INTEGRITY
-- ==============================================================================

\echo ''
\echo '=== MERCHANT GATEWAY CREDENTIALS AUDIT ==='

-- Total records
SELECT 'MERCHANT_GATEWAY_CREDENTIALS_COUNT' as metric, COUNT(*) as value FROM merchant_gateway_credentials;

-- Check for NULL violations (secret_key_enc is required)
SELECT 'MERCHANT_GATEWAY_CREDENTIALS_NULL_CHECK' as test,
  COALESCE(SUM(CASE WHEN restaurant_id IS NULL THEN 1 ELSE 0 END), 0) as null_restaurant_id,
  COALESCE(SUM(CASE WHEN gateway IS NULL THEN 1 ELSE 0 END), 0) as null_gateway,
  COALESCE(SUM(CASE WHEN secret_key_enc IS NULL THEN 1 ELSE 0 END), 0) as null_secret_key
FROM merchant_gateway_credentials;

-- Check encryption (secret_key_enc should be BYTEA, not empty)
SELECT
  'MERCHANT_GATEWAY_CREDENTIALS_ENCRYPTION' as test,
  COUNT(*) as empty_secret_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM merchant_gateway_credentials
WHERE secret_key_enc IS NULL OR length(secret_key_enc) = 0;

-- Check for orphan credentials (restaurant_id not in restaurant_web_profiles)
SELECT
  'MERCHANT_GATEWAY_CREDENTIALS_ORPHAN' as test,
  COUNT(*) as orphan_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM merchant_gateway_credentials mgc
LEFT JOIN restaurant_web_profiles rwp ON mgc.restaurant_id = rwp.restaurant_id
WHERE rwp.restaurant_id IS NULL;

-- ==============================================================================
-- 6. STAFF TASKS INTEGRITY
-- ==============================================================================

\echo ''
\echo '=== STAFF TASKS AUDIT ==='

-- Total records
SELECT 'STAFF_TASKS_COUNT' as metric, COUNT(*) as value FROM staff_tasks;

-- Check for NULL violations
SELECT 'STAFF_TASKS_NULL_CHECK' as test,
  COALESCE(SUM(CASE WHEN id IS NULL THEN 1 ELSE 0 END), 0) as null_id,
  COALESCE(SUM(CASE WHEN restaurant_id IS NULL THEN 1 ELSE 0 END), 0) as null_restaurant_id,
  COALESCE(SUM(CASE WHEN title IS NULL THEN 1 ELSE 0 END), 0) as null_title,
  COALESCE(SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END), 0) as null_status
FROM staff_tasks;

-- Check status consistency (overdue should have passed due_at)
SELECT
  'STAFF_TASKS_STATUS_CONSISTENCY' as test,
  COUNT(*) as inconsistent_count
FROM staff_tasks
WHERE status = 'overdue' AND (due_at IS NULL OR due_at > NOW());

-- Check for tasks marked completed but requires_validation without validator
SELECT
  'STAFF_TASKS_VALIDATION_MISSING' as test,
  COUNT(*) as missing_validation_count
FROM staff_tasks
WHERE status = 'completed'
  AND requires_validation = true
  AND validated_by IS NULL;

-- Status distribution
SELECT
  'STAFF_TASKS_STATUS_DISTRIBUTION' as metric,
  status,
  COUNT(*) as count
FROM staff_tasks
GROUP BY status
ORDER BY count DESC;

-- ==============================================================================
-- 7. WEB ORDERS INTEGRITY
-- ==============================================================================

\echo ''
\echo '=== WEB ORDERS AUDIT ==='

-- Total records
SELECT 'WEB_ORDERS_COUNT' as metric, COUNT(*) as value FROM web_orders;

-- Check for NULL violations
SELECT 'WEB_ORDERS_NULL_CHECK' as test,
  COALESCE(SUM(CASE WHEN id IS NULL THEN 1 ELSE 0 END), 0) as null_id,
  COALESCE(SUM(CASE WHEN restaurant_id IS NULL THEN 1 ELSE 0 END), 0) as null_restaurant_id,
  COALESCE(SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END), 0) as null_status,
  COALESCE(SUM(CASE WHEN total_cents IS NULL THEN 1 ELSE 0 END), 0) as null_total
FROM web_orders;

-- Check for negative totals
SELECT
  'WEB_ORDERS_NEGATIVE_TOTAL' as test,
  COUNT(*) as count
FROM web_orders
WHERE total_cents < 0;

-- Check payment status consistency
SELECT
  'WEB_ORDERS_PAYMENT_STATUS_INCONSISTENCY' as test,
  COUNT(*) as inconsistent_count
FROM web_orders
WHERE status IN ('COMPLETED', 'READY', 'IN_PREP')
  AND payment_status != 'PAID';

-- ==============================================================================
-- 8. WEB ORDER ITEMS INTEGRITY
-- ==============================================================================

\echo ''
\echo '=== WEB ORDER ITEMS AUDIT ==='

-- Total records
SELECT 'WEB_ORDER_ITEMS_COUNT' as metric, COUNT(*) as value FROM web_order_items;

-- Check for orphan order items (order_id not in web_orders)
SELECT
  'WEB_ORDER_ITEMS_ORPHAN' as test,
  COUNT(*) as orphan_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM web_order_items woi
LEFT JOIN web_orders wo ON woi.order_id = wo.id
WHERE wo.id IS NULL;

-- Check for invalid menu_item_id references
SELECT
  'WEB_ORDER_ITEMS_INVALID_MENU_ITEM' as test,
  COUNT(*) as invalid_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM web_order_items woi
LEFT JOIN menu_items mi ON woi.menu_item_id = mi.id
WHERE mi.id IS NULL;

-- Check for negative quantities
SELECT
  'WEB_ORDER_ITEMS_NEGATIVE_QTY' as test,
  COUNT(*) as count
FROM web_order_items
WHERE qty <= 0;

-- ==============================================================================
-- 9. PAYMENT INTENT REFS INTEGRITY
-- ==============================================================================

\echo ''
\echo '=== PAYMENT INTENT REFS AUDIT ==='

-- Total records
SELECT 'PAYMENT_INTENT_REFS_COUNT' as metric, COUNT(*) as value FROM payment_intent_refs;

-- Check for orphan payment intents (order_id not in web_orders)
SELECT
  'PAYMENT_INTENT_REFS_ORPHAN' as test,
  COUNT(*) as orphan_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM payment_intent_refs pir
LEFT JOIN web_orders wo ON pir.order_id = wo.id
WHERE wo.id IS NULL;

-- Check for duplicate (provider, intent_id) - should be prevented by UNIQUE
SELECT
  'PAYMENT_INTENT_REFS_DUPLICATE' as test,
  provider,
  intent_id,
  COUNT(*) as duplicate_count
FROM payment_intent_refs
GROUP BY provider, intent_id
HAVING COUNT(*) > 1;

-- ==============================================================================
-- 10. SUMMARY REPORT
-- ==============================================================================

\echo ''
\echo '=== INTEGRITY SUMMARY ==='

SELECT
  'DATABASE_INTEGRITY_SUMMARY' as report,
  (SELECT COUNT(*) FROM event_store) as event_store_records,
  (SELECT COUNT(*) FROM legal_seals) as legal_seals_records,
  (SELECT COUNT(*) FROM restaurant_web_profiles) as restaurant_profiles,
  (SELECT COUNT(*) FROM menu_categories) as menu_categories,
  (SELECT COUNT(*) FROM menu_items) as menu_items,
  (SELECT COUNT(*) FROM web_orders) as web_orders,
  (SELECT COUNT(*) FROM web_order_items) as web_order_items,
  (SELECT COUNT(*) FROM merchant_gateway_credentials) as gateway_credentials,
  (SELECT COUNT(*) FROM staff_tasks) as staff_tasks,
  (SELECT COUNT(*) FROM payment_intent_refs) as payment_intents;

-- ==============================================================================
-- END OF AUDIT
-- ==============================================================================
