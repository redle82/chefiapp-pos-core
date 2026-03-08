#!/usr/bin/env bash
set -euo pipefail

# AUDIT 360 orchestrator (manual services must be running)
# - Generates surface map
# - Runs UI click audit
# - Optionally runs payments audit (set AUDIT_PAYMENT=1 and AUDIT_STRIPE_PK)
#
# Env:
#   AUDIT_BASE_URL (default http://127.0.0.1:5173)
#   AUDIT_ROUTES (csv)
#   HEADED=1 to see browser
#   AUDIT_PAYMENT=1 AUDIT_STRIPE_PK=... to enable payments audit

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AUDIT 360 — Surface + UI Click"
echo "  BASE_URL=${AUDIT_BASE_URL:-http://127.0.0.1:5173}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

node scripts/audit-surface-map.js

npx playwright test tests/playwright/audit360/ui-click.audit.spec.ts --config=playwright.config.audit.ts "$@"

if [[ "${AUDIT_PAYMENT:-0}" == "1" ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  AUDIT 360 — Payments"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  npx playwright test tests/playwright/audit360/payments.audit.spec.ts --config=playwright.config.audit.ts "$@"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AUDIT 360 COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
