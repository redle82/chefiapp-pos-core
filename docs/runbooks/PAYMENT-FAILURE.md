# Runbook: Payment Failure Rate High

**Alert Rule**: `payment_failure_rate`
**Severity**: CRITICAL
**Threshold**: Payment failure rate > 10% (minimum 5 total attempts)
**Cooldown**: 30 minutes

---

## Symptoms

- Alert "High Payment Failure Rate" triggered on the Monitoring dashboard
- Customers reporting declined payments at checkout
- `payment.failed` counter climbing in Metrics section
- Stripe webhook `payment_intent.payment_failed` events spiking

## Impact

- Revenue loss: customers unable to complete orders
- Operational disruption: staff forced to handle cash-only fallback
- Customer experience: frustration, potential walkouts

## Investigation Steps

### 1. Confirm the scope (1 min)

Open the Monitoring page in the merchant portal:
- Navigate to **Admin > System Monitoring**
- Check the Counters section for `payment.success` vs `payment.failed`
- Determine if failures are across all payment methods or isolated to one

### 2. Check Stripe Dashboard (2 min)

- Open [Stripe Dashboard > Payments](https://dashboard.stripe.com/payments)
- Filter by status "Failed" in the last hour
- Check the decline codes:
  - `card_declined` -- customer card issue, not a system problem
  - `authentication_required` -- 3D Secure flow broken
  - `processing_error` -- Stripe-side issue
  - `api_error` -- integration problem

### 3. Check circuit breaker state (1 min)

- On the Monitoring page, expand "System Health" widget
- Check "Payments" service status
- If circuit breaker is OPEN:
  - All payment requests are being short-circuited
  - The breaker opened due to consecutive failures
  - It will auto-recover to HALF_OPEN after the configured timeout

### 4. Check environment configuration (2 min)

Verify environment variables are set correctly:

```bash
# In Vercel or your deployment platform, check:
VITE_STRIPE_PUBLISHABLE_KEY   # Must start with pk_live_ or pk_test_
STRIPE_SECRET_KEY              # Must start with sk_live_ or sk_test_
STRIPE_WEBHOOK_SECRET          # Must start with whsec_
```

If any of these are missing or contain test keys in production, that is the root cause.

### 5. Check network quality (1 min)

- Open browser DevTools > Network tab
- Attempt a test payment
- Check if Stripe API calls (`api.stripe.com`) are timing out or returning errors
- Check Supabase connectivity (the order needs to be saved before payment)

## Resolution

### If Stripe is experiencing an outage

1. Check [Stripe Status](https://status.stripe.com/)
2. Switch the POS to **cash-only mode**:
   - In terminal settings, temporarily disable card payments
   - Inform staff to accept cash and record manually
3. Monitor Stripe status page for recovery
4. Once Stripe is back, re-enable card payments
5. Reconcile any cash payments against the order log

### If configuration error (wrong/missing env vars)

1. Fix the environment variables in Vercel/deployment platform
2. Redeploy the application
3. Verify with a test payment (use test mode if available)

### If circuit breaker is stuck OPEN

The circuit breaker should auto-recover. If it does not:
1. Refresh the browser to reset the in-memory circuit breaker state
2. Attempt a single payment to test
3. If it fails again, investigate the underlying cause (Stripe, network, config)

### If card decline rate is high but system is working

This is a customer-side issue, not a system issue:
1. Check if a specific card type is failing (Visa, Mastercard, etc.)
2. Verify the terminal is properly configured for the region
3. Ensure 3D Secure redirect URLs are correct

## Escalation

| Condition | Action |
|---|---|
| Unresolved after 15 min | Notify restaurant manager |
| Unresolved after 30 min | Page on-call engineer |
| Stripe outage confirmed | Post notice for staff, switch to cash-only |
| Data loss suspected | Contact engineering lead immediately |

## Post-Incident

- [ ] Document the root cause
- [ ] Update this runbook if the resolution was not covered
- [ ] Check if alert thresholds need tuning
- [ ] Verify no payments were lost (reconcile Stripe vs local orders)
