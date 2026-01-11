# GATE 6: PAYMENT GATEWAY BOUNDARY
**Status**: DRAFT
**Pattern**: THE WITNESS PATTERN

---

## 1. THE PROBLEM
The "System of Record" tracks theoretical debt (`Order Total`).
The "Real World" holds actual money (Bank Accounts, Credit Cards).

**The Gap**: How do we move money from "Real World" to "System of Record" without polluting the Core with provider-specific logic (Stripe SDKs, XML, Webhooks)?

---

## 2. THE SOLUTION: WITNESS PATTERN

We treat Payment Gateways not as "logic", but as **Witnesses**.

*   **The User** (Payer) interacts with the **Gateway** (Stripe/Pix).
*   **The Gateway** emits a **Testimony** (Webhook/Callback).
*   **The Adapter** translates Testimony into a **Proposed Fact**.
*   **The Core** judges the Fact and checks:
    *   Does the Order exist?
    *   Is the Amount correct?
    *   Is the Currency correct?
*   **The Core** seals the verdict as `PAYMENT_CONFIRMED`.

---

## 3. ARCHITECTURE

### 3.1 The Contract (`PaymentGatewayAdapter`)

```typescript
export interface PaymentGatewayAdapter {
    // Identity
    providerId: string; // "stripe", "pix", "mock"

    // 1. Intent (Outbound)
    // Asks the provider to prepare for payment. Does NOT create money.
    createPaymentIntent(
        orderId: string,
        amountCents: number,
        metadata: any
    ): Promise<{ gatewayReference: string; clientSecret: string }>;

    // 2. Testimony (Inbound)
    // Validates that a webhook/callback is authentic.
    verifyWebhook(
        payload: any,
        headers: any
    ): Promise<VerifiedPayment | null>;
}

export interface VerifiedPayment {
    gatewayReference: string; // "ch_3Lk..."
    orderId: string;
    amountCents: number;
    status: "PAID" | "FAILED" | "REFUNDED";
    rawMetadata: any;
}
```

### 3.2 The Flow (Happy Path)

1.  **UI**: Calls `Gateway.createPaymentIntent(orderId, 1000)`.
2.  **User**: Swipes card on Terminal / Types numbers on Web.
3.  **Gateway**: Charges card. Sends Webhook.
4.  **Adapter**: Verifies signature. Returns `VerifiedPayment { status: 'PAID' }`.
5.  **Core Bridge**:
    ```typescript
    if (verified.status === 'PAID') {
        const event = {
            type: "PAYMENT_CONFIRMED",
            payload: { ...verified },
            // ...
        };
        await coreTxManager.appendAndSeal(event);
    }
    ```

---

## 4. SECURITY & AUDIT RULES

1.  **Trust Boundary**: The Adapter MUST verify cryptographic signatures (Stripe-Signature, etc.). Unsigned webhooks are rejected.
2.  **Idempotency**: The Core's `idempotency_key` (Gate 4) must be mapped from the Gateway's `eventId` to prevent double-crediting a single webhook.
3.  **No Partial Truths**: A payment is either `CONFIRMED` or it doesn't exist in the Core. "Pending" states live in the Gateway, not the Core events.

---

## 5. IMPLEMENTATION PLAN

1.  Define `PaymentGatewayAdapter`.
2.  Implement `LocalMockGateway` (for dev/test).
3.  Implement `CorePaymentBridge` (the service that orchestrates).

---
**Signed:** ChefIApp POS Architecture Team
