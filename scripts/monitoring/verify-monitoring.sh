#!/usr/bin/env bash
# Verify monitoring setup before deployment
# Checks Sentry, Vercel, and observability infrastructure
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
echo -e "${BOLD}  🔍 MONITORING VERIFICATION${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

FAILURES=0
WARNINGS=0

# ==============================================================================
# 1. Sentry Configuration Check
# ==============================================================================
echo -e "${BOLD}1️⃣  Sentry Configuration${NC}"
echo ""

# Check if Sentry config exists
if [[ -f ".sentry/config.json" ]]; then
    echo -e "   ${GREEN}${CHECK} Sentry configuration file exists${NC}"

    SENTRY_ORG=$(grep -oP '"org":\s*"\K[^"]+' .sentry/config.json || echo "")
    SENTRY_PROJECT=$(grep -oP '"project":\s*"\K[^"]+' .sentry/config.json || echo "")

    if [[ -n "$SENTRY_ORG" ]] && [[ -n "$SENTRY_PROJECT" ]]; then
        echo "   ${INFO} Organization: ${SENTRY_ORG}"
        echo "   ${INFO} Project: ${SENTRY_PROJECT}"
    fi
else
    echo -e "   ${YELLOW}${WARN} Sentry configuration file not found${NC}"
    echo "   ${INFO} Run: ./scripts/monitoring/setup-sentry.sh"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 2. Environment Variables Check
# ==============================================================================
echo -e "${BOLD}2️⃣  Environment Variables${NC}"
echo ""

cd merchant-portal

# Check Vercel environment variables
echo "   Checking Vercel production environment..."

VERCEL_ENV_CHECK=$(vercel env ls production 2>/dev/null || echo "")

SENTRY_VARS=(
    "VITE_SENTRY_DSN"
    "VITE_SENTRY_AUTH_TOKEN"
    "VITE_SENTRY_ORG"
    "VITE_SENTRY_PROJECT"
)

for var in "${SENTRY_VARS[@]}"; do
    if echo "$VERCEL_ENV_CHECK" | grep -q "$var"; then
        echo -e "   ${GREEN}${CHECK} ${var} configured in Vercel${NC}"
    else
        echo -e "   ${YELLOW}${WARN} ${var} not found in Vercel${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

cd ..
echo ""

# ==============================================================================
# 3. Sentry Integration Check
# ==============================================================================
echo -e "${BOLD}3️⃣  Sentry Integration${NC}"
echo ""

# Check if Sentry is imported in the app
if grep -r "@sentry/react" merchant-portal/src > /dev/null 2>&1; then
    echo -e "   ${GREEN}${CHECK} Sentry SDK imported${NC}"
else
    echo -e "   ${RED}${CROSS} Sentry SDK not found in code${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Check for Sentry initialization
if grep -r "Sentry.init" merchant-portal/src > /dev/null 2>&1; then
    echo -e "   ${GREEN}${CHECK} Sentry initialization found${NC}"
else
    echo -e "   ${YELLOW}${WARN} Sentry.init not found (may be conditional)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for ErrorBoundary
if [[ -f "merchant-portal/src/ui/design-system/ErrorBoundary.tsx" ]]; then
    echo -e "   ${GREEN}${CHECK} ErrorBoundary component exists${NC}"
else
    echo -e "   ${YELLOW}${WARN} ErrorBoundary not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for Logger service
if [[ -f "merchant-portal/src/core/logger/Logger.ts" ]]; then
    echo -e "   ${GREEN}${CHECK} Logger service exists${NC}"
else
    echo -e "   ${YELLOW}${WARN} Logger service not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 4. Vite Configuration Check
# ==============================================================================
echo -e "${BOLD}4️⃣  Vite Configuration${NC}"
echo ""

if [[ -f "merchant-portal/vite.config.ts" ]]; then
    # Check for Sentry plugin
    if grep -q "@sentry/vite-plugin" merchant-portal/vite.config.ts; then
        echo -e "   ${GREEN}${CHECK} Sentry Vite plugin configured${NC}"
    else
        echo -e "   ${YELLOW}${WARN} Sentry Vite plugin not found${NC}"
        echo "   ${INFO} Sourcemaps may not be uploaded automatically"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for sourcemap configuration
    if grep -q "sourcemap: true" merchant-portal/vite.config.ts; then
        echo -e "   ${GREEN}${CHECK} Sourcemaps enabled${NC}"
    else
        echo -e "   ${YELLOW}${WARN} Sourcemaps may not be enabled${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "   ${RED}${CROSS} vite.config.ts not found${NC}"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# ==============================================================================
