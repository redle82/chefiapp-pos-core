#!/bin/bash

# ============================================================================
# Day 6 Phase 3: Load Testing Script
# ============================================================================
# Purpose: Stress test payment webhook processing infrastructure
#
# Scenarios:
# 1. Normal load (50-100 webhooks/min)
# 2. Peak load (200+ webhooks/min)
# 3. Failure handling (timeouts, retries)
# 4. Concurrent order + payment processing
# 5. Latency percentile measurement
#
# ============================================================================

set -e

GATEWAY_URL=${GATEWAY_URL:-"http://localhost:4320"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DURATION=${TEST_DURATION:-300}  # 5 minutes default
CONCURRENT_WORKERS=${CONCURRENT_WORKERS:-10}
RATE_PER_SECOND=${RATE_PER_SECOND:-5}  # 300 req/min

# Test data
TEST_RESTAURANT_ID="550e8400-e29b-41d4-a716-446655440000"  # Use existing restaurant
TEST_ORDER_ID="660e8400-e29b-41d4-a716-446655440001"
TEST_WEBHOOK_EVENT_ID="770e8400-e29b-41d4-a716-446655440002"
TEST_MERCHANT_CODE="${LOADTEST_MERCHANT_CODE:-acct_loadtest_merchant_001}"
TEST_PROVIDER="${LOADTEST_PROVIDER:-stripe}"

# Metrics tracking
RESULTS_DIR="./load-test-results"
LATENCIES_FILE="${RESULTS_DIR}/latencies.txt"
ERRORS_FILE="${RESULTS_DIR}/errors.txt"
SUMMARY_FILE="${RESULTS_DIR}/summary.txt"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# Helper Functions
# ============================================================================

setup_test_env() {
  echo -e "${BLUE}[Setup] Creating test environment...${NC}"

  mkdir -p "$RESULTS_DIR"
  > "$LATENCIES_FILE"
  > "$ERRORS_FILE"
  > "$SUMMARY_FILE"

  # Verify gateway is running
  if ! curl -s "$GATEWAY_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}[Error] Gateway not running at $GATEWAY_URL${NC}"
    exit 1
  fi

  echo -e "${GREEN}[Setup] ✓ Test environment ready${NC}"
}

random_choice() {
  local choices=("$@")
  local index=$((RANDOM % ${#choices[@]}))
  echo "${choices[$index]}"
}

# Generate realistic payment webhook payloads
generate_webhook_payload() {
  local provider=$1
  local status=$2
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local webhook_event_id="$TEST_WEBHOOK_EVENT_ID"
  local payment_amount=$((RANDOM % 10000 + 100))

  case $provider in
    stripe)
      cat <<EOF
{
  "webhook_event_id": "$webhook_event_id",
  "payment_status": "$status",
  "payment_amount": $payment_amount,
  "event_type": "payment.success",
  "provider": "stripe",
  "provider_event_id": "evt_$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 20)",
  "merchant_code": "acct_$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 16)",
  "currency": "EUR",
  "customer_id": "cus_$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 14)",
  "timestamp": "$timestamp",
  "metadata": {
    "order_id": "$TEST_ORDER_ID",
    "restaurant_id": "$TEST_RESTAURANT_ID"
  }
}
EOF
      ;;
    sumup)
      cat <<EOF
{
  "webhook_event_id": "$webhook_event_id",
  "payment_status": "$status",
  "payment_amount": $payment_amount,
  "event_type": "transaction.completed",
  "provider": "sumup",
  "transaction_id": "txn_$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 16)",
  "merchant_code": "$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 12)",
  "amount": $payment_amount,
  "currency": "EUR",
  "status": "$status",
  "timestamp": "$timestamp",
  "card_type": "$(random_choice 'VISA' 'MASTERCARD' 'AMEX')"
}
EOF
      ;;
    *)
      cat <<EOF
{
  "webhook_event_id": "$webhook_event_id",
  "payment_status": "$status",
  "payment_amount": $payment_amount,
  "event_type": "payment.processed",
  "provider": "custom",
  "event_id": "$webhook_event_id",
  "amount": $payment_amount,
  "timestamp": "$timestamp"
}
EOF
      ;;
  esac
}

# Execute single webhook test
test_webhook_endpoint() {
  local endpoint=$1
  local method=${2:-POST}
  local payload=$3
  local start_time=$(date +%s%N)

  local response
  local http_code

  if [ "$method" = "GET" ] || [ -z "$payload" ]; then
    response=$(curl -s -w "\n%{http_code}" \
      -X "$method" \
      -H "Authorization: Bearer test-token" \
      "$GATEWAY_URL$endpoint" 2>&1)
  else
    response=$(curl -s -w "\n%{http_code}" \
      -X "$method" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer test-token" \
      -d "$payload" \
      "$GATEWAY_URL$endpoint" 2>&1)
  fi

  http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  local end_time=$(date +%s%N)
  local latency_ms=$(( (end_time - start_time) / 1000000 ))

  echo "$latency_ms" >> "$LATENCIES_FILE"

  if [[ "$http_code" =~ ^[0-9]+$ ]] && { [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; }; then
    echo "$latency_ms ms"
  else
    echo "HTTP $http_code: $body" >> "$ERRORS_FILE"
    echo "ERROR($http_code)"
  fi
}

# ============================================================================
# Load Test Scenarios
# ============================================================================

scenario_normal_load() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║ Scenario 1: Normal Load (50-100 req/min)                    ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

  local total_requests=50
  local duration=60

  echo -e "${YELLOW}Sending $total_requests requests over $duration seconds...${NC}"

  for i in $(seq 1 $total_requests); do
    local provider=$(random_choice 'stripe' 'sumup' 'custom')
    local status=$(random_choice 'completed' 'processing' 'pending')
    local payload=$(generate_webhook_payload "$provider" "$status")

    result=$(test_webhook_endpoint "/api/v1/payment/update-from-event" "POST" "$payload")
    echo "  [$(printf '%3d' $i)/$total_requests] $provider ($status) → $result"

    # Rate limiting: ~1 per second
    sleep 1.2
  done

  echo -e "${GREEN}✓ Normal load scenario complete${NC}"
}

scenario_peak_load() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║ Scenario 2: Peak Load (200+ req/min, concurrent)           ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

  local total_requests=100
  local concurrent_jobs=10

  echo -e "${YELLOW}Sending $total_requests requests with $concurrent_jobs parallel workers...${NC}"

  for i in $(seq 1 $total_requests); do
    (
      local provider=$(random_choice 'stripe' 'sumup' 'custom')
      local status=$(random_choice 'completed' 'processing' 'failed')
      local payload=$(generate_webhook_payload "$provider" "$status")

      result=$(test_webhook_endpoint "/api/v1/payment/update-from-event" "POST" "$payload")
      echo "  [$(printf '%3d' $i)/$total_requests] $provider ($status) → $result"
    ) &

    while [ "$(jobs -pr | wc -l | tr -d ' ')" -ge "$concurrent_jobs" ]; do
      sleep 0.05
    done
  done

  # Wait for remaining jobs
  wait

  echo -e "${GREEN}✓ Peak load scenario complete${NC}"
}

scenario_merchant_resolution() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║ Scenario 3: Merchant Code Resolution (lookup-heavy)        ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

  local total_requests=50

  echo -e "${YELLOW}Testing merchant code resolution endpoints...${NC}"

  for i in $(seq 1 $total_requests); do
    # Generate random merchant codes
    local merchant_code="$TEST_MERCHANT_CODE"
    local provider="$TEST_PROVIDER"

    result=$(test_webhook_endpoint \
      "/api/v1/payment/resolve-merchant/$merchant_code?provider=$provider" \
      "GET" \
      "")

    echo "  [$(printf '%3d' $i)/$total_requests] resolve-merchant → $result"
    sleep 0.2
  done

  echo -e "${GREEN}✓ Merchant resolution scenario complete${NC}"
}

