#!/usr/bin/env bash
# T+1h Internal Testing Checklist
# Interactive checklist for first hour after production deployment
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

CHECK="✅"
CROSS="❌"
WARN="⚠️ "
INFO="ℹ️ "

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  ⏱️  T+1H INTERNAL TESTING CHECKLIST${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

DEPLOY_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
echo "   Checklist started: ${DEPLOY_TIME}"
echo ""

PASSED=0
FAILED=0
SKIPPED=0

# ==============================================================================
# Helper Functions
# ==============================================================================

ask_check() {
    local question="$1"
    local detail="${2:-}"

    echo -e "${BOLD}${question}${NC}"
    if [[ -n "$detail" ]]; then
        echo "   ${INFO} ${detail}"
    fi

    while true; do
        read -p "   [y/n/s (skip)]: " -n 1 -r
        echo ""
        case $REPLY in
            [Yy])
                echo -e "   ${GREEN}${CHECK} Confirmed${NC}"
                PASSED=$((PASSED + 1))
                echo ""
                return 0
                ;;
            [Nn])
                echo -e "   ${RED}${CROSS} Failed${NC}"
                FAILED=$((FAILED + 1))
                echo ""
                return 1
                ;;
            [Ss])
                echo -e "   ${YELLOW}⊘ Skipped${NC}"
                SKIPPED=$((SKIPPED + 1))
                echo ""
                return 2
                ;;
            *)
                echo "   Invalid input. Use y (yes), n (no), or s (skip)"
                ;;
        esac
    done
}

# ==============================================================================
# Pre-check: Deployment Info
# ==============================================================================
echo -e "${BOLD}📋 Deployment Information${NC}"
echo ""

if [[ -f "/tmp/production-url.txt" ]]; then
    PROD_URL=$(cat /tmp/production-url.txt)
    echo "   Production URL: ${PROD_URL}"
else
    read -p "   Enter production URL: " PROD_URL
    echo "$PROD_URL" > /tmp/production-url.txt
fi

