#!/usr/bin/env bash
# Full smoke test — Day 7 checklist
# Usage:
#   bash scripts/smoke-test.sh           # API + integration flow (Core + Gateway local)
#   bash scripts/smoke-test.sh --prod   # Production frontend + deploy smoke
# Covers: signup → org creation → integration → (optional) production URL checks
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ "${1:-}" == "--prod" ]]; then
  echo "Running production smoke test (frontend + deploy validation)..."
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [[ -x "$SCRIPT_DIR/deploy/smoke-test.sh" ]]; then
    exec "$SCRIPT_DIR/deploy/smoke-test.sh"
  else
    echo -e "${YELLOW}scripts/deploy/smoke-test.sh not found or not executable. Running integration smoke only.${NC}"
  fi
fi

echo "=========================================="
echo "ChefIApp Smoke Test (API + Integration)"
echo "=========================================="
echo ""

# 1. Integration test (PostgREST, gateway, onboarding, webhook)
echo -e "${GREEN}Step 1: Integration tests${NC}"
if bash "$(dirname "$0")/test-integration.sh"; then
  echo -e "${GREEN}Integration tests passed.${NC}"
else
  echo -e "${RED}Integration tests failed.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Smoke test finished successfully.${NC}"
echo "For production URL validation run: bash scripts/smoke-test.sh --prod"
