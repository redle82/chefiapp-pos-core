#!/bin/bash
# =============================================================================
# ChefIApp - Start Stress Test Environment
# =============================================================================
# This script starts both the backend (Docker) and frontends pointing to it
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}🧪 CHEFIAPP STRESS TEST ENVIRONMENT${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""

# =============================================================================
# STEP 1: Start Docker Backend
# =============================================================================

echo -e "${YELLOW}📦 Step 1: Starting Docker Backend...${NC}"
cd "$PROJECT_ROOT/docker-tests"

if ! docker compose ps postgres 2>/dev/null | grep -q "running"; then
  make start
  echo "   Waiting for services..."
  sleep 5
else
  echo "   Backend already running ✅"
fi

# Check if data exists
RESTAURANT_COUNT=$(docker compose exec -T postgres psql -U postgres -d chefiapp_test -t -c "SELECT COUNT(*) FROM gm_restaurants" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$RESTAURANT_COUNT" -lt 10 ]; then
  echo "   Seeding 10 restaurants..."
  docker compose cp seeds/seed-10.sql postgres:/tmp/seed-10.sql 2>/dev/null
  docker compose exec -T postgres psql -U postgres -d chefiapp_test -f /tmp/seed-10.sql 2>/dev/null
fi

echo -e "${GREEN}   ✅ Backend ready with $RESTAURANT_COUNT restaurants${NC}"
echo ""

# =============================================================================
# STEP 2: Configure Frontends
# =============================================================================

echo -e "${YELLOW}🔧 Step 2: Configuring Frontends...${NC}"

# Mobile
if [ -f "$PROJECT_ROOT/mobile-app/.env.stress-local" ]; then
  cp "$PROJECT_ROOT/mobile-app/.env.stress-local" "$PROJECT_ROOT/mobile-app/.env"
  echo "   Mobile: .env.stress-local → .env ✅"
fi

# Merchant Portal
if [ -f "$PROJECT_ROOT/merchant-portal/.env.stress-local" ]; then
  cp "$PROJECT_ROOT/merchant-portal/.env.stress-local" "$PROJECT_ROOT/merchant-portal/.env.local"
  echo "   Merchant Portal: .env.stress-local → .env.local ✅"
fi

echo ""

# =============================================================================
# STEP 3: Print Instructions
# =============================================================================

echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ STRESS ENVIRONMENT READY${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Backend API:     http://localhost:54398"
echo "  Database:        localhost:54399"
echo "  Restaurants:     $RESTAURANT_COUNT"
echo ""
echo "  To start Mobile:"
echo "    cd mobile-app && npx expo start"
echo ""
echo "  To start Merchant Portal:"
echo "    cd merchant-portal && npm run dev"
echo ""
echo "  To run chaos test:"
echo "    cd docker-tests && make chaos-test"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
