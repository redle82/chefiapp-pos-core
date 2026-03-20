> **DEPRECATED** -- This document is outdated (2026-01-24). See [architecture/CORE_SYSTEM_OVERVIEW.md](architecture/CORE_SYSTEM_OVERVIEW.md) for the current core overview.

# Core Overview -- System Mental Map

> **This document answers: "What is untouchable? What is extensible? What is disposable?"**
> **Last updated:** 2026-01-24
> **Status:** RATIFIED

---

## 🎯 Purpose

This document is an **explicit mental map** of the ChefIApp Core. It does not explain "how to do", but rather **"why it exists"** and **"what can never change"**.

**Target audience:**
- Developers who will touch the Core
- Investors who need to understand the architecture
- Auditors who need to validate integrity
- Lawyers who need to defend the system

---

## 🏛️ The Sacred Nucleus (IMMUTABLE)

### Definition

The **Sacred Nucleus** is the set of components that **NEVER** can be changed without invalidating the entire system. If you change this, the system ceases to be ChefIApp.

### Sacred Components

#### 1. **Event System (Event-Driven Architecture)**

**What it is:**
- All operational facts are immutable events
- Events are the only language of communication between components
- Events are auditable, reproducible, and ordered

**Why it's sacred:**
- Without events, there is no audit
- Without audit, there is no trust
- Without trust, there is no product

**Where it lives:**
- `gm_events` (table)
- `docker-tests/task-engine/` (generation and processing)
- `docker-tests/simulators/simulate-24h.js` (validation)

**Violation = Invalid system**

---

#### 2. **SLA Governance (Task Engine)**

**What it is:**
- Every task has a deadline
- Expired deadline = automatic escalation
- Escalation ignores social hierarchy
- Hard-blocking prevents operations until resolution

**Why it's sacred:**
- Without SLA, tasks are "suggestions"
- Without escalation, problems become invisible
- Without hard-blocking, compliance is optional

**Where it lives:**
- `docker-tests/task-engine/policies/*.json` (definitions)
- `docker-tests/task-engine/escalation-engine.js` (execution)
- `gm_tasks`, `gm_task_escalations`, `gm_shift_blocks` (persistence)

**Violation = Broken governance**

---

#### 3. **Offline-First by Design**

**What it is:**
- Offline is not an error, it's a valid state
- Actions are queued locally
- Idempotency keys prevent duplication
- Reconciliation is automatic

**Why it's sacred:**
- Restaurants operate in environments with unstable networks
- Without offline-first, the system breaks on the first network drop
- Without idempotency, there is duplication of orders/payments

**Where it lives:**
- `docker-tests/simulators/simulate-24h.js` (offline simulation)
- `gm_offline_actions` (offline actions audit)
- Retry and reconciliation logic (to be consolidated)

**Violation = Unreliable system**

---

#### 4. **Single Source of Truth**

**What it is:**
- Each domain has **one** and only **one** source of truth
- Logic duplication is forbidden
- Consolidation is mandatory

**Sacred Tables:**
| Domain | Source of Truth | Violation |
|--------|----------------|-----------|
| Orders | `gm_orders` | Create another orders table |
| Tasks | `gm_tasks` | Task logic outside task-engine |
| Events | `gm_events` | Events in multiple places |
| Governance | `task-engine/policies/*.json` | SLA outside task-engine |
| Profiles | `seeds/profiles/*.json` | Profiles hardcoded in code |

**Why it's sacred:**
- Duplication = inconsistency
- Inconsistency = bugs
- Bugs = loss of trust

**Violation = Broken integrity**

---

#### 5. **Validation by Simulation**

**What it is:**
- The only proof of functionality is the simulator
- If `make simulate-24h-small` passes, it's correct
- If it fails, it's wrong
- There are no exceptions

**Why it's sacred:**
- Without simulation, there is no objective validation
- Without objective validation, there is no trust
- Without trust, there is no product

**Where it lives:**
- `docker-tests/simulators/simulate-24h.js` (complete simulation)
- `docker-tests/simulators/simulate-failfast.js` (quick validation)
- `docker-tests/Makefile` (orchestration)

