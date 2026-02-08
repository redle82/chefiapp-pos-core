#!/usr/bin/env bash
# =============================================================================
# Supreme E2E — Orquestra: contract-gate → Docker Core → seed → E2E → load → logs → PASS/FAIL
# =============================================================================
# Uso: ./scripts/supreme-e2e.sh  ou  make supreme-e2e  ou  npm run supreme:e2e
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${LOG_DIR:-./logs}"
AUDIT_DIR="${PROJECT_ROOT}/docs/audit"
REASONS=()
FAIL=0

mkdir -p "$LOG_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SUPREME E2E + STRESS — ChefIApp"
echo "  Docker Core = authority. Supabase only auth/session (pilot)."
echo "═══════════════════════════════════════════════════════════"
echo ""

# -----------------------------------------------------------------------------
# 1) Contract gate
# -----------------------------------------------------------------------------
echo "[1/7] Contract gate..."
if (cd "$PROJECT_ROOT" && make contract-gate) >> "$LOG_DIR/supreme-contract-gate.log" 2>&1; then
  REASONS+=("Contract gate: OK")
  echo "  OK"
else
  REASONS+=("Contract gate: FAIL")
  FAIL=1
  echo "  FAIL (see $LOG_DIR/supreme-contract-gate.log)"
fi
echo ""

# -----------------------------------------------------------------------------
# 2) Docker Core up
# -----------------------------------------------------------------------------
echo "[2/7] Docker Core..."
cd "$PROJECT_ROOT/docker-core"
if docker compose -f docker-compose.core.yml ps postgres 2>/dev/null | grep -q "running"; then
  echo "  Core already running"
else
  docker compose -f docker-compose.core.yml up -d
  echo "  Waiting for Postgres..."
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if docker compose -f docker-compose.core.yml exec -T postgres pg_isready -U postgres -d chefiapp_core 2>/dev/null; then
      break
    fi
    sleep 2
  done
  sleep 2
fi
if docker compose -f docker-compose.core.yml exec -T postgres pg_isready -U postgres -d chefiapp_core >/dev/null 2>&1; then
  REASONS+=("Docker Core: OK")
  echo "  OK"
else
  REASONS+=("Docker Core: FAIL (Postgres not ready)")
  FAIL=1
  echo "  FAIL"
fi
cd "$PROJECT_ROOT"
echo ""

# -----------------------------------------------------------------------------
# 3) Seed
# -----------------------------------------------------------------------------
echo "[3/7] Seed..."
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:54320/chefiapp_core}"
if (cd "$PROJECT_ROOT" && npx tsx scripts/supreme-seed.ts) >> "$LOG_DIR/supreme-seed.log" 2>&1; then
  REASONS+=("Seed: OK")
  echo "  OK"
else
  REASONS+=("Seed: FAIL")
  FAIL=1
  echo "  FAIL (see $LOG_DIR/supreme-seed.log)"
fi
echo ""

# -----------------------------------------------------------------------------
# 4) E2E Playwright (optional: start portal in background if not running)
# -----------------------------------------------------------------------------
echo "[4/7] E2E Playwright..."
PORT_PID=""
if [ -f "$PROJECT_ROOT/tests/e2e/playwright.config.ts" ]; then
  export E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}"
  if curl -sS --connect-timeout 2 "$E2E_BASE_URL" > /dev/null 2>&1; then
    echo "  Portal already at $E2E_BASE_URL"
  else
    echo "  Starting merchant portal in background..."
    (cd "$PROJECT_ROOT/merchant-portal" && npm run dev) >> "$LOG_DIR/supreme-portal.log" 2>&1 &
    PORT_PID=$!
    for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
      if curl -sS --connect-timeout 2 "$E2E_BASE_URL" > /dev/null 2>&1; then break; fi
      sleep 5
    done
  fi
  if (cd "$PROJECT_ROOT" && npx playwright test --config=tests/e2e/playwright.config.ts) >> "$LOG_DIR/supreme-e2e.log" 2>&1; then
    REASONS+=("E2E: OK")
    echo "  OK"
  else
    REASONS+=("E2E: FAIL")
    FAIL=1
    echo "  FAIL (see $LOG_DIR/supreme-e2e.log)"
  fi
  [ -n "$PORT_PID" ] && kill $PORT_PID 2>/dev/null || true
else
  echo "  Skip (no tests/e2e/playwright.config.ts)"
  REASONS+=("E2E: skip (no config)")
fi
echo ""

# -----------------------------------------------------------------------------
# 5) Load (k6)
# -----------------------------------------------------------------------------
echo "[5/7] Load (k6)..."
if command -v k6 >/dev/null 2>&1 && [ -f "$PROJECT_ROOT/tests/load/k6-orders.js" ]; then
  K6_OUT="$AUDIT_DIR/SUPREME_LOAD_RESULTS_$(date +%Y-%m-%d).md"
  if (cd "$PROJECT_ROOT" && k6 run tests/load/k6-orders.js --out json="$LOG_DIR/k6-orders.json") >> "$LOG_DIR/supreme-k6.log" 2>&1; then
    echo "  OK (report in $K6_OUT)"
    REASONS+=("Load: OK")
    echo "## Supreme Load — $(date -Iseconds)" > "$K6_OUT"
    echo "" >> "$K6_OUT"
    echo "k6 run completed. See \`logs/supreme-k6.log\` and \`logs/k6-orders.json\`." >> "$K6_OUT"
  else
    REASONS+=("Load: FAIL")
    FAIL=1
    echo "  FAIL (see $LOG_DIR/supreme-k6.log)"
  fi
else
  echo "  Skip (k6 not installed or tests/load/k6-orders.js missing)"
  REASONS+=("Load: skip")
fi
echo ""

# -----------------------------------------------------------------------------
# 6) Docker logs capture
# -----------------------------------------------------------------------------
echo "[6/7] Logs..."
(cd "$PROJECT_ROOT/docker-core" && docker compose -f docker-compose.core.yml logs --no-log-prefix) > "$LOG_DIR/docker-core.log" 2>&1 || true
echo "  Saved to $LOG_DIR/docker-core.log"
echo ""

# -----------------------------------------------------------------------------
# 7) Summary
# -----------------------------------------------------------------------------
echo "[7/7] Summary"
echo ""
echo "═══════════════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo "  PASS"
else
  echo "  FAIL"
fi
echo "═══════════════════════════════════════════════════════════"
for r in "${REASONS[@]}"; do
  echo "  $r"
done
echo "  Logs: $LOG_DIR"
echo ""

exit "$FAIL"
