#!/usr/bin/env bash

set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-chefiapp-core-postgres}"
DB_NAME="${DB_NAME:-chefiapp_core}"
DB_USER="${DB_USER:-postgres}"

LOADTEST_RESTAURANT_ID="${LOADTEST_RESTAURANT_ID:-550e8400-e29b-41d4-a716-446655440000}"
LOADTEST_ORDER_ID="${LOADTEST_ORDER_ID:-660e8400-e29b-41d4-a716-446655440001}"
LOADTEST_WEBHOOK_EVENT_ID="${LOADTEST_WEBHOOK_EVENT_ID:-770e8400-e29b-41d4-a716-446655440002}"
LOADTEST_MERCHANT_CODE="${LOADTEST_MERCHANT_CODE:-acct_loadtest_merchant_001}"
LOADTEST_PROVIDER="${LOADTEST_PROVIDER:-stripe}"

echo "[seed] Seeding deterministic payment integration fixtures..."

docker exec -i "${POSTGRES_CONTAINER}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" <<SQL
BEGIN;

SET LOCAL session_replication_role = replica;

INSERT INTO gm_restaurants (id, name, status, created_at, updated_at)
VALUES (
  '${LOADTEST_RESTAURANT_ID}'::uuid,
  'Load Test Restaurant',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET updated_at = NOW();

INSERT INTO gm_orders (
  id,
  restaurant_id,
  status,
  payment_status,
  total_cents,
  source,
  created_at,
  updated_at,
  payment_amount,
  payment_method,
  last_payment_event_id
)
VALUES (
  '${LOADTEST_ORDER_ID}'::uuid,
  '${LOADTEST_RESTAURANT_ID}'::uuid,
  'OPEN',
  'PENDING',
  1299,
  'tpv',
  NOW(),
  NOW(),
  12.99,
  '${LOADTEST_PROVIDER}',
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  restaurant_id = EXCLUDED.restaurant_id,
  updated_at = NOW(),
  source = EXCLUDED.source,
  total_cents = EXCLUDED.total_cents;

INSERT INTO webhook_events (
  id,
  provider,
  event_type,
  event_id,
  raw_payload,
  status,
  merchant_code,
  order_id,
  created_at,
  updated_at
)
VALUES (
  '${LOADTEST_WEBHOOK_EVENT_ID}'::uuid,
  '${LOADTEST_PROVIDER}',
  'payment.success',
  'evt_loadtest_001',
  jsonb_build_object(
    'webhook_event_id', '${LOADTEST_WEBHOOK_EVENT_ID}',
    'order_id', '${LOADTEST_ORDER_ID}',
    'restaurant_id', '${LOADTEST_RESTAURANT_ID}',
    'provider', '${LOADTEST_PROVIDER}'
  ),
  'processed',
  '${LOADTEST_MERCHANT_CODE}',
  '${LOADTEST_ORDER_ID}'::uuid,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET
  merchant_code = EXCLUDED.merchant_code,
  order_id = EXCLUDED.order_id,
  updated_at = NOW();

UPDATE gm_orders
SET
  last_payment_event_id = '${LOADTEST_WEBHOOK_EVENT_ID}'::uuid,
  updated_at = NOW()
WHERE id = '${LOADTEST_ORDER_ID}'::uuid;

INSERT INTO merchant_code_mapping (
  restaurant_id,
  provider,
  merchant_code,
  merchant_name,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '${LOADTEST_RESTAURANT_ID}'::uuid,
  '${LOADTEST_PROVIDER}',
  '${LOADTEST_MERCHANT_CODE}',
  'Load Test Merchant',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (provider, merchant_code) DO UPDATE
SET
  restaurant_id = EXCLUDED.restaurant_id,
  merchant_name = EXCLUDED.merchant_name,
  is_active = true,
  updated_at = NOW();

COMMIT;
SQL

echo "[seed] Done"
echo "  LOADTEST_RESTAURANT_ID=${LOADTEST_RESTAURANT_ID}"
echo "  LOADTEST_ORDER_ID=${LOADTEST_ORDER_ID}"
echo "  LOADTEST_WEBHOOK_EVENT_ID=${LOADTEST_WEBHOOK_EVENT_ID}"
echo "  LOADTEST_MERCHANT_CODE=${LOADTEST_MERCHANT_CODE}"
echo "  LOADTEST_PROVIDER=${LOADTEST_PROVIDER}"
