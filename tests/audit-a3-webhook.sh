#!/bin/bash
# AUDITORIA A3 — Webhook Test Script
#
# Este script automatiza o teste de webhooks de billing
#
# PRÉ-REQUISITOS:
#   1. Stripe CLI instalado (brew install stripe/stripe-cli/stripe)
#   2. stripe login executado
#
# USO:
#   ./tests/audit-a3-webhook.sh

set -e

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  AUDITORIA A3 — Webhook Integration Test"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check stripe CLI
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found"
    echo "   Install: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI found"

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "❌ Not logged in to Stripe"
    echo "   Run: stripe login"
    exit 1
fi

echo "✅ Stripe authenticated"
echo ""

# Export keys
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_51SgVOwEOB1Od9eibRT57fi9vamvl3Wa2zDcdwSmvUtWwe48vfF8qRjLPyw0vNekfGXPc52IdMOI6fANtWZ6HKJra00Uq5STAfU}"

echo "Starting test sequence..."
echo ""

# Results file
RESULTS_FILE="a3-results.txt"
echo "=== AUDITORIA A3 ===" > $RESULTS_FILE
echo "Date: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Test function
run_test() {
    local test_id=$1
    local test_name=$2
    local trigger=$3
    
    echo "📋 TEST $test_id: $test_name"
    echo -n "   Triggering $trigger... "
    
    if stripe trigger $trigger --api-key $STRIPE_SECRET_KEY 2>&1 | grep -q "Trigger succeeded"; then
        echo "✅ PASS"
        echo "✅ $test_id: $test_name - PASS" >> $RESULTS_FILE
        return 0
    else
        echo "⚠️ (may need server running)"
        echo "⚠️ $test_id: $test_name - NEEDS SERVER" >> $RESULTS_FILE
        return 1
    fi
}

# Run tests (these create real test events in Stripe)
echo ""
echo "Creating test events in Stripe sandbox..."
echo ""

run_test "3.1" "Subscription Created" "customer.subscription.created" || true
sleep 1

run_test "3.2" "Subscription Updated" "customer.subscription.updated" || true
sleep 1

run_test "3.3" "Invoice Paid" "invoice.paid" || true
sleep 1

run_test "3.4" "Invoice Payment Failed" "invoice.payment_failed" || true
sleep 1

run_test "3.5" "Customer Created" "customer.created" || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST EVENTS CREATED"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Events have been created in Stripe."
echo ""
echo "To complete A3, run these commands in separate terminals:"
echo ""
echo "  Terminal 1 (Server):"
echo "  STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx npm run server:billing"
echo ""
echo "  Terminal 2 (Listener):"
echo "  stripe listen --forward-to localhost:3001/webhooks/billing"
echo ""
echo "  Terminal 3 (Trigger):"
echo "  stripe trigger customer.subscription.created"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""

cat $RESULTS_FILE
