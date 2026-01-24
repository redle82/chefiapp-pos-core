# Domain Write Authority Contract
>
> **Status:** ACTIVE (HYBRID ENFORCED)
> **Goal:** Transition to PURE KERNEL SOVEREIGNTY

## 0. Authority Precedence (Law 0)

**"If two components are capable of writing state, the one closer to the Domain Logic has absolute authority."**

The hierarchy of authority is absolute:
`UI < Infrastructure < Application < Kernel < EventStore`

- **UI:** Can only request intent. Cannot determine outcome.
- **Infrastructure (Adapters):** Can only translate intent. Cannot invent logic.
- **Application (Services):** Can orchestrate flow. Cannot bypass Kernel rules.
- **Kernel:** The Sovereign Decider.
- **EventStore:** The Immortal Record.

---

## 1. The Single Writer Principle (Law 1)

**"No domain-relevant state SHALL be written outside the Kernel."**

There is only one valid path for state mutation in the ChefIApp Universe:

1. **Command** → `TenantKernel`
2. **Logic** → `EventExecutor`
3. **Truth** → `EventStore`
4. **Reality** → `Projections` (Read Models)

Any code writing directly to the database (`supabase.from(table).insert/update`) violates this law unless explicitly granted a **Transitional Exception**.

---

## 2. Transitional Dual-Write Exception (Law 2)

Legacy engines (e.g., `CashRegisterEngine`) are permitted to write state directly to the database ONLY IF:

1. **Simultaneity:** They attempt to invoke the Kernel immediately in the same operation context.
2. **Event Emission:** A corresponding Domain Event is defined and handled by the Kernel.
3. **Projection Alignment:** The direct write is treated conceptually as a "Pre-Projection" rather than the Source of Truth.
4. **Classification:** The engine is marked as an **Infrastructure Adapter**, not a Domain Authority.

**Current Exceptions:**

- `CashRegisterEngine` (Write: `gm_cash_registers`, Event: `CASH_REGISTER_OPEN/CLOSE`)

---

## 2.5. Compensable Dual-Write (Law 2.5)

**"If you must sin (Dual-Write), you must confess and do penance (Reconcile)."**

Every dual-write operation operating under **HYBRID** mode MUST be "Compensable":

1. **Tagging:** The database row must be marked as `kernel_shadow_status = 'DIRTY'`.
2. **Confession:** A reconciliation job must be enqueued immediately in `gm_reconciliation_queue`.
3. **Penance (Auto-Correction):** An autonomous agent (Edge Function) must process the job, replay the authoritative Event Stream, and overwrite the "Dirty" state with the "Clean" Kernel truth.

**Failure to enqueue a reconciliation job is a Critical Breach** (even if the DB write succeeded). The system prefers to crash than to allow uncorrectable state drift.

---

## 3. The Kill Switch (Law 3)

**"Every dual-write path MUST be controlled by a sovereign configuration."**

The system must support a mode switch that disables direct writes and enforces pure Kernel routing.

```typescript
export const KERNEL_WRITE_MODE = process.env.VITE_KERNEL_MODE || 'HYBRID';
// Modes:
// 'HYBRID' -> Allow direct DB writes (Legacy) + Kernel Events
// 'PURE'   -> Kernel Only. Direct DB writes throw Fatal Error.
```

---

## 4. Truth Supremacy (Law 4)

**"If State and Event diverge, the Event wins. Always."**

In a forensic audit or system rebuild:

- The **Event Log** is the absolute truth.
- The **Database Tables** (`gm_orders`, `gm_cash_registers`) are merely cached views (Projections).
- Any row in the database that cannot be derived from the Event Log is considered **Corrupted State** ("Zombie State").

---

## 5. Migration Protocol (The Path to Purity)

To move from **HYBRID** to **PURE**:

1. **Wired:** Ensure `TenantKernel` is injected into every Legacy Engine.
2. **Inverted:** Update Legacy Engine to read its state *from* the Kernel's `InMemoryRepo` or Projections, not write to them.
3. **Switched:** Set `KERNEL_WRITE_MODE = 'PURE'`.
4. **Verified:** Run full regression suite.

---

## 6. Enforcement Mechanism (Runtime Law)

**"This is not a bug. This is a constitutional violation."**

Any direct database write detected in **PURE** mode MUST:

1. **Throw Immediately:** Abort the transaction.
2. **Crash Loudly:** Include full stack trace and `TenantId`.
3. **Report Critical:** Log as `CRITICAL_CONSTITUTIONAL_BREACH`.

This ensures that architectural drift is treated as a severe system failure, preventing silent regression.

## 7. The Sovereignty Dashboard (Law 7)

**"The system must be self-aware of its own integrity."**

A standardized component (`SovereigntyDashboard`) exists to visualize:

- Dirty Count (Law 2.5 backlog)
- Quarantine Count (Corrupted state)
- Reconciliation Queue Depth

**Note:** The "Health Score" displayed is **ADVISORY ONLY**.
It is a heuristic for human operators (`100 - penalties`). It MUST NOT be used by automated logic to determine system behavior (e.g., blocking features). The only authoritative signal for blocking is `KERNEL_WRITE_MODE` status.

---

**Signed,**
*ChefIApp Governance Committee*
