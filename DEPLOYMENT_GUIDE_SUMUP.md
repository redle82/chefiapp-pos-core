# 🚀 SumUp EUR Payment Integration - Production Deployment Guide

## ✅ Status: READY FOR DEPLOYMENT

### 📋 Prerequisites (All Complete)

- [x] Migration SQL created
- [x] Integration Gateway .env updated with production credentials
- [x] Vercel configuration created
- [x] SumUp API key obtained: `sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN`
- [x] Supabase production credentials confirmed

---

## 🎯 Deployment Steps

### Step 1: Apply Database Migration (Manual)

**Open:** https://supabase.com/dashboard/project/kwgsmbrxfcezuvkwgvuf/sql/new

**Copy and paste the entire SQL from:**
`docker-core/schema/migrations/20260221_sumup_payment_integration.sql`

**Or run this command to see the SQL:**

```bash
cat docker-core/schema/migrations/20260221_sumup_payment_integration.sql
```

**What it does:**

- Adds `payment_provider` column to `gm_payments`
- Adds `external_checkout_id` for SumUp checkout tracking
- Adds `external_payment_id` for final transaction ID
- Adds `metadata` JSONB for provider-specific data
- Creates performance indexes

**Expected output:** ✓ Success messages confirming columns and indexes created

---

### Step 2: Deploy Integration Gateway to Vercel

```bash
cd integration-gateway

# Login to Vercel (if needed)
npx vercel login

# Deploy to production
npx vercel --prod
```

**Environment variables will be set via vercel.json:**

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUMUP_ACCESS_TOKEN
- SUMUP_API_BASE_URL
- SUMUP_MERCHANT_CODE

**Save the deployment URL** (e.g., `https://integration-gateway-xyz.vercel.app`)

---

### Step 3: Test Gateway Health

```bash
# Replace with your actual deployment URL
GATEWAY_URL="https://integration-gateway-xyz.vercel.app"

curl -s "$GATEWAY_URL/health" | jq '.'
```

**Expected response:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-22T...",
  "service": "integration-gateway",
  "version": "1.0.0"
}
```

---

### Step 4: Register SumUp Webhook

```bash
# Replace with your actual gateway URL
GATEWAY_URL="https://integration-gateway-xyz.vercel.app"
WEBHOOK_URL="${GATEWAY_URL}/webhook/sumup"

curl -X POST https://api.sumup.com/v0.1/me/webhooks \
  -H "Authorization: Bearer sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"events\": [\"checkout.completed\", \"checkout.failed\"]
  }"
```

**Expected response:**

```json
{
  "id": "webhook-id-here",
  "url": "https://integration-gateway-xyz.vercel.app/webhook/sumup",
  "events": ["checkout.completed", "checkout.failed"],
  "status": "active"
}
```

---

### Step 5: Update Merchant Portal Environment

If deploying merchant-portal to production, update `.env.production`:

```bash
cd merchant-portal

# Create .env.production
cat > .env.production << EOF
VITE_API_BASE=https://integration-gateway-xyz.vercel.app
VITE_INTERNAL_API_TOKEN=chefiapp-internal-token-prod
VITE_SUPABASE_URL=https://kwgsmbrxfcezuvkwgvuf.supabase.co
VITE_SUPABASE_ANON_KEY=sbp_9ec8232d45aa2b530dd1ba1e68931791111ec21e
EOF

# Deploy to Vercel
npx vercel --prod
```

---

### Step 6: End-to-End Test

**Test locally first (gateway in production, portal local):**

```bash
# Terminal 1: Start local merchant portal pointing to prod gateway
cd merchant-portal
VITE_API_BASE=https://integration-gateway-xyz.vercel.app pnpm run dev
```

**Then:**

1. Open http://localhost:5175/app/staff/home
2. Create a test order (e.g., €10.00)
3. Click "Cartão EUR 🇪🇺 (SumUp)"
4. System should:
   - Create checkout via production gateway
   - Insert record in production database
   - Redirect to SumUp payment page
5. Complete payment on SumUp (use test card if available)
6. Webhook should update payment status to "paid"

---

## 🔍 Verification Checklist

- [ ] Migration applied successfully in Supabase SQL Editor
- [ ] `gm_payments` table has new columns (payment_provider, external_checkout_id, etc.)
- [ ] Integration Gateway deployed to Vercel
- [ ] Gateway `/health` endpoint responds with 200 OK
- [ ] Webhook registered with SumUp successfully
- [ ] Test payment flow creates checkout correctly
- [ ] Payment completion updates database via webhook
- [ ] Order status changes to "paid" after successful payment

---

## 📌 Production URLs

**Integration Gateway:** (Fill after deployment)

```
https://integration-gateway-_____.vercel.app
```

**Webhook URL:** (Fill after deployment)

```
https://integration-gateway-_____.vercel.app/webhook/sumup
```

**Merchant Portal:** (If deployed)

```
https://merchant-portal-_____.vercel.app
```

---

## 🛟 Troubleshooting

### Gateway not starting

- Check Vercel logs: `npx vercel logs`
- Verify environment variables are set correctly in Vercel dashboard

### Checkout creation fails

- Verify SumUp API key is valid: `curl -H "Authorization: Bearer sup_sk_cFFI..." https://api.sumup.com/v0.1/me`
- Check gateway logs for error messages

### Webhook not received

- Verify webhook is registered: `curl -H "Authorization: Bearer sup_sk_cFFI..." https://api.sumup.com/v0.1/me/webhooks`
- Check Vercel logs for incoming webhook requests
- Test webhook manually with curl

### Database not updating

- Verify Supabase credentials are correct
- Check if `gm_payments` table has correct schema
- Look for errors in gateway logs

---

## 🎉 Success Criteria

✅ Gateway deployed and healthy
✅ Database migration applied
✅ Webhook registered with SumUp
✅ Payment flow creates checkout successfully
✅ SumUp payment page loads correctly
✅ Successful payment updates database status
✅ Order marked as "paid" in merchant portal

---

**Ready to deploy? Run the steps above sequentially!**
