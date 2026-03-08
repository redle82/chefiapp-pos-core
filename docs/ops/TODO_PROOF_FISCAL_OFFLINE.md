# PROOF: Fiscal + Offline/Sync Hardening — Verification Checklist

> **Date**: 2026-02-23
> **Script**: `scripts/flows/proof_fiscal_offline.sh` > **Prereq**: Docker Core running (`docker compose -f docker-core/docker-compose.core.yml up -d`)

---

## Section 1 — Triggers & Invariants on `gm_fiscal_documents` + `event_store`

### 1.1 Trigger Listing

| Trigger                              | Table                 | Expected                               |
| ------------------------------------ | --------------------- | -------------------------------------- |
| `trg_compute_event_hash`             | `event_store`         | BEFORE INSERT — SHA-256 hash chain     |
| `trg_forbid_event_store_mutation`    | `event_store`         | BEFORE UPDATE/DELETE — immutable       |
| `trg_cdc_fiscal_doc_created`         | `gm_fiscal_documents` | AFTER INSERT — CDC emit                |
| `trg_cdc_fiscal_doc_status`          | `gm_fiscal_documents` | AFTER UPDATE — CDC emit                |
| `trg_guard_fiscal_document_mutation` | `gm_fiscal_documents` | BEFORE UPDATE/DELETE — guard 16 fields |
| `trg_assign_fiscal_number`           | `gm_fiscal_documents` | BEFORE INSERT — MAX+1 numbering        |
| `trg_forbid_legal_seals_mutation`    | `legal_seals`         | BEFORE UPDATE/DELETE — immutable       |

**PASS criteria**: All 7 triggers exist. Query:

```sql
SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('event_store','gm_fiscal_documents','legal_seals')
ORDER BY event_object_table, trigger_name;
```

### 1.2 Immutability Proof — event_store

**Test**: INSERT a row, then try UPDATE and DELETE. Both must fail with `RAISE EXCEPTION`.

```sql
-- Insert test event
INSERT INTO event_store (id, restaurant_id, event_type, payload, stream_id)
VALUES ('<uuid>', '<rest_id>', 'TEST_EVENT', '{"test":true}'::jsonb, 'test-<run_id>');

-- Must FAIL: UPDATE
UPDATE event_store SET payload = '{"tampered":true}' WHERE id = '<uuid>';

-- Must FAIL: DELETE
DELETE FROM event_store WHERE id = '<uuid>';
```

**PASS**: Both UPDATE and DELETE raise error matching `immutable|cannot modify|forbid`.

### 1.3 Immutability Proof — gm_fiscal_documents

**Test**: INSERT fiscal doc via RPC, then try to change `total_cents`, `hash_signature`, or DELETE.

```sql
-- Must FAIL: UPDATE financial field
UPDATE gm_fiscal_documents SET total_cents = 0 WHERE id = '<fiscal_id>';

-- Must FAIL: DELETE
DELETE FROM gm_fiscal_documents WHERE id = '<fiscal_id>';
```

**PASS**: Both operations raise error matching `cannot modify|immutable|guard`.

### 1.4 Fiscal Numbering — Sequential & Gapless

**Test**: Insert two fiscal documents for the same restaurant. Second must get `fiscal_number = first + 1`.

**PASS**: `fiscal_number` increments without gaps per `(restaurant_id, doc_type, fiscal_series, fiscal_year)`.

---

## Section 2 — Hash Chain Verification (Real Proof)

### 2.1 Hash Auto-Compute on INSERT

**Test**: Insert into `event_store` without providing `hash` or `hash_prev`. The trigger `compute_event_hash` must fill both.

```sql
SELECT hash, hash_prev FROM event_store WHERE id = '<uuid>';
```

**PASS**: `hash` is NOT NULL, is 64-char hex (SHA-256). `hash_prev` links to previous event in same stream.

### 2.2 Chain Integrity RPC

**Test**: Call `check_hash_chain_integrity(<restaurant_id>)`.

```sql
SELECT * FROM check_hash_chain_integrity('<restaurant_id>');
```

**PASS**: Returns `is_valid = true` (or no broken chain rows).

### 2.3 Tamper Detection (Adversarial)

**Test**: After verifying chain is intact, attempt to tamper an event's payload and re-check.

> Note: The `forbid_mutation` trigger on `event_store` should BLOCK the UPDATE entirely.
> This proves tamper detection is preventive (not just detective).

**PASS**: UPDATE is rejected at trigger level → chain cannot be tampered.

---

## Section 3 — Fiscal Glue: Payment → Fiscal Document

### 3.1 Fiscal RPC Idempotency

**Test**: Call `create_fiscal_document_for_order` twice with the same `order_id + restaurant_id`.

```sql
SELECT create_fiscal_document_for_order('<order_id>', '<restaurant_id>', 'PT');
SELECT create_fiscal_document_for_order('<order_id>', '<restaurant_id>', 'PT');
```

**PASS**: Second call returns the SAME `fiscal_doc_id` without creating a duplicate. Count of fiscal docs for that order = 1.

### 3.2 Fiscal Hash Computation

**Test**: After fiscal document creation, verify `hash_signature` is NOT NULL and is a real SHA-256 hash.

