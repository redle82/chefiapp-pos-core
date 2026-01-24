# PUBLIC API CONTRACT (v1.0.0-AUDIT)

**Product**: @chefiapp/system-of-record
**Status**: FROZEN / AUDITED
**Scope**: External Integration Surface

This document defines the **ONLY** guarantees made to external integrators.
Accessing internal logic (CoreExecutor, InMemoryRepo, direct DB tables) bypasses the System of Record guarantees and voids the Audit Seal.

---

## 1. Public Contracts

The following interfaces are stable, versioned, and safe to use.

### Event Sourcing (Read-Only)
- `EventStore.readStream(streamId)`: Returns `Promise<CoreEvent[]>`
- `EventStore.readAll(filter)`: Returns `Promise<CoreEvent[]>`
- `EventStore.getStreamVersion(streamId)`: Returns `Promise<number>`
- **Optional (Audit Tooling)**: `EventStore.verifyHashChain(filter?)`: Returns `VerificationReport`

*Note: `EventStore.append()` is restricted to the **CoreTransactionManager** and must NEVER be called by Integrators.*

### Core Transaction (The Only Write Path)
- `CoreTransactionManager.execute(work)`: Executes atomic units of work.
- `CoreTransactionManager.appendAndSeal(event)`: The atomic "Fact Factory".

### Legal Boundary (Observation & Proof)
- `LegalSealStore.getLatestSeal(entityType, entityId)`: Returns `Promise<LegalSeal | null>` (Maps to `getSeal` internal impl)
- `LegalSealStore.listSealsByEntity(entityType, entityId)`: Returns `Promise<LegalSeal[]>`
- `LegalSealStore.getSealById(sealId)`: **Reserved for future audit tooling**.

*Note: `LegalBoundary.observe()` is an Audit/Replay tool. In production, observation happens automatically inside the CoreTransaction.*

### Fiscal Integration (Extension)
- `FiscalObserver`: Interface for implementing fiscal printers/ERPs.
- `FiscalObserver.onSealed(seal, event)`: The authoritative callback for fiscal reaction.
- `TaxDocument`, `FiscalResult`, `FiscalStatus`: Standard data types.

---

## 2. UI Projection Contract

User Interfaces must treat the System of Record as an asynchronous "Feed of Facts".
There are 3 supported patterns for UI Integration:

### Pattern A: Client-Side Projection (Recommended for SPA)
1.  UI subscribes to `EventStore` (via Polling or Realtime).
2.  UI reduces events locally (e.g., `events.reduce(reducer, initialState)`).
3.  **Pro:** Zero backend state drift.
4.  **Con:** Heavy on client if history is long.

### Pattern B: Server-Side Read Model (Recommended for Dashboard)
1.  A separate "Projections" service listens to `EventStore`.
2.  Writes to a denormalized `read_model_orders` table.
3.  UI reads from `read_model_orders` via standard REST/GraphQL.
4.  **Pro:** Fast reads, complex queries.
5.  **Con:** Eventual consistency latency (<100ms).

### Pattern C: Sealed Feed (Recommended for Fiscal/Notifications)
1.  Listen strictly to `LegalSealStore`.
2.  Only react when a Fact is legally sealed.
3.  **Use Case:** Printing receipts, sending emails, triggering inventory decrement.

---

## 3. Package Structure

### 🔒 @chefiapp/system-of-record (The Core)
- **Privilege**: Kernel Mode.
- **Content**: Gates 0–5.2 (Engine, Persistence, Legal).
- **License**: Proprietary / Restricted.
- **Modification**: **FORBIDDEN**.

### 🔓 @chefiapp/adapters-sdk (The Toolkit)
- **Privilege**: User Mode.
- **Content**: Types, Interfaces, Mock Adapters, Test Harness.
- **License**: Apache 2.0 (Recommended).
- **Modification**: Allowed (Open Source).
- **Exports**:
    - `CoreEvent`, `LegalSeal`
    - `FiscalObserver`
    - `EventStore` (Interface Only)

---

## 4. Strict Boundary Rules

1.  **No Direct State Mutation**: You cannot import `CoreExecutor` to manually change state. You must use the `Command` pattern or strictly observe via `EventStore`.
2.  **No Bypass**: Writing directly to `event_store` or `legal_seals` tables via SQL is a violation of the integrity model.
3.  **No Mocking the Truth**: In production, you must verify the `hash` and `hash_prev` of events if you are building an audit tool.

---

**Signed:** ChefIApp POS Architecture Team
**Date:** 2025-12-22
