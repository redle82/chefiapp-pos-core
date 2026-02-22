#!/usr/bin/env bash
# Sentry setup script for production monitoring
# Interactive script to configure Sentry for merchant-portal
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
INFO="ℹ️ "

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  📊 SENTRY SETUP - Production Monitoring${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "This script will help you configure Sentry for production monitoring."
echo ""
echo -e "${BOLD}Prerequisites:${NC}"
echo "  1. Sentry account at https://sentry.io/"
echo "  2. Vercel CLI installed and authenticated"
echo "  3. Sentry project created (or will be created)"
echo ""

read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# ==============================================================================
# Step 1: Collect Sentry Configuration
# ==============================================================================
echo -e "${BOLD}1️⃣  Collect Sentry Configuration${NC}"
echo ""

# Sentry DSN
echo -e "${BOLD}Sentry DSN${NC}"
echo "Get your DSN from: https://sentry.io/settings/[your-org]/projects/[your-project]/keys/"
echo ""
read -p "Enter Sentry DSN: " SENTRY_DSN

if [[ -z "$SENTRY_DSN" ]]; then
    echo -e "${RED}${CROSS} Sentry DSN is required${NC}"
    exit 1
fi

# Extract org and project from DSN
SENTRY_ORG=$(echo "$SENTRY_DSN" | grep -oP '(?<=@)[^.]+(?=\.ingest)' || echo "")
SENTRY_PROJECT=$(echo "$SENTRY_DSN" | grep -oP '/\d+$' | tr -d '/' || echo "")

echo ""
echo -e "${BOLD}Sentry Auth Token${NC}"
echo "Create a token at: https://sentry.io/settings/account/api/auth-tokens/"
echo "Required scopes: project:read, project:write, org:read"
echo ""
read -p "Enter Sentry Auth Token: " SENTRY_AUTH_TOKEN

if [[ -z "$SENTRY_AUTH_TOKEN" ]]; then
    echo -e "${RED}${CROSS} Sentry Auth Token is required for sourcemap uploads${NC}"
    exit 1
fi

echo ""
echo -e "${BOLD}Sentry Organization Slug${NC}"
if [[ -n "$SENTRY_ORG" ]]; then
    echo "Detected from DSN: ${SENTRY_ORG}"
    read -p "Press Enter to use this or type a different org slug: " ORG_INPUT
    SENTRY_ORG="${ORG_INPUT:-$SENTRY_ORG}"
else
    read -p "Enter Sentry organization slug: " SENTRY_ORG
fi

echo ""
echo -e "${BOLD}Sentry Project Name${NC}"
if [[ -n "$SENTRY_PROJECT" ]]; then
    echo "Detected from DSN: ${SENTRY_PROJECT}"
    read -p "Press Enter to use this or type a different project name: " PROJECT_INPUT
    SENTRY_PROJECT="${PROJECT_INPUT:-$SENTRY_PROJECT}"
else
    read -p "Enter Sentry project name (e.g., merchant-portal): " SENTRY_PROJECT
fi

echo ""
echo -e "${GREEN}${CHECK} Configuration collected${NC}"
echo ""

# ==============================================================================
# Step 2: Verify Sentry Credentials
# ==============================================================================
echo -e "${BOLD}2️⃣  Verify Sentry Credentials${NC}"
echo ""

echo "   Testing Sentry API connection..."

API_TEST=$(curl -s -w "%{http_code}" -o /tmp/sentry-test.json \
    -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" \
    "https://sentry.io/api/0/organizations/${SENTRY_ORG}/projects/" || echo "000")

if [[ "$API_TEST" == "200" ]]; then
    echo -e "   ${GREEN}${CHECK} Sentry API connection successful${NC}"
else
    echo -e "   ${RED}${CROSS} Sentry API connection failed (HTTP ${API_TEST})${NC}"
    echo "   Check your credentials and try again"
    exit 1
fi
echo ""

# ==============================================================================
# Step 3: Configure Vercel Environment Variables
# ==============================================================================
echo -e "${BOLD}3️⃣  Configure Vercel Environment Variables${NC}"
echo ""

cd merchant-portal

echo "   Setting environment variables in Vercel..."
echo ""

# Set VITE_SENTRY_DSN
echo "   → VITE_SENTRY_DSN"
echo "$SENTRY_DSN" | vercel env add VITE_SENTRY_DSN production --sensitive > /dev/null 2>&1 || \
    echo "$SENTRY_DSN" | vercel env add VITE_SENTRY_DSN production > /dev/null 2>&1 || \
    echo -e "   ${YELLOW}⚠️  Could not set (may already exist)${NC}"

# Set VITE_SENTRY_AUTH_TOKEN
echo "   → VITE_SENTRY_AUTH_TOKEN"
echo "$SENTRY_AUTH_TOKEN" | vercel env add VITE_SENTRY_AUTH_TOKEN production --sensitive > /dev/null 2>&1 || \
    echo "$SENTRY_AUTH_TOKEN" | vercel env add VITE_SENTRY_AUTH_TOKEN production > /dev/null 2>&1 || \
    echo -e "   ${YELLOW}⚠️  Could not set (may already exist)${NC}"

# Set VITE_SENTRY_ORG
echo "   → VITE_SENTRY_ORG"
echo "$SENTRY_ORG" | vercel env add VITE_SENTRY_ORG production > /dev/null 2>&1 || \
    echo -e "   ${YELLOW}⚠️  Could not set (may already exist)${NC}"

# Set VITE_SENTRY_PROJECT
echo "   → VITE_SENTRY_PROJECT"
echo "$SENTRY_PROJECT" | vercel env add VITE_SENTRY_PROJECT production > /dev/null 2>&1 || \
    echo -e "   ${YELLOW}⚠️  Could not set (may already exist)${NC}"

cd ..

echo ""
echo -e "${GREEN}${CHECK} Vercel environment variables configured${NC}"
echo ""

# ==============================================================================
# Step 4: Create Local .env File
# ==============================================================================
echo -e "${BOLD}4️⃣  Create Local .env File${NC}"
echo ""

ENV_FILE="merchant-portal/.env.production"

cat > "$ENV_FILE" <<EOF
# Sentry Configuration
VITE_SENTRY_DSN=${SENTRY_DSN}
VITE_SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
VITE_SENTRY_ORG=${SENTRY_ORG}
VITE_SENTRY_PROJECT=${SENTRY_PROJECT}

# Add other production environment variables below
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# VITE_API_BASE=
EOF

echo -e "${GREEN}${CHECK} Created: ${ENV_FILE}${NC}"
echo "   ${INFO} Remember to add other required variables"
echo ""

# ==============================================================================
# Step 5: Save Configuration
# ==============================================================================
echo -e "${BOLD}5️⃣  Save Configuration${NC}"
echo ""

CONFIG_FILE=".sentry/config.json"
mkdir -p .sentry

cat > "$CONFIG_FILE" <<EOF
{
  "dsn": "${SENTRY_DSN}",
  "org": "${SENTRY_ORG}",
  "project": "${SENTRY_PROJECT}",
  "setupDate": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
}
EOF

echo -e "${GREEN}${CHECK} Configuration saved to: ${CONFIG_FILE}${NC}"
echo ""

# ==============================================================================
# Summary & Next Steps
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  ✨ SENTRY SETUP COMPLETE${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}${BOLD}${CHECK} Sentry monitoring configured successfully!${NC}"
echo ""

echo -e "${BOLD}Configuration Summary:${NC}"
echo "  Organization: ${SENTRY_ORG}"
echo "  Project: ${SENTRY_PROJECT}"
echo "  DSN: ${SENTRY_DSN:0:50}..."
echo "  Vercel env vars: ✓ Configured"
echo ""

echo -e "${BOLD}Next steps:${NC}"
echo "  1. Configure Sentry alerts (recommended):"
echo "     $ ./scripts/monitoring/configure-sentry-alerts.sh"
echo ""
echo "  2. Verify monitoring setup:"
echo "     $ ./scripts/monitoring/verify-monitoring.sh"
echo ""
echo "  3. Deploy to production:"
echo "     $ ./scripts/deploy/deploy-production.sh"
echo ""

echo -e "${BOLD}Alert Configuration (Manual):${NC}"
echo "  - High Error Rate: > 5% errors in 1 hour"
echo "  - New Issues: First occurrence of unhandled errors"
echo "  - Performance: p95 > 3 seconds in 30 minutes"
echo "  - Browser Block Bypass: Any browser access to /op/* routes"
echo ""
echo "  Create alerts at: https://sentry.io/settings/${SENTRY_ORG}/projects/${SENTRY_PROJECT}/alerts/"
echo ""

echo -e "${BOLD}Dashboard Links:${NC}"
echo "  • Sentry Dashboard: https://sentry.io/organizations/${SENTRY_ORG}/issues/"
echo "  • Project Settings: https://sentry.io/settings/${SENTRY_ORG}/projects/${SENTRY_PROJECT}/"
echo "  • Alert Rules: https://sentry.io/settings/${SENTRY_ORG}/projects/${SENTRY_PROJECT}/alerts/"
echo ""

echo -e "${GREEN}${CHECK} Setup complete!${NC}"
echo ""