# 5. Analytics Check
# ==============================================================================
echo -e "${BOLD}5️⃣  Analytics Integration${NC}"
echo ""

if [[ -f "merchant-portal/src/analytics/track.ts" ]]; then
    echo -e "   ${GREEN}${CHECK} Analytics tracking service exists${NC}"
else
    echo -e "   ${YELLOW}${WARN} Analytics tracking not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [[ -f "merchant-portal/src/core/observability/errorsStore.ts" ]]; then
    echo -e "   ${GREEN}${CHECK} Errors store exists${NC}"
else
    echo -e "   ${YELLOW}${WARN} Errors store not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 6. Sentry API Connection Test
# ==============================================================================
echo -e "${BOLD}6️⃣  Sentry API Connection${NC}"
echo ""

if [[ -f ".sentry/config.json" ]]; then
    SENTRY_ORG=$(grep -oP '"org":\s*"\K[^"]+' .sentry/config.json 2>/dev/null || echo "")

    if [[ -n "$SENTRY_ORG" ]]; then
        echo "   Testing connection to Sentry API..."

        # Try to fetch Sentry projects (requires auth token via env var)
        if [[ -n "${SENTRY_AUTH_TOKEN:-}" ]]; then
            API_TEST=$(curl -s -w "%{http_code}" -o /dev/null \
                -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" \
                "https://sentry.io/api/0/organizations/${SENTRY_ORG}/" || echo "000")

            if [[ "$API_TEST" == "200" ]]; then
                echo -e "   ${GREEN}${CHECK} Sentry API connection successful${NC}"
            else
                echo -e "   ${YELLOW}${WARN} Sentry API connection failed (HTTP ${API_TEST})${NC}"
                WARNINGS=$((WARNINGS + 1))
            fi
        else
            echo -e "   ${YELLOW}${WARN} SENTRY_AUTH_TOKEN not set (skipping API test)${NC}"
            echo "   ${INFO} Set env var to test: export SENTRY_AUTH_TOKEN=..."
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo -e "   ${YELLOW}${WARN} Skipping (no Sentry config)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 7. Documentation Check
# ==============================================================================
echo -e "${BOLD}7️⃣  Monitoring Documentation${NC}"
echo ""

DOCS=(
    "docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md"
    "docs/ops/ROLLOUT_QUICK_REFERENCE.md"
    "docs/ops/MONITORING_DASHBOARD_SETUP.md"
    "docs/ops/OBSERVABILITY_SETUP.md"
)

for doc in "${DOCS[@]}"; do
    if [[ -f "$doc" ]]; then
        echo -e "   ${GREEN}${CHECK} ${doc}${NC}"
    else
        echo -e "   ${YELLOW}${WARN} ${doc} missing${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  VERIFICATION RESULTS${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [[ $FAILURES -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}${CHECK} MONITORING VERIFICATION PASSED${NC}"
    echo ""
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}${WARN} ${WARNINGS} warning(s) detected${NC}"
        echo "   Review warnings above - most are non-blocking"
    fi
    echo ""
    echo -e "${BOLD}Monitoring Status: Ready for Production${NC}"
    echo ""
    echo -e "${BOLD}Quick Links:${NC}"
    if [[ -f ".sentry/config.json" ]]; then
        SENTRY_ORG=$(grep -oP '"org":\s*"\K[^"]+' .sentry/config.json 2>/dev/null || echo "")
        if [[ -n "$SENTRY_ORG" ]]; then
            echo "  • Sentry Issues: https://sentry.io/organizations/${SENTRY_ORG}/issues/"
            echo "  • Sentry Performance: https://sentry.io/organizations/${SENTRY_ORG}/performance/"
        fi
    fi
    echo "  • Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo "  1. Deploy to production: ./scripts/deploy/deploy-production.sh"
    echo "  2. Run smoke test: ./scripts/deploy/smoke-test.sh"
    echo "  3. Monitor dashboards during rollout"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}${CROSS} MONITORING VERIFICATION FAILED${NC}"
    echo ""
    echo -e "${RED}${FAILURES} critical issue(s) detected${NC}"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}${WARNINGS} warning(s) also present${NC}"
    fi
    echo ""
    echo -e "${BOLD}Action required:${NC}"
    echo "  1. Fix critical failures marked with ${RED}${CROSS}${NC}"
    echo "  2. Configure monitoring: ./scripts/monitoring/setup-sentry.sh"
    echo "  3. Re-run verification"
    echo ""
    echo -e "${YELLOW}⚠️  Deploying without monitoring is NOT recommended${NC}"
    echo ""
    exit 1
fi
