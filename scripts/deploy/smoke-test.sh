#!/usr/bin/env bash
# Smoke test for production deployment
# Validates critical functionality after deployment
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
echo -e "${BOLD}  🧪 SMOKE TEST - Production Validation${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get production URL
if [[ -f "/tmp/production-url.txt" ]]; then
    PROD_URL=$(cat /tmp/production-url.txt)
else
    read -p "Enter production URL: " PROD_URL
    echo "$PROD_URL" > /tmp/production-url.txt
fi

echo -e "${INFO} Testing: ${BOLD}${PROD_URL}${NC}"
echo ""

FAILURES=0
WARNINGS=0

# ==============================================================================
# 1. Site Reachability
# ==============================================================================
echo -e "${BOLD}1️⃣  Site Reachability${NC}"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" || echo "000")

if [[ "$HTTP_CODE" == "200" ]]; then
    echo -e "   ${GREEN}${CHECK} Site is reachable (HTTP 200)${NC}"
elif [[ "$HTTP_CODE" == "301" ]] || [[ "$HTTP_CODE" == "302" ]]; then
    echo -e "   ${GREEN}${CHECK} Site redirects (HTTP ${HTTP_CODE})${NC}"
else
    echo -e "   ${RED}${CROSS} Site unreachable (HTTP ${HTTP_CODE})${NC}"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# ==============================================================================
# 2. Critical Pages Load
# ==============================================================================
echo -e "${BOLD}2️⃣  Critical Pages Load${NC}"

PAGES=(
    "/"
    "/merchant"
    "/merchant/login"
)

for page in "${PAGES[@]}"; do
    PAGE_URL="${PROD_URL}${page}"
    PAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PAGE_URL" || echo "000")

    if [[ "$PAGE_CODE" == "200" ]] || [[ "$PAGE_CODE" == "301" ]] || [[ "$PAGE_CODE" == "302" ]]; then
        echo -e "   ${GREEN}${CHECK} ${page} (HTTP ${PAGE_CODE})${NC}"
    else
        echo -e "   ${RED}${CROSS} ${page} (HTTP ${PAGE_CODE})${NC}"
        FAILURES=$((FAILURES + 1))
    fi
done
echo ""

# ==============================================================================
# 3. Browser Block Enforcement
# ==============================================================================
echo -e "${BOLD}3️⃣  Browser Block Enforcement${NC}"

echo "   Testing operational routes (must block browser)..."

BLOCK_ROUTES=(
    "/op/tpv"
    "/op/kds"
    "/app/staff"
)

for route in "${BLOCK_ROUTES[@]}"; do
    ROUTE_URL="${PROD_URL}${route}"
    ROUTE_CONTENT=$(curl -s "$ROUTE_URL" || echo "")

    # Check if browser block screen is shown
    if echo "$ROUTE_CONTENT" | grep -qi "browser-block\|device-only\|install.*app\|pwa"; then
        echo -e "   ${GREEN}${CHECK} ${route} - Browser blocked correctly${NC}"
    else
        # Check if it's a redirect (also acceptable)
        ROUTE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ROUTE_URL")
        if [[ "$ROUTE_CODE" == "301" ]] || [[ "$ROUTE_CODE" == "302" ]]; then
            echo -e "   ${GREEN}${CHECK} ${route} - Redirects (HTTP ${ROUTE_CODE})${NC}"
        else
            echo -e "   ${RED}${CROSS} ${route} - Browser block NOT detected${NC}"
            FAILURES=$((FAILURES + 1))
        fi
    fi
done
echo ""

# ==============================================================================
# 4. Static Assets Load
# ==============================================================================
echo -e "${BOLD}4️⃣  Static Assets Load${NC}"

# Check if common assets are accessible
ASSETS=(
    "/assets/index.css"
    "/assets/index.js"
)

for asset in "${ASSETS[@]}"; do
    ASSET_URL="${PROD_URL}${asset}"
    ASSET_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ASSET_URL" 2>/dev/null || echo "000")

    if [[ "$ASSET_CODE" == "200" ]]; then
        echo -e "   ${GREEN}${CHECK} ${asset}${NC}"
    else
        # Assets may have hash in filename, so 404 is acceptable
        echo -e "   ${YELLOW}${WARN} ${asset} (HTTP ${ASSET_CODE}) - may have hash in filename${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# ==============================================================================