echo ""
read -p "   Deployment time (or press Enter for 1h ago): " DEPLOY_INPUT
if [[ -z "$DEPLOY_INPUT" ]]; then
    DEPLOY_HOUR=$(date -u -v-1H +"%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || date -u -d '1 hour ago' +"%Y-%m-%d %H:%M:%S UTC")
else
    DEPLOY_HOUR="$DEPLOY_INPUT"
fi

echo ""
echo "   ${INFO} Testing window: ${DEPLOY_HOUR} → Now"
echo ""

# ==============================================================================
# Section 1: Device Access Tests
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}1️⃣  Device Access Tests (2 Test Devices Required)${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "Device 1: PWA installed successfully on iOS/Android?" \
    "Open ${PROD_URL} in Safari/Chrome → Share → Add to Home Screen"

ask_check "Device 1: AppStaff loads and shows home screen?" \
    "Navigate to /app/staff/home after PWA installation"

ask_check "Device 2: TPV installed and accessible?" \
    "Install PWA, navigate to /op/tpv"

ask_check "Device 2: TPV shows operational interface (not block screen)?" \
    "Verify TPV loads the full operational UI"

# ==============================================================================
# Section 2: Browser Block Verification
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}2️⃣  Browser Block Verification (CRITICAL)${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "Desktop browser: /op/tpv shows block screen?" \
    "Open ${PROD_URL}/op/tpv in Chrome/Firefox (NOT installed PWA)"

ask_check "Desktop browser: /op/tpv does NOT allow access?" \
    "CRITICAL: Must show 'Install app' message, not operational UI"

ask_check "Desktop browser: /op/kds shows block screen?" \
    "Test ${PROD_URL}/op/kds"

ask_check "Desktop browser: /app/staff shows block screen?" \
    "Test ${PROD_URL}/app/staff"

if [[ $FAILED -gt 0 ]]; then
    echo ""
    echo -e "${RED}${BOLD}⚠️  CRITICAL: Browser block failures detected!${NC}"
    echo -e "${RED}Consider immediate rollback if browser access allowed${NC}"
    echo ""
fi

# ==============================================================================
# Section 3: Core Functionality Tests
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}3️⃣  Core Functionality Tests${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask_check "Login works on installed PWA?" \
    "Test authentication flow"

ask_check "Menu/products load correctly?" \
    "Check that menu data appears"

ask_check "Create test order succeeds?" \
    "Full flow: select items → add to cart → confirm"

ask_check "Payment flow accessible (do not process real payment)?" \
    "Verify payment UI appears"

ask_check "Order appears in KDS/AppStaff?" \
    "Check order synchronization between modules"

# ==============================================================================
# Section 4: Error Monitoring
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}4️⃣  Error Monitoring${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Check Sentry dashboard for errors in last hour"
echo "   Dashboard: https://sentry.io/"
echo ""

ask_check "Sentry: Error rate < 1% ?" \
    "Check Issues tab for error count vs. total events"

ask_check "Sentry: No critical unhandled errors?" \
    "Look for red 'Unhandled' labels"

ask_check "Sentry: Browser-block bypass count = 0?" \
    "Search for events matching /op/ routes from non-installed contexts"

# ==============================================================================
# Section 5: Performance Check
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}5️⃣  Performance Check${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Check Vercel Analytics: https://vercel.com/dashboard"
echo ""

ask_check "Vercel: Build successful with no warnings?" \
    "Check deployment logs"

ask_check "Vercel: LCP (Largest Contentful Paint) < 2.5s ?" \
    "Check Speed Insights tab"

ask_check "Performance feels responsive on test devices?" \
    "Subjective check: app loads quickly, interactions smooth"

# ==============================================================================
# Section 6: Core RPC Health
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}6️⃣  Core RPC Health${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Check Supabase dashboard for database health"
echo ""

ask_check "Supabase: Connection pool healthy (< 90% used)?" \
    "Check Database > Connection pooling"

ask_check "Supabase: No slow queries or timeouts?" \
    "Check Logs for slow query warnings"

ask_check "API responses fast (subjective check)?" \
    "Interactions with backend feel responsive"

# ==============================================================================
# Decision Point
# ==============================================================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  📊 T+1H CHECKLIST SUMMARY${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
echo "   Checks passed:  ${GREEN}${PASSED}${NC} / ${TOTAL}"
echo "   Checks failed:  ${RED}${FAILED}${NC} / ${TOTAL}"
echo "   Checks skipped: ${YELLOW}${SKIPPED}${NC} / ${TOTAL}"
echo ""

# Calculate failure rate
if [[ $TOTAL -gt 0 ]]; then
    FAIL_RATE=$(( (FAILED * 100) / TOTAL ))
else
    FAIL_RATE=0
fi

# GO/NO-GO Decision
echo -e "${BOLD}━━━ GO/NO-GO DECISION ━━━${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✅ GO - Proceed to T+6h Pilot Phase${NC}"
    echo ""
    echo "All critical checks passed. Ready to expand rollout."
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo "  1. Continue monitoring dashboards"
    echo "  2. Set timer for T+6h"
    echo "  3. Run: ./scripts/rollout/t-plus-6h-checklist.sh"
    echo ""
    echo "Documentation: docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md"
    echo ""
    exit 0
elif [[ $FAIL_RATE -lt 20 ]]; then
    echo -e "${YELLOW}${BOLD}⚠️  CONDITIONAL GO - Review failures and decide${NC}"
    echo ""
    echo "Some checks failed but failure rate < 20%."
    echo ""
    read -p "Proceed to pilot phase despite failures? (yes/no): " -r DECISION
    if [[ "$DECISION" =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        echo -e "${YELLOW}Proceeding with caution...${NC}"
        echo "Monitor closely during pilot phase."
        echo ""
        exit 0
    else
        echo ""
        echo -e "${RED}Rollout paused by operator${NC}"
        echo ""
        exit 1
    fi
else
    echo -e "${RED}${BOLD}❌ NO-GO - ROLLBACK RECOMMENDED${NC}"
    echo ""
    echo "Failure rate: ${FAIL_RATE}% (threshold: 20%)"
    echo ""
    echo -e "${BOLD}Critical failures detected. Recommended actions:${NC}"
    echo "  1. Review failed checks above"
    echo "  2. Check error logs in Sentry"
    echo "  3. Consider rollback: vercel rollback"
    echo ""
    echo -e "${RED}DO NOT proceed to pilot phase until issues resolved${NC}"
    echo ""
    exit 1
fi
