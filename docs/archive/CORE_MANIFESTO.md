# CORE MANIFESTO

> This document defines what the ChefIApp Core **IS** and what it **WILL NEVER BE**.
> Any violation of this manifesto is an architectural regression.

---

## PREAMBLE

The ChefIApp Core has been validated in **production simulation** with:
- 24 hours of continuous operation
- Complete governance (SLA, escalation, hard-blocking)
- Offline resilience during peak hours
- Zero orphans, zero duplicates, zero data loss

This manifesto codifies the decisions that made this possible.

**Ratification date:** 2026-01-24  
**Validated by:** MEGA OPERATIONAL SIMULATOR v2.1

---

## SECTION I — WHAT THE CORE IS

### 1.1 Restaurant Operating System

The Core is not an application. It is an **operating system** that governs:
- Orders
- Tasks
- Shifts
- Governance
- Data integrity

### 1.2 Human Behavior Governor

The Core does not suggest. The Core **demands**.

- Tasks have SLA
- Expired SLA = automatic escalation
- Escalation ignores social hierarchy
- Hard-blocking prevents operations until resolution

### 1.3 Single Source of Truth

There is **one** source of truth for each domain:

| Domain | Source of Truth |
|--------|----------------|
| Orders | `gm_orders` |
| Tasks | `gm_tasks` |
| Events | `gm_events` |
| Governance | `task-engine/policies/*.json` |
| Profiles | `seeds/profiles/*.json` |

**Duplication is forbidden. Consolidation is mandatory.**

### 1.4 Offline-First by Design

Offline is not an error. Offline is a **valid state**.

- Actions are queued locally
- Idempotency keys prevent duplication
- Reconciliation is automatic
- Integrity is guaranteed in any network scenario

### 1.5 Event-Driven

The Core communicates through **events**, not direct calls.

```
Action → Event → Reaction
```

Events are:
- Immutable
- Auditable
- Reproducible

### 1.6 SLA-Governed

No task exists without a deadline.  
No deadline exists without consequences.

```
Task created → SLA defined → Monitoring → Escalation → Resolution or Failure
```

### 1.7 Tested by Simulation

The only proof of functionality is the simulator.

```bash
make simulate-24h-small
make assertions
```

**If it passes: it's correct.**  
**If it fails: it's wrong.**

There are no exceptions. There is no "works on my machine".

---

## SECTION II — WHAT THE CORE WILL NEVER BE

### 2.1 Will Never Be a Common POS

Common POS = sales interface.  
ChefIApp Core = operational governance system.

The difference:
- POS records sales
- Core **governs operations**

### 2.2 Will Never Be UI-First

UI is a **consumer** of the Core, not a source of truth.

```
WRONG: UI decides → Core obeys
RIGHT: Core decides → UI displays
```

If the UI disagrees with the Core, the UI is wrong.

### 2.3 Will Never Be Permissive

The Core does not ask "are you sure?".  
The Core says "you cannot until X is done".

Permissiveness is a bug. Rigidity is a feature.

### 2.4 Will Never Be "Best Effort"

There is no "we tried to send".  
There is "sent" or "failed with audit trail".

```
FORBIDDEN: fire-and-forget
REQUIRED: confirm-or-retry-with-audit
```

### 2.5 Will Never Be a Feature Playground

New features do not enter the Core by will.  
They enter by **need validated by the simulator**.

Entry criteria:
1. Does the feature solve a real operational problem?
2. Can the simulator exercise the feature?
3. Does the feature maintain integrity under stress?

**3 yes = can enter.**  
**Any no = does not enter.**

### 2.6 Will Never Be UI-Dependent

The Core works **without**:
- Mobile app
- Web app
- Dashboard
- Graphical interface

If all UIs are deleted, the Core continues governing.

### 2.7 Will Never Accept Critical Logic Outside the Core