scenario_pending_payment_queries() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║ Scenario 4: Pending Payment Queries (read-heavy)           ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

  local total_requests=30

  echo -e "${YELLOW}Testing pending payment queries...${NC}"

  for i in $(seq 1 $total_requests); do
    result=$(test_webhook_endpoint \
      "/api/v1/payment/pending/$TEST_RESTAURANT_ID?maxAgeMinutes=$((RANDOM % 120 + 30))" \
      "GET" \
      "")

    echo "  [$(printf '%3d' $i)/$total_requests] pending-payments → $result"
    sleep 0.1
  done

  echo -e "${GREEN}✓ Pending payment queries scenario complete${NC}"
}

scenario_mixed_operations() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║ Scenario 5: Mixed Operations (realistic mix)               ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

  local total_requests=60
  local concurrent_jobs=5

  echo -e "${YELLOW}Running mixed operations test ($total_requests operations)...${NC}"

  for i in $(seq 1 $total_requests); do
    (
      local operation=$(random_choice 'update' 'resolve' 'pending' 'merchant-list')
      local result=""

      case $operation in
        update)
          local provider=$(random_choice 'stripe' 'sumup')
          local payload=$(generate_webhook_payload "$provider" "completed")
          result=$(test_webhook_endpoint "/api/v1/payment/update-from-event" "POST" "$payload")
          ;;
        resolve)
          local merchant_code="$TEST_MERCHANT_CODE"
          result=$(test_webhook_endpoint \
            "/api/v1/payment/resolve-merchant/$merchant_code?provider=$TEST_PROVIDER" "GET" "")
          ;;
        pending)
          result=$(test_webhook_endpoint \
            "/api/v1/payment/pending/$TEST_RESTAURANT_ID" "GET" "")
          ;;
        merchant-list)
          result=$(test_webhook_endpoint \
            "/api/v1/payment/merchants/$TEST_RESTAURANT_ID" "GET" "")
          ;;
      esac

      echo "  [$(printf '%3d' $i)/$total_requests] $operation → $result"
    ) &

    while [ "$(jobs -pr | wc -l | tr -d ' ')" -ge "$concurrent_jobs" ]; do
      sleep 0.05
    done
  done

  wait
  echo -e "${GREEN}✓ Mixed operations scenario complete${NC}"
}

