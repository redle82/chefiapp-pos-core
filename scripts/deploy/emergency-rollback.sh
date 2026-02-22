#!/usr/bin/env bash
# Emergency Rollback Script
# Quick rollback with verification for production incidents
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

echo -e "${BOLD}${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${RED}  ⚠️  EMERGENCY ROLLBACK${NC}"
echo -e "${BOLD}${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ROLLBACK_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
echo "   Initiated: ${ROLLBACK_TIME}"
echo ""

# ==============================================================================
# Safety Confirmation
# ==============================================================================
echo -e "${BOLD}${RED}This will roll back the production deployment.${NC}"
echo ""
echo "   ${INFO} All users will be served the previous version"
echo "   ${INFO} Current deployment will remain in history"
echo "   ${INFO} This action can be reversed"
echo ""

read -p "Reason for rollback: " ROLLBACK_REASON
echo ""

echo -e "${BOLD}Are you sure you want to roll back?${NC}"
read -p "Type 'ROLLBACK' to confirm: " CONFIRM

if [[ "$CONFIRM" != "ROLLBACK" ]]; then
    echo ""
    echo -e "${YELLOW}Rollback cancelled by operator${NC}"
    echo ""
    exit 0
fi

echo ""
echo -e "${RED}${BOLD}Proceeding with rollback...${NC}"
echo ""

# ==============================================================================
# Check Vercel CLI
# ==============================================================================
echo "1️⃣  Checking Vercel CLI..."
echo ""

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}${CROSS} Vercel CLI not found${NC}"
    echo ""
    echo "Install:"
    echo "  $ npm install -g vercel"
    echo ""
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo -e "${RED}${CROSS} Not authenticated with Vercel${NC}"
    echo ""
    echo "Login:"
    echo "  $ vercel login"
    echo ""
    exit 1
fi

echo -e "   ${GREEN}${CHECK} Vercel CLI ready${NC}"
echo ""

# ==============================================================================
# Get Current Deployment Info
# ==============================================================================
echo "2️⃣  Analyzing current deployment..."
echo ""

cd merchant-portal || {
    echo -e "${RED}${CROSS} merchant-portal directory not found${NC}"
    exit 1
}

# Get deployments list
DEPLOYMENTS=$(vercel ls --prod --json 2>/dev/null | jq -r '.deployments[] | "\(.uid)|\(.url)|\(.created)"' | head -5)

if [[ -z "$DEPLOYMENTS" ]]; then
    echo -e "${RED}${CROSS} Could not retrieve deployments${NC}"
    echo ""
    echo "Check Vercel project configuration."
    exit 1
fi

echo "   Recent production deployments:"
echo ""

declare -a DEPLOY_UIDS
declare -a DEPLOY_URLS
declare -a DEPLOY_DATES

