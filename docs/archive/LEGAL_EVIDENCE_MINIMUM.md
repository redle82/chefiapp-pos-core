# LEGAL EVIDENCE MINIMUM
> **Status:** GATE 4 Prerequisite  
> **Purpose:** Define exactly HOW we prove facts before implementing the DB adapters.

## 1. The 10 Pillars of Proof

1.  **Immutability by Design & Force**: Updates and Deletes are blocked by DB triggers (`prevent_immutable_modification`) and application architecture. History is never rewritten, only appended.
2.  **Global Monotonic Sequencing**: Every Event (`sequence_id`) and Legal Seal (`legal_sequence_id`) receives a strictly increasing ID from the Database `BIGSERIAL`. Gaps are permitted (rollback), but reordering is impossible.
3.  **Atomic Materialization**: A Legal Seal is **only** created if its corresponding Event is successfully committed in the same transaction. "No Event, No Seal. No Seal, No sealed Event."
4.  **Causal Linkage**: Every Legal Seal explicitly references the `event_id` it seals. The seal proves the existence and specific version of the financial fact.
5.  **Idempotency & Uniqueness**: The tuple `(entity_type, entity_id, legal_state)` is strictly `UNIQUE` in the database. Trying to seal the same state twice results in a harmless rejection or no-op, never a duplicate or inconsistent record.
6.  **Temporal Certitude**: We rely on the Database's `NOW()` for `created_at` and `sealed_at`, providing a consistent server-side timeline (Audit Time) distinct from client timestamps.
7.  **Fact Snapshotting**: The Legal Seal contains a snapshot of the critical financial state (`financial_state_snapshot`) at the moment of sealing. This allows instant verification without replaying the entire log.
8.  **Replay Determinism**: Replaying the `event_store` from zero **must** result in the exact same calculated state and the exact same set of required Legal Seals.
9.  **Tamper Detection (Hash Chain)**: (Prepared) Events contain a hash of the previous event (or causal ancestor), forming a cryptographic chain that makes row insertion/deletion detectable.
10. **Segregated Authority**: The `LegalBoundary` is an Observer. It cannot create financial data. The `Core` is the Executor. It cannot create legal seals. They meet only in the Atomic Transaction.

## 2. How to Audit (The "Red Button")

### Verification of Replay
1.  **Dump** existing `legal_seals`.
2.  **Replay** all events from `event_store` into a fresh `InMemoryLegalSealStore`.
3.  **Compare**: The set of keys `(entity, state)` generated in memory must match the Database dump 100%.

### Verification of Seals
1.  **Select** a Seal.
2.  **Fetch** key `event_id`.
3.  **Verify**: Does `event.payload` logically imply `seal.legal_state`? (e.g., Event=PAYMENT_CONFIRMED → Seal=PAYMENT_SEALED).
4.  **Verdict**: If yes, the seal is valid.

## 3. What is IMPOSSIBLE to Alter

*   **You cannot "Un-pay" a sealed payment**: You must issue a NEW `PAYMENT_REFUNDED` event.
*   **You cannot "Insert" a historical order**: It would have a `sequence_id` higher than subsequent events, revealing the fraud.
*   **You cannot "Delete" a bad order**: The gap in `sequence_id` (or broken hash chain) will flag a "Data Integrity Violation".
