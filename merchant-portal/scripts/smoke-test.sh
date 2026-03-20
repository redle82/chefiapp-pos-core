#!/bin/bash
# Smoke test for merchant-portal build output.
# Run after `npm -w merchant-portal run build` to verify critical paths.
# Usage: bash merchant-portal/scripts/smoke-test.sh
set -e

DIST_DIR="merchant-portal/dist"

# If called from merchant-portal/ directory, adjust path
if [ -d "dist" ] && [ ! -d "$DIST_DIR" ]; then
  DIST_DIR="dist"
fi

echo "Smoke Test: Checking build output in $DIST_DIR ..."

# --- Check dist exists ---
if [ ! -d "$DIST_DIR" ]; then
  echo "FAIL: $DIST_DIR/ not found"
  exit 1
fi

# --- Check index.html exists ---
if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "FAIL: index.html missing from build"
  exit 1
fi
echo "  index.html: OK"

# --- Check JS chunks exist ---
JS_COUNT=$(find "$DIST_DIR/assets" -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
if [ "$JS_COUNT" -eq 0 ]; then
  echo "FAIL: No JS chunks found in $DIST_DIR/assets/"
  exit 1
fi
echo "  JS chunks: $JS_COUNT found"

# --- Check CSS exists ---
CSS_COUNT=$(find "$DIST_DIR/assets" -name "*.css" 2>/dev/null | wc -l | tr -d ' ')
echo "  CSS files: $CSS_COUNT found"

# --- Check no secrets leaked into build ---
SECRETS_FOUND=0

if grep -rl "service_role" "$DIST_DIR" 2>/dev/null; then
  echo "FAIL: service_role key found in build output!"
  SECRETS_FOUND=1
fi

if grep -rl "SUPABASE_SERVICE" "$DIST_DIR" 2>/dev/null; then
  echo "FAIL: SUPABASE_SERVICE reference found in build output!"
  SECRETS_FOUND=1
fi

if grep -rlE "sk_live_|sk_test_" "$DIST_DIR" 2>/dev/null; then
  echo "FAIL: Stripe secret key found in build output!"
  SECRETS_FOUND=1
fi

if [ "$SECRETS_FOUND" -eq 1 ]; then
  echo "FAIL: SECRETS DETECTED IN BUILD OUTPUT"
  exit 1
fi
echo "  Secrets scan: clean"

# --- Check bundle size ---
TOTAL_SIZE=$(du -sk "$DIST_DIR" | cut -f1)
echo "  Total size: ${TOTAL_SIZE}KB"

if [ "$TOTAL_SIZE" -gt 20000 ]; then
  echo "WARN: Bundle size exceeds 20MB: ${TOTAL_SIZE}KB"
fi

# --- Check manifest.json (PWA) ---
if [ -f "$DIST_DIR/manifest.json" ]; then
  echo "  manifest.json: present"
else
  echo "  manifest.json: missing (PWA may not work)"
fi

echo ""
echo "Smoke test passed ($JS_COUNT JS chunks, ${TOTAL_SIZE}KB total)"
