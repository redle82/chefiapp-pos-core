
# The Sovereign Code v1
*System Architecture & Operational Guarantees*

**Status**: FROZEN
**Version**: 1.0 (First Breath)
**Date**: January 2026

## 1. Principles of Sovereignty
This system is built on **distrust of the frontend**. The UI is merely a view layer; the Database is the Sovereign.
1.  **Fiscal Reality**: Money exists only if the database says so.
2.  **Atomic Truth**: Transactions are all-or-nothing.
3.  **Silent Observability**: Every critical action is logged, whether success or failure.

## 2. Core Flows (The Lifecycle)

### A. The Stranger (Airlock)
*Entry Point for the Public*
- **Mechanism**: Anonymous `gm_order_requests` table.
- **Security**: Insert-Only RLS. No read access to other records.
- **Ingestion**: `OrderProcessingService` accepts requests -> Creates `gm_orders`.

### B. The Gatekeeper (TPV)
*The Verification Layer*
- **Role**: Staff/Manager.
- **Action**: Verifies `gm_order_requests`.
- **Transformation**: Request (Potential) -> Order (Liability).

### C. The Digestion (Kitchen)
*The Production Layer*
- **Mechanism**: `KitchenDisplay` (Kanban).
- **Status Flow**: `open` -> `in_prep` -> `ready` -> `served`.
- **Constraint**: Items cannot be lost; flow is unidirectionally progressive.

### D. The Wallet (Payment)
*The Hardened Layer*
- **Constraint 1**: **Register Must Be Open**. No payments in the dark.
- **Constraint 2**: **Idempotency**. `idempotency_key` prevents double-charging.
- **Constraint 3**: **Atomic Update**. Order Status + Money Log happen in one transaction.
- **RPC**: `process_order_payment` (The only way to write money).

### E. The Brain (Dashboard)
*The Intelligence Layer*
- **Source**: Directly aggregates `gm_orders` via `get_daily_metrics`.
- **Guarantee**: Zero calculation on client. If the Dashboard shows €100, the Database has €100.

## 3. Database Schema (Snapshot)
- **`gm_restaurants`**: The Tenant Root.
- **`gm_orders`**: The Central Ledger.
- **`gm_order_items`**: The Detail.
- **`gm_order_requests`**: The Airlock Queue.
- **`gm_cash_registers`**: The Physical Wallet.
- **`gm_payments`**: The Immutable Transaction Log.
- **`gm_payment_audit_logs`**: The Black Box Recorder.

## 4. Known Constraints (The Freeze)
- **Timezone**: Currently hardcoded/implied as `Europe/Lisbon` or UTC in aggregators.
- **Payment Method**: Cash/Card implemented. Integration with Terminals (Stripe/Adyen) is via "Manual Entry" pattern or future webhooks.
- **Inventory**: Deducts are logical, not physical (yet).

## 5. Deployment Readiness
- **RLS**: Active on all public tables.
- **RPCs**: Hardened against signature ambiguity.
- **Performance**: Indexes active on `status`, `created_at`, `restaurant_id`.

**The System is Ready.**
