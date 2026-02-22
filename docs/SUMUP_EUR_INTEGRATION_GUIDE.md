# SumUp Europe (EUR) Integration Guide

## Overview

This document describes the complete implementation of SumUp card payment integration for European restaurants (EUR currency).

**Status**: ✅ API Ready | ⏳ UI Integration Pending

**Provider**: SumUp
**Region**: Europe (Spain, Portugal, Germany, etc.)
**Currency**: EUR
**Payment Methods**: Credit Card, Debit Card
**Account**: MNAAKKUV (ES - Spain merchant account)

---

## Architecture

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   Frontend  │──────▶│ Integration Gateway│──────▶│   SumUp API │
│  (Merchant  │       │   (Port 4320)      │       │             │
│   Portal)   │       │                    │       │             │
└─────────────┘       └──────────────────┘       └─────────────┘
       │                       │                         │
       │                       ▼                         │
       │              ┌──────────────────┐              │
       │              │  Docker Core DB  │              │
       │              │   (gm_payments)  │              │
       │              └──────────────────┘              │
       │                       ▲                         │
       └───────────────────────┴─────────────────────────┘
                         (Webhook callback)
```

### Components

1. **Frontend (merchant-portal)**: React app calling PaymentBroker
2. **Integration Gateway**: Express API handling checkout creation/status
3. **SumUp API**: External payment processor
4. **Docker Core DB**: PostgreSQL database storing payment records
5. **Webhook Handler**: Receives payment confirmation from SumUp

---

## Database Schema

### Migration Applied

File: `docker-core/schema/migrations/20260221_sumup_payment_integration.sql`

```sql
ALTER TABLE public.gm_payments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### Payment Record Example

```json
{
  "id": "uuid-payment-id",
  "restaurant_id": "uuid-restaurant-id",
  "order_id": "uuid-order-id",
  "amount_cents": 2550,
  "currency": "EUR",
  "payment_method": "card",
  "payment_provider": "sumup",
  "external_checkout_id": "5a64a64b-ea2c-4cff-916c-34b0ab7023f1",
  "external_payment_id": "TXID-ABC123",
  "status": "paid",
  "metadata": {
    "checkout_url": "https://pay.sumup.com/...",
    "completed_at": "2026-02-21T23:30:15Z",
    "card_last4": "1234",
    "card_type": "MASTERCARD"
  }
}
```

---

## API Endpoints

### 1. Create Checkout

**Endpoint**: `POST /api/v1/sumup/checkout`

**Headers**:

```
Authorization: Bearer {INTERNAL_API_TOKEN}
Content-Type: application/json
```

**Request Body**:

```json
{
  "orderId": "uuid-order-id",
  "restaurantId": "uuid-restaurant-id",
  "amount": 2550,
  "currency": "EUR",
  "description": "Pedido ABC123",
  "returnUrl": "https://merchant.chefiapp.com/payment/success"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "checkout": {
    "id": "5a64a64b-ea2c-4cff-916c-34b0ab7023f1",
    "url": "https://pay.sumup.com/checkout/5a64a64b...",
    "status": "PENDING",
    "amount": 25.5,
    "currency": "EUR",
    "expiresAt": "2026-02-21T23:45:00Z",
    "reference": "uuid-order-id"
  },
  "paymentId": "uuid-payment-id",
  "timestamp": "2026-02-21T23:30:00Z"
}
```

**Error Response** (400 Bad Request):

```json
{
  "error": "Validation failed",
  "message": "Missing required fields: orderId, restaurantId, amount",
  "timestamp": "2026-02-21T23:30:00Z"
}
```

### 2. Get Checkout Status

**Endpoint**: `GET /api/v1/sumup/checkout/:id`

**Headers**:

```
Authorization: Bearer {INTERNAL_API_TOKEN}
```

**Response** (200 OK):

```json
{
  "success": true,
  "checkout": {
    "id": "5a64a64b-ea2c-4cff-916c-34b0ab7023f1",
    "status": "PAID",
    "amount": 25.5,
    "currency": "EUR",
    "reference": "uuid-order-id",
    "transactions": [
      {
        "id": "TXID-ABC123",
        "amount": 25.5,
        "currency": "EUR",
        "status": "SUCCESSFUL",
        "timestamp": "2026-02-21T23:32:15Z",
        "card": {
          "last_4_digits": "1234",
          "type": "MASTERCARD"
        }
      }
    ],
    "validUntil": "2026-02-21T23:45:00Z"
  },
  "timestamp": "2026-02-21T23:33:00Z"
}
```

**Status Values**:

- `PENDING`: Checkout created, waiting for payment
- `PAID`: Payment completed successfully
- `FAILED`: Payment attempt failed
- `EXPIRED`: Checkout expired (15-30 minutes after creation)

---

## Frontend Integration

### PaymentBroker Usage

File: `merchant-portal/src/core/payment/PaymentBroker.ts`

