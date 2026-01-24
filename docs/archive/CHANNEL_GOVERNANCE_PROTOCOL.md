# CHANNEL GOVERNANCE PROTOCOL

**Product**: ChefIApp POS Core (System of Record)
**Scope**: User Interfaces, Hardware Integrations, and APIs
**Audit Status**: DRAFT

---

## 1. THE FUNDAMENTAL THEOREM

> **"The Interface is an Intent Emitter. The Core is the Fact Sealer."**

No channel (Screen, App, API, Totem) has the authority to create money or confirm payment directly.
All channels are restricted to emitting **Commands** or **Intents**.
Only the **Core Engine** (via Gates 0-4) has the authority to translate these into **Financial Facts**.

---

## 2. CHANNEL AUTHORITY MATRIX

| Channel | Actor | Authority Level | Can Emit (Intent) | Can Confirm (Fact)? |
| :--- | :--- | :--- | :--- | :--- |
| **Table (QR)** | Guest | Low (Untrusted) | `ORDER_ADD_ITEM`, `PAYMENT_INTENT` | ❌ NEVER |
| **Web / Delivery** | Guest | Low (Untrusted) | `ORDER_CREATE`, `PAYMENT_INTENT` | ❌ NEVER |
| **Staff App** | Waiter | Medium (Trusted) | `ORDER_MODIFY`, `TABLE_CLOSE` | ❌ NEVER* |
| **Manager App** | Manager | High (Privileged) | `ORDER_VOID`, `DISCOUNT_APPLY` | ⚠️ Cash Only |
| **Payment Terminal** | Hardware | High (Cryptographic)| `TRANSACTION_RESULT` | ✅ Via Gateway |
| **Core Engine** | System | Absolute | `PAYMENT_CONFIRMED`, `LEGAL_SEAL` | ✅ ALWAYS |

*\*Waiters declare "Cash Received", but the System confirms the balance.*

---

## 3. THE "INTENT vs. FACT" FLOW

### Scenario A: Table QR Payment (Credit Card)
1.  **UI (Table)**: Emits `PAYMENT_INTENT` (Token, Amount).
2.  **Gateway**: Processes transaction externally.
3.  **Webhook/Backend**: Receives success. Emits `PAYMENT_PROCESSED` (Command).
4.  **Core Gate 0**: Validates amount, order status. Emits `PAYMENT_CONFIRMED` (Event).
5.  **Legal Gate 2**: Seals as `PAYMENT_SEALED`.

**Audit Proof**: Even if the UI is hacked to say "Paid", the Core never receives the Gateway confirmation, so the Order stays `OPEN`.

### Scenario B: Waiter Cash Payment
1.  **UI (Staff)**: Waiter counts money. Emits `DECLARE_CASH_RECEIVED` (Command).
2.  **Core Gate 0**: Checks balance. Does `Paid >= Total`?
3.  **Core Gate 0**: Generates `PAYMENT_CONFIRMED` (Event).
4.  **Legal Gate 2**: Seals as `PAYMENT_SEALED`.

**Audit Proof**: The Waiter cannot force the system to close a table with insufficient funds. The math happens in the Core, not the App.

---

## 4. SECURITY & FRAUD VECTORS (MITIGATED)

| Threat | Attack Vector | Mitigation | Status |
| :--- | :--- | :--- | :--- |
| **"Ghost Orders"** | UI sends `ORDER_CLOSED` without payment. | **Gate 1 Invariant**: Order cannot transition to `CLOSED` if `balance > 0`. | 🛡️ BLOCKED |
| **"Fake Success"** | Hacked Web UI shows "Success" screen. | **Gate 2 Observer**: No `LegalSeal` is created. Kitchen does not receive `KITCHEN_TICKET`. | 🛡️ BLOCKED |
| **"Double Spend"** | User clicks "Pay" twice quickly. | **Gate 4 Idempotency**: `idempotency_key` rejects second intent. | 🛡️ BLOCKED |
| **"Price Manips"** | UI sends `$0.01` for a steak. | **Core Pricing**: Prices are fetched from `Product` in Core, not trusted from UI. | 🛡️ BLOCKED |

---

## 5. INTEGRATION RULES FOR CHANNELS

1.  **Blind Submission**: Channels should submit commands and *wait* for the Event Stream to confirm success. Do not assume success locally.
2.  **No Local State**: Do not calculate "Total" locally for official display. Display the "Total" from the `Order` projection.
3.  **Hardware trust**: Only trust signals from signed Hardware (TEF/POS) or authenticated Gateways (Stripe/Pagar.me).

---

**AUDIT VERDICT**:
The System of Record is **CHANNEL AGNOSTIC**.
It allows infinite scale of input channels (Voice, AI, VR, IoT) without compromising financial integrity, because no channel holds authority.

**Signed:**
ChefIApp POS Architecture Team
