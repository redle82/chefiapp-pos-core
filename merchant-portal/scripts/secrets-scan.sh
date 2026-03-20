#!/bin/bash
# secrets-scan.sh -- Scan build output for leaked secrets.
#
# Scans ALL .js and .css files in dist/ for patterns that indicate
# accidentally bundled secrets. Intended for CI integration.
#
# Usage:
#   bash merchant-portal/scripts/secrets-scan.sh
#   # or from merchant-portal/:
#   bash scripts/secrets-scan.sh
#
# Exit codes:
#   0 = clean (no secrets found)
#   1 = secrets detected (BLOCKS deployment)
set -euo pipefail

DIST_DIR="merchant-portal/dist"

# If called from merchant-portal/ directory, adjust path
if [ -d "dist" ] && [ ! -d "$DIST_DIR" ]; then
  DIST_DIR="dist"
fi

echo "========================================"
echo "  Secrets Scan: Build Output"
echo "========================================"
echo ""

if [ ! -d "$DIST_DIR" ]; then
  echo "SKIP: $DIST_DIR/ not found. Run build first."
  echo "  (This is OK in CI if build step hasn't run yet)"
  exit 0
fi

FILE_COUNT=$(find "$DIST_DIR" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" \) | wc -l | tr -d ' ')
echo "Scanning $FILE_COUNT files in $DIST_DIR ..."
echo ""

FAILURES=0

check_pattern() {
  local label="$1"
  local pattern="$2"
  local result

  result=$(grep -rl "$pattern" "$DIST_DIR" 2>/dev/null || true)

  if [ -n "$result" ]; then
    echo "FAIL: $label"
    echo "  Found in:"
    echo "$result" | while read -r f; do echo "    - $f"; done
    FAILURES=$((FAILURES + 1))
  else
    echo "  OK: $label"
  fi
}

check_pattern_extended() {
  local label="$1"
  local pattern="$2"
  local result

  result=$(grep -rlE "$pattern" "$DIST_DIR" 2>/dev/null || true)

  if [ -n "$result" ]; then
    echo "FAIL: $label"
    echo "  Found in:"
    echo "$result" | while read -r f; do echo "    - $f"; done
    FAILURES=$((FAILURES + 1))
  else
    echo "  OK: $label"
  fi
}

echo "--- Supabase ---"
check_pattern "service_role key reference" "service_role"
check_pattern "SUPABASE_SERVICE env var" "SUPABASE_SERVICE"
check_pattern_extended "Supabase service role JWT" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6"

echo ""
echo "--- Stripe ---"
check_pattern_extended "Stripe live secret key" "sk_live_[a-zA-Z0-9]{20,}"
check_pattern_extended "Stripe test secret key" "sk_test_[a-zA-Z0-9]{20,}"
check_pattern "Stripe webhook secret" "whsec_"

echo ""
echo "--- Generic Secrets ---"
check_pattern_extended "JWT secret env var" "jwt_secret"
check_pattern_extended "Private key PEM block" "-----BEGIN (RSA |EC )?PRIVATE KEY-----"
check_pattern_extended "Generic API secret pattern" "api[_-]?secret[[:space:]]*[:=]"
check_pattern "Database connection string" "postgresql://"
check_pattern "Database password" "DB_PASSWORD"

echo ""
echo "--- Environment Leak ---"
check_pattern "process.env reference" "process.env"
check_pattern "SUPABASE_URL without VITE prefix" "SUPABASE_URL"

echo ""

# Summary
echo "========================================"
if [ "$FAILURES" -gt 0 ]; then
  echo "  SECRETS SCAN: FAILED ($FAILURES pattern(s) found)"
  echo ""
  echo "  DO NOT DEPLOY. Review and remove leaked secrets."
  echo "========================================"
  exit 1
else
  echo "  SECRETS SCAN: CLEAN"
  echo "  Scanned $FILE_COUNT files -- no secrets detected."
  echo "========================================"
  exit 0
fi