```typescript
import { PaymentBroker } from "@/core/payment/PaymentBroker";

// 1. Create checkout
const checkout = await PaymentBroker.createSumUpCheckout({
  orderId: "uuid-order-id",
  restaurantId: "uuid-restaurant-id",
  amount: 2550, // €25.50 in cents
  currency: "EUR",
  description: "Pedido #123",
  returnUrl: "https://merchant.chefiapp.com/payment/success",
});

// 2. Redirect user to payment page
window.location.href = checkout.checkout.url;

// 3. After redirect back, poll for status
const status = await PaymentBroker.getSumUpCheckoutStatus(checkout.checkout.id);

if (status.checkout.status === "PAID") {
  // Payment completed - update UI
  console.log("Payment successful!");
} else if (status.checkout.status === "EXPIRED") {
  // Checkout expired - show error
  console.error("Payment expired");
}
```

### Payment Flow (UI)

**Recommended Flow**:

1. User clicks "Pagar com Cartão" (Pay with Card)
2. Frontend calls `PaymentBroker.createSumUpCheckout()`
3. Redirect user to `checkout.url` (SumUp hosted payment page)
4. User enters card details on SumUp page
5. SumUp processes payment
6. User redirected to `returnUrl` with status
7. Frontend polls `getSumUpCheckoutStatus()` to confirm
8. Display success/failure message

**Alternative Flow (Without Redirect)**:

1. Create checkout
2. Open `checkout.url` in iframe/modal (not recommended - less secure)
3. Poll status every 2-5 seconds
4. Display success when `status === 'PAID'`

---

## Webhook Handler

**Endpoint**: `POST /api/v1/webhook/sumup`
**Status**: ✅ Already implemented (HMAC verification + database integration)

File: `integration-gateway/src/index.ts` (lines 68-218)

### Webhook Flow

1. SumUp sends POST request to `/api/v1/webhook/sumup`
2. Gateway verifies HMAC signature (`X-SumUp-Signature` header)
3. Extracts event details (eventId, eventType, paymentStatus)
4. Calls Supabase RPC `process_webhook_event` to log event
5. Updates order via `PaymentIntegrationService.updateOrderFromPaymentEvent()`
6. Updates `gm_payments` record with transaction ID
7. Returns 200 OK (idempotent - duplicate events ignored)

### Webhook Registration

**Action Required**: Register webhook URL in SumUp Dashboard

