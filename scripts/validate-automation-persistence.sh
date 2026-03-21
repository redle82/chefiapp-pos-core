#!/usr/bin/env bash
# =============================================================================
# validate-automation-persistence.sh
# Dispatcher V1.1 — Production-grade persistence validation
# =============================================================================
# Validates the full lifecycle of automation dispatch:
#   1. Migration applied in Core DB
#   2. Gateway persists to gm_automation_events (storage: "core")
#   3. Server-side deduplication works (same dispatch_id returned on repeat)
#   4. Exactly 1 row written (no duplicate inserts)
#
# Prerequisites:
#   - Core (Docker) running:
#       docker compose -f docker-core/docker-compose.core.yml up -d
#   - Gateway running WITH CORE_SERVICE_KEY:
#       CORE_SERVICE_KEY=chefiapp-core-secret-key-min-32-chars-long \
#       CORE_URL=http://localhost:3001 pnpm run dev:gateway
#
# Usage:
#   bash scripts/validate-automation-persistence.sh
#   bash scripts/validate-automation-persistence.sh --apply-migration   # idempotent
#   bash scripts/validate-automation-persistence.sh --cleanup-only      # remove test artefacts
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ─── Colours ─────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✔ $*${NC}"; }
fail() { echo -e "${RED}  ✗ $*${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $*${NC}"; }
info() { echo -e "${CYAN}  → $*${NC}"; }
step() { echo -e "\n${CYAN}▶ $*${NC}"; }

# ─── Config ───────────────────────────────────────────────────────────────────
CORE_URL="${CORE_URL:-http://localhost:3001}"
CORE_SERVICE_KEY="${CORE_SERVICE_KEY:-chefiapp-core-secret-key-min-32-chars-long}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
INTERNAL_TOKEN="${INTERNAL_API_TOKEN:-chefiapp-internal-token-dev}"
PG_HOST="localhost"
PG_PORT="${PG_PORT:-54320}"
PG_USER="postgres"
PG_PASS="postgres"
PG_DB="chefiapp_core"
PG_CONTAINER="chefiapp-core-postgres"

# Test artefacts (RFC4122-valid UUIDs — version 4, variant 8)
TEST_RESTAURANT_ID="a1b2c3d4-e5f6-4a7b-8c9d-e0f123456789"
TEST_IDEMPOTENCY_KEY="validate:automation:persist:$(date +%Y%m%d%H%M%S)"
MIGRATION_FILE="$ROOT/docker-core/schema/migrations/20260226103000_gm_automation_events.sql"

APPLY_MIGRATION=false
CLEANUP_ONLY=false
PASS=true

for arg in "$@"; do
  case "$arg" in
    --apply-migration)  APPLY_MIGRATION=true ;;
    --cleanup-only)     CLEANUP_ONLY=true ;;
  esac
done

# ─── Helpers ──────────────────────────────────────────────────────────────────
psql_exec() {
  # Try container first, then direct TCP (if exposed on PG_PORT)
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${PG_CONTAINER}$"; then
    docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" "$@"
  else
    PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" "$@"
  fi
}

core_get() {
  local path="$1"
  curl -sf \
    -H "apikey: ${CORE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${CORE_SERVICE_KEY}" \
    "${CORE_URL}/rest/v1/${path}"
}

core_post() {
  local path="$1"; local data="$2"
  curl -sf -XPOST \
    -H "apikey: ${CORE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${CORE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$data" \
    "${CORE_URL}/rest/v1/${path}"
}

core_delete() {
  local path="$1"
  curl -sf -XDELETE \
    -H "apikey: ${CORE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${CORE_SERVICE_KEY}" \
    "${CORE_URL}/rest/v1/${path}" || true
}

# ─── Cleanup ─────────────────────────────────────────────────────────────────
cleanup() {
  step "Cleanup — removing test artefacts"
  core_delete "gm_automation_events?restaurant_id=eq.${TEST_RESTAURANT_ID}" && ok "automation events removed" || warn "could not remove automation events"
  core_delete "gm_restaurants?id=eq.${TEST_RESTAURANT_ID}"                  && ok "test restaurant removed"  || warn "could not remove test restaurant"
}

if $CLEANUP_ONLY; then
  cleanup
  echo ""
  ok "Cleanup complete."
  exit 0
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Dispatcher V1.1 — Persistence Validation                      ${NC}"
echo -e "${CYAN}  $(date '+%Y-%m-%d %H:%M:%S')                                  ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

# ─── Step 1: Core health ──────────────────────────────────────────────────────
step "1/7  Core health"
if curl -sf "${CORE_URL}/rest/v1/" -o /dev/null; then
  ok "Core REST is up at ${CORE_URL}"
else
  fail "Core is NOT reachable at ${CORE_URL}"
  echo ""
  echo "  To start Core:"
  echo "    cd docker-core"
  echo "    docker compose -f docker-compose.core.yml up -d"
  echo "    # Wait ~15s then re-run this script"
  exit 1
fi

