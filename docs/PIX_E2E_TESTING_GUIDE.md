# 🧪 PIX E2E Testing Guide

## ✅ Configuração Completa

**Data**: February 21, 2026
**Status**: Pronto para testes E2E
**API Key**: Configurada (sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN)

---

## 🔐 Configuração Current

### Integration Gateway (.env)

```env
SUMUP_ACCESS_TOKEN=sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN
SUMUP_API_BASE_URL=https://api.sumup.com
SUMUP_PIX_DEFAULT_COUNTRY=BR
SUMUP_PIX_DEFAULT_CURRENCY=BRL
```

### Merchant Portal (.env.local)

```env
VITE_API_BASE=http://localhost:4320
VITE_INTERNAL_API_TOKEN=chefiapp-internal-token-dev
```

---

## 🚀 Quick Start Testing

### 1. Start Services

```bash
# Terminal 1: Integration Gateway
cd integration-gateway
pnpm install
pnpm dev
# Should start on http://localhost:4320

# Terminal 2: Merchant Portal
cd merchant-portal
pnpm install
pnpm dev
# Should start on http://localhost:5175

# Terminal 3: Docker Core (if needed)
cd docker-core
docker-compose -f docker-compose.core.yml up -d
```

### 2. Verify Gateway Health

```bash
curl http://localhost:4320/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 3. Test Pix Checkout Creation (API)

```bash
curl -X POST http://localhost:4320/api/v1/payment/pix/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer chefiapp-internal-token-dev" \
  -d '{
    "amount": 10.50,
    "currency": "BRL",
    "orderId": "order_test_001",
    "restaurantId": "rest_001",
    "description": "Test Order - Pix Payment"
  }'
```

**Expected Response**:

```json
{
  "provider": "sumup",
  "payment_method": "pix",
  "country": "BR",
  "checkout_id": "ckout_xxxxx",
  "checkout_reference": "CREF_xxxxx",
  "status": "PENDING",
  "amount": 10.5,
  "currency": "BRL",
  "raw": {
    "id": "ckout_xxxxx",
    "checkout_reference": "CREF_xxxxx",
    "amount": 10.5,
    "currency": "BRL",
    "pay_to_email": "merchant@example.com",
    "merchant_code": "MERCHANT_CODE",
    "status": "PENDING",
    "date": "2026-02-21T...",
    "transactions": [],
    "qr_code_url": "https://api.sumup.com/qr/xxxxx"
  }
}
```

### 4. Get QR Code Status

```bash
curl -X GET http://localhost:4320/api/v1/payment/sumup/checkout/ckout_xxxxx \
  -H "Authorization: Bearer chefiapp-internal-token-dev"
```

---

## 🖥️ UI Testing

### Manual Flow

1. Open `http://localhost:5175/app/tpv`
2. Click "Nova Mesa" or select existing table
3. Add items to order (e.g., "Hamburguer €8.50", "Coca-Cola €2.50")
4. Click "Pagamento" button
5. Select "PIX ⚡" payment method
6. Click "Confirmar €11.00"
7. **Verify**:
   - ✅ QR Code appears (280px × 280px)
   - ✅ Countdown timer shows "10:00"
   - ✅ Timer counts down (9:59, 9:58...)
   - ✅ Status text: "Aguardando confirmação..."
   - ✅ QR Code loads without errors
   - ✅ Console shows polling logs every 2 seconds

### Test Scenarios

#### ✅ Scenario 1: Happy Path (Complete Payment)

1. Generate QR Code via UI
2. Copy QR Code URL from browser console or network tab
3. Use SumUp test environment to simulate payment:
   - Open SumUp Merchant Dashboard (if available)
   - Or use SumUp's test payment simulator
4. Scan QR Code with test device/simulator
5. Complete payment in test app
6. **Expected**:
   - UI shows "Pagamento Pix confirmado!" ✅
   - Order status updates to "PAID"
   - Payment record created in database

#### 🕒 Scenario 2: QR Code Expiry

1. Generate QR Code via UI
2. Wait 10 minutes (or fast-forward timer in dev tools)
3. **Expected**:
   - Timer reaches 0:00
   - UI shows "QR Code expirou" message ⏱️
   - "Confirmar" button becomes active again
   - Can regenerate new QR Code

#### ❌ Scenario 3: Network Error

1. Stop integration-gateway service
2. Click "Confirmar €XX.XX" in UI
3. **Expected**:
   - Error message: "Erro ao criar checkout Pix"
   - Console shows fetch error
   - User can retry after restarting gateway

#### 🔄 Scenario 4: Payment Cancellation

1. Generate QR Code
2. In SumUp dashboard, cancel the checkout
3. **Expected**:
   - Polling detects "CANCELED" status
   - UI shows cancellation message
   - User can regenerate QR Code

---

## 🔍 Debugging

### Check Gateway Logs

```bash
cd integration-gateway
tail -f logs/gateway.log

# Or if using pm2:
pm2 logs integration-gateway
```

### Check Browser Console

Open DevTools (F12) → Console tab

Expected logs:

```
[PaymentModal] Creating Pix checkout for order_xxx...
[PaymentBroker] POST /api/v1/payment/pix/checkout
[PaymentModal] QR Code ready: ckout_xxxxx
[PaymentModal] Polling status every 2s...
[PaymentBroker] GET /api/v1/payment/sumup/checkout/ckout_xxxxx
[PaymentModal] Status: PENDING
[PaymentModal] Status: PENDING
[PaymentModal] Status: PAID ✅
[PaymentModal] Payment confirmed!
```

### Check Network Tab

1. Open DevTools → Network tab
2. Filter: XHR/Fetch
3. Look for:
   - `POST /api/v1/payment/pix/checkout` (create)
   - `GET /api/v1/payment/sumup/checkout/:id` (polling)

### Verify Database

```sql
-- Check webhook events
SELECT * FROM webhook_events
WHERE provider = 'sumup'
ORDER BY created_at DESC
LIMIT 10;

-- Check payment records
SELECT * FROM payments
WHERE payment_method = 'pix'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🧪 Automated Testing

### Unit Tests (Already Passing ✅)

```bash
cd integration-gateway
npm test

# Expected: 25/25 passing
```

### Integration Tests (API Level)

```bash
# Test Pix checkout creation
bash scripts/test-pix-checkout.sh

# Test webhook idempotency
bash scripts/test-pix-webhook-idempotency.sh
```

### E2E Tests (Playwright - Optional)

```bash
cd tests/e2e
npx playwright test pix-payment.spec.ts
```

---

## ✅ Success Criteria

### Phase 2B: API Validation

- [ ] Gateway starts without errors
- [ ] `/api/v1/payment/pix/checkout` returns 200 with valid response
- [ ] QR Code URL is generated successfully
- [ ] `/api/v1/payment/sumup/checkout/:id` returns status correctly
- [ ] No authentication errors (401/403)

### Phase 2C: UI Validation

- [ ] QR Code displays in UI (no broken image)
- [ ] Countdown timer works (10:00 → 9:59 → ...)
- [ ] Polling logs appear in console every 2 seconds
- [ ] QR Code expires at 0:00 with correct message
- [ ] Error handling works (network failures)
- [ ] Can regenerate QR Code after expiry

### Phase 2D: End-to-End Validation (Requires SumUp Test Environment)

- [ ] Payment simulation in SumUp test environment
- [ ] Webhook received at gateway
- [ ] HMAC signature verified successfully
- [ ] Payment status updated in database
- [ ] Order marked as PAID
- [ ] Idempotency validated (duplicate webhooks ignored)

---

## 🚨 Common Issues

### Issue 1: "SUMUP_ACCESS_TOKEN is not configured"

**Solution**: Verify `.env` file in `integration-gateway/`:

```bash
grep SUMUP_ACCESS_TOKEN integration-gateway/.env
```

### Issue 2: CORS Error in Browser

**Solution**: Gateway should include CORS headers. Check `integration-gateway/src/index.ts`:

```typescript
app.use(cors({ origin: "http://localhost:5175" }));
```

### Issue 3: QR Code Image Fails to Load

**Possible Causes**:

1. Invalid `qr_code_url` in API response
2. CORS restriction on SumUp QR images
3. Network timeout

**Debug**:

```javascript
// In browser console:
fetch(qrCodeUrl, { mode: "no-cors" })
  .then(() => console.log("QR URL accessible"))
  .catch((err) => console.error("QR URL error:", err));
```

### Issue 4: Polling Not Stopping After Payment

**Solution**: Check cleanup in `useEffect`:

```typescript
return () => clearInterval(pollInterval);
```

---

## 📞 Next Steps

### Immediate (Can Do Now)

1. **Start services** and verify gateway health
2. **Test API** with curl commands above
3. **Test UI** with manual flow (Scenarios 1-4)
4. **Check logs** to ensure no errors

### When SumUp Test Environment Available

1. Request **test merchant code** from SumUp
2. Configure **sandbox webhook URL** in SumUp dashboard
3. Simulate **real payment flow** with test device
4. Validate **webhook idempotency** with duplicate events
5. Document **KPIs** (latency, success rate, etc.)

### Before Production

1. Switch to **production API key** (if different from test)
2. Configure **production webhook URL** (HTTPS required)
3. Enable **audit logging** for all Pix transactions
4. Set up **monitoring** (Sentry, Datadog, etc.)
5. Document **SLA targets** (< 2s payment confirmation)

---

## 📊 Expected Performance

| Metric               | Target          | Status         |
| -------------------- | --------------- | -------------- |
| Checkout creation    | < 500ms         | ⏳ To measure  |
| QR Code generation   | < 1s            | ⏳ To measure  |
| Polling interval     | 2s              | ✅ Implemented |
| Payment confirmation | < 5s after scan | ⏳ To measure  |
| Webhook latency      | < 2s            | ⏳ To measure  |
| Idempotency rate     | 100%            | ✅ Implemented |

---

**Status**: ✅ Configuração completa — Pronto para testes!

**Próxima ação**: Executar comandos de teste acima e validar fluxo UI.
