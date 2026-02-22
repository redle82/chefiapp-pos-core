# 🌍 Payment Routing Strategy - Multi-Region

> **Strategic Decision**: Route payment methods by customer region for optimal local payment support

---

## 📋 Overview

ChefIApp POS uses a **region-based payment routing** strategy to provide the best payment experience for customers worldwide:

| Region               | Primary Method      | Provider  | Account           | Status        |
| -------------------- | ------------------- | --------- | ----------------- | ------------- |
| 🇧🇷 **Brazil**        | Pix (Instant)       | TBD       | BR/BRL merchant   | ⏳ Pending    |
| 🇪🇺 **Europe**        | Card (Credit/Debit) | **SumUp** | ES/EUR (MNAAKKUV) | ✅ **Active** |
| 🌎 **Rest of World** | Card (Credit/Debit) | Stripe    | USD merchant      | ⏳ Pending    |

---

## ✅ Current Status: Europe (SumUp)

### Account Details

- **Provider**: SumUp
- **Merchant Code**: `MNAAKKUV`
- **Country**: ES (Spain)
- **Currency**: EUR (Euro)
- **Category**: 5812 (Restaurants)
- **API Key**: Configured in `.env` (SUMUP_ACCESS_TOKEN)
- **Base URL**: `https://api.sumup.com`

### Validated Endpoints

✅ **POST /v0.1/checkouts** - Create checkout (Status 201)
✅ **GET /v0.1/checkouts/:id** - Get checkout status (Status 200)
✅ **GET /v0.1/me** - Merchant profile (Status 200)

### Test Results (2026-02-21)

```bash
# Card Payment (EUR) - SUCCESS ✅
curl -X POST https://api.sumup.com/v0.1/checkouts \
  -H "Authorization: Bearer $SUMUP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkout_reference": "TEST_123",
    "amount": 10.50,
    "currency": "EUR",
    "merchant_code": "MNAAKKUV",
    "description": "Test Order",
    "return_url": "https://chefiapp.com/success"
  }'

# Response:
{
  "id": "5a64a64b-ea2c-4cff-916c-34b0ab7023f1",
  "status": "PENDING",
  "amount": 10.50,
  "currency": "EUR",
  "merchant_code": "MNAAKKUV",
  "merchant_country": "ES"
}
```

---

## 🏗️ Implementation Architecture

### Payment Router Service

```typescript
// integration-gateway/src/services/payment-router.ts

interface PaymentRequest {
  amount: number;
  currency: string;
  country: string;
  orderId: string;
  description: string;
}

interface PaymentProvider {
  name: "sumup" | "stripe" | "pix-provider";
  createCheckout(request: PaymentRequest): Promise<CheckoutResponse>;
  getStatus(checkoutId: string): Promise<StatusResponse>;
}

class PaymentRouter {
  /**
   * Route payment to appropriate provider based on customer region
   */
  async routePayment(request: PaymentRequest): Promise<CheckoutResponse> {
    const provider = this.selectProvider(request.country, request.currency);

    return provider.createCheckout(request);
  }

  private selectProvider(country: string, currency: string): PaymentProvider {
    // Brazil: Pix provider
    if (country === "BR" && currency === "BRL") {
      return this.pixProvider;
    }

    // Europe: SumUp (ES/EUR merchant)
    if (this.isEuropeanCountry(country) && currency === "EUR") {
      return this.sumupProvider;
    }

    // Rest of World: Stripe
    return this.stripeProvider;
  }

  private isEuropeanCountry(country: string): boolean {
    const europeanCountries = [
      "AT",
      "BE",
      "BG",
      "HR",
      "CY",
      "CZ",
      "DK",
      "EE",
      "FI",
      "FR",
      "DE",
      "GR",
      "HU",
      "IE",
      "IT",
      "LV",
      "LT",
      "LU",
      "MT",
      "NL",
      "PL",
      "PT",
      "RO",
      "SK",
      "SI",
      "ES",
      "SE",
      "GB",
      "CH",
      "NO",
      "IS",
    ];
    return europeanCountries.includes(country);
  }
}
```

---

## 🇪🇺 Europe Implementation (Phase 1) - **READY NOW**

### Scope

- **Target Markets**: EU countries (27 members + EEA)
- **Payment Method**: Credit/Debit cards
- **Currency**: EUR
- **Provider**: SumUp (account MNAAKKUV)