# ─── Step 2: Apply migration ──────────────────────────────────────────────────
step "2/7  Migration — gm_automation_events"
if ! $APPLY_MIGRATION; then
  # Check if the table already exists
  TABLE_EXISTS=$(psql_exec -tAq -c "SELECT to_regclass('public.gm_automation_events');" 2>/dev/null || echo "")
  if [[ "$TABLE_EXISTS" == "public.gm_automation_events" ]]; then
    ok "gm_automation_events already exists — skipping migration"
  else
    warn "Table gm_automation_events does NOT exist"
    info "Re-run with --apply-migration to apply it:"
    echo "    bash scripts/validate-automation-persistence.sh --apply-migration"
    PASS=false
  fi
else
  info "Applying migration (idempotent)..."
  if psql_exec < "$MIGRATION_FILE" > /dev/null 2>&1; then
    ok "Migration applied successfully"
  else
    fail "Migration failed — check psql output"
    PASS=false
  fi
fi

if ! $PASS; then
  fail "Cannot proceed without the table. See above."
  exit 1
fi

# Re-verify table
TABLE_CHECK=$(psql_exec -tAq -c "SELECT to_regclass('public.gm_automation_events');" 2>/dev/null || echo "")
if [[ "$TABLE_CHECK" != "public.gm_automation_events" ]]; then
  fail "gm_automation_events not found after migration attempt. Aborting."
  exit 1
fi
ok "Table gm_automation_events confirmed"

# ─── Step 3: Seed test restaurant ────────────────────────────────────────────
step "3/7  Test restaurant (RFC4122 UUID, FK-safe)"
EXISTING=$(core_get "gm_restaurants?id=eq.${TEST_RESTAURANT_ID}&select=id" 2>/dev/null || echo "[]")
if echo "$EXISTING" | grep -q "$TEST_RESTAURANT_ID"; then
  ok "Test restaurant already exists"
else
  info "Inserting test restaurant ${TEST_RESTAURANT_ID}..."
  INSERT_RESULT=$(core_post "gm_restaurants" \
    "{\"id\":\"${TEST_RESTAURANT_ID}\",\"name\":\"[TEST] Automation Validation\",\"status\":\"draft\"}" 2>/dev/null || echo "error")
  if echo "$INSERT_RESULT" | grep -q "$TEST_RESTAURANT_ID"; then
    ok "Test restaurant created"
  else
    # Try via psql direct as fallback (no FK issues from psql as superuser)
    psql_exec -c "INSERT INTO public.gm_restaurants (id, name, status) VALUES ('${TEST_RESTAURANT_ID}', '[TEST] Automation Validation', 'draft') ON CONFLICT (id) DO NOTHING;" > /dev/null 2>&1 \
      && ok "Test restaurant created via psql" \
      || { fail "Could not create test restaurant"; exit 1; }
  fi
fi

# ─── Step 4: Gateway health ───────────────────────────────────────────────────
step "4/7  Gateway health"
GW_HEALTH=$(curl -sf "${GATEWAY_URL}/health" 2>/dev/null || echo "")
if echo "$GW_HEALTH" | grep -q '"ok"'; then
  ok "Gateway is up at ${GATEWAY_URL}"
else
  fail "Gateway is NOT reachable at ${GATEWAY_URL}"
  echo ""
  echo "  To start gateway with CORE_SERVICE_KEY:"
  echo "    CORE_SERVICE_KEY=${CORE_SERVICE_KEY} \\"
  echo "    CORE_URL=${CORE_URL} \\"
  echo "    pnpm run dev:gateway"
  cleanup
  exit 1
fi

# ─── Step 5: Smoke — Call 1 (first dispatch) ─────────────────────────────────
step "5/7  Smoke — Call 1 (first dispatch, expect 202)"

BODY=$(cat <<EOF
{
  "restaurant_id": "${TEST_RESTAURANT_ID}",
  "trigger": "activation_velocity_low",
  "score": 38.5,
  "classification": "at_risk",
  "recommended_action": {
    "title": "Activate online ordering",
    "reason": "Velocity dropped below threshold",
    "automation": "onboarding_push_v1"
  }
}
EOF
)

