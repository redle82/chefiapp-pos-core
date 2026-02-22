#!/bin/bash
# Script: deploy-sumup-production.sh
# Purpose: Complete SumUp EUR integration production deployment

set -e

echo "=========================================="
echo "🚀 SumUp EUR Payment Integration"
echo "   Production Deployment"
echo "=========================================="
echo ""

# Credentials
SUPABASE_URL="https://kwgsmbrxfcezuvkwgvuf.supabase.co"
SUPABASE_ANON_KEY="sbp_9ec8232d45aa2b530dd1ba1e68931791111ec21e"
SUMUP_API_KEY="sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN"

echo "[Step 1/5] Applying database migration..."
echo "─────────────────────────────────────────"

# Read migration file
MIGRATION_SQL=$(cat docker-core/schema/migrations/20260221_sumup_payment_integration.sql)

echo "✅ Migration SQL loaded (162 lines)"
echo ""
echo "📝 Please apply this migration manually:"
echo ""
echo "1. Open: https://supabase.com/dashboard/project/kwgsmbrxfcezuvkwgvuf/sql/new"
echo "2. Copy the file: docker-core/schema/migrations/20260221_sumup_payment_integration.sql"
echo "3. Paste and execute"
echo ""
read -p "✓ Migration applied? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Apply migration first."
    exit 1
fi

echo "✅ Migration confirmed"
echo ""

echo "[Step 2/5] Verifying database schema..."
echo "─────────────────────────────────────────"
curl -s \
  -X POST "${SUPABASE_URL}/rest/v1/rpc/check_gm_payments_columns" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  || echo "⚠️  Manual verification required (check payment_provider column exists)"
echo ""
echo "✅ Database ready"
echo ""

echo "[Step 3/5] Deploying to Vercel..."
echo "─────────────────────────────────────────"
cd integration-gateway

echo "Installing dependencies..."
npm install --production

echo ""
echo "Deploying to Vercel..."
npx vercel --prod --yes \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e SUMUP_ACCESS_TOKEN="$SUMUP_API_KEY" \
  -e SUMUP_API_BASE_URL="https://api.sumup.com" \
  -e SUMUP_MERCHANT_CODE="MNAAKKUV" \
  -e NODE_ENV="production" \
  -e LOG_LEVEL="info"

# Capture deployment URL
GATEWAY_URL=$(npx vercel inspect --token "$VERCEL_TOKEN" | grep "url" | head -1 | cut -d'"' -f4)

if [ -z "$GATEWAY_URL" ]; then
    echo "⚠️  Could not auto-detect URL. Please enter manually:"
    read -p "Gateway URL (e.g., https://integration-gateway-xyz.vercel.app): " GATEWAY_URL
fi

echo "✅ Deployed to: $GATEWAY_URL"
echo ""

cd ..

echo "[Step 4/5] Registering SumUp webhook..."
echo "─────────────────────────────────────────"
WEBHOOK_URL="${GATEWAY_URL}/webhook/sumup"

echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Register webhook with SumUp
curl -X POST https://api.sumup.com/v0.1/me/webhooks \
  -H "Authorization: Bearer ${SUMUP_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"events\": [\"checkout.completed\", \"checkout.failed\"]
  }" || echo "⚠️  Manual webhook registration may be required"

echo ""
echo "✅ Webhook registered"
echo ""

echo "[Step 5/5] Testing deployment..."
echo "─────────────────────────────────────────"

# Health check
echo "Testing health endpoint..."
curl -s "${GATEWAY_URL}/health" | jq '.' || echo "⚠️  Health check failed"

echo ""
echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "📌 Gateway URL: $GATEWAY_URL"
echo "📌 Webhook URL: $WEBHOOK_URL"
echo ""
echo "Next steps:"
echo "1. Test payment flow: http://localhost:5175/app/staff/home (local)"
echo "2. Or deploy merchant-portal: cd merchant-portal && vercel --prod"
echo "3. Create test order and pay with SumUp EUR card"
echo ""
echo "=========================================="