| Logic Type | Where It Lives | Where It NEVER Lives |
|------------|----------------|---------------------|
| Governance | Core | UI |
| SLA | Core | Mobile |
| Escalation | Core | Web |
| Hard-blocking | Core | Components |
| Offline sync | Core | Scattered hooks |

**If it's critical, it's in the Core. No exceptions.**

---

## SECTION III — NON-NEGOTIABLE PRINCIPLES

### 3.1 Governance > Convenience

If governance says "cannot close shift", the shift does not close.  
It doesn't matter if the manager is in a hurry.  
It doesn't matter if "it's just this once".

### 3.2 Integrity > Speed

A slow and correct operation is better than a fast and corrupted one.

The Core prefers:
- Blocking over losing data
- Retry over failing silently
- Audit trail over performance

### 3.3 Offline is a Valid State

Losing connection is not an emergency.  
It is an expected and tested scenario.

The system must:
- Continue operating
- Queue actions
- Reconcile automatically
- Never duplicate

### 3.4 UI is Disposable

Any UI can be:
- Rewritten
- Replaced
- Deleted

The Core remains intact.

### 3.5 If the Simulator Doesn't Exercise It, It's Not Core

```
Code in Core + Simulator doesn't test = Dead code
Dead code = Remove
```

There is no code "too important to test".

---

## SECTION IV — RULES FOR THE FUTURE

### 4.1 How New Features Enter

```
1. Documented proposal
2. Simulator updated to exercise
3. Implementation
4. make simulate-24h-* passes
5. make assertions passes
6. Merge allowed
```

**Skipping any step = PR rejected.**

### 4.2 Where Logic Can Live

| Type | Allowed Location |
|------|----------------|
| Governance | `core/sovereignty/`, `task-engine/` |
| Events | `core/events/` |
| Offline | `core/offline/`, `simulators/` |
| Fiscal | `core/fiscal/` |
| Payments | `core/payment/` |
| UI Components | `pages/`, `components/` |
| Integrations | `server/integrations/` |

**Logic in the wrong place = refactor or remove.**

### 4.3 When Something Becomes Legacy

Code becomes legacy when:
- Not exercised by simulator for 2 cycles
- Has @deprecated for more than 1 month
- Duplicates existing logic in Core
- Has no documented owner

**Legacy = candidate for removal.**

### 4.4 Who Decides Exceptions

**Almost no one.**

Exceptions to the manifesto require:
1. Written document justifying
2. Approval from 2+ maintainers
3. Plan to remove the exception
4. Maximum deadline of 30 days

Exception without deadline = not an exception, it's a violation.

---

## SECTION V — DEFINITIONS

### Core
Code that governs operations, tested by the simulator, independent of UI.

### UI
Any visual interface that consumes the Core.

### Legacy
Code not exercised, marked for removal.

### Governance
System of rules that enforces correct behavior.

### Hard-Blocking
Restriction that prevents operation until resolution.

### Escalation
Automatic transfer of responsibility due to expired SLA.

### Simulator
Tool that validates the Core without UI, under real conditions.

---

## SECTION VI — SIGNATURES

This manifesto has been validated by:

- **MEGA OPERATIONAL SIMULATOR v2.1**
  - 24h simulated
  - 964+ orders
  - 210+ tasks
  - 89+ escalations
  - 0 orphans
  - 0 duplicates

- **Total Cleanup (2026-01-24)**
  - 25 files removed
  - 11 directories removed
  - 8 edge functions removed
  - 0 regressions

---

## APPENDIX — VALIDATION COMMANDS

```bash
# Quick validation
make simulate-24h-small && make assertions

# Complete validation
make simulate-24h-small && \
make simulate-24h-large && \
make simulate-24h-giant && \
make assertions

# Check integrity
make assertions
```

**If any command fails, the Core is in violation.**

---

## EPILOGUE

> The ChefIApp Core is not flexible.  
> It is not friendly.  
> It is not permissive.  
>
> It is **correct**.
>
> And being correct is more important than being convenient.

---

*This manifesto is law. Violations are bugs. Bugs are fixed or removed.*