```sql
SELECT id, hash_signature, fiscal_number, total_cents
FROM gm_fiscal_documents WHERE order_id = '<order_id>';
```

**PASS**: `hash_signature` is 64+ char hex string, not a placeholder.

### 3.3 Order Create Idempotency (via `create_order_atomic`)

**Test**: Call `create_order_atomic` twice with the same `p_idempotency_key`.

**PASS**: Second call returns same `order_id`, no duplicate row created.

> **GAP CLOSED**: Migration `20260223_add_idempotency_to_create_order_atomic.sql` adds `p_idempotency_key` param.

### 3.4 Payment Idempotency (via `process_order_payment`)

**Test**: Call payment RPC twice with the same idempotency key.

**PASS**: Second call returns idempotent response, single payment row exists.

---

## Section 4 — Offline/Sync Hardening

### 4.1 Order Dedup E2E

**Test**: SyncEngine enqueues ORDER_CREATE with a stable `idempotencyKey`. If retried, Core returns idempotent response.

**Verified by**: `proof_fiscal_offline.sh` Step 3.3 (server-side) + SyncEngine source code review:

- [SyncEngine.ts](../../merchant-portal/src/core/sync/SyncEngine.ts) `syncOrderCreate()` now passes `idempotencyKey` to Core.

### 4.2 PrintQueue Guard — No Phantom Prints

**Test**: PrintQueueProcessor only processes a print job AFTER `orderExistsInCore(orderId)` returns `true`.

**Verified by**: Source code at [PrintQueueProcessor.ts](../../merchant-portal/src/core/print/PrintQueueProcessor.ts):

```typescript
if (job.orderId) {
  const exists = await orderExistsInCore(job.orderId);
  if (!exists) continue; // stays pending
}
```

**PASS**: Code-level gate confirmed. No phantom print possible.

### 4.3 Conflict Resolution — LWW + Version

**Test**: SyncEngine's `syncOrderUpdate` uses `ConflictResolver.shouldApplyUpdate()` (LWW) + `getVersion()` (optimistic locking). On version mismatch, throws `VERSION_CONFLICT`.

**Verified by**: Source code at [ConflictResolver.ts](../../merchant-portal/src/core/sync/ConflictResolver.ts):

- `shouldApplyUpdate(table, id, localTimestamp)` → compares `updated_at`
- `getVersion(table, id)` → returns current version

**Proof script**: Step in `proof_fiscal_offline.sh` creates an order, bumps version, then attempts update with stale version → must fail.

---

## Section 5 — SAF-T Fidelity

### 5.1 SAF-T Reads From Real Fiscal Documents

**Source code verified**: [SaftExportService.ts](../../merchant-portal/src/core/fiscal/SaftExportService.ts):

```typescript
const { data } = await coreClient
  .from("gm_fiscal_documents")
  .select("*")
  .eq("jurisdiction", "PT")
  .in("status", ["ACCEPTED", "SUBMITTED", "PENDING"])
  .in("doc_type", ["INVOICE", "SIMPLIFIED_INVOICE", "CREDIT_NOTE"]);
```

**PASS**: Reads exclusively from `gm_fiscal_documents`, uses real `hash_signature`.

### 5.2 No Placeholder Hashes

**Proof script verifies**: After creating a fiscal document, query `hash_signature` and confirm it:

- Is NOT NULL
- Is NOT `'placeholder'` or `'0000...'`
- Is 64+ hex chars (SHA-256)

---

## Section 6 — Execution Checklist

### Definition of Done

| #   | Check                           | Script Step | Status |
| --- | ------------------------------- | ----------- | ------ |
| 1   | All 7 triggers exist            | Step 1      |        |
| 2   | event_store UPDATE blocked      | Step 2a     |        |
| 3   | event_store DELETE blocked      | Step 2b     |        |
| 4   | fiscal_documents UPDATE blocked | Step 3a     |        |
| 5   | fiscal_documents DELETE blocked | Step 3b     |        |
| 6   | Hash auto-computed on INSERT    | Step 4      |        |
| 7   | Hash chain integrity valid      | Step 5      |        |
| 8   | Tamper blocked at trigger level | Step 6      |        |
| 9   | Fiscal numbering sequential     | Step 7      |        |
| 10  | Fiscal RPC idempotent           | Step 8      |        |
| 11  | Fiscal hash is real SHA-256     | Step 9      |        |
| 12  | Order create idempotent         | Step 10     |        |
| 13  | Payment idempotent              | Step 11     |        |
| 14  | Version conflict detected       | Step 12     |        |
| 15  | SAF-T uses real fiscal docs     | Code review |        |
| 16  | PrintQueue gate confirmed       | Code review |        |

### Run Commands

```bash
# Full automated proof (Core must be running)
bash scripts/flows/proof_fiscal_offline.sh

# Phase 11 rehearsal (should still 35/35)
bash scripts/flows/run-fiscal-sync-rehearsal.sh
```

### Continuation Sequence

After all 16 checks PASS:

1. Commit: `feat(fiscal): close idempotency gap in create_order_atomic + proof script`
2. Merge to `main`
3. Re-run `proof_fiscal_offline.sh` on staging
4. Update `docs/ops/RELEASE_AUDIT_STATUS.md` with evidence
