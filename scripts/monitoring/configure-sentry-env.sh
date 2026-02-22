#!/usr/bin/env bash
# Configure Sentry environment variables in Vercel
# Usage: bash scripts/monitoring/configure-sentry-env.sh
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
echo -e "${BOLD}  🔐 SENTRY - Configure Vercel Environment Variables${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ==============================================================================
# Verify Vercel CLI is installed and authenticated
# ==============================================================================
echo -e "${BOLD}1️⃣  Verify Vercel CLI${NC}"
echo ""

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}${CROSS} Vercel CLI not found${NC}"
    echo ""
    echo "Install with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}${CHECK} Vercel CLI installed${NC}"
echo ""

# Check Vercel authentication
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}${INFO} Not authenticated with Vercel${NC}"
    echo ""
    echo "Authenticating..."
    vercel login
fi

echo -e "${GREEN}${CHECK} Vercel authenticated${NC}"
echo ""

# ==============================================================================
# Sentry Configuration
# ==============================================================================
echo -e "${BOLD}2️⃣  Sentry Configuration${NC}"
echo ""

# Sentry Auth Token (already provided)
SENTRY_AUTH_TOKEN="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"

echo -e "${BOLD}Sentry DSN${NC}"
echo "Get your DSN from: https://sentry.io/settings/[org]/projects/[project]/keys/"
echo ""
read -p "Enter Sentry DSN: " SENTRY_DSN

if [[ -z "$SENTRY_DSN" ]]; then
    echo -e "${RED}${CROSS} Sentry DSN is required${NC}"
    exit 1
fi

echo ""
echo -e "${BOLD}Sentry Organization${NC}"
read -p "Enter Sentry organization slug (default: goldmonkeystudio): " SENTRY_ORG
SENTRY_ORG="${SENTRY_ORG:-goldmonkeystudio}"

echo ""
echo -e "${BOLD}Sentry Project${NC}"
read -p "Enter Sentry project name (default: merchant-portal): " SENTRY_PROJECT
SENTRY_PROJECT="${SENTRY_PROJECT:-merchant-portal}"

echo ""
echo -e "${GREEN}${CHECK} Configuration collected${NC}"
echo ""

# ==============================================================================
# Set Vercel Environment Variables
# ==============================================================================
echo -e "${BOLD}3️⃣  Set Vercel Environment Variables${NC}"
echo ""

cd merchant-portal

# Function to set env var
set_vercel_env() {
    local name=$1
    local value=$2
    local scope=${3:-production}

    echo "   Setting ${name}..."
    echo "$value" | vercel env add "$name" "$scope" --force > /dev/null 2>&1 || true
}

# Set Sentry variables
set_vercel_env "VITE_SENTRY_DSN" "$SENTRY_DSN" "production"
set_vercel_env "VITE_SENTRY_AUTH_TOKEN" "$SENTRY_AUTH_TOKEN" "production"
set_vercel_env "VITE_SENTRY_ORG" "$SENTRY_ORG" "production"
set_vercel_env "VITE_SENTRY_PROJECT" "$SENTRY_PROJECT" "production"

echo ""
echo -e "${GREEN}${CHECK} Vercel environment variables configured${NC}"
echo ""

# ==============================================================================
# Update .env.production file
# ==============================================================================
echo -e "${BOLD}4️⃣  Update .env.production${NC}"
echo ""

ENV_FILE=".env.production"

# Backup existing file if it exists
if [[ -f "$ENV_FILE" ]]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}${INFO} Backup created: $ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)${NC}"
fi

# Update or add Sentry variables
update_env_var() {
    local key=$1
    local value=$2
    local file=$3

    if grep -q "^${key}=" "$file" 2>/dev/null; then
        # Update existing line
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
        # Add new line
        echo "${key}=${value}" >> "$file"
    fi
}

update_env_var "VITE_SENTRY_DSN" "$SENTRY_DSN" "$ENV_FILE"
update_env_var "VITE_SENTRY_AUTH_TOKEN" "$SENTRY_AUTH_TOKEN" "$ENV_FILE"
update_env_var "VITE_SENTRY_ORG" "$SENTRY_ORG" "$ENV_FILE"
update_env_var "VITE_SENTRY_PROJECT" "$SENTRY_PROJECT" "$ENV_FILE"

echo -e "${GREEN}${CHECK} .env.production updated${NC}"
echo ""

# ==============================================================================
# Verify Configuration
# ==============================================================================
echo -e "${BOLD}5️⃣  Verify Configuration${NC}"
echo ""

echo "Vercel environment variables:"
vercel env ls production | grep SENTRY || echo "   No SENTRY variables found in Vercel (this is normal if using stdin)"

echo ""
echo ".env.production file:"
grep "VITE_SENTRY" "$ENV_FILE" | sed 's/=.*/=***/' || echo "   No SENTRY variables found"

echo ""
echo -e "${GREEN}${CHECK} Configuration complete${NC}"
echo ""

# ==============================================================================
# Next Steps
# ==============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  📋 Next Steps${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. ${BOLD}Deploy to Vercel:${NC}"
echo "   cd merchant-portal && vercel --prod"
echo ""
echo "2. ${BOLD}Configure Sentry Alerts:${NC}"
echo "   bash scripts/monitoring/configure-sentry-alerts.sh"
echo ""
echo "3. ${BOLD}Monitor Dashboard:${NC}"
echo "   https://sentry.io/organizations/${SENTRY_ORG}/projects/${SENTRY_PROJECT}/"
echo ""
echo -e "${GREEN}${CHECK} Sentry monitoring ready for production!${NC}"
echo ""
