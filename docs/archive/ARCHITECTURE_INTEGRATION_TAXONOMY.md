# ChefIApp — Integration Taxonomy & Decision Framework

**Version:** 1.0  
**Purpose:** Define which components belong in Core, which are Adapters, which are external services.  
**Principle:** Only things that influence decisions, make promises, or affect causality live in Core.

---

## The Core Principle

```
Does it:
  1. Change internal decisions?
  2. Generate promises to the restaurant/customer?
  3. Affect causal order of events?
  4. Break the system if it's wrong?
  5. Create conceptual lock-in?

If YES to any → Candidate for Core
If NO to all → Belongs outside Core
```

---

## The Three Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CORE (System Nervous System)         │
│  - Owns state and decisions                             │
│  - No external dependencies (except storage)            │
│  - Defines contracts                                    │
│  - Controls what gets promised                          │
│  - 100% required for operation                          │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│           ADAPTERS (Sensors & Translators)              │
│  - Read external data (marketplaces, WhatsApp, etc.)    │
│  - Convert to Core contracts                            │
│  - Never decide, only report                            │
│  - Replaceable without changing Core                    │
│  - Fail gracefully (don't break the system)             │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│    EXTERNAL (Marketing, Support, Analytics, etc.)       │
│  - No direct system dependency                          │
│  - Nice-to-have, not required                           │
│  - No contracts, no promises                            │
│  - Can change or disappear without breaking Core        │
└─────────────────────────────────────────────────────────┘
```

---

## Classification Decision Tree

**For any new component, ask in order:**

```
1. Does it define how money flows or gets confirmed?
   └─ YES → CORE
   └─ NO  → Go to Q2

2. Does it affect the restaurant's data ownership?
   └─ YES → CORE
   └─ NO  → Go to Q3

3. Does it carry a customer promise (SLA, delivery, loyalty)?
   └─ YES → CORE
   └─ NO  → Go to Q4

4. Does it read external data that Core must understand?
   └─ YES → ADAPTER
   └─ NO  → Go to Q5

5. Is it marketing, analytics, or nice-to-have?
   └─ YES → EXTERNAL
   └─ NO  → EXTERNAL (default)
```

---

## Full Component Matrix

| Component | Layer | Rationale | Replaceability | Failure Mode |
|-----------|-------|-----------|-----------------|--------------|
| **TPV (Order Lifecycle)** | **CORE** | Controls money, promisesdelivery time | Never | Order state breaks |
| **Loyalty/Fidelization** | **CORE** | Affects customer data, retention, pricing | Never | Loyalty state corrupts |
| **Restaurant Page** | **CORE** | Promises public URL & order experience | Never | Availability SLA breaks |
| **Payment Processing** | **CORE** | Validates payment, affects confirmations | Never (contract-locked) | Payments can't be confirmed |
| **Fiscal Integration** | **CORE** | Legal requirement (receipts, compliance) | Never (law) | Breaks fiscal law |
| **Kitchen Display** | **CORE** | Makes promises about confirmation time | Never | SLA breaks |
| **Menu** | **CORE** | Drives what customers see, what gets ordered | Never | Order content breaks |
| **---** | **---** | **---** | **---** | **---** |
| **Just Eat Adapter** | **ADAPTER** | Reads orders; converts to Core contracts | Yes (swap for Glovo) | Orders stop flowing; system OK |
| **Glovo Adapter** | **ADAPTER** | Reads orders; converts to Core contracts | Yes (swap for UberEats) | Orders stop flowing; system OK |
| **Uber Eats Adapter** | **ADAPTER** | Reads orders; converts to Core contracts | Yes (swap for Deliveroo) | Orders stop flowing; system OK |
| **Deliveroo Adapter** | **ADAPTER** | Reads orders; converts to Core contracts | Yes (swap for Just Eat) | Orders stop flowing; system OK |
| **WhatsApp Adapter** | **ADAPTER** | Reads messages; creates Core order on confirmation | Yes (can remove) | WhatsApp orders stop; system OK |
| **Webhook Handler (Marketplace)** | **ADAPTER** | Translates marketplace events → Core events | Yes (different polling) | Slight sync lag; system OK |
| **---** | **---** | **---** | **---** | **---** |
| **Google Analytics** | **EXTERNAL** | Tracks metrics (non-critical) | Yes | No data; business insight gap |
| **Intercom/Support Chat** | **EXTERNAL** | Customer support (not core) | Yes | Can't chat; email still works |
| **ShipDay Tracking** | **EXTERNAL** | Delivery tracking (nice-to-have) | Yes | No tracking; food still delivered |
| **SEO / Content Pages** | **EXTERNAL** | Marketing (acquisition, not retention) | Yes | Visibility down; system OK |
| **Competitor Comparisons** | **EXTERNAL** | Marketing content (no system impact) | Yes | Page missing; system OK |
| **SMS Notifications** | **ADAPTER** | Communicates state (replaceable) | Yes (use email instead) | No SMS; system OK |
| **Email Notifications** | **ADAPTER** | Communicates state (required for UX) | Partial (critical for retention) | No email; UX breaks |
| **Delivery Partner Integration** | **ADAPTER** | Reads delivery status (informational) | Yes | No tracking; order still completes |
| **CRM/Email Marketing** | **EXTERNAL** | Retention/acquisition campaign | Yes (use SMS, direct email) | No campaigns; system OK |

---

## The Critical Distinction: Sensor vs Plugin

### ❌ The Wrong Way (LastApp Pattern)

```
Marketplace API
    ↓
Sync ALL marketplace data
    ↓
Store everything
    ↓
Compete on their features
    ↓
Lock-in customer to platform
```

**Result:** 
- Dependent on marketplace changes
- Fragile integrations (they control your feature set)
- No sovereignty over the restaurant

### ✅ The Right Way (ChefIApp OS Pattern)

```
Marketplace API
    ↓
Adapter reads only what Core needs
    ↓
Converts to Core contract
    ↓
Core makes all decisions
    ↓
Restaurant remains sovereign
```

**Result:**
- Marketplace can change; Core unchanged
- Easy to swap providers
- Restaurant owns their data and rules

---

## How to Evaluate New Integrations (Process)

**When someone asks: "Should we integrate X?"**

1. **Identify what X provides:**
   - E.g., "Doorstep delivery tracking"

2. **Ask: Does Core need to know about this?**
   - Does it change order state? NO
   - Does it make a promise we control? NO
   - Does it affect decisions? NO
   - → It's EXTERNAL

3. **Ask: If X disappears tomorrow, does the system break?**
   - If YES → Core or required Adapter
   - If NO → Optional (Adapter or External)

4. **Classify accordingly:**
   - Can swap for alternative? YES → ADAPTER
   - Can't swap? CORE or EXTERNAL
   - Marketing-only? EXTERNAL

---

## Red Flags (Things That Try to Become Core But Shouldn't)

### 🚩 "We should copy LastApp's loyalty system"
**Red flag:** Their loyalty is 3rd-party or locked to their platform.  
**Decision:** Build our own (CORE) or buy standalone + integrate (ADAPTER).

### 🚩 "We need ShipDay for delivery tracking like SkipTheDishes"
**Red flag:** Tracking doesn't affect Core decisions.  
**Decision:** EXTERNAL — nice-to-have, don't let it drive architecture.

### 🚩 "Let's use their fidelization API instead of building ours"
**Red flag:** Fidelization affects customer data and retention strategy.  
**Decision:** BUILD CORE — not negotiable for sovereignty.

### 🚩 "We should copy their SEO strategy"
**Red flag:** Marketing layer, not system layer.  
**Decision:** EXTERNAL — SEO is marketing, not architecture.

### 🚩 "We should integrate WhatsApp business as a full ordering channel"
**Red flag:** WhatsApp has no guarantees, no state, no contracts.  
**Decision:** ADAPTER only — reads messages, creates orders, nothing more.

---

## Examples: Applying the Framework

### Example 1: Should Marketplace Pricing Override Ours?

```
Marketplace says: "Price this item €5 on Just Eat, €6 on Glovo"

Q1: Does it define money flow?
  → Partially (affects what customer pays)

Q2: Does it affect restaurant data ownership?
  → YES (different pricing per channel)

Decision: CORE feature
  - Core allows "price override per marketplace"
  - But Core decides how it's allowed
  - Adapter can READ marketplace rules
  - Core ENFORCES restaurant's rules

Result: Restaurant decides price, marketplace suggests, Core validates
```

### Example 2: Should We Integrate a CRM?

```
CRM integration for restaurant email campaigns

Q1-3: No impact on orders, money, or promises
Q4: Does Core need to know customer campaigns?
  → NO (nice-to-have for retention)

Decision: EXTERNAL
  - Standalone CRM tool
  - Can read restaurant + customer data
  - Doesn't affect Core

Result: Restaurant can use CRM or not; system doesn't care
```

### Example 3: Should We Use a Delivery Aggregator?

```
Service that tracks deliveries across all platforms

Q1-3: Does it change order state? Does it affect promises?
  → NO (informational only)

Q4: Does Core need real-time tracking?
  → NO (nice-to-have, not critical)

Decision: EXTERNAL or optional ADAPTER
  - Can add for UX
  - Doesn't break system if absent

Result: Improve tracking UX; system works without it
```

---

## How to Structure Code (Layer-by-Layer)

```
core-engine/
  └─ Core logic (order state, decisions, contracts)
  └─ No knowledge of Marketplace, WhatsApp, CRM, etc.
  └─ Pure business logic

adapters/
  ├─ marketplace/
  │  ├─ just-eat-adapter.ts
  │  ├─ glovo-adapter.ts
  │  ├─ uber-eats-adapter.ts
  │  └─ deliveroo-adapter.ts
  ├─ messaging/
  │  ├─ whatsapp-adapter.ts
  │  ├─ email-adapter.ts
  │  └─ sms-adapter.ts
  └─ tracking/
     └─ shipday-adapter.ts

external/
  ├─ analytics/
  │  └─ google-analytics.ts
  ├─ crm/
  │  └─ mailchimp-integration.ts
  └─ support/
     └─ intercom-integration.ts
```

**Golden Rule:** Core imports nothing from `adapters/` or `external/`.  
Adapters import from Core (one-way dependency).

---

## Decision Making Guide (One Page Cheat Sheet)

```
NEW FEATURE REQUEST
    ↓
"Does it control money/state/promises?"
    ├─ YES → CORE
    │  (Order flow, Loyalty, Menu, Payment, Kitchen)
    │
    └─ NO → "Does it read external data Core needs?"
       ├─ YES → ADAPTER
       │  (Marketplaces, WhatsApp, Email, SMS)
       │
       └─ NO → EXTERNAL
          (Analytics, CRM, Support, SEO, Marketing)
```

---

## Next Steps (Implementation)

1. **Review all current integrations** against this matrix
2. **Audit codebase** to find things incorrectly in Core
3. **Create adapter layer** if not already done
4. **Document each integration's** layer + rationale
5. **Share this framework** with the entire team

**Responsible person:** [TBD]  
**Timeline:** Review + audit in 2 weeks

---

## Philosophy (Why This Matters)

> **LastApp** tries to be everything for everyone.  
> Every feature pull request locks them deeper into dependency hell.  
> They own the integration, not the restaurants.

> **ChefIApp** is an OS.  
> The restaurant owns their data, their decisions, their future.  
> We're a platform that gets out of the way.

---

## FAQ

**Q: Can we move something from EXTERNAL to CORE later?**  
A: Yes. If it starts affecting core decisions (e.g., CRM loyalty → customer data → reordering).  
Start EXTERNAL; promote if needed.

**Q: Can we move something from CORE to ADAPTER?**  
A: Rarely. Usually means we designed it wrong initially.  
Example: Payment should never leave Core.

**Q: Who decides if something is Core?**  
A: The architect + product lead. Use the decision tree above.  
Default to EXTERNAL/ADAPTER unless it clearly needs Core.

**Q: What if a marketplace wants us to integrate their payment?**  
A: No. Core owns payment validation.  
Marketplace provides payment method; Core validates.

**Q: Should WhatsApp be CORE since restaurants want it?**  
A: No. Want ≠ need. WhatsApp is unreliable (no state guarantees).  
As ADAPTER: reads messages, creates Core orders on confirmation.  
If WhatsApp breaks, system continues; orders just stop flowing from that channel.

