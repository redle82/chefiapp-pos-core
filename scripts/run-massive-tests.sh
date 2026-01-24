#!/bin/bash
# ==============================================================================
# RUN MASSIVE TESTS - ChefIApp
# ==============================================================================
# Orchestrates the complete massive test suite
# 
# Usage:
#   ./scripts/run-massive-tests.sh
#   ./scripts/run-massive-tests.sh --skip-seed
#   ./scripts/run-massive-tests.sh --restaurants=10
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RESTAURANTS=${RESTAURANTS:-5}
ORDERS_PER_RESTAURANT=${ORDERS:-10}
SKIP_SEED=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-seed)
            SKIP_SEED=true
            ;;
        --restaurants=*)
            RESTAURANTS="${arg#*=}"
            ;;
        --orders=*)
            ORDERS_PER_RESTAURANT="${arg#*=}"
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-seed         Skip seeding (use existing data)"
            echo "  --restaurants=N     Number of restaurants (default: 5)"
            echo "  --orders=N          Orders per restaurant (default: 10)"
            echo "  --help              Show this help"
            exit 0
            ;;
    esac
done

# Header
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  ChefIApp MASSIVE TEST SUITE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Restaurants: ${YELLOW}$RESTAURANTS${NC}"
echo -e "  Orders/Restaurant: ${YELLOW}$ORDERS_PER_RESTAURANT${NC}"
echo ""

# Check for test-results directory
mkdir -p test-results

# Step 1: Seed
if [ "$SKIP_SEED" = false ]; then
    echo -e "${YELLOW}📌 STEP 1: Seeding Test Data${NC}"
    echo ""
    npx ts-node scripts/seed-massive-test.ts --restaurants=$RESTAURANTS --cleanup
    echo ""
else
    echo -e "${YELLOW}📌 STEP 1: Skipping Seed (--skip-seed)${NC}"
    echo ""
fi

# Step 2: Stress Test
echo -e "${YELLOW}📌 STEP 2: Running Stress Test${NC}"
echo ""
npx ts-node scripts/stress-orders-massive.ts --orders=$ORDERS_PER_RESTAURANT || true
echo ""

# Step 3: Chaos Test
echo -e "${YELLOW}📌 STEP 3: Running Chaos Tests${NC}"
echo ""
npx ts-node scripts/chaos-test-massive.ts --scenario=all || true
echo ""

# Step 4: Generate Report
echo -e "${YELLOW}📌 STEP 4: Generating Report${NC}"
echo ""
npx ts-node scripts/generate-test-report.ts
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  MASSIVE TEST SUITE COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Results saved to:"
echo "    - test-results/*.json"
echo "    - docs/testing/MASSIVE_TEST_RESULTS.md"
echo ""
