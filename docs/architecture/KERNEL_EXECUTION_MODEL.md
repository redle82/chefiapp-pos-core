# Kernel Execution Model
>
> **The Neural Pathways of the System**

This document details the technical flow of a Domain Operation within a Tenant Kernel.

## 1. The Trinity

Every Kernel Instance maintains 3 sovereign components:

1. **Repo (Memory):** `InMemoryRepo`. The current state (Session, Orders, Payments).
    - *Lifecycle:* Created on Boot. Destroyed on Dispose.
    - *Isolation:* Unique instance per Kernel.
2. **Executor (Brain):** `EventExecutor`. The logic engine.
    - *Dependency:* Injected with the specific `Repo` instance.
    - *Scope:* Bound to `TenantId` at construction.
3. **EventStore (History):** `PostgresEventStore`. The persistence layer.
    - *Connection:* Shared pool, but queries are strictly scoped by `stream_id = ${tenantId}:...`.

## 2. The Execution Pipeline (`Kernel.execute()`)

When the UI calls `Kernel.execute(request)`, the following pipeline runs:

### A. The Gatekeeper (Kernel)

1. **Assertion:** Is Kernel `READY`? If `BOOTING` or `DISPOSED`, throw Error.
2. **Injection:** Takes `request` (without tenant) and injects `kernel.tenantId`.
3. **Envelope:** Generates/Refreshes `ExecutionContext` (Tenant + ExecutionId + Lifecycle).
4. **Delegation:** Calls `executor.execute(authenticatedRequest, context)`.

### B. The Orchestrator (EventExecutor)

1. **Context Check:** Asserts `ctx.tenantId == request.tenantId` and `ctx.lifecycle == 'ACTIVE'`.
    - *Anti-Zombie:* If Kernel was disposed mid-flight, this check fails (Fail-Closed).
2. **Stream Resolution:** Generates `StreamId` using `${tenantId}:${entity}:${entityId}`.
3. **Concurrency Check:** Fetches current `stream_version`.
4. **Rebuild (Projection):**
    - Reads events from EventStore (scoped by StreamId).
    - Replays them into the **Kernel's Repo**.
    - *This ensures Memory is in sync with History.*
5. **Logic Execution (CoreExecutor):**
    - Runs State Machine (Guards, Effects).
    - Generates Payload (New State).
6. **Commit (EventStore):**
    - Appends new Event + Meta + IdempotencyKey.
    - *Atomic Check:* If version mismatch, roll back.

### C. The Aftermath

1. **Memory Update:** The Repo now holds the new state.
2. **Result:** Returns `TransitionResult` to UI.

## 3. The Anti-Looping Mechanism

Why this prevents the "Infinite Loop" bug:

1. **Physical Isolation:** The Executor cannot touch another Tenant's Repo because it doesn't *have* a reference to it.
2. **Stream Sovereignty:** `StreamId` is derived from the Kernel's strictly typed `tenantId`. It is mathematically impossible to read/write another tenant's stream.
3. **Lifecycle Reset:** When switching tenants, `Kernel.dispose()` destroys the Repo. The new Kernel starts with a blank slate (or rehydrated slate). No "ghost state" survives.

## 4. Implementation Reference

- **Class:** `core-engine/kernel/TenantKernel.ts`
- **Executor:** `event-log/EventExecutor.ts`
- **Repo:** `core-engine/repo/InMemoryRepo.ts`
