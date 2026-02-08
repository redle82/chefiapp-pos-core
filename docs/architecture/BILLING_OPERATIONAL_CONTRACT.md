# Billing Operational Contract (Pilot)

**Status:** DRAFT (Phase 1)
**Authority:** Sovereign Engineering / Billing Layer
**Context:** Scale 100 -> 1000 Restaurants

---

## 1. Billing as Perception

Billing is not merely a financial transaction; it is a **Core Operational State**. The system must "feel" its billing health through the Design System before any technical gate is enforced.

### 1.1 Billing Status Hierarchy

| Status        | Meaning                      | Operability      | UI Tone           |
| :------------ | :--------------------------- | :--------------- | :---------------- |
| **trial**     | Evaluation period            | Normal           | Neutral / Blue    |
| **active**    | Paid & Healthy               | Normal           | Operational Green |
| **past_due**  | Payment issue (Grace period) | Normal + Warning | Urgent Yellow     |
| **suspended** | Blocked                      | **BLOCKED**      | Calm Red          |

---

## 2. The Perceptual Sensors

The Runtime reads billing status from the Core and propagates it to the `GlobalUIState`.

- **Sensor Identity**: The `billingStatus` is global and unique per Restaurant Identity.
- **Sensor Latency**: Billing status should be cached but refreshed on application boot or critical transitions.
- **Sensor Failure**: If billing status cannot be determined, default to `active` (Safe-to-Open) during Pilot, but log as an anomaly.

---

## 3. Enforcement Gates

### 3.1 The Soft Gate (Warning)

When `past_due`, the system continues to operate but injects a persistent `<BillingBanner />` across all interfaces (Portal, TPV, KDS).

### 3.2 The Hard Gate (Suspension)

When `suspended`, all **Operational Routes** (`/op/*`) must redirect to a `<BillingBlockedView />`.

- **Exemptions**: Billing Management (`/app/billing`), Support (`/support`), and core Auth routes are NEVER blocked.

---

## 4. Visual Language

- **Billing Messages**: Must be human, business-centric, and non-technical.
- **No Stack Traces**: Billing issues are never "errors"; they are "states".
- **Actionable**: Every billing view must provide a direct path to resolution (e.g., "Pay Now", "Contact Support").

---

## 5. Implementation Roadmap

- **Phase 1**: Design System Sensors (Components & State).
- **Phase 2**: Core Integration (DB & Readers).
- **Phase 3**: Real Enforcement Gates.

---

**End of Contract.**