RESP1=$(curl -s -w "\n__STATUS:%{http_code}" -XPOST "${GATEWAY_URL}/internal/automation/dispatch" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: ${INTERNAL_TOKEN}" \
  -H "X-Idempotency-Key: ${TEST_IDEMPOTENCY_KEY}" \
  -d "$BODY")

STATUS1=$(echo "$RESP1" | grep '__STATUS:' | cut -d: -f2)
JSON1=$(echo "$RESP1" | sed '/^__STATUS:/d')

info "Response: ${JSON1}"

STORAGE1=$(echo "$JSON1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('storage','?'))" 2>/dev/null || echo "?")
DEDUPED1=$(echo "$JSON1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('deduped','?'))" 2>/dev/null || echo "?")
DISPATCH_ID=$(echo "$JSON1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('dispatch_id',''))" 2>/dev/null || echo "")

if [[ "$STATUS1" == "202" ]]; then
  ok "HTTP 202 — first dispatch accepted"
else
  fail "Expected HTTP 202, got: ${STATUS1}"
  PASS=false
fi

if [[ "$DEDUPED1" == "False" || "$DEDUPED1" == "false" ]]; then
  ok "deduped: false (correct — first dispatch)"
else
  warn "deduped was not false on first call: ${DEDUPED1}"
fi

if [[ "$STORAGE1" == "core" ]]; then
  ok "storage: core ✅ — persisting to gm_automation_events"
elif [[ "$STORAGE1" == "memory" ]]; then
  warn "storage: memory — gateway running WITHOUT CORE_SERVICE_KEY"
  warn "To get storage:core, restart the gateway:"
  echo ""
  echo "    kill \$(lsof -ti:4320)"
  echo "    CORE_SERVICE_KEY=${CORE_SERVICE_KEY} \\"
  echo "    CORE_URL=${CORE_URL} \\"
  echo "    pnpm run dev:gateway &"
  echo ""
  PASS=false
else
  warn "storage: ${STORAGE1}"
fi

# ─── Step 6: Smoke — Call 2 (dedup, same key) ────────────────────────────────
step "6/7  Smoke — Call 2 (repeat, expect 200 + deduped:true)"

RESP2=$(curl -s -w "\n__STATUS:%{http_code}" -XPOST "${GATEWAY_URL}/internal/automation/dispatch" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: ${INTERNAL_TOKEN}" \
  -H "X-Idempotency-Key: ${TEST_IDEMPOTENCY_KEY}" \
  -d "$BODY")

STATUS2=$(echo "$RESP2" | grep '__STATUS:' | cut -d: -f2)
JSON2=$(echo "$RESP2" | sed '/^__STATUS:/d')

info "Response: ${JSON2}"

DEDUPED2=$(echo "$JSON2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('deduped','?'))" 2>/dev/null || echo "?")
DISPATCH_ID2=$(echo "$JSON2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('dispatch_id',''))" 2>/dev/null || echo "")
STORAGE2=$(echo "$JSON2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('storage','?'))" 2>/dev/null || echo "?")

if [[ "$STATUS2" == "200" ]]; then
  ok "HTTP 200 — dedup handled"
else
  fail "Expected HTTP 200 on repeat, got: ${STATUS2}"
  PASS=false
fi

if [[ "$DEDUPED2" == "True" || "$DEDUPED2" == "true" ]]; then
  ok "deduped: true ✅"
else
  fail "Expected deduped:true on repeat call, got: ${DEDUPED2}"
  PASS=false
fi

if [[ -n "$DISPATCH_ID" && "$DISPATCH_ID" == "$DISPATCH_ID2" ]]; then
  ok "dispatch_id identical on both calls: ${DISPATCH_ID}"
else
  fail "dispatch_id mismatch: call1=${DISPATCH_ID} call2=${DISPATCH_ID2}"
  PASS=false
fi

# ─── Step 7: DB verification ──────────────────────────────────────────────────
step "7/7  DB verification — row count in gm_automation_events"

if [[ "$STORAGE1" == "core" ]]; then
  ROW_COUNT=$(psql_exec -tAq \
    -c "SELECT COUNT(*) FROM public.gm_automation_events WHERE idempotency_key = '${TEST_IDEMPOTENCY_KEY}';" \
    2>/dev/null || echo "err")

  if [[ "$ROW_COUNT" == "1" ]]; then
    ok "Exactly 1 row in gm_automation_events for this idempotency_key ✅"
  else
    fail "Expected 1 row, found: ${ROW_COUNT}"
    PASS=false
  fi

  DB_ROW=$(psql_exec -t \
    -c "SELECT id, restaurant_id, trigger, classification, status, idempotency_key, created_at FROM public.gm_automation_events WHERE idempotency_key = '${TEST_IDEMPOTENCY_KEY}';" \
    2>/dev/null || echo "query failed")

  info "DB row:"
  echo "$DB_ROW" | sed 's/^/    /'
else
  warn "Skipping DB row check (storage is not 'core' — restart gateway with CORE_SERVICE_KEY first)"
fi

# ─── Cleanup ──────────────────────────────────────────────────────────────────
cleanup

# ─── Final verdict ────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
if $PASS; then
  echo -e "${GREEN}  ✅ PASS — Dispatcher V1.1 persistence is production-grade     ${NC}"
  echo -e "${GREEN}     storage: ${STORAGE1} | dedup: confirmed | row count: 1     ${NC}"
else
  echo -e "${RED}  ❌ FAIL — See warnings above                                   ${NC}"
  if [[ "$STORAGE1" == "memory" ]]; then
    echo ""
    echo -e "${YELLOW}  Most common cause: gateway running without CORE_SERVICE_KEY    ${NC}"
    echo -e "${YELLOW}  Fix:                                                            ${NC}"
    echo -e "${YELLOW}    kill \$(lsof -ti:4320)                                        ${NC}"
    echo -e "${YELLOW}    CORE_SERVICE_KEY=${CORE_SERVICE_KEY} \\                       ${NC}"
    echo -e "${YELLOW}    CORE_URL=${CORE_URL} pnpm run dev:gateway                     ${NC}"
  fi
fi
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

$PASS || exit 1