**Violation = Unvalidated system**

---

## 🔧 What Is Extensible (EVOLUTIVE)

### Definition

Components that **can** be modified, extended, or replaced, as long as they respect the contracts of the Sacred Nucleus.

### Extensible Components

#### 1. **Restaurant Profiles**

**What it is:**
- JSON configurations that define restaurant characteristics
- Examples: `ambulante`, `pequeno`, `medio`, `grande`, `gigante`

**Can be:**
- ✅ Add new profiles
- ✅ Modify existing characteristics
- ✅ Add new fields

**Cannot:**
- ❌ Remove required fields
- ❌ Break task-engine contracts
- ❌ Violate data integrity

**Where it lives:**
- `docker-tests/seeds/profiles/*.json`

---

#### 2. **Policy Packs (Compliance Packages)**

**What it is:**
- JSON definitions of operational tasks
- Examples: `OPENING_STANDARD`, `CLOSING_STANDARD`, `FOOD_SAFETY_STANDARD`

**Can be:**
- ✅ Add new policy packs
- ✅ Modify task SLA
- ✅ Add new triggers

**Cannot:**
- ❌ Remove SLA validation
- ❌ Bypass escalation
- ❌ Remove hard-blocking from critical tasks

**Where it lives:**
- `docker-tests/task-engine/policies/*.json`

---

#### 3. **Simulators and Tests**

**What it is:**
- Scripts that validate system behavior
- Examples: `simulate-24h.js`, `simulate-failfast.js`, `kds-kitchen.js`

**Can be:**
- ✅ Add new test scenarios
- ✅ Modify simulation parameters
- ✅ Add new metrics

**Cannot:**
- ❌ Remove integrity validations
- ❌ Bypass orphan checks
- ❌ Falsify results

**Where it lives:**
- `docker-tests/simulators/*.js`
- `docker-tests/Makefile`

---

#### 4. **UI and Shells (Apps)**

**What it is:**
- Visual interfaces that consume the Core
- Examples: `merchant-portal`, `mobile-app`, `customer-portal`

**Can be:**
- ✅ Completely rewrite the UI
- ✅ Change frameworks (React → Vue, etc.)
- ✅ Add new screens

**Cannot:**
- ❌ Bypass Core validations
- ❌ Create business logic in UI
- ❌ Duplicate sources of truth

**Where it lives:**
- `merchant-portal/`
- `mobile-app/`
- `customer-portal/`

---

## 🗑️ What Is Disposable (DISPOSABLE)

### Definition

Components that **can** be removed, redone, or ignored without impacting the Sacred Nucleus.

### Disposable Components

#### 1. **Transition Documentation**

**What it is:**
- Documents created during migrations
- Examples: `LEGACY_INVENTORY.md`, `CLEANUP_REPORT.md`

**Can be:**
- ✅ Removed after complete migration
- ✅ Archived in `docs/archive/`
- ✅ Ignored if no longer relevant

**Where it lives:**
- `docs/refactor/`
- `docs/archive/`

---

#### 2. **One-Time Migration Scripts**

**What it is:**
- SQL or Node.js scripts executed once
- Examples: schema migrations, initial seeds

**Can be:**
- ✅ Removed after execution
- ✅ Kept only for history

**Where it lives:**
- `supabase/migrations/` (after production execution)
- Temporary scripts in `docker-tests/`

---

#### 3. **Environment-Specific Configurations**

**What it is:**
- `.env.example` files, local configurations
- Examples: development API keys, staging URLs

**Can be:**
- ✅ Modified freely
- ✅ Removed if no longer necessary

**Where it lives:**
- `.env.example`
- Local configurations

---

## 📐 Layered Architecture

### Layer 0: Sacred Nucleus (IMMUTABLE)

```
┌─────────────────────────────────────────┐
│   SACRED NUCLEUS (NEVER CHANGE)          │
├─────────────────────────────────────────┤
│  • Event System                         │
│  • SLA Governance                       │
│  • Offline-First                        │
│  • Single Source of Truth               │
│  • Validation by Simulation             │
└─────────────────────────────────────────┘
```

