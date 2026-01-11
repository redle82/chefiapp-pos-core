#!/bin/bash
# ==============================================================================
# Setup Test Restaurant for CORE Operational Testing
# ==============================================================================
# Purpose: Seed explicit test restaurant to satisfy CORE's ontological gate
# Usage: ./scripts/setup-test-restaurant.sh
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Setting up test restaurant for CORE operational testing..."

# Load .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    echo "   Please set DATABASE_URL in your .env file or environment"
    exit 1
fi

# Test restaurant ID (fixed UUID for consistency)
TEST_RESTAURANT_ID="00000000-0000-0000-0000-000000000001"
TEST_COMPANY_ID="00000000-0000-0000-0000-000000000002"

echo "📋 Test Restaurant ID: $TEST_RESTAURANT_ID"
echo "📋 Test Company ID: $TEST_COMPANY_ID"

# Execute seed
echo "🌱 Executing seed..."
psql "$DATABASE_URL" -f migrations/99999999_00_test_restaurant_seed.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed executed successfully${NC}"
else
    echo -e "${RED}❌ Seed failed${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating...${NC}"
    touch .env
fi

# Check if WEB_MODULE_RESTAURANT_ID is already set
if grep -q "WEB_MODULE_RESTAURANT_ID" .env; then
    echo -e "${YELLOW}⚠️  WEB_MODULE_RESTAURANT_ID already exists in .env${NC}"
    echo "   Current value:"
    grep "WEB_MODULE_RESTAURANT_ID" .env
    echo ""
    read -p "   Update to test restaurant ID? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Update existing value
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|WEB_MODULE_RESTAURANT_ID=.*|WEB_MODULE_RESTAURANT_ID=$TEST_RESTAURANT_ID|" .env
        else
            # Linux
            sed -i "s|WEB_MODULE_RESTAURANT_ID=.*|WEB_MODULE_RESTAURANT_ID=$TEST_RESTAURANT_ID|" .env
        fi
        echo -e "${GREEN}✅ Updated WEB_MODULE_RESTAURANT_ID in .env${NC}"
    else
        echo "   Keeping existing value"
    fi
else
    # Add to .env
    echo "" >> .env
    echo "# Test Restaurant ID (CORE Operational Testing)" >> .env
    echo "WEB_MODULE_RESTAURANT_ID=$TEST_RESTAURANT_ID" >> .env
    echo -e "${GREEN}✅ Added WEB_MODULE_RESTAURANT_ID to .env${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your server to load new environment variable"
echo "   2. Run TestSprite tests"
echo ""
echo "📚 Documentation:"
echo "   - testsprite_tests/CORE_TESTING_PREREQUISITES.md"
echo "   - testsprite_tests/TEST_EXECUTION_SUMMARY.md"
echo ""