# 5. API Endpoints (if accessible)
# ==============================================================================
echo -e "${BOLD}5️⃣  API Endpoints${NC}"

# Check if internal API is configured
API_BASE=$(echo "$PROD_URL" | sed 's|merchant-portal|integration-gateway|' || echo "")

if [[ -n "$API_BASE" ]]; then
    API_HEALTH="${API_BASE}/health"
    API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_HEALTH" 2>/dev/null || echo "000")

    if [[ "$API_CODE" == "200" ]]; then
        echo -e "   ${GREEN}${CHECK} API health check passed${NC}"
    else
        echo -e "   ${YELLOW}${WARN} API health check failed (HTTP ${API_CODE})${NC}"
        echo "   ${INFO} This is expected if API is not deployed yet"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "   ${YELLOW}${WARN} Could not determine API endpoint${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 6. Performance Check
# ==============================================================================
echo -e "${BOLD}6️⃣  Performance Check${NC}"

echo "   Measuring response time..."
START_TIME=$(date +%s%N)
curl -s -o /dev/null "$PROD_URL"
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

echo "   ${INFO} Response time: ${RESPONSE_TIME}ms"

if [[ $RESPONSE_TIME -lt 1000 ]]; then
    echo -e "   ${GREEN}${CHECK} Response time < 1s (excellent)${NC}"
elif [[ $RESPONSE_TIME -lt 3000 ]]; then
    echo -e "   ${GREEN}${CHECK} Response time < 3s (good)${NC}"
else
    echo -e "   ${YELLOW}${WARN} Response time > 3s (consider optimization)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 7. Security Headers
# ==============================================================================
echo -e "${BOLD}7️⃣  Security Headers${NC}"

HEADERS=$(curl -s -I "$PROD_URL")

# Check for important security headers
if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo -e "   ${GREEN}${CHECK} X-Frame-Options present${NC}"
else
    echo -e "   ${YELLOW}${WARN} X-Frame-Options missing${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    echo -e "   ${GREEN}${CHECK} X-Content-Type-Options present${NC}"
else
    echo -e "   ${YELLOW}${WARN} X-Content-Type-Options missing${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    echo -e "   ${GREEN}${CHECK} HSTS enabled${NC}"
else
    echo -e "   ${YELLOW}${WARN} HSTS not configured${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 8. Sentry Integration (if configured)
# ==============================================================================
echo -e "${BOLD}8️⃣  Sentry Integration${NC}"

# Check if Sentry is referenced in the page
PAGE_CONTENT=$(curl -s "$PROD_URL")
if echo "$PAGE_CONTENT" | grep -qi "sentry.*js\|sentry-dsn"; then
    echo -e "   ${GREEN}${CHECK} Sentry integration detected${NC}"
else
    echo -e "   ${YELLOW}${WARN} Sentry integration not detected${NC}"
    echo "   ${INFO} This is acceptable if monitoring not yet configured"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  SMOKE TEST RESULTS${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [[ $FAILURES -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}${CHECK} SMOKE TEST PASSED${NC}"
    echo ""
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}${WARN} ${WARNINGS} warning(s) detected (non-critical)${NC}"
    fi
    echo ""
    echo -e "${BOLD}Production deployment validated successfully!${NC}"
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo "  1. Monitor error dashboards (Sentry, Vercel)"
    echo "  2. Set timer for T+1h internal testing"
    echo "  3. Run: ./scripts/rollout/t-plus-1h-checklist.sh"
    echo "  4. Follow: docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}${CROSS} SMOKE TEST FAILED${NC}"
    echo ""
    echo -e "${RED}${FAILURES} critical issue(s) detected${NC}"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}${WARNINGS} warning(s) also present${NC}"
    fi
    echo ""
    echo -e "${BOLD}${RED}⚠️  ROLLBACK RECOMMENDED${NC}"
    echo ""
    echo -e "${BOLD}Emergency rollback:${NC}"
    echo "  $ vercel rollback"
    echo "  Or via: https://vercel.com/dashboard"
    echo ""
    echo -e "${BOLD}Investigate failures above before proceeding${NC}"
    echo ""
    exit 1
fi
