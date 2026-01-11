# ChefIApp Architecture — Quick Reference Card

**Print this. Pin it to your desk.**

---

## The Golden Question

```
Does it:
  □ Change money/order/customer decisions?
  □ Make promises we control?
  □ Affect causality of events?
  □ Break the system if wrong?

YES to ANY → CORE (maybe)
NO to ALL  → NOT CORE (definitely)
```

---

## Three Layers (In Order)

| Layer | What | Why | Replaces | Fails How |
|-------|------|-----|----------|-----------|
| **🔴 CORE** | Order state, money, promises | Controls what matters | Never | System breaks |
| **🟡 ADAPTER** | External data → Core contracts | Sensors only | Easily | Channel stops, system OK |
| **⚪ EXTERNAL** | Marketing, analytics, nice-to-have | Not system-critical | Always | Service disappears, system OK |

---

## What Goes Where (Simple Version)

### ✅ ALWAYS CORE
- Order lifecycle
- Payment validation
- Loyalty (your own)
- Menu + pricing
- Kitchen display
- Fiscal requirements
- Restaurant page

### ✅ ALWAYS ADAPTER
- Marketplaces (Just Eat, Glovo, etc.)
- WhatsApp (reads messages, creates orders)
- Email / SMS (notifications)
- Delivery tracking (informational)

### ✅ ALWAYS EXTERNAL
- Google Analytics
- CRM campaigns
- Support chat
- SEO / content
- Competitor pages

---

## Decision Tree (Copy-Paste)

```
1. Does it make promises about money or order state?
   NO  → Go to 2
   YES → CORE

2. Does it read external data that Core must understand?
   NO  → Go to 3
   YES → ADAPTER

3. Is it marketing, analytics, or "nice-to-have"?
   NO  → CORE (unusual; escalate)
   YES → EXTERNAL
```

---

## Red Flags (Stop and Escalate)

- ❌ "Copy LastApp's integration approach"
- ❌ "Let's make marketplace pricing override ours"
- ❌ "WhatsApp should be a full ordering channel"
- ❌ "Use their fidelization API, not ours"
- ❌ "SEO is architecture-critical"

**If you see these:** Talk to the architect first.

---

## Code Structure (Dependency Rule)

```
Core ← Adapters ← External

Core NEVER imports Adapters
Core NEVER imports External
Adapters CAN import Core (one-way)
External CAN import anything (it's separate)
```

---

## Question: "Should we integrate X?"

**Before saying YES:**

1. Can the restaurant's system work without it? 
   - YES → Not Core
   - NO → Maybe Core

2. Does it lock us into one vendor?
   - YES → Red flag
   - NO → OK

3. If it breaks tomorrow, what happens?
   - Order disappears → Core
   - Feature unavailable → Adapter
   - Dashboard empty → External

---

## Philosophy in One Line

> **LastApp** owns the integrations.  
> **ChefIApp** owns the Core.

Restaurant stays sovereign. Integrations are replaceable.

---

## Common Mistakes

| Mistake | Reality |
|---------|---------|
| "Marketplace features = Core features" | NO — Adapt them, don't inherit them |
| "Every integration needs state" | NO — Only if it affects Core decisions |
| "Popular = should be Core" | NO — Use decision tree, not popularity |
| "Nice-to-have = eventually Core" | NO — Keep them separate; promote only if rules change |
| "More integrations = better" | NO — Cleaner boundaries = better |

---

## To Add Something to Core (Approval Process)

1. **Describe what it does**
2. **Answer:** Does it change decisions, make promises, or affect causality?
3. **If YES:** Propose contract (event, state change)
4. **If NO:** Classify as Adapter or External
5. **Present to architect** — they decide

---

## Current State (As of Phase 1)

✅ **CORE (Locked)**
- Order state machine
- Payment validation
- Fiscal integration
- Loyalty (being built)

🟡 **ADAPTERS (Pluggable)**
- Just Eat
- Glovo
- Uber Eats
- Deliveroo
- WhatsApp
- Email/SMS

⚪ **EXTERNAL (Not yet)**
- Analytics (TBD)
- CRM (TBD)
- Support (TBD)

---

**Questions?** Ask the architect before designing.  
**New integration idea?** Run it through the decision tree.  
**Found something in wrong layer?** Log an architecture debt issue.

