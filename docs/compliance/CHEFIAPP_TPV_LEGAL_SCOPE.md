# CHEFIAPP TPV — LEGAL SCOPE DECLARATION

> **Classification:** INSTITUTIONAL — AUDIT SENSITIVE
> **Version:** 1.0
> **Date:** 2026-02-12
> **System Version:** 1.4.0 (`PRODUCTION_READINESS_HARDENED`)
> **Status:** DB Core Hardening v1.0 — FROZEN

---

## 1. SYSTEM IDENTITY

**ChefIApp** is a **Restaurant Operating System (TPV)** — a Terminal de Punto de Venda (Point of Sale Terminal) designed for full-service restaurant operations.

| Attribute             | Value                                 |
| --------------------- | ------------------------------------- |
| Product Name          | ChefIApp POS Core                     |
| Product Type          | Restaurant Operating System (TPV)     |
| Fiscal Classification | **Non-Fiscal Emitter**                |
| Deployment Model      | Self-hosted Docker stack              |
| Database              | PostgreSQL 15                         |
| API Layer             | PostgREST v12                         |
| Target Markets        | EU (initial: PT, ES), LATAM (BR), USA |

---

## 2. WHAT CHEFIAPP IS

ChefIApp is a **complete operational system** for restaurant management:

1. **Order Management** — full lifecycle from creation to close (`create_order_atomic`, `update_order_status`, `process_order_payment`)
2. **Payment Processing** — multi-method payments with audit trail (`process_order_payment`, `process_split_payment_atomic`, `fn_log_payment_attempt`)
3. **Cash Register Control** — open/close with shift reports (`open_cash_register_atomic`, `close_cash_register_atomic`, `generate_shift_close_report`)
4. **Inventory & Stock** — BOM-based deduction, stock levels, consumption tracking (`deduct_stock_by_bom`, `simulate_order_stock_impact`)
5. **Catalog & Menu** — products, categories, menus, catalog sync
6. **Table Management** — zones, tables, capacity, reservations
7. **Staff Management** — roles, scheduling, restaurant membership
8. **Multi-tenant** — full restaurant isolation via `has_restaurant_access()` and RLS

---

## 3. WHAT CHEFIAPP IS NOT

ChefIApp does **NOT**:

| Capability                       | Status                        | Implication                                          |
| -------------------------------- | ----------------------------- | ---------------------------------------------------- |
| Issue fiscal invoices            | ❌ Not implemented            | Not a certified billing system                       |
| Calculate taxes (IVA/VAT/ICMS)   | ❌ Not implemented            | Tax computation delegated to fiscal systems          |
| Generate SAF-T files             | ❌ Not implemented (prepared) | Infrastructure exists, jurisdiction module required  |
| Communicate with tax authorities | ❌ Not implemented            | Requires certified fiscal module per jurisdiction    |
| Store payment card data (PAN)    | ❌ By design                  | PSP tokenization only                                |
| Act as a payment processor       | ❌ By design                  | Records payments, does not process card transactions |

---

## 4. FISCAL BOUNDARY — FORMAL DECLARATION

### 4.1 The Non-Emitter Position

ChefIApp occupies the legal position of a **pre-fiscal operational system**:

> _"ChefIApp records operational financial events (orders, payments, receipts) as the source of truth for restaurant operations. It does not emit, sign, or transmit fiscal documents to any tax authority. All fiscal obligations are delegated to certified external systems via integration interfaces."_

This position is legally recognized in:

- **Portugal (AT):** Software de gestão sem emissão de documentos fiscais
- **Spain (AEAT):** Sistema TPV operacional sin emisión fiscal
- **EU General:** Operational POS, non-certified for fiscal document emission
- **Brazil (SEFAZ):** Sistema de gestão operacional, sem emissão de NFC-e/NF-e
- **USA:** POS system (no federal fiscal certification required; state-level varies)

### 4.2 Integration-Ready Architecture

While ChefIApp does not emit fiscal documents, it provides:

| Integration Point                   | Status      | Purpose                                     |
| ----------------------------------- | ----------- | ------------------------------------------- |
| `gm_fiscal_certifications` table    | ✅ Deployed | Stores per-jurisdiction certification state |
| `request_fiscal_certification()`    | ✅ Deployed | Initiates certification process             |
| `record_fiscal_signature()`         | ✅ Deployed | Records external fiscal signatures          |
| `get_fiscal_certification_status()` | ✅ Deployed | Queries certification state                 |
| `event_store` (immutable)           | ✅ Deployed | Source events for fiscal integration        |
| `legal_seals` (immutable)           | ✅ Deployed | Legal boundary layer for sealed events      |

### 4.3 Fiscal Module Extension Path

When fiscal compliance is required for a specific jurisdiction:

```
ChefIApp Core (operational events)
       │
       ├── fiscal-module-pt (Portugal AT)     ← future module
       ├── fiscal-module-es (Spain TicketBAI) ← future module
       ├── fiscal-module-br (Brazil NFC-e)    ← future module
       └── fiscal-module-xx (any)             ← pluggable
```

