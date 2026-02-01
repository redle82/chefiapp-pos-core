#!/bin/bash

# =============================================================================
# TESTE E — Offline / Replay
# =============================================================================
# Runner script para executar o teste de offline e replay.
# 
# Usage:
#   ./scripts/run-offline-replay-test.sh
#   ./scripts/run-offline-replay-test.sh --offline-orders=20 --network-drops=3
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
OFFLINE_ORDERS="${OFFLINE_ORDERS:-10}"
NETWORK_DROPS="${NETWORK_DROPS:-2}"
DROP_DURATION="${DROP_DURATION:-5}"

for arg in "$@"; do
  case $arg in
    --offline-orders=*)
      OFFLINE_ORDERS="${arg#*=}"
      shift
      ;;
    --network-drops=*)
      NETWORK_DROPS="${arg#*=}"
      shift
      ;;
    --drop-duration=*)
      DROP_DURATION="${arg#*=}"
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TESTE E — Offline / Replay${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Offline orders: ${YELLOW}${OFFLINE_ORDERS}${NC}"
echo -e "  Network drops: ${YELLOW}${NETWORK_DROPS}${NC}"
echo -e "  Drop duration: ${YELLOW}${DROP_DURATION}s${NC}"
echo ""

# Check Docker Core
echo -e "${YELLOW}📌 STEP 1: Verifying Docker Core${NC}"
echo ""

if ! docker compose -f docker-core/docker-compose.core.yml ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ Docker Core is not running${NC}"
    echo "   Start it with: docker compose -f docker-core/docker-compose.core.yml up -d"
    exit 1
fi

echo -e "${GREEN}✅ Docker Core is running${NC}"
echo ""

# Check if test data exists
echo -e "${YELLOW}📌 STEP 2: Checking test data${NC}"
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
echo -e "${YELLOW}📌 STEP 3: Running Offline / Replay Test${NC}"
echo ""
echo -e "${BLUE}💡 This test will:${NC}"
echo "   1. Create orders offline (local queue)"
echo "   2. Replay orders when connection restored"
echo "   3. Validate no orders lost, no duplicates"
echo "   4. Verify order correctness and state consistency"
echo ""

npx ts-node scripts/test-offline-replay.ts \
  --offline-orders="${OFFLINE_ORDERS}" \
  --network-drops="${NETWORK_DROPS}" \
  --drop-duration="${DROP_DURATION}"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ TESTE E completed successfully${NC}"
else
    echo -e "${RED}❌ TESTE E failed${NC}"
fi
echo ""

exit $EXIT_CODE
