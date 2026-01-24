# FISCAL DEFENSE PROTOCOL
> **Classification:** AUDIT SENSITIVE
> **System:** ChefIApp POS CORE (Fiscal Layer)
> **Gates Involved:** 5, 5.1, 5.2
> **Date:** 2025-12-22

---

## 1. THE THESIS OF INDEPENDENCE

The Fiscal Layer operates under a strict **"Unilateral Observation"** doctrine. It is structurally impossible for the Fiscal Module to influence, block, or modify the Financial Core.

> **"Financial Reality precedes Bureaucratic Reality."**

We assert:
1.  **The Sale is Final:** Once sealed by Gate 2, the sale exists legally and financially, regardless of fiscal reporting status.
2.  **The Report is Derivative:** The fiscal document is a projection of immutable Core truth, not a source of truth itself.
3.  **The Proof is Separate:** Fiscal usage logs (`fiscal_event_store`) are maintained independently from financial logs (`event_store` and `legal_seals`).

---

## 2. THE CHAIN OF EVIDENCE

### 2.1 Idempotency Proof
**Question:** "Did you report this sale twice?"

**Proof:**
*   **Mechanism:** `UNIQUE(ref_seal_id, doc_type)` constraint on `fiscal_event_store`.
*   **Defense:** The database engine structurally rejects duplicate fiscal reporting attempts for the same Legal Seal and document type. Duplicate fiscal reporting is structurally impossible at the persistence level.

### 2.2 Immutability Proof
**Question:** "Did you alter the fiscal report after sending it?"

**Proof:**
*   **Mechanism:** `BEFORE UPDATE OR DELETE` Trigger raising `FISCAL_IMMUTABLE_VIOLATION`.
*   **Defense:** Records in `fiscal_event_store` are Write-Once, Read-Many (WORM). No user or application process can overwrite or erase the historical record of what was transmitted to the government.

### 2.3 Causality Proof
**Question:** "Is this fiscal report real?"

**Proof:**
*   **Mechanism:** Foreign Key constraints to `legal_seals(seal_id)` and `event_store(event_id)`.
*   **Defense:** Every fiscal record is strictly anchored to a proven Financial Event and its Legal Seal. It is structurally impossible to generate fiscal records without a corresponding financial fact.

---

## 3. SEPARATION OF POWERS (CORE FROZEN)

The Fiscal Logic is implemented as an **External Observer** to the Core, respecting the **Core Frozen** mandate (Gates 0–4).

| Layer | Responsibility | Permission |
|-------|----------------|------------|
| **Core** | Generates Reality | Write Logic |
| **Legal** | Seals Financial Facts | Observer / Seal |
| **Fiscal** | Reports Reality | Read-Only Observation |

*   **Failure Isolation:** If the Fiscal Module crashes or a government API becomes unavailable, the Core continues to process sales uninterrupted. Fiscal reporting resumes asynchronously once connectivity or service is restored.
*   **Panic Safety:** A defect in fiscal calculation or transmission cannot revert, mutate, or invalidate a finalized sale.

---

## 4. AUDIT VERDICT

**Status:** APPROVED (Audit-Grade)

This architecture constitutes a **Non-Repudiable Fiscal Compliance Evidence System**, satisfying:
*   **Traceability:** Sale → Event → Seal → Fiscal Record.
*   **Integrity:** Database-level structural enforcement of uniqueness and immutability.
*   **Decoupling:** Zero risk of fiscal logic corrupting financial or business logic.

**Signed:** *ChefIApp POS Architecture Team*
