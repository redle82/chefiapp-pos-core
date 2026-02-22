#!/bin/bash

# ============================================================================
# SumUp EUR Integration - E2E Infrastructure Test
# ============================================================================

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-54320}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===============================================================================${NC}"
echo -e "${BLUE}  SumUp EUR Integration - Infrastructure Test${NC}"
echo -e "${BLUE}===============================================================================${NC}"
echo

# Test 1: Gateway Health
echo -e "${YELLOW}[1/5] Gateway Health Check${NC}"
if curl -s http://localhost:4320/health | jq . > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC} - Gateway responding"
  curl -s http://localhost:4320/health | jq .
else
  echo -e "${RED}❌ FAIL${NC} - Gateway not responding"
  exit 1
fi
echo

# Test 2: Portal
echo -e "${YELLOW}[2/5] Merchant Portal Accessibility${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/)
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Portal accessible (HTTP $STATUS)"
else
  echo -e "${RED}❌ FAIL${NC} - Portal not accessible (HTTP $STATUS)"
  exit 1
fi
echo

# Test 3: Database
echo -e "${YELLOW}[3/5] Database Schema${NC}"
TABLE_EXISTS=$(PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tc \
  "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='gm_payments');" 2>/dev/null | tr -d ' ')

if [ "$TABLE_EXISTS" = "t" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Table 'gm_payments' exists"
  echo
  PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d gm_payments" 2>/dev/null | head -15
else
  echo -e "${RED}❌ FAIL${NC} - Table not found"
  exit 1
fi
echo

# Test 4: SumUp Columns
echo -e "${YELLOW}[4/5] SumUp-Specific Columns${NC}"
COL_PROVIDER=$(PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tc \
  "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gm_payments' AND column_name='payment_provider');" 2>/dev/null | tr -d ' ')

COL_CHECKOUT=$(PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tc \
  "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gm_payments' AND column_name='external_checkout_id');" 2>/dev/null | tr -d ' ')

if [ "$COL_PROVIDER" = "t" ] && [ "$COL_CHECKOUT" = "t" ]; then
  echo -e "${GREEN}✅ PASS${NC} - SumUp columns present"
  echo "  ✓ payment_provider"
  echo "  ✓ external_checkout_id"
else
  echo -e "${RED}❌ FAIL${NC} - Missing SumUp columns"
  exit 1
fi
echo

# Test 5: Performance Indexes
echo -e "${YELLOW}[5/5] Performance Indexes${NC}"
echo -e "${YELLOW}Indexes for gm_payments:${NC}"
PGPASSWORD=postgres psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tc \
  "SELECT indexname FROM pg_indexes WHERE tablename='gm_payments' ORDER BY indexname;" 2>/dev/null | grep -E "idx_|pkey"
echo

# Summary
echo -e "${BLUE}===============================================================================${NC}"
echo -e "${GREEN}✅ All Infrastructure Tests Passed!${NC}"
echo -e "${BLUE}===============================================================================${NC}"
echo
echo -e "${YELLOW}📊 Ready for Testing!${NC}"
echo "  ✓ Gateway (4320):  http://localhost:4320/health"
echo "  ✓ Portal (5175):   http://localhost:5175/"
echo "  ✓ Database:        PostgreSQL on port 54320"
echo "  ✓ Table:           gm_payments (ready for payments)"
echo
echo -e "${YELLOW}🧪 Manual Test Steps:${NC}"
echo "  1. Open browser: http://localhost:5175/"
echo "  2. Navigate to: TPV Staff section"
echo "  3. Create test order"
echo "  4. Open PaymentModal"
echo "  5. Select: 'Cartão EUR 🇪🇺'"
echo "  6. Click 'Confirmar'"
echo "  7. Use test card: 4242 4242 4242 4242"
echo "     (Expiry: any future date, CVV: 123)"
echo
echo -e "${YELLOW}💾 Check Payment Record:${NC}"
echo "  PGPASSWORD=postgres psql -h localhost -p 54320 -U postgres"
echo "  postgres=> SELECT * FROM gm_payments ORDER BY created_at DESC LIMIT 1;"
echo
