#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TRUTH SUITE RUNNER — ChefIApp Phase 0 Truth Lock Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# This script runs the Playwright Truth Suite which validates that:
#   1. UI NEVER anticipates the Core
#   2. UI NEVER fakes success, progress, or connectivity
#   3. Demo mode requires EXPLICIT consent
#   4. All critical actions are GATED by health status
#
# Usage:
#   ./run-truth-tests.sh              # Run all truth tests
#   ./run-truth-tests.sh --headed     # Run with browser visible
#   ./run-truth-tests.sh --grep "health" # Run only health tests
#   ./run-truth-tests.sh --debug      # Debug mode
#
# Test Categories:
#   truth.health.spec.ts    — Core health monitoring
#   truth.gating.spec.ts    — Action gating when unhealthy
#   truth.tpv.spec.ts       — Offline queue reconciliation
#   truth.creating.spec.ts  — Restaurant creation flow
#   truth.publish.spec.ts   — Publishing flow
#   truth.payments.spec.ts  — Stripe validation flow
#   truth.banner.spec.ts    — Core status banner
#   truth.microcopy.spec.ts — Forbidden patterns audit
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

cd "$(dirname "$0")"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TRUTH SUITE — Phase 0 Contract Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Doctrine: UI NEVER anticipates the Core"
echo ""

npx playwright test tests/playwright/truth --config=playwright.config.truth.ts "$@"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TRUTH SUITE COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
