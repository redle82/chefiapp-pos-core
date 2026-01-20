# GATE 8: REAL MONEY PROTOCOL (STRIPE)
**Status**: DRAFT
**Provider**: Stripe (Sandbox/Test Mode)

---

## 1. THE OBJECTIVE
To prove that the "Frozen Core" can accept **Real Money** without code changes to the Core itself.
We will replace `LocalMockGateway` with `StripeGatewayAdapter`.

---

## 2. SECURITY BOUNDARY (THE AIR GAP)

The Core MUST NOT know what "Stripe" is.

*   **Allowed**: `StripeGatewayAdapter` imports `stripe-node`.
*   **FORBIDDEN**: `CoreTransactionManager` imports `stripe-node`.

The `StripeGatewayAdapter` acts as the **Translator**:
1.  **Stripe World**: `payment_intent.succeeded` (JSON)
2.  **Translation**: Verifies Signature -> Extracts Amount/Currency -> Maps to `payment_ref`.
3.  **Core World**: `TransitionRequest { type: 'CONFIRM_PAYMENT' }`

---

## 3. IMPLEMENTATION PLAN

### 3.1 The Adapter (`StripeGatewayAdapter`)
Implements `PaymentGatewayAdapter`.
*   `createPaymentIntent(order)`: Calls Stripe API -> Returns `stripe_payment_link`.
*   `verifyWebhook(headers, body)`: Uses `stripe.webhooks.constructEvent` -> Returns `CorePayload`.

### 3.2 Idempotency Strategy
Stripe sends the same webhook multiple times.
*   **Layer 1 (Gateway)**: `verifyWebhook` checks the signature.
*   **Layer 2 (Core)**: `CoreTransactionManager` uses `stripe_event_id` as the `idempotency_key`.
*   **Result**: If Stripe sends the webhook 50 times, the Core records ONE `PAYMENT_CONFIRMED`.

### 3.3 Fiscal Implication
When `StripeGatewayAdapter` confirms a payment, the **Fiscal Observer** (Gate 5) will automatically issue the Tax Receipt.
This proves the "Chain Reaction" works globally.

---
**Signed:** System of Record Governance Board
