#!/usr/bin/env bash
# Pre-flight check before production deployment
# Validates: release gate, environment variables, build health, monitoring setup
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
WARN="⚠️ "
INFO="ℹ️ "

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  PRE-FLIGHT CHECK - Production Deployment${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

FAILURES=0
WARNINGS=0

# ==============================================================================
# 1. Release Gate Verification
# ==============================================================================
echo -e "${BOLD}1️⃣  Release Gate Verification${NC}"
echo "   Running audit:release:portal..."
echo ""

if npm run audit:release:portal > /tmp/pre-flight-release.log 2>&1; then
    echo -e "   ${GREEN}${CHECK} Release gate PASSED${NC}"
    # Extract test summary
    if grep -q "Test Files:" /tmp/pre-flight-release.log; then
        echo ""
        grep -A 3 "Test Files:" /tmp/pre-flight-release.log | sed 's/^/   /'
    fi
else
    echo -e "   ${RED}${CROSS} Release gate FAILED${NC}"
    echo ""
    echo "   Error details:"
    tail -20 /tmp/pre-flight-release.log | sed 's/^/   /'
    FAILURES=$((FAILURES + 1))
fi
echo ""

# ==============================================================================
# 2. Environment Variables Check
# ==============================================================================
echo -e "${BOLD}2️⃣  Environment Variables Check${NC}"

# Check if .env.production exists
if [[ -f "merchant-portal/.env.production" ]]; then
    echo -e "   ${GREEN}${CHECK} .env.production exists${NC}"

    # Check critical variables
    REQUIRED_VARS=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "VITE_API_BASE"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" merchant-portal/.env.production && ! grep -q "^${var}=$" merchant-portal/.env.production; then
            echo -e "   ${GREEN}${CHECK} ${var} configured${NC}"
        else
            echo -e "   ${RED}${CROSS} ${var} missing or empty${NC}"
            FAILURES=$((FAILURES + 1))
        fi
    done

    # Check optional monitoring variables
    OPTIONAL_VARS=(
        "VITE_SENTRY_DSN"
        "VITE_SENTRY_AUTH_TOKEN"
        "VITE_SENTRY_ORG"
        "VITE_SENTRY_PROJECT"
    )

    echo ""
    echo "   Monitoring variables (optional):"
    for var in "${OPTIONAL_VARS[@]}"; do
        if grep -q "^${var}=" merchant-portal/.env.production && ! grep -q "^${var}=$" merchant-portal/.env.production; then
            echo -e "   ${GREEN}${CHECK} ${var} configured${NC}"
        else
            echo -e "   ${YELLOW}${WARN} ${var} not configured (monitoring limited)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "   ${YELLOW}${WARN} .env.production not found${NC}"
    echo "   ${INFO} Will use Vercel environment variables"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 3. Vercel CLI Check
# ==============================================================================
echo -e "${BOLD}3️⃣  Vercel CLI Check${NC}"

if command -v vercel &> /dev/null; then
    echo -e "   ${GREEN}${CHECK} Vercel CLI installed${NC}"
    VERCEL_VERSION=$(vercel --version)
    echo "   ${INFO} Version: ${VERCEL_VERSION}"

    # Check if logged in
    if vercel whoami &> /dev/null; then
        VERCEL_USER=$(vercel whoami 2>/dev/null || echo "unknown")
        echo -e "   ${GREEN}${CHECK} Logged in as: ${VERCEL_USER}${NC}"
    else
        echo -e "   ${RED}${CROSS} Not logged in to Vercel${NC}"
        echo "   ${INFO} Run: vercel login"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "   ${RED}${CROSS} Vercel CLI not installed${NC}"
    echo "   ${INFO} Install: npm i -g vercel"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# ==============================================================================
# 4. Build Health Check
# ==============================================================================
echo -e "${BOLD}4️⃣  Build Health Check${NC}"
echo "   Testing production build..."
echo ""

cd merchant-portal
if npm run build > /tmp/pre-flight-build.log 2>&1; then
    echo -e "   ${GREEN}${CHECK} Production build successful${NC}"

    # Check bundle size
    if [[ -d "dist" ]]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        echo "   ${INFO} Bundle size: ${DIST_SIZE}"

        # Check for large bundles (> 5MB warning)
        DIST_SIZE_KB=$(du -sk dist | cut -f1)
        if [[ $DIST_SIZE_KB -gt 5120 ]]; then
            echo -e "   ${YELLOW}${WARN} Bundle size > 5MB (consider optimization)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo -e "   ${RED}${CROSS} Production build FAILED${NC}"
    echo ""
    echo "   Error details:"
    tail -30 /tmp/pre-flight-build.log | sed 's/^/   /'
    FAILURES=$((FAILURES + 1))
fi
cd ..
echo ""

# ==============================================================================
# 5. Critical Files Check
# ==============================================================================
echo -e "${BOLD}5️⃣  Critical Files Check${NC}"

CRITICAL_FILES=(
    "merchant-portal/src/components/operational/BrowserBlockGuard.tsx"
    "merchant-portal/src/components/operational/BrowserBlockGuard.test.tsx"
    "docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md"
    "docs/ops/ROLLOUT_QUICK_REFERENCE.md"
    "docs/ops/MONITORING_DASHBOARD_SETUP.md"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "   ${GREEN}${CHECK} ${file}${NC}"
    else
        echo -e "   ${RED}${CROSS} ${file} missing${NC}"
        FAILURES=$((FAILURES + 1))
    fi
done
echo ""

# ==============================================================================
# 6. Git Status Check
# ==============================================================================
echo -e "${BOLD}6️⃣  Git Status Check${NC}"

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "   ${YELLOW}${WARN} Uncommitted changes detected${NC}"
    echo ""
    git status --short | head -10 | sed 's/^/   /'
    if [[ $(git status --porcelain | wc -l) -gt 10 ]]; then
        echo "   ... and $(($(git status --porcelain | wc -l) - 10)) more"
    fi
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "   ${GREEN}${CHECK} Working directory clean${NC}"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "   ${INFO} Current branch: ${CURRENT_BRANCH}"

if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo -e "   ${YELLOW}${WARN} Not on main branch${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ==============================================================================
# 7. Browser Block Guard Verification
# ==============================================================================
echo -e "${BOLD}7️⃣  Browser Block Guard Verification${NC}"

# Fail only on lines that look like a DEV bypass (allow render when DEV). Legitimate
# use of import.meta.env.DEV (e.g. isDev for telemetry only) does not contain return/Outlet.
if grep "import\.meta\.env\.DEV" merchant-portal/src/components/operational/BrowserBlockGuard.tsx 2>/dev/null | grep -qE "return|<Outlet|Outlet />"; then
    echo -e "   ${RED}${CROSS} DEV bypass code still present (import.meta.env.DEV with return/Outlet on same line)!${NC}"
    FAILURES=$((FAILURES + 1))
else
    echo -e "   ${GREEN}${CHECK} No DEV bypass in guard (production-ready)${NC}"
fi

# Check that test exists and uses correct pattern
if [[ -f "merchant-portal/src/components/operational/BrowserBlockGuard.test.tsx" ]]; then
    if grep -q "should block browser access in all environments" merchant-portal/src/components/operational/BrowserBlockGuard.test.tsx; then
        echo -e "   ${GREEN}${CHECK} Regression test in place${NC}"
    else
        echo -e "   ${YELLOW}${WARN} Test exists but may be outdated${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  SUMMARY${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [[ $FAILURES -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}${CHECK} PRE-FLIGHT CHECK PASSED${NC}"
    echo ""
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}${WARN} ${WARNINGS} warning(s) - review recommended but not blocking${NC}"
    fi
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo "  1. Review warnings above (if any)"
    echo "  2. Run: ./scripts/deploy/deploy-production.sh"
    echo "  3. Follow: docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}${CROSS} PRE-FLIGHT CHECK FAILED${NC}"
    echo ""
    echo -e "${RED}${FAILURES} critical issue(s) must be resolved before deployment${NC}"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}${WARNINGS} warning(s) should also be reviewed${NC}"
    fi
    echo ""
    echo -e "${BOLD}Action required:${NC}"
    echo "  1. Fix all failures marked with ${RED}${CROSS}${NC} above"
    echo "  2. Re-run this script"
    echo "  3. DO NOT deploy until pre-flight passes"
    echo ""
    exit 1
fi
