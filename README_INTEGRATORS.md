# INTEGRATOR'S GUIDE & RULES

**Target Audience**: ERP Developers, Fiscal Partners, Auditors, Internal UI Teams.
**Subject**: Integration with `@chefiapp/system-of-record` (v1.0.0-AUDIT).

---

## ⚠️ CRITICAL WARNING

**You are not integrating with a standard JavaScript library.**
**You are integrating with a Non-Repudiable Financial System of Record.**

Your code interacts with a "Legal Engine". Misuse does not just cause bugs; it causes **Legal Liability**.

---

## ✅ THE "DO" LIST (Safe & Encouraged)

1.  **DO Observe, Don't Touch**
    - Treat the Core as a "Black Box" that emits immutable facts.
    - React to `PAYMENT_SEALED` events to update your UI or send emails.

2.  **DO Use the SDK Types**
    - Import `CoreEvent`, `LegalSeal`, `FiscalObserver` from `@chefiapp/adapters-sdk`.
    - These types are guaranteed to match the Core's output.

3.  **DO Handle Asynchronicity**
    - The Core is fast. Your Fiscal Printer is slow.
    - Do not block the Core. Use the `FiscalObserver` pattern to work in the background.

4.  **DO Fail Independently**
    - If your ERP integration creates an error, catch it.
    - Do not let an external API failure crash the Sales Engine.

---

## ❌ THE "DON'T" LIST (Strictly Prohibited)

1.  **DON'T Modify Core Logic**
    - "I just need to tweak a tax rule in `core-engine`..." -> **FORBIDDEN**.
    - If logic is wrong, the *Specification* must be updated, re-audited, and patched.

2.  **DON'T Bypass the Event Log**
    - "I'll just update the `status` column in Postgres..." -> **FORBIDDEN**.
    - This breaks the cryptographic chain and the replay proof.

3.  **DON'T Depend on Internals**
    - If it's not in `PUBLIC_API.md`, it doesn't exist for you.

---

## 🚦 HOW TO DEVELOP ADAPTERS

### 1. The Fiscal Adapter Pattern
If you are building a module for "NFC-e" (Brazil) or "TicketBAI" (Spain):

```typescript
import { FiscalObserver, LegalSeal, CoreEvent } from "@chefiapp/adapters-sdk";

export class MyRegionalAdapter implements FiscalObserver {
    async onSealed(seal: LegalSeal, originEvent: CoreEvent): Promise<void> {
        // 1. Read the sealed financial facts
        const data = JSON.parse(seal.financial_state);
        
        // 2. Format XML for your government
        const xml = this.convertToXml(data);
        
        // 3. Send and persist response (Gate 5.1)
        // ...
    }
}
```

### 2. The UI Pattern
The UI should be a "Projection":
- Listen to `ORDER_*` events.
- Update a local Read-Model (e.g., Redux, MobX, or a `projections` table).
- Display the Read-Model to the user.
- **Never** read raw state from the CoreExecutor directly in the render loop.

---

**By proceeding, you acknowledge that you understand the boundary between the "Muttable World" (UI/Adapters) and the "Immutable World" (System of Record).**
