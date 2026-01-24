#!/bin/bash
# =============================================================================
# test-stress-orders.sh — ChefIApp Stress Test (Phase 6)
# =============================================================================
# Creates multiple orders rapidly to test system under load
#
# USAGE:
#   chmod +x scripts/test-stress-orders.sh
#   ./scripts/test-stress-orders.sh [count] [delay_ms]
#
# ARGUMENTS:
#   count     - Number of orders to create (default: 100)
#   delay_ms  - Delay between orders in ms (default: 100)
#
# REQUIREMENTS:
#   - curl
#   - jq
#   - Dev server running
#   - Valid test auth token
# =============================================================================

set -e

# Configuration
ORDER_COUNT=${1:-100}
DELAY_MS=${2:-100}

# Supabase configuration (use test environment)
SUPABASE_URL="https://yjcgoehucaafzykvrdpg.supabase.co"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

# Test restaurant ID (Sofia Gastrobar)
RESTAURANT_ID="sofia-gastrobar"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Metrics
STARTED_AT=$(date +%s)
SUCCESS_COUNT=0
FAILURE_COUNT=0

# -----------------------------------------------------------------------------
# Check requirements
# -----------------------------------------------------------------------------
check_requirements() {
    echo "🔍 Checking requirements..."

    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl not found${NC}"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️  jq not found (install with: brew install jq)${NC}"
    fi

    if [ -z "$SUPABASE_ANON_KEY" ]; then
        echo -e "${YELLOW}⚠️  SUPABASE_ANON_KEY not set${NC}"
        echo "   Set with: export SUPABASE_ANON_KEY=your_key"
        echo "   Continuing with mock mode..."
        MOCK_MODE=true
    fi

    echo -e "${GREEN}✅ Requirements OK${NC}"
}

# -----------------------------------------------------------------------------
# Generate random order
# -----------------------------------------------------------------------------
generate_order() {
    local order_num=$1
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local idempotency_key="stress-test-$(date +%s)-$order_num"

    # Random table 1-20
    local table_num=$((RANDOM % 20 + 1))

    # Random items (1-5 items per order)
    local item_count=$((RANDOM % 5 + 1))

    cat << EOF
{
    "restaurant_id": "$RESTAURANT_ID",
    "table_number": $table_num,
    "status": "pending",
    "items": [
        {
            "name": "Test Item $order_num",
            "quantity": $((RANDOM % 3 + 1)),
            "price": $((RANDOM % 50 + 5)).99
        }
    ],
    "idempotency_key": "$idempotency_key",
    "created_at": "$timestamp",
    "source": "stress_test"
}
EOF
}

# -----------------------------------------------------------------------------
# Create order via API
# -----------------------------------------------------------------------------
create_order() {
    local order_num=$1
    local order_json=$(generate_order $order_num)

    if [ "$MOCK_MODE" = true ]; then
        # Mock mode - just simulate delay
        sleep 0.$((DELAY_MS / 10))
        echo -e "${BLUE}[MOCK]${NC} Order #$order_num created"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        return 0
    fi

    # Real API call
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SUPABASE_URL/rest/v1/gm_orders" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "$order_json")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓${NC} Order #$order_num (HTTP $http_code)"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}✗${NC} Order #$order_num (HTTP $http_code)"
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
    fi

    # Delay between orders
    sleep 0.$((DELAY_MS / 10))
}

# -----------------------------------------------------------------------------
# Progress bar
# -----------------------------------------------------------------------------
show_progress() {
    local current=$1
    local total=$2
    local width=50
    local percent=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))

    printf "\r[%s%s] %d%% (%d/%d)" \
        "$(printf '#%.0s' $(seq 1 $filled))" \
        "$(printf '.%.0s' $(seq 1 $empty))" \
        "$percent" "$current" "$total"
}

# -----------------------------------------------------------------------------
# Report
# -----------------------------------------------------------------------------
show_report() {
    local ended_at=$(date +%s)
    local duration=$((ended_at - STARTED_AT))
    local orders_per_sec=$(echo "scale=2; $ORDER_COUNT / $duration" | bc 2>/dev/null || echo "N/A")

    echo ""
    echo ""
    echo "============================================="
    echo "📊 STRESS TEST REPORT"
    echo "============================================="
    echo ""
    echo "Configuration:"
    echo "  Orders requested: $ORDER_COUNT"
    echo "  Delay between:    ${DELAY_MS}ms"
    echo ""
    echo "Results:"
    echo -e "  ${GREEN}Successful: $SUCCESS_COUNT${NC}"
    echo -e "  ${RED}Failed:     $FAILURE_COUNT${NC}"
    echo "  Duration:   ${duration}s"
    echo "  Rate:       ~$orders_per_sec orders/sec"
    echo ""

    if [ $FAILURE_COUNT -eq 0 ]; then
        echo -e "${GREEN}✅ STRESS TEST PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  STRESS TEST COMPLETED WITH FAILURES${NC}"
    fi

    echo ""
    echo "============================================="
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    echo "🔥 ChefIApp Stress Test — Phase 6"
    echo "=================================="
    echo "Creating $ORDER_COUNT orders with ${DELAY_MS}ms delay"
    echo ""

    check_requirements

    echo ""
    echo "🚀 Starting stress test..."
    echo ""

    for i in $(seq 1 $ORDER_COUNT); do
        create_order $i
        show_progress $i $ORDER_COUNT
    done

    show_report
}

main "$@"
