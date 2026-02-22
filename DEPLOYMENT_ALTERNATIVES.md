# 🚨 Deployment Alternative Plan

## Issue

Vercel free tier limit reached (5000 uploads/day). Need to wait 11 hours or use alternative platform.

---

## ✅ Option 1: Railway (Recommended Now)

Railway doesn't have the same upload limits. Here's how to deploy:

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

### Step 3: Initialize Project

```bash
cd integration-gateway
railway init
```

### Step 4: Set Environment Variables

```bash
railway variables set PORT=4320
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://kwgsmbrxfcezuvkwgvuf.supabase.co
railway variables set SUPABASE_ANON_KEY=sbp_9ec8232d45aa2b530dd1ba1e68931791111ec21e
railway variables set SUMUP_ACCESS_TOKEN=sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN
railway variables set SUMUP_API_BASE_URL=https://api.sumup.com
railway variables set SUMUP_MERCHANT_CODE=MNAAKKUV
railway variables set LOG_LEVEL=info
```

### Step 5: Deploy

```bash
railway up
```

### Step 6: Get Deployment URL

```bash
railway domain
```

---

## ✅ Option 2: Render (Also Good)

### Via Render Dashboard:

1. **Create New Web Service:**

   - Go to: https://dashboard.render.com/
   - Click "New +" → "Web Service"

2. **Connect Repository:**

   - Connect your GitHub repo: goldmonkey777/ChefIApp-POS-CORE
   - Root directory: `integration-gateway`

3. **Configure Service:**

   - **Name:** integration-gateway
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

4. **Environment Variables:**

   ```
   PORT=4320
   NODE_ENV=production
   SUPABASE_URL=https://kwgsmbrxfcezuvkwgvuf.supabase.co
   SUPABASE_ANON_KEY=sbp_9ec8232d45aa2b530dd1ba1e68931791111ec21e
   SUMUP_ACCESS_TOKEN=sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN
   SUMUP_API_BASE_URL=https://api.sumup.com
   SUMUP_MERCHANT_CODE=MNAAKKUV
   LOG_LEVEL=info
   ```

5. **Deploy:** Click "Create Web Service"

---

## ✅ Option 3: Vercel (Wait 11 Hours)

```bash
# Available at: 2026-02-22 ~14:00 (11 hours from now)
cd integration-gateway
npx vercel --prod --yes --archive=tgz
```

---

## 📋 After Deployment (Any Platform)

### 1. Test Health Endpoint

```bash
# Replace with your deployment URL
GATEWAY_URL="https://your-gateway-url.com"
curl -s "$GATEWAY_URL/health" | jq '.'
```

### 2. Apply Database Migration

**Manual (Recommended):**

1. Open: https://supabase.com/dashboard/project/kwgsmbrxfcezuvkwgvuf/sql/new
2. Paste contents of: `docker-core/schema/migrations/20260221_sumup_payment_integration.sql`
3. Execute

**Migration SQL (Copy this):**

```sql
-- Add payment provider columns
ALTER TABLE public.gm_payments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_gm_payments_external_checkout
  ON public.gm_payments(external_checkout_id)
  WHERE external_checkout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_payments_provider
  ON public.gm_payments(payment_provider, created_at DESC)
  WHERE payment_provider IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_payments_external_payment
  ON public.gm_payments(external_payment_id)
  WHERE external_payment_id IS NOT NULL;

-- Verify
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'gm_payments'
          AND column_name = 'payment_provider'
    ) THEN
        RAISE NOTICE '✓ SumUp columns added successfully';
    ELSE
        RAISE EXCEPTION '✗ Failed to add columns';
    END IF;
END $$;
```

### 3. Register Webhook

```bash
GATEWAY_URL="https://your-gateway-url.com"
WEBHOOK_URL="${GATEWAY_URL}/webhook/sumup"

curl -X POST https://api.sumup.com/v0.1/me/webhooks \
  -H "Authorization: Bearer sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"events\": [\"checkout.completed\", \"checkout.failed\"]
  }"
```

### 4. Test End-to-End

```bash
# Update merchant-portal to use production gateway
cd ../merchant-portal
VITE_API_BASE=$GATEWAY_URL pnpm run dev

# Open http://localhost:5175/app/staff/home
# Create order → Pay with SumUp EUR → Complete payment
```

---

## 🎯 Quick Start (Railway - Fastest Now)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Navigate to gateway
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/integration-gateway

# Login
railway login

# Deploy
railway up

# Set all environment variables (from commands above)
# Get deployment URL
railway domain
```

---

## 📝 Manual Deployment (No CLI)

If you prefer manual setup:

1. **Create account on Railway/Render/Fly.io**
2. **Create new service from GitHub repo**
3. **Set environment variables in dashboard**
4. **Deploy**
5. **Get URL and register webhook**

---

Choose the option that works best for you! Railway is probably the fastest right now since Vercel is rate-limited.
