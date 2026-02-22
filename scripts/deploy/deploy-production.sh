#!/usr/bin/env bash
# Production deployment script with rollout monitoring
# Deploys merchant-portal to Vercel production
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

CHECK="✅"
CROSS="❌"
WARN="⚠️ "
INFO="ℹ️ "
ROCKET="🚀"

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  ${ROCKET} PRODUCTION DEPLOYMENT${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ==============================================================================
# Safety Confirmation
# ==============================================================================
echo -e "${YELLOW}${BOLD}⚠️  WARNING: This will deploy to PRODUCTION${NC}"
echo ""
echo "This deployment will:"
echo "  • Build merchant-portal with production optimizations"
echo "  • Deploy to Vercel production environment"
echo "  • Make changes live to ALL users"
echo "  • Upload sourcemaps to Sentry (if configured)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r CONFIRM
echo ""

if [[ ! "$CONFIRM" =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled by user${NC}"
    exit 0
fi

# ==============================================================================
# Pre-flight check
# ==============================================================================
echo -e "${BOLD}1️⃣  Running pre-flight checks...${NC}"
echo ""

if [[ -f "scripts/deploy/pre-flight-check.sh" ]]; then
    if bash scripts/deploy/pre-flight-check.sh; then
        echo ""
        echo -e "${GREEN}${CHECK} Pre-flight checks passed${NC}"
    else
        echo ""
        echo -e "${RED}${CROSS} Pre-flight checks FAILED${NC}"
        echo "Fix issues above before deploying"
        exit 1
    fi
else
    echo -e "${YELLOW}${WARN} Pre-flight script not found, skipping...${NC}"
fi
echo ""

# ==============================================================================
# Record deployment metadata
# ==============================================================================
echo -e "${BOLD}2️⃣  Recording deployment metadata...${NC}"
echo ""

DEPLOY_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
GIT_COMMIT=$(git rev-parse HEAD)
GIT_BRANCH=$(git branch --show-current)
DEPLOYER=$(git config user.email || echo "unknown")

cat > /tmp/deployment-metadata.json <<EOF
{
  "deployTime": "$DEPLOY_TIME",
  "gitCommit": "$GIT_COMMIT",
  "gitBranch": "$GIT_BRANCH",
  "deployer": "$DEPLOYER"
}
EOF

echo "   ${INFO} Time: $DEPLOY_TIME"
echo "   ${INFO} Commit: ${GIT_COMMIT:0:8}"
echo "   ${INFO} Branch: $GIT_BRANCH"
echo "   ${INFO} Deployer: $DEPLOYER"
echo ""

# ==============================================================================
# Deploy to Vercel
# ==============================================================================
echo -e "${BOLD}3️⃣  Deploying to Vercel...${NC}"
echo ""

cd merchant-portal

# Check if vercel.json exists
if [[ ! -f "vercel.json" ]]; then
    echo -e "${YELLOW}${WARN} vercel.json not found in merchant-portal${NC}"
    echo "Creating basic vercel.json..."
    cat > vercel.json <<'VERCEL_JSON'
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "pnpm install"
}
VERCEL_JSON
fi

# Deploy with production flag
echo "   Executing: vercel --prod"
echo ""

if vercel --prod > /tmp/vercel-deploy.log 2>&1; then
    echo -e "${GREEN}${CHECK} Deployment successful!${NC}"
    echo ""

    # Extract deployment URL
    DEPLOY_URL=$(grep -oP 'https://[^\s]+' /tmp/vercel-deploy.log | head -1 || echo "URL not found")
    echo "   ${INFO} Production URL: ${DEPLOY_URL}"

    # Save URL for smoke test
    echo "$DEPLOY_URL" > /tmp/production-url.txt
else
    echo -e "${RED}${CROSS} Deployment FAILED${NC}"
    echo ""
    echo "Error details:"
    cat /tmp/vercel-deploy.log | tail -30
    cd ..
    exit 1
fi

cd ..
echo ""

# ==============================================================================
# Verify deployment
# ==============================================================================
echo -e "${BOLD}4️⃣  Verifying deployment...${NC}"
echo ""

if [[ -f "/tmp/production-url.txt" ]]; then
    PROD_URL=$(cat /tmp/production-url.txt)

    echo "   Testing: ${PROD_URL}"

    # Wait for DNS propagation
    sleep 5

    # Check if site is reachable
    if curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" | grep -q "200"; then
        echo -e "   ${GREEN}${CHECK} Site is reachable (HTTP 200)${NC}"
    else
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
        echo -e "   ${YELLOW}${WARN} Site returned HTTP ${HTTP_CODE}${NC}"
    fi

    # Check if browser block is active (should redirect or show block screen)
    echo "   ${INFO} Verifying browser-block enforcement..."
    BLOCK_TEST=$(curl -s "$PROD_URL/op/tpv" | grep -c "browser-block\|device-only" || echo "0")
    if [[ "$BLOCK_TEST" -gt 0 ]]; then
        echo -e "   ${GREEN}${CHECK} Browser block is active${NC}"
    else
        echo -e "   ${YELLOW}${WARN} Browser block verification inconclusive${NC}"
    fi
else
    echo -e "   ${YELLOW}${WARN} Could not extract production URL${NC}"
fi
echo ""

# ==============================================================================
# Post-deployment checklist
# ==============================================================================
echo -e "${BOLD}5️⃣  Post-deployment checklist${NC}"
echo ""

echo "   [ ] Check Vercel dashboard: https://vercel.com/dashboard"
echo "   [ ] Check Sentry errors: https://sentry.io/"
echo "   [ ] Run smoke test: ./scripts/deploy/smoke-test.sh"
echo "   [ ] Follow T+1h checklist: ./scripts/rollout/t-plus-1h-checklist.sh"
echo ""

# ==============================================================================
# Summary & Next Steps
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  ${ROCKET} DEPLOYMENT COMPLETE${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}${BOLD}✨ Deployment successful!${NC}"
echo ""
echo -e "${BOLD}Deployment Time:${NC} $DEPLOY_TIME"
echo -e "${BOLD}Git Commit:${NC} ${GIT_COMMIT:0:8}"
echo ""

if [[ -f "/tmp/production-url.txt" ]]; then
    echo -e "${BOLD}Production URL:${NC}"
    cat /tmp/production-url.txt
    echo ""
fi

echo -e "${BOLD}Emergency Rollback:${NC}"
echo "  If issues occur, rollback immediately:"
echo "  $ vercel rollback"
echo "  Or via dashboard: https://vercel.com/dashboard"
echo ""

echo -e "${BOLD}Next Steps (T+0h → T+1h):${NC}"
echo "  1. Run smoke test: ./scripts/deploy/smoke-test.sh"
echo "  2. Monitor dashboards:"
echo "     - Sentry: https://sentry.io/"
echo "     - Vercel: https://vercel.com/dashboard"
echo "  3. Wait 1 hour, then run: ./scripts/rollout/t-plus-1h-checklist.sh"
echo ""

echo -e "${BOLD}Documentation:${NC}"
echo "  - Rollout Plan: docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md"
echo "  - Quick Reference: docs/ops/ROLLOUT_QUICK_REFERENCE.md"
echo ""

echo -e "${GREEN}${CHECK} Deployment pipeline completed successfully${NC}"
echo ""
