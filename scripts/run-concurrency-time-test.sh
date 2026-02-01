#!/bin/bash

# =============================================================================
# TESTE C — Concorrência + Tempo
# =============================================================================
# Runner script para executar o teste de concorrência e tempo.
# 
# Usage:
#   ./scripts/run-concurrency-time-test.sh
#   ./scripts/run-concurrency-time-test.sh --cycles=50 --wait-times=30,120,600
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
CYCLES="${CYCLES:-50}"
WAIT_TIMES="${WAIT_TIMES:-30,120,600}"
TABLES="${TABLES:-10}"

for arg in "$@"; do
  case $arg in
    --cycles=*)
      CYCLES="${arg#*=}"
      shift
      ;;
    --wait-times=*)
      WAIT_TIMES="${arg#*=}"
      shift
      ;;
    --tables=*)
      TABLES="${arg#*=}"
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TESTE C — Concorrência + Tempo${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Cycles: ${YELLOW}${CYCLES}${NC}"
echo -e "  Wait times: ${YELLOW}${WAIT_TIMES}${NC}"
echo -e "  Tables: ${YELLOW}${TABLES}${NC}"
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
echo -e "${YELLOW}📌 STEP 3: Running Concurrency + Time Test${NC}"
echo ""
echo -e "${BLUE}💡 This test will:${NC}"
echo "   1. Create orders"
echo "   2. Wait for extended periods (${WAIT_TIMES}s)"
echo "   3. Close and reopen orders"
echo "   4. Measure performance degradation"
echo ""
echo -e "${YELLOW}⚠️  This test may take a while (depends on wait times)${NC}"
echo ""

npx ts-node scripts/test-concurrency-time.ts \
  --cycles="${CYCLES}" \
  --wait-times="${WAIT_TIMES}" \
  --tables="${TABLES}"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ TESTE C completed successfully${NC}"
else
    echo -e "${RED}❌ TESTE C failed${NC}"
fi
echo ""

exit $EXIT_CODE