### Integration Status

| Component            | Status  | Notes                                   |
| -------------------- | ------- | --------------------------------------- |
| Environment Config   | ✅ Done | SUMUP_ACCESS_TOKEN, SUMUP_MERCHANT_CODE |
| Checkout Creation    | ✅ Done | POST /v0.1/checkouts working (201)      |
| Status Polling       | ✅ Done | GET /v0.1/checkouts/:id working (200)   |
| Webhook Handler      | ⏳ TODO | Receive payment status updates          |
| Database Persistence | ⏳ TODO | Store checkout_id, status, transactions |
| UI Components        | ✅ Done | PaymentModal (from Phase 2)             |
| E2E Testing          | ⏳ TODO | Full order flow with SumUp EUR          |

### Next Steps (Phase 2B - Europe)

1. ✅ **Validate SumUp API** (DONE - 2026-02-21)
2. ⏳ **Implement Webhook Handler** (1-2 hours)
   - Endpoint: POST /webhooks/sumup
   - Verify HMAC signature
   - Update payment status in database
   - Trigger order completion workflow
3. ⏳ **Database Schema** (30 min)
   - Add `sumup_checkout_id` to payments table
   - Add `payment_provider` enum ('sumup', 'stripe', 'pix')
   - Migration script
4. ⏳ **E2E Test Flow** (2 hours)
   - Create order → SumUp checkout → Status polling → Completion
   - Test scenarios: Success, Timeout, User cancel, Error
5. ⏳ **Production Deployment** (1 hour)
   - Environment variables (Vercel)
   - SumUp webhook URL registration
   - Monitoring/logging setup

**Total Estimate**: 6-8 hours to production-ready Europe payments

---

## 🇧🇷 Brazil Implementation (Phase 2) - **FUTURE**

### Requirements

- **Payment Method**: Pix (instant bank transfer)
- **Currency**: BRL (Reais)
- **Provider Options**:
  1. **SumUp Brazil** (requires new BR merchant account)
     - Timeline: 2-7 days (KYC + approval)
     - Action: Contact support@sumup.com
  2. **Mercado Pago** (Brazil-native, Pix leader)
     - Instant signup
     - Best Pix integration
     - Lower fees for BR transactions
  3. **PagSeguro** (Uol/PagBank)
     - Established Brazilian player

### Recommended: Mercado Pago

- **Why**: Native Pix support, instant onboarding, lower fees
- **Timeline**: 1-2 days (account approval)
- **API**: Similar to SumUp (REST + webhooks)

---

## 🌎 Rest of World Implementation (Phase 3) - **FUTURE**

### Requirements

- **Payment Method**: Credit/Debit cards (Visa, Mastercard, Amex)
- **Currency**: Multi-currency (USD primary)
- **Provider**: Stripe

### Why Stripe

- Global coverage (135+ countries)
- Multi-currency support
- Excellent API/docs
- Strong fraud prevention
- Dashboard for reconciliation

### Integration Complexity

- Similar to SumUp (checkout creation + webhooks)
- Reuse same PaymentRouter architecture
- Timeline: 4-6 hours (already have partial Stripe integration)

---

## 📊 Rollout Plan

### Phase 2B: Europe (SumUp) - **THIS WEEK**

- **Target**: EU restaurants, European customers
- **Timeline**: 2-3 days
- **Effort**: 6-8 hours
- **Risk**: Low (API validated, account working)
- **Value**: Immediate European market support

### Phase 3: Brazil (Pix via Mercado Pago) - **NEXT SPRINT**

- **Target**: Brazilian restaurants, local customers
- **Timeline**: 1 week (including account approval)
- **Effort**: 8-12 hours
- **Risk**: Medium (new provider integration)
- **Value**: Critical for Brazilian market penetration

### Phase 4: Global (Stripe) - **FUTURE**

- **Target**: Non-EU/BR restaurants, international customers
- **Timeline**: 1 week
- **Effort**: 6-8 hours (partial code exists)
- **Risk**: Low (mature integration)
- **Value**: Complete global coverage

---

## 🧪 Testing Strategy

### Europe (SumUp)

```bash
# Test EUR card checkout
cd integration-gateway
node test-sumup-full.js

# Expected:
# ✅ Card Checkout (EUR): Works
# ❌ Pix Checkout (BRL): Not Available (expected)
```