Each module:

- Observes `event_store` events
- Generates jurisdiction-specific fiscal documents
- Communicates with tax authority APIs
- Records results back via `record_fiscal_signature()`

**ChefIApp Core remains unchanged.** This is by architectural design (see `:blueprint/04_LEGAL_BOUNDARY.md`).

---

## 5. DATA SOVEREIGNTY

### 5.1 Data Location

All operational data resides in a single PostgreSQL instance under the operator's control:

| Data Category    | Table(s)                               | Location              |
| ---------------- | -------------------------------------- | --------------------- |
| Orders           | `gm_orders`, `gm_order_items`          | Operator's PostgreSQL |
| Payments         | `gm_payments`, `gm_payment_audit_logs` | Operator's PostgreSQL |
| Financial events | `event_store`                          | Operator's PostgreSQL |
| Legal seals      | `legal_seals`                          | Operator's PostgreSQL |
| Staff/Users      | `gm_staff`, `restaurant_users`         | Operator's PostgreSQL |
| Customers/People | `gm_restaurant_people`                 | Operator's PostgreSQL |

### 5.2 No External Data Transmission

ChefIApp Core does **not** transmit operational data to:

- Cloud services (no SaaS dependency)
- Third-party analytics
- External databases
- ChefIApp corporate servers

**Exception:** When a fiscal module is installed, it transmits fiscal documents to the relevant tax authority as required by law.

### 5.3 GDPR / RGPD Alignment

| Requirement        | Implementation                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Data minimization  | Only operational data stored                                                                          |
| Right to access    | `get_export_jobs` / `request_export_job()` enables data export                                        |
| Right to erasure   | Soft-delete (`deleted_at`) on `restaurant_users`; operational records retained per legal requirements |
| Purpose limitation | Data used only for restaurant operations                                                              |
| Data portability   | Export jobs system (`gm_export_jobs`) supports structured export                                      |
| Processing records | `gm_payment_audit_logs`, `event_store` provide full processing trail                                  |

---

## 6. MULTI-TENANCY — ISOLATION GUARANTEE

### 6.1 Access Control Model

```
                        ┌────────────────┐
                        │ JWT / Session  │
                        │  auth.uid()    │
                        └───────┬────────┘
                                │
                        ┌───────▼────────┐
                        │ restaurant_    │
                        │ users table    │
                        │ (user→rest.)   │
                        └───────┬────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼───────┐ ┌──────▼──────┐ ┌────────▼────────┐
    │ has_restaurant_ │ │ require_    │ │ RLS policies    │
    │ access(uuid)    │ │ restaurant_ │ │ on all tables   │
    │                 │ │ role(...)   │ │                 │
    └─────────────────┘ └─────────────┘ └─────────────────┘
```

### 6.2 Roles

| Role            | Purpose            | Capabilities                           |
| --------------- | ------------------ | -------------------------------------- |
| `anon`          | Unauthenticated    | Read-only on non-sensitive public data |
| `authenticated` | Authenticated user | Operations scoped to their restaurants |
| `service_role`  | Backend services   | Full access (server-side only)         |

### 6.3 Row-Level Security (RLS)

RLS is enabled on all sensitive tables. Current policy count: **20+ policies** across hardened tables.

Every policy references `has_restaurant_access(restaurant_id)` or `auth.uid()` — ensuring that **no user can access another tenant's data**, even via direct SQL.

---

## 7. IMMUTABILITY GUARANTEES

### 7.1 Write-Once Tables

| Table                      | Protection            | Mechanism                          |
| -------------------------- | --------------------- | ---------------------------------- |
| `event_store`              | Immutable after write | Application-level + trigger guards |
| `legal_seals`              | Immutable after write | Application-level + trigger guards |
| `gm_payment_audit_logs`    | Append-only           | No UPDATE/DELETE grants            |
| `gm_backup_runs`           | Guarded mutations     | `trg_guard_backup_run_mutation`    |
| `gm_audit_mode`            | Guarded mutations     | `trg_guard_audit_mode_mutation`    |
| `gm_export_jobs`           | Guarded mutations     | `trg_guard_export_job_mutation`    |
| `gm_fiscal_certifications` | Guarded mutations     | `trg_guard_fiscal_cert_mutation`   |

### 7.2 Hash Chain Integrity

The `event_store` supports stream hash verification:

- Each event references its predecessor
- Hash chain proves temporal ordering
- Tampering detection is structural

---

## 8. SIGNATURES

This document represents the technical-legal scope of ChefIApp POS Core v1.4.0 as deployed on 2026-02-12.

| Role              | Entity                          |
| ----------------- | ------------------------------- |
| System Architect  | ChefIApp Engineering            |
| Document Version  | 1.0                             |
| Core Version      | 1.4.0                           |
| Hardening Version | DB Core Hardening v1.0 — FROZEN |
| Classification    | Institutional — Audit Sensitive |

---

_This document should be reviewed upon any change to: fiscal module integration, data storage architecture, or authentication model._
