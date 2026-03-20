#!/bin/bash
# Smoke test for merchant-portal build output.
# Run after `npm -w merchant-portal run build` to verify critical paths.
# Usage: bash merchant-portal/scripts/smoke-test.sh
# Exit codes: 0 = pass, 1 = failure
set -euo pipefail

DIST_DIR="merchant-portal/dist"
FAILURES=0

# If called from merchant-portal/ directory, adjust path
if [ -d "dist" ] && [ ! -d "$DIST_DIR" ]; then
  DIST_DIR="dist"
fi

fail() {
  echo "FAIL: $1"
  FAILURES=$((FAILURES + 1))
}

warn() {
  echo "WARN: $1"
}

echo "========================================"
echo "  Smoke Test: Build Output Verification"
echo "========================================"
echo ""
echo "Checking build output in $DIST_DIR ..."
echo ""

# ---------------------------------------------------------------------------
# Section 1: Core Build Artifacts
# ---------------------------------------------------------------------------
echo "--- Section 1: Core Build Artifacts ---"

if [ ! -d "$DIST_DIR" ]; then
  echo "FAIL: $DIST_DIR/ not found. Did the build complete?"
  exit 1
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
  fail "index.html missing from build"
else
  echo "  index.html: OK"
fi

JS_COUNT=$(find "$DIST_DIR/assets" -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
if [ "$JS_COUNT" -eq 0 ]; then
  fail "No JS chunks found in $DIST_DIR/assets/"
else
  echo "  JS chunks: $JS_COUNT found"
fi

CSS_COUNT=$(find "$DIST_DIR/assets" -name "*.css" 2>/dev/null | wc -l | tr -d ' ')
if [ "$CSS_COUNT" -eq 0 ]; then
  fail "No CSS files found in $DIST_DIR/assets/"
else
  echo "  CSS files: $CSS_COUNT found"
fi

echo ""

# ---------------------------------------------------------------------------
# Section 2: Critical Route Verification
# ---------------------------------------------------------------------------
echo "--- Section 2: Critical Routes in Bundle ---"

CRITICAL_ROUTES=(
  "/login"
  "/onboarding"
  "/dashboard"
  "/pos"
  "/orders"
  "/menu"
  "/settings"
)

ROUTE_FAILURES=0
for route in "${CRITICAL_ROUTES[@]}"; do
  # Search for route string in JS bundles (Vite/React Router embeds them)
  if grep -rl "\"$route\"" "$DIST_DIR/assets/"*.js >/dev/null 2>&1 || \
     grep -rl "'$route'" "$DIST_DIR/assets/"*.js >/dev/null 2>&1; then
    echo "  Route $route: found"
  else
    warn "Route $route not found in JS bundles (may use dynamic import)"
    ROUTE_FAILURES=$((ROUTE_FAILURES + 1))
  fi
done

if [ "$ROUTE_FAILURES" -gt 3 ]; then
  fail "More than 3 critical routes missing from bundle. Possible routing misconfiguration."
fi

echo ""

# ---------------------------------------------------------------------------
# Section 3: Secrets Scan
# ---------------------------------------------------------------------------
echo "--- Section 3: Secrets Scan ---"

SECRETS_FOUND=0

if grep -rl "service_role" "$DIST_DIR" 2>/dev/null; then
  fail "service_role key found in build output!"
  SECRETS_FOUND=1
fi

if grep -rl "SUPABASE_SERVICE" "$DIST_DIR" 2>/dev/null; then
  fail "SUPABASE_SERVICE reference found in build output!"
  SECRETS_FOUND=1
fi

if grep -rlE "sk_live_|sk_test_" "$DIST_DIR" 2>/dev/null; then
  fail "Stripe secret key found in build output!"
  SECRETS_FOUND=1
fi

if grep -rlE "eyJhbGciOiJIUzI1NiIs" "$DIST_DIR" 2>/dev/null; then
  fail "Potential JWT token found in build output!"
  SECRETS_FOUND=1
fi

if [ "$SECRETS_FOUND" -eq 0 ]; then
  echo "  Secrets scan: clean"
fi

echo ""

# ---------------------------------------------------------------------------
# Section 4: Console.log Detection
# ---------------------------------------------------------------------------
echo "--- Section 4: Console.log in Production ---"

# Count raw console.log calls (exclude structured logger patterns like console.info/warn/error
# used by logging frameworks). Only flag console.log specifically.
CONSOLE_LOG_COUNT=$(grep -r 'console\.log(' "$DIST_DIR/assets/"*.js 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONSOLE_LOG_COUNT" -gt 0 ]; then
  warn "Found $CONSOLE_LOG_COUNT console.log() calls in production bundle."
  warn "Consider replacing with structured logger or removing."
  # Not a hard failure, but flagged for cleanup
fi

echo ""

# ---------------------------------------------------------------------------
# Section 5: PWA Assets
# ---------------------------------------------------------------------------
echo "--- Section 5: PWA Assets ---"

if [ -f "$DIST_DIR/manifest.json" ]; then
  # Validate JSON syntax
  if python3 -c "import json; json.load(open('$DIST_DIR/manifest.json'))" 2>/dev/null; then
    echo "  manifest.json: valid JSON"
  elif node -e "JSON.parse(require('fs').readFileSync('$DIST_DIR/manifest.json','utf8'))" 2>/dev/null; then
    echo "  manifest.json: valid JSON"
  else
    fail "manifest.json is not valid JSON"
  fi
else
  fail "manifest.json missing (PWA will not install)"
fi

if [ -f "$DIST_DIR/sw.js" ]; then
  echo "  Service worker (sw.js): present"
else
  warn "sw.js not found in build output. Service worker may be registered differently."
fi

echo ""

# ---------------------------------------------------------------------------
# Section 6: Bundle Size
# ---------------------------------------------------------------------------
echo "--- Section 6: Bundle Size ---"

TOTAL_SIZE=$(du -sk "$DIST_DIR" | cut -f1)
JS_SIZE=$(find "$DIST_DIR/assets" -name "*.js" -exec du -sk {} + 2>/dev/null | awk '{s+=$1} END {print s+0}')
CSS_SIZE=$(find "$DIST_DIR/assets" -name "*.css" -exec du -sk {} + 2>/dev/null | awk '{s+=$1} END {print s+0}')

echo "  Total: ${TOTAL_SIZE}KB"
echo "  JavaScript: ${JS_SIZE}KB"
echo "  CSS: ${CSS_SIZE}KB"

if [ "$TOTAL_SIZE" -gt 20000 ]; then
  fail "Bundle size exceeds 20MB limit: ${TOTAL_SIZE}KB"
elif [ "$TOTAL_SIZE" -gt 15000 ]; then
  warn "Bundle size approaching limit: ${TOTAL_SIZE}KB / 20000KB"
fi

echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "========================================"
if [ "$FAILURES" -gt 0 ]; then
  echo "  SMOKE TEST FAILED: $FAILURES failure(s)"
  echo "========================================"
  exit 1
else
  echo "  SMOKE TEST PASSED"
  echo "  $JS_COUNT JS chunks, $CSS_COUNT CSS files, ${TOTAL_SIZE}KB total"
  echo "========================================"
  exit 0
fi