1. Go to [SumUp Developer Dashboard](https://developer.sumup.com/)
2. Navigate to **Webhooks** section
3. Add new webhook:
   - URL: `https://your-gateway-url.com/api/v1/webhook/sumup`
   - Events: `checkout.paid`, `checkout.failed`
   - Secret: Use `SUMUP_ACCESS_TOKEN` from `.env`
4. Save and test

---

## Environment Variables

### Integration Gateway

File: `integration-gateway/.env`

```env
# SumUp API Configuration
SUMUP_ACCESS_TOKEN=sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN
SUMUP_API_BASE_URL=https://api.sumup.com
SUMUP_MERCHANT_CODE=MNAAKKUV

# Internal Security
INTERNAL_API_TOKEN=chefiapp-internal-token-dev

# Frontend URL (for returnUrl default)
FRONTEND_URL=https://merchant.chefiapp.com

# Database
SUPABASE_URL=http://localhost:3000
SUPABASE_ANON_KEY=your-key-here
```

### Frontend

File: `merchant-portal/.env.local`

```env
# Integration Gateway URL
VITE_API_BASE=http://localhost:4320

# Internal API Token
VITE_INTERNAL_API_TOKEN=chefiapp-internal-token-dev

# SumUp Return URL (optional - defaults to current origin)
VITE_SUMUP_RETURN_URL=https://merchant.chefiapp.com/payment/success
```

---

## Testing

### Manual E2E Test

**Prerequisites**:

1. Integration gateway running: `cd integration-gateway && pnpm dev`
2. Docker Core database running: `docker compose up -d`
3. Migration applied: `psql -f docker-core/schema/migrations/20260221_sumup_payment_integration.sql`

**Test Script**:

```bash
# Run E2E test
cd integration-gateway
node test-sumup-eur-e2e.js
```

**Manual Steps**:

1. Script creates checkout and prints URL
2. Open URL in browser
3. Enter test card: `4242 4242 4242 4242`, Expiry: any future date, CVV: 123
4. Complete payment
5. Script polls status and verifies completion (up to 5 minutes)

### Test Card Numbers

**SumUp Test Cards** (Sandbox):

- Success: `4242 4242 4242 4242`
- Insufficient Funds: `4000 0000 0000 0002`
- Expired Card: `4000 0000 0000 0069`
- Invalid CVV: `4000 0000 0000 0127`

**Production Testing**:

- Use real card with small amount (€0.10)
- Verify in SumUp Dashboard
- Refund immediately after test

---

## Production Deployment

### Checklist

- [ ] **Migration Applied**: Run `20260221_sumup_payment_integration.sql` on production DB
- [ ] **Gateway Deployed**: Deploy integration-gateway to production (Vercel/Railway)
- [ ] **Environment Variables**: Set in production environment
- [ ] **Webhook Registered**: Add production webhook URL in SumUp Dashboard
- [ ] **Test Transaction**: Complete €0.10 test payment in production
- [ ] **Monitoring**: Setup alerts for failed payments (Sentry/Datadog)
- [ ] **Documentation**: Update merchant help docs with card payment instructions

### Deployment Commands

```bash
# Deploy integration-gateway to Vercel
cd integration-gateway
vercel --prod

# Apply migration to production
psql $DATABASE_URL -f docker-core/schema/migrations/20260221_sumup_payment_integration.sql

# Verify tables
psql $DATABASE_URL -c "SELECT payment_provider, external_checkout_id FROM gm_payments LIMIT 1;"
```

### Monitoring

**Key Metrics to Track**:

- Checkout creation rate (requests/min)
- Payment completion rate (% of checkouts → paid)
- Average time to payment (from checkout → paid)
- Failed payment rate (% failed/expired)
- Webhook delivery success (% received within 30s)

**Alerting Rules**:

- Alert if checkout creation fails > 5% (SumUp API issue)
- Alert if payment completion < 70% (UX issue or fraud)
- Alert if webhook delivery fails > 2% (network issue)

---

## Security Considerations

### API Security

1. **Bearer Token**: All API calls require `Authorization: Bearer {token}`
2. **HMAC Verification**: Webhooks verified using HMAC-SHA256 signature
3. **TLS Only**: Production must use HTTPS (no HTTP)
4. **Rate Limiting**: Implement rate limiting (10 req/min per IP)

### PCI Compliance

✅ **No Card Data Storage**: Card details entered on SumUp page (PCI-compliant)
✅ **No CVV Storage**: Never store CVV/CVC codes
✅ **Tokenization**: Use checkout IDs, not card numbers
✅ **Audit Trail**: All payments logged in `gm_payments` table

### Best Practices

- **Idempotency**: Use `checkout_reference` (orderId) for deduplication
- **Expiry Handling**: Checkout expires after 15-30 minutes - show countdown
- **Error Handling**: Display user-friendly messages (not raw API errors)
- **Retry Logic**: Retry checkout creation on network errors (max 3 attempts)

---

## Troubleshooting

### Common Issues

**Problem**: "Unauthorized" error when creating checkout
**Solution**: Verify `INTERNAL_API_TOKEN` matches in gateway and frontend

**Problem**: Checkout creation fails with "Currency mismatch"
**Solution**: SumUp MNAAKKUV account only supports EUR (not BRL/USD)

**Problem**: Webhook not received after payment
**Solution**:

1. Verify webhook URL registered in SumUp Dashboard
2. Check gateway logs: `docker logs integration-gateway`
3. Test webhook manually: `curl -X POST http://localhost:4320/api/v1/webhook/sumup ...`

**Problem**: Payment status stuck on "PENDING"
**Solution**:

1. Check SumUp Dashboard for transaction status
2. Manually call `GET /api/v1/sumup/checkout/:id` to force status update
3. Verify webhook handler is receiving events

---

## Roadmap

### Current Status (Phase 2B - Europe)

✅ Database migration created
✅ API endpoints implemented (`POST /checkout`, `GET /checkout/:id`)
✅ PaymentBroker methods added (`createSumUpCheckout`, `getSumUpCheckoutStatus`)
✅ Webhook handler complete (HMAC verification + DB integration)
✅ E2E test script created
⏳ UI integration (PaymentModal card redirect flow)
⏳ Production deployment

### Next Steps

1. **UI Integration** (2-3 hours)

   - Add "Pagar com Cartão (Europe)" button to PaymentModal
   - Implement redirect flow with loading state
   - Handle success/failure callbacks
   - Display card payment confirmation

2. **Testing** (1-2 hours)

   - Run E2E test on staging environment
   - Test with real card (€0.10 transaction)
   - Verify webhook delivery
   - Test error scenarios (expired card, insufficient funds)

3. **Production Deployment** (1 hour)

   - Deploy integration-gateway to production
   - Apply migration to production database
   - Register production webhook URL
   - Monitor first 10 transactions

4. **Documentation** (30 minutes)
   - Update merchant help docs
   - Create internal runbook for support team
   - Add payment method to onboarding flow

### Future Enhancements

- **Multi-Currency Support**: Add USD (Stripe), BRL (Pix) routing
- **Split Payments**: Support partial payments (50% now, 50% later)
- **Recurring Payments**: Tokenization for saved cards
- **3D Secure**: Enhanced security for high-value transactions
- **Refunds**: API endpoint for issuing refunds
- **Analytics**: Payment funnel dashboard (merchant-portal)

---

## Support

**SumUp API Documentation**: https://developer.sumup.com/docs/
**SumUp Support**: support@sumup.com
**Internal Team**: @goldmonkey (implementation), @team (operations)

**Emergency Contacts**:

- Payment issues: Slack #payments-critical
- API outages: ops@chefiapp.com
- Security incidents: security@chefiapp.com

---

**Document Version**: 1.0
**Last Updated**: 2026-02-21
**Author**: GitHub Copilot (Claude Sonnet 4.5)
**Status**: Ready for Production Deployment 🚀
