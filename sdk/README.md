# System of Record SDK (v1.0.0-AUDIT)

This directory contains the **Official Public Interface** for the ChefIApp POS Core.
Integrators, Auditors, and Extension Developers must use *only* the types and interfaces exported here.

## 🚫 Integration Rules (Strict)

1.  **Do Not Import Internals**: Never start an import with `../core-engine/` or `../legal-boundary/`. Always import from `@chefiapp/pos-core/sdk`.
    ```typescript
    // ✅ CORRECT
    import { CoreEvent, LegalSeal } from "@chefiapp/pos-core/sdk";

    // ❌ FORBIDDEN (Voids Warranty)
    import { CoreEvent } from "../core-engine/event-log/types";
    ```

2.  **Read-Only Observer Pattern**:
    - The Core is designed to be *observed*, not *controlled*.
    - Use `EventStore` to read the immutable stream.
    - Use `FiscalObserver` to react to seals.
    - Do not attempt to inject side-effects into the `CoreTransactionManager`.

3.  **Audit Boundary**:
    - Code inside `sdk/` is effectively part of the "Contract".
    - Code outside `sdk/` (e.g., your UI, your API) is "Uncertified Territory".

## 📚 Core Concepts

### 1. CoreEvent (The Atom of Truth)
Every financial fact (Order Paid, Session Closed) is a signed, hashed `CoreEvent`.
- **Immutable**: Cannot be changed after emission.
- **Ordered**: Strictly sequenced by `stream_version`.
- **Causal**: Linked via `causation_id`.

### 2. LegalSeal (The Institutional Proof)
Events are "sealed" by the Legal Boundary.
- `PAYMENT_CONFIRMED` -> `PAYMENT_SEALED`
- `ORDER_CLOSED` -> `ORDER_FINAL`
A seal guarantees that the system has accepted the fact as **Non-Repudiable**.

### 3. Fiscal Integration
Fiscal printers and ERPs are **Observers**.
- Build a class that implements `FiscalObserver`.
- Listen for Sealed Events.
- Report asynchronously.
- Store your result in a separate persistence layer (Gate 5.1).

## 🛡️ License Warning

Modification of the files in `core-engine`, `legal-boundary`, `event-log`, or `gate3-persistence` constitutes a **Breach of Seal**.
The system is no longer a "System of Record" if the source code is altered.

*Engineered by ChefIApp POS Architecture Team*