INDEX=1
while IFS='|' read -r uid url created; do
    DEPLOY_UIDS[$INDEX]=$uid
    DEPLOY_URLS[$INDEX]=$url

    # Convert timestamp to readable date
    if command -v date &> /dev/null; then
        READABLE_DATE=$(date -r "$((created / 1000))" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$created")
    else
        READABLE_DATE="$created"
    fi
    DEPLOY_DATES[$INDEX]=$READABLE_DATE

    if [[ $INDEX -eq 1 ]]; then
        echo "      ${INDEX}. ${uid:0:10}... (CURRENT) - ${READABLE_DATE}"
    else
        echo "      ${INDEX}. ${uid:0:10}... - ${READABLE_DATE}"
    fi

    INDEX=$((INDEX + 1))

    if [[ $INDEX -gt 5 ]]; then
        break
    fi
done <<< "$DEPLOYMENTS"

echo ""

# ==============================================================================
# Select Target Deployment
# ==============================================================================
echo "3️⃣  Select target deployment for rollback..."
echo ""

CURRENT_UID="${DEPLOY_UIDS[1]}"
echo "   Current deployment: ${CURRENT_UID:0:10}..."
echo ""

read -p "Roll back to deployment number (2-5): " TARGET_INDEX

if [[ ! "$TARGET_INDEX" =~ ^[2-5]$ ]]; then
    echo -e "${RED}${CROSS} Invalid selection${NC}"
    exit 1
fi

TARGET_UID="${DEPLOY_UIDS[$TARGET_INDEX]}"
TARGET_URL="${DEPLOY_URLS[$TARGET_INDEX]}"
TARGET_DATE="${DEPLOY_DATES[$TARGET_INDEX]}"

if [[ -z "$TARGET_UID" ]]; then
    echo -e "${RED}${CROSS} Target deployment not found${NC}"
    exit 1
fi

echo ""
echo -e "${BOLD}Rollback Target:${NC}"
echo "   Deployment ID: ${TARGET_UID:0:10}..."
echo "   URL:           ${TARGET_URL}"
echo "   Date:          ${TARGET_DATE}"
echo ""

read -p "Confirm rollback to this deployment? (yes/no): " CONFIRM_TARGET
if [[ ! "$CONFIRM_TARGET" =~ ^[Yy][Ee][Ss]$ ]]; then
    echo ""
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

# ==============================================================================
# Record Rollback Metadata
# ==============================================================================
echo ""
echo "4️⃣  Recording rollback metadata..."
echo ""

ROLLBACK_LOG="/tmp/rollback-$(date +%Y%m%d-%H%M%S).json"

OPERATOR_EMAIL=$(git config user.email 2>/dev/null || echo "unknown")

cat > "$ROLLBACK_LOG" <<EOF
{
  "rollback_time": "${ROLLBACK_TIME}",
  "operator": "${OPERATOR_EMAIL}",
  "reason": "${ROLLBACK_REASON}",
  "from_deployment": "${CURRENT_UID}",
  "to_deployment": "${TARGET_UID}",
  "target_url": "${TARGET_URL}",
  "target_date": "${TARGET_DATE}"
}
EOF

echo "   Metadata saved: ${ROLLBACK_LOG}"
echo ""

# ==============================================================================
# Execute Rollback
# ==============================================================================
echo "5️⃣  Executing rollback..."
echo ""

ROLLBACK_OUTPUT=$(vercel promote "${TARGET_UID}" --yes 2>&1)
ROLLBACK_EXIT_CODE=$?

if [[ $ROLLBACK_EXIT_CODE -eq 0 ]]; then
    echo -e "   ${GREEN}${CHECK} Rollback executed successfully${NC}"
    echo ""
else
    echo -e "   ${RED}${CROSS} Rollback failed${NC}"
    echo ""
    echo "$ROLLBACK_OUTPUT"
    echo ""
    exit 1
fi

# ==============================================================================
# Verify Rollback
# ==============================================================================
echo "6️⃣  Verifying rollback..."
echo ""

# Wait for DNS propagation
echo "   Waiting 10 seconds for propagation..."
sleep 10

# Get production URL
PROD_URL=$(vercel ls --prod --json 2>/dev/null | jq -r '.deployments[0].url' || echo "")

if [[ -z "$PROD_URL" ]]; then
    PROD_URL="$TARGET_URL"
fi

# Add https if missing
if [[ ! "$PROD_URL" =~ ^https?:// ]]; then
    PROD_URL="https://${PROD_URL}"
fi

echo "   Testing: ${PROD_URL}"
echo ""

# Test site reachability
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" || echo "000")

if [[ "$HTTP_CODE" =~ ^(200|301|302)$ ]]; then
    echo -e "   ${GREEN}${CHECK} Site reachable (HTTP ${HTTP_CODE})${NC}"
else
    echo -e "   ${RED}${CROSS} Site not reachable (HTTP ${HTTP_CODE})${NC}"
    echo ""
    echo -e "${YELLOW}${WARN} Rollback completed but site verification failed${NC}"
    echo "   Manual verification required"
fi

echo ""

# ==============================================================================
# Run Smoke Tests
# ==============================================================================
echo "7️⃣  Running smoke tests on rolled-back version..."
echo ""

if [[ -f "../scripts/deploy/smoke-test.sh" ]]; then
    echo "   Running: scripts/deploy/smoke-test.sh"
    echo ""

    # Run smoke test (don't fail rollback if smoke test fails)
    bash ../scripts/deploy/smoke-test.sh || {
        echo ""
        echo -e "${YELLOW}${WARN} Smoke tests failed on rolled-back version${NC}"
        echo "   Review test output above"
    }
else
    echo -e "   ${YELLOW}${WARN} Smoke test script not found, skipping${NC}"
fi

echo ""

# ==============================================================================
# Summary & Next Steps
# ==============================================================================
echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  ✅ ROLLBACK COMPLETE${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BOLD}Rollback Summary:${NC}"
echo "   ⏮  Rolled back from: ${CURRENT_UID:0:10}..."
echo "   ✅ Rolled back to:   ${TARGET_UID:0:10}..."
echo "   📅 Target deployed:  ${TARGET_DATE}"
echo "   👤 Operator:         ${OPERATOR_EMAIL}"
echo "   📝 Reason:           ${ROLLBACK_REASON}"
echo ""

echo -e "${BOLD}Rollback Log:${NC}"
echo "   ${ROLLBACK_LOG}"
echo ""

echo -e "${BOLD}${RED}IMPORTANT: Immediate Actions${NC}"
echo ""
echo "  1. ✅ Verify application is working correctly"
echo "  2. 📊 Check Sentry for errors in last 5 minutes"
echo "  3. 📱 Test critical user flows manually"
echo "  4. 📞 Notify stakeholders about rollback"
echo "  5. 🐛 Investigate root cause of issue"
echo "  6. 📝 Document incident and resolution"
echo ""

echo -e "${BOLD}Monitoring:${NC}"
echo "   Sentry: https://sentry.io/"
echo "   Vercel: https://vercel.com/dashboard"
echo ""

echo -e "${BOLD}To re-deploy after fix:${NC}"
echo "   $ bash scripts/deploy/deploy-production.sh"
echo ""

echo -e "${GREEN}Rollback completed at: $(date -u +"%Y-%m-%d %H:%M:%S UTC")${NC}"
echo ""
