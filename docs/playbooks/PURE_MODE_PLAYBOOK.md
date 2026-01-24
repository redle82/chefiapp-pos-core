# PURE MODE PLAYBOOK
>
> **Strategy Guide for Transitioning to Kernel Sovereignty**

## 🎯 Objective

Migrate ChefIApp from **HYBRID** (Dual-Write + Reconciliation) to **PURE** (Kernel-Only Write) mode.
Eliminate the "Truth Gap" permanently.

---

## 🚦 Maturity Levels

| Level | Mode | Behavior | Reconciler | Status |
| :--- | :--- | :--- | :--- | :--- |
| **0** | **ANARCHY** | Direct writes everywhere. No tracking. | OFF | 🔴 DANGEROUS |
| **1** | **HYBRID (Silent)** | Gate active. Exceptions logged. | OFF | 🟠 VISIBLE |
| **2** | **HYBRID (Healed)** | Gate marks 'DIRTY'. Reconciler fixes state. | **ON** | 🟢 CONTROLLED (Current) |
| **3** | **PURE (Staging)** | Direct writes throw ERROR. Kernel is sole writer. | ON (Safety) | 🔵 VALIDATION |
| **4** | **PURE (Prod)** | Direct writes forbidden. | OFF (Legacy) | 🟣 SOVEREIGN |

---

## 🛠️ The Transition Protocol

### 1. The Stability Phase (Level 2)

**Goal:** Prove that the Event Log is complete and correct.

- **Action:** Run `HYBRID` mode with Reconciliation enabled.
- **Metric:** Monitor "Reconciliation Corrections".
  - If `reconciled_state == db_state` (before fix), the Kernel Logic is perfect.
  - If `reconciled_state != db_state`, the Kernel Logic is buggy (or DB was wrong).
- **Exit Criteria:** 7 days of < 0.1% logic divergence in reconciliation jobs.

### 2. The Verification Phase (Level 3 - Staging)

**Goal:** Validate that `DbWriteGate` effectively blocks unauthorized writes.

- **Action:** Set `VITE_KERNEL_MODE = 'PURE'` in Staging/Test environment.
- **Test:** Run full E2E Regression Suite.
  - Expect crashes in any unpatched legacy flows.
  - Validate that `CashRegister` and `OrderContext` (Refactored) work via Kernel commands.

### 3. The Migration Phase (Code Cleanup)

**Goal:** Remove the dual-write code paths entirely.

- **Action:** In Legacy Engines (e.g., `CashRegister.ts`), remove the `DbWriteGate` calls.
- **Refactor:** Ensure `TenantKernel` updates the `InMemoryRepo` -> `PostgresRepo` (or separate Projector) efficiently.
- **Note:** In PURE mode, the "Write" happens inside the Kernel's persistence adapter, not the UI's context.

### 4. The Sovereign Switch (Level 4 - Prod)

**Goal:** Enforce Purity in Production.

- **Action:**
    1. Deploy PURE config to 1% of traffic (Canary).
    2. Monitor Error Rates (`CRITICAL_CONSTITUTIONAL_BREACH`).
    3. Rollout to 100%.
- **Safety:** Keep `HYBRID` mode configuration available for instant rollback if `TenantKernel` fails under load.

---

## 🚨 Troubleshooting PURE Mode

### Symptom: "Constitutional Breach" Error in UI

- **Cause:** A component tried to write to DB directly (bypassing Kernel) while in PURE mode.
- **Fix:**
    1. Identify the caller (Stack Trace).
    2. Whitelist in `ExceptionRegistry` (Temporary rollback to HYBRID for that caller? No, strict PURE denies it).
    3. **Correct Fix:** Refactor component to dispatch a Command to `TenantKernel`.

### Symptom: Data Missing in UI

- **Cause:** Kernel accepted command, Event saved, but Projection (DB) not updated.
- **Fix:** Check `Projector` or `ReconciliationEngine`. In PURE mode, Projections must run **synchronously** or **eventually** (via CDC/Queue).
- **Urgent:** If Projections are async, UI must handle "Eventual Consistency". If synchronous (current InMemoryRepo behavior wrapped), verify it persists to DB.

---

## 📊 Metrics to Watch (The "Dirty Rate")

Define a Dashboard Widget "Sovereignty Health":

- **Dirty Writes / Min:** (Should be > 0 in Hybrid, 0 in Pure)
- **Reconciliation Failures:** (Should be 0. If > 0, we have data loss risk)
- **Breach Attempts:** (Blocked writes in Pure Mode)

> **"Purity is not a destination, it is a discipline."**