**Rule:** If you touch here, the system becomes invalid.

---

### Layer 1: Runtime (EVOLUTIVE)

```
┌─────────────────────────────────────────┐
│   RUNTIME (EXTENSIBLE WITH CONTRACTS)   │
├─────────────────────────────────────────┤
│  • Restaurant Profiles                  │
│  • Policy Packs                         │
│  • Simulators                           │
│  • Apps (UI)                            │
└─────────────────────────────────────────┘
```

**Rule:** Can change, as long as it respects the contracts of the Sacred Nucleus.

---

### Layer 2: Disposable (DISPOSABLE)

```
┌─────────────────────────────────────────┐
│   DISPOSABLE (CAN REMOVE)               │
├─────────────────────────────────────────┤
│  • Transition documentation             │
│  • One-time migration scripts           │
│  • Temporary configurations            │
└─────────────────────────────────────────┘
```

**Rule:** Can remove without impacting the Core.

---

## 🚨 Golden Rules

### Rule 1: If Not Exercised by Simulator, It's Not Core

If a functionality doesn't appear in `simulate-24h.js`, it's not part of the Sacred Nucleus.

**Example:**
- ❌ Feature to "share recipe on Instagram" → Not Core
- ✅ Task system with SLA → Is Core (exercised by simulator)

---

### Rule 2: Duplication = Violation

If you see duplicated logic, consolidate immediately.

**Example:**
- ❌ Retry logic in 3 different places → Violation
- ✅ Retry logic in `offline-controller` → Correct

---

### Rule 3: UI Doesn't Decide, Core Decides

The UI never makes business decisions. It only reflects the Core's state.

**Example:**
- ❌ UI checks if it can close shift → Violation
- ✅ UI queries Core, Core returns `canCloseShift: false` → Correct

---

### Rule 4: Without Validation, No Trust

If a change doesn't pass `make simulate-24h-small`, it cannot be committed.

**Example:**
- ❌ "Works on my machine" → Violation
- ✅ "Passed in simulator" → Correct

---

## 📊 Decision Matrix

Use this matrix to decide if something is Sacred, Extensible, or Disposable:

| Criterion | Sacred | Extensible | Disposable |
|-----------|--------|------------|------------|
| **Appears in simulator?** | ✅ Yes | ✅ Yes | ❌ No |
| **If removed, system breaks?** | ✅ Yes | ❌ No | ❌ No |
| **Can be replaced?** | ❌ No | ✅ Yes | ✅ Yes |
| **Has formal contract?** | ✅ Yes | ✅ Yes | ❌ No |
| **Is auditable?** | ✅ Yes | ✅ Yes | ❌ No |

---

## 🎯 Recommended Next Steps

### For Developers

1. **Read this document before touching the Core**
2. **Consult `CORE_MANIFESTO.md` for specific rules**
3. **Run `make simulate-failfast` before each commit**
4. **Run `make simulate-24h-small` before each PR**

### For Investors/Auditors

1. **Focus on Layer 0 (Sacred Nucleus)**
2. **Validate that the simulator covers all sacred components**
3. **Verify there is no logic duplication**
4. **Confirm validation is automatic and reproducible**

---

## 📚 Related Documents

- **[CORE_MANIFESTO.md](../../CORE_MANIFESTO.md)** - System law (specific rules)
- **[docs/CORE_ARCHITECTURE.md](../CORE_ARCHITECTURE.md)** - Technical architecture
- **[docs/testing/MEGA_OPERATIONAL_SIMULATOR.md](../testing/MEGA_OPERATIONAL_SIMULATOR.md)** - Complete validation
- **[START_HERE.md](../../START_HERE.md)** - Entry point

---

## ✅ Conclusion

This document defines **what is untouchable** in the ChefIApp Core.

**Summary in one sentence:**
> The Sacred Nucleus is what makes ChefIApp be ChefIApp. Everything else is extensible or disposable.

**Last validation:** 2026-01-24  
**Next review:** When there is a significant architectural change

---

*This document is part of Core v1.0-core-sovereign.*
