# Phase 1 Blueprint — Storage & Event Adapter Decoupling

## Goal

Decouple `CoreExecutor` from `InMemoryRepo` concrete implementation and establish a stable contract for:

- `StorageAdapter` (state + transactions + locks)
- `EventStoreAdapter` (append-only log + replay)

Outcome: domain logic runs unchanged with either in-memory or persistent adapters.

---

## Scope (Weeks 1-2)

### In Scope

1. Contract-first adapter definitions.
2. `InMemory` implementation aligned with contracts.
3. `CoreExecutor` dependency inversion to `StorageAdapter`.
4. Compatibility tests running against two adapters:
   - `InMemoryAdapter`
   - `PostgresAdapter` (initial implementation)

### Out of Scope

- New product features.
- State-machine versioning (Phase 2).
- Guard/effect plugin boundary (Phase 3).
- New observability hooks (Phase 4).

---

## Contracts

### StorageAdapter

Source: `core-engine/repo/StorageAdapter.ts`

Critical semantics:

- `beginTransaction()` returns stable tx id.
- `commit()` must enforce optimistic concurrency.
- `rollback()` must be idempotent.
- `withLock()` must serialize operations by lock id(s).
- CRUD methods return defensive copies or immutable snapshots.
- `findPaymentById()` removes need for private map introspection in executor/guards/effects.

### EventStoreAdapter

Source: `core-engine/event-log/EventStoreAdapter.ts`

Critical semantics:

- `append()` and `appendMany()` enforce stream version constraints.
- `readStreamFromVersion()` supports replay/resume.
- `readAll(filter)` supports forensic queries.

---

## Invariants (Non-negotiable)

1. Atomicity: either all state changes in a transition commit or none.
2. Consistency: no invalid state transition can persist.
3. Isolation: `withLock` prevents race conditions on targeted entities.
4. Durability (persistent adapters): committed changes survive process restart.
5. Idempotency guardrails: duplicate event writes are rejected or safely deduplicated.

---

## Migration Path

### Step 1 — Contract Adoption

- Add adapter contracts (done in this blueprint step).
- Add compile-time exports from `core-engine/index.ts`.

### Step 2 — InMemory Alignment

- Create `InMemoryStorageAdapter` wrapper implementing `StorageAdapter`.
- Keep existing `InMemoryRepo` behavior unchanged.
- Implement `findPaymentById` via existing payment access methods.

### Step 3 — Executor Injection

- Change `CoreExecutor` constructor to depend on `StorageAdapter`.
- Remove `(repo as any)` map access from executor.
- Replace scan loops with `findPaymentById` and adapter methods.

### Step 4 — PostgresAdapter

- Implement transaction lifecycle (`BEGIN/COMMIT/ROLLBACK`).
- Implement lock semantics using deterministic lock keys.
- Implement optimistic concurrency checks (version column / `WHERE version = x`).

### Step 5 — Dual Adapter Test Matrix

- Run same executor/guard/effect tests against both adapters.
- Keep assertions identical across implementations.

---

## Acceptance Criteria (Phase 1 Done)

1. `CoreExecutor` compiles and runs with `StorageAdapter` only.
2. No private repository field access (`as any`) remains in executor path.
3. Existing domain tests pass unchanged with InMemory adapter.
4. Postgres adapter passes minimal parity suite:
   - transition success
   - guard failure rollback
   - effect failure rollback
   - concurrency conflict
5. Replay-ready event store API available through `EventStoreAdapter`.

---

## Risk Map

### R1 — Hidden coupling to InMemory internals

- Symptom: direct `Map` access from business code.
- Mitigation: route all access through adapter contract.

### R2 — Transaction semantic drift (InMemory vs Postgres)

- Symptom: tests pass in-memory and fail in persistent mode.
- Mitigation: parity tests and shared fixtures.

### R3 — Lock granularity mismatch

- Symptom: deadlocks or false conflicts.
- Mitigation: deterministic lock ordering + explicit lock id policy.

---

## Locking Policy (Deterministic)

- Lock ids are strings (`ENTITY:ID`) and sorted lexicographically before multi-lock acquire.
- For payment confirmation flow lock both entities when needed:
  - `PAYMENT:{paymentId}`
  - `ORDER:{orderId}`

This preserves current anti-race behavior and avoids lock-order inversion.

---

## Compatibility Matrix

| Capability                          | InMemoryAdapter | PostgresAdapter |
| ----------------------------------- | --------------: | --------------: |
| Transaction begin/commit/rollback   |              ✅ |              ✅ |
| Optimistic concurrency              |              ✅ |              ✅ |
| Deterministic lock set              |              ✅ |              ✅ |
| findPaymentById lookup              |              ✅ |              ✅ |
| Stream append with expected version |              ✅ |              ✅ |
| readStreamFromVersion               |              ✅ |              ✅ |

---

## Execution Checklist (Week 1)

- [x] Define `StorageAdapter` contract.
- [x] Define `EventStoreAdapter` contract.
- [x] Export contracts through core-engine public API.
- [x] Introduce `InMemoryStorageAdapter` implementation.
- [x] Refactor `CoreExecutor` to consume adapter contract.
- [ ] Add adapter parity tests.

---

## Suggested Commands (validation)

```bash
npx vitest run core-engine/executor/ core-engine/guards/ core-engine/effects/
npx vitest run core-engine/pulse/
```

For adapter parity (next step):

```bash
npx vitest run core-engine/tests/adapter-parity/
```

---

## Decision Gate after Week 2

Proceed to Phase 2 only if:

- Adapter parity is green.
- No critical transaction semantic gap remains.
- Executor path has zero private-storage coupling.

If any fail, complete hardening before state-machine versioning.