### Brazil (Future)

```bash
# Test BRL Pix checkout
node test-pix-mercadopago.js

# Expected:
# ✅ Pix Checkout (BRL): Works
# QR Code: <data>
# Expiry: 10 minutes
```

### Stripe (Future)

```bash
# Test multi-currency checkout
node test-stripe-global.js

# Expected:
# ✅ Card Checkout (USD): Works
# ✅ Card Checkout (GBP): Works
# ✅ Card Checkout (JPY): Works
```

---

## 🔐 Security Considerations

### API Keys per Environment

```env
# Development
SUMUP_ACCESS_TOKEN=sup_sk_test_...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
STRIPE_SECRET_KEY=sk_test_...

# Production
SUMUP_ACCESS_TOKEN=sup_sk_live_...
MERCADOPAGO_ACCESS_TOKEN=APP-...
STRIPE_SECRET_KEY=sk_live_...
```

### Webhook Security

1. **SumUp**: HMAC signature verification
2. **Mercado Pago**: X-Signature header validation
3. **Stripe**: Webhook secret + signature validation

### PCI Compliance

- ✅ No card data stored (tokenization only)
- ✅ HTTPS only
- ✅ Provider-hosted checkout pages
- ✅ Webhook validation

---

## 📈 Success Metrics

### KPIs per Region

| Metric                      | Europe (SumUp) | Brazil (Pix) | Global (Stripe) |
| --------------------------- | -------------- | ------------ | --------------- |
| **Conversion Rate**         | Target: 85%    | Target: 95%  | Target: 80%     |
| **Avg. Transaction Time**   | 30-60s         | 10-30s       | 30-90s          |
| **Failed Payments**         | <2%            | <1%          | <3%             |
| **Customer Support Issues** | <5%            | <3%          | <8%             |

### Monitoring

- Payment success/failure rates by provider
- Average transaction completion time
- Webhook delivery success rate
- API error rates (4xx, 5xx)

---

## 🚀 Quick Start (Europe - Now)

### 1. Environment Setup

```bash
cd integration-gateway
cat .env | grep SUMUP

# Should see:
# SUMUP_ACCESS_TOKEN=sup_sk_cFFIrqohzBbKf4Xu3Rhu6k42hYRHlfLvN
# SUMUP_API_BASE_URL=https://api.sumup.com
# SUMUP_MERCHANT_CODE=MNAAKKUV
```

### 2. Test API

```bash
node test-sumup-full.js

# ✅ Card Checkout (EUR): Works
# ✅ Status Polling: Works
```

### 3. Start Integration Gateway

```bash
pnpm dev:gateway

# Gateway running on http://localhost:4320
```

### 4. Create Test Checkout

```bash
curl -X POST http://localhost:4320/api/v1/sumup/checkout \
  -H "Authorization: Bearer chefiapp-internal-token-dev" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25.50,
    "currency": "EUR",
    "orderId": "ORD-12345",
    "description": "Pizza Margherita + Coca Cola"
  }'

# Response:
# {
#   "checkout_id": "...",
#   "status": "PENDING",
#   "checkout_url": "https://pay.sumup.com/...",
#   "amount": 25.50,
#   "currency": "EUR"
# }
```

---

## 📚 Documentation

### For Developers

- [SumUp API Docs](https://developer.sumup.com/docs/)
- [Mercado Pago Pix Guide](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/pix)
- [Stripe API Reference](https://stripe.com/docs/api)

### Internal Docs

- `/docs/PIX_E2E_TESTING_GUIDE.md` - Pix testing procedures
- `/docs/SUMUP_EUROPE_INTEGRATION.md` - This document
- `/integration-gateway/README.md` - Gateway architecture

---

## 🎯 Decision Summary

**Strategic Choice**: Multi-provider routing by region

- **Why**: Optimize for local payment preferences
- **Europe**: SumUp (cards, EUR) - ✅ **Ready Now**
- **Brazil**: Pix provider (instant, BRL) - 🔄 Next sprint
- **Global**: Stripe (cards, multi-currency) - 📅 Future

**Current Action**: Proceed with **Phase 2B (Europe/SumUp)**

- API validated ✅
- Account working ✅
- 6-8 hours to production ⏱️

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-21
**Status**: ✅ Europe Ready | ⏳ Brazil Pending | ⏳ Global Pending
**Next Review**: After Phase 2B completion
