#!/bin/bash
# ==============================================================================
# RUN REALTIME KDS TEST - ChefIApp
# ==============================================================================
# Executes TESTE D — Realtime + KDS validation
# 
# Usage:
#   ./scripts/run-realtime-kds-test.sh
#   ./scripts/run-realtime-kds-test.sh --orders=10
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ORDERS=${ORDERS:-5}

# Parse arguments
for arg in "$@"; do
    case $arg in
        --orders=*)
            ORDERS="${arg#*=}"
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --orders=N     Number of orders to create (default: 5)"
            echo "  --help         Show this help"
            exit 0
            ;;
    esac
done

# Header
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TESTE D — Realtime + KDS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Orders: ${YELLOW}$ORDERS${NC}"
echo ""

# Check Docker Core
echo -e "${YELLOW}📌 STEP 1: Verifying Docker Core${NC}"
echo ""
if ! docker compose -f docker-core/docker-compose.core.yml ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ Docker Core not running. Start it first:${NC}"
    echo "   cd docker-core && docker compose -f docker-compose.core.yml up -d"
    exit 1
fi
echo -e "${GREEN}✅ Docker Core is running${NC}"
echo ""

# Check Realtime
echo -e "${YELLOW}📌 STEP 2: Verifying Realtime${NC}"
echo ""
REALTIME_STATUS=$(docker compose -f docker-core/docker-compose.core.yml ps realtime | grep -o "Up\|Restarting\|Exited" | head -1)
if [ "$REALTIME_STATUS" != "Up" ]; then
    echo -e "${RED}❌ Realtime is not running (status: $REALTIME_STATUS)${NC}"
    echo "   Check logs: docker compose -f docker-core/docker-compose.core.yml logs realtime"
    echo ""
    echo -e "${YELLOW}⚠️  Continuing anyway (test will likely fail)${NC}"
else
    echo -e "${GREEN}✅ Realtime is running${NC}"
fi
echo ""

# Check if test data exists
echo -e "${YELLOW}📌 STEP 3: Checking test data${NC}"
echo ""
if ! npx ts-node -e "
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:54320/chefiapp_core' });
pool.query(\"SELECT COUNT(*) FROM public.gm_restaurants WHERE name LIKE 'Test Restaurant%' OR name LIKE 'Restaurante Piloto%'\")
  .then(r => { console.log(r.rows[0].count); pool.end(); })
  .catch(e => { console.error('0'); pool.end(); });
" | grep -q "^[1-9]"; then
    echo -e "${YELLOW}⚠️  No test restaurants found. Running seed first...${NC}"
    echo ""
    npx ts-node scripts/seed-massive-test-docker.ts --restaurants=1 || true
    echo ""
fi
echo -e "${GREEN}✅ Test data available${NC}"
echo ""

# Run test
echo -e "${YELLOW}📌 STEP 4: Running Realtime + KDS Test${NC}"
echo ""
echo -e "${BLUE}💡 Tip: Open KDS in browser to observe visually:${NC}"
echo -e "   ${GREEN}http://localhost:5175/app/kds?demo=true${NC}"
echo ""
echo -e "${YELLOW}Press Enter to start test...${NC}"
read -r

npx ts-node scripts/test-realtime-kds.ts --orders=$ORDERS

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ TESTE D PASSED${NC}"
else
    echo -e "${RED}❌ TESTE D FAILED${NC}"
    echo ""
    echo "Check:"
    echo "  - Realtime logs: docker compose -f docker-core/docker-compose.core.yml logs realtime"
    echo "  - Test results: test-results/realtime-kds-test-*.json"
    echo "  - KDS visual: http://localhost:5175/app/kds?demo=true"
fi
echo ""

exit $EXIT_CODE