# ============================================================================
# Results Analysis
# ============================================================================

analyze_results() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║ Results Analysis & Performance Report                      ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

  if [ ! -s "$LATENCIES_FILE" ]; then
    echo -e "${RED}No latency data collected${NC}"
    return
  fi

  local total_requests=$(wc -l < "$LATENCIES_FILE")
  local errors=0
  if [ -f "$ERRORS_FILE" ]; then
    errors=$(wc -l < "$ERRORS_FILE")
  fi
  local success=$((total_requests - errors))
  local success_rate=0
  if [ "$total_requests" -gt 0 ]; then
    success_rate=$((success * 100 / total_requests))
  fi

  # Calculate percentiles
  local sorted_latencies=$(sort -n "$LATENCIES_FILE")
  local min_latency=$(echo "$sorted_latencies" | head -1)
  local max_latency=$(echo "$sorted_latencies" | tail -1)
  local avg_latency=$(awk '{sum+=$1} END {print int(sum/NR)}' "$LATENCIES_FILE")

  # Percentile calculations
  local p50_idx=$((total_requests / 2))
  local p95_idx=$((total_requests * 95 / 100))
  local p99_idx=$((total_requests * 99 / 100))

  local p50=$(echo "$sorted_latencies" | sed -n "${p50_idx}p")
  local p95=$(echo "$sorted_latencies" | sed -n "${p95_idx}p")
  local p99=$(echo "$sorted_latencies" | sed -n "${p99_idx}p")

  # Generate report
  cat > "$SUMMARY_FILE" <<EOF
╔════════════════════════════════════════════════════════════╗
║       Day 6 Phase 3: Load Testing Results Summary          ║
╚════════════════════════════════════════════════════════════╝

Test Configuration:
  • Start Time: $(date)
  • Test Duration: $TEST_DURATION seconds
  • Concurrent Workers: $CONCURRENT_WORKERS
  • Target Rate: $RATE_PER_SECOND req/sec

Performance Metrics:
  • Total Requests: $total_requests
  • Successful: $success ($success_rate%)
  • Failed/Errors: $errors
  • Success Rate: $success_rate%

Latency Analysis (milliseconds):
  • Minimum: ${min_latency} ms
  • Maximum: ${max_latency} ms
  • Average: ${avg_latency} ms
  • P50 (median): ${p50} ms
  • P95 (95th percentile): ${p95} ms
  • P99 (99th percentile): ${p99} ms

Throughput:
  • Requests/sec: $(echo "scale=2; $total_requests / $TEST_DURATION" | bc) req/sec
  • Requests/min: $(echo "$total_requests * 60 / $TEST_DURATION" | bc) req/min

Error Summary:
EOF

  if [ -s "$ERRORS_FILE" ]; then
    echo "  Errors logged: $(wc -l < "$ERRORS_FILE")" >> "$SUMMARY_FILE"
    echo "" >> "$SUMMARY_FILE"
    head -10 "$ERRORS_FILE" >> "$SUMMARY_FILE"
  else
    echo "  No errors recorded ✓" >> "$SUMMARY_FILE"
  fi

  cat "$SUMMARY_FILE"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║     Day 6 Phase 3: Load Testing Suite                      ║${NC}"
  echo -e "${BLUE}║     Payment Webhook Infrastructure Stress Test             ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

  setup_test_env

  # Run all scenarios
  scenario_normal_load
  scenario_peak_load
  scenario_merchant_resolution
  scenario_pending_payment_queries
  scenario_mixed_operations

  # Analyze and report
  analyze_results

  echo ""
  echo -e "${GREEN}✅ Load testing complete!${NC}"
  echo "Results saved to: $RESULTS_DIR/"
  echo ""
}

main "$@"
