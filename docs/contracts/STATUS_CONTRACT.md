# Status Contract

> **Constitution of State**

This document defines the allowed states for Core Entities.
**Rule:** All Core Statuses MUST be **UPPERCASE** in Application Code and Events.
_Database columns may use lowercase `text` but must match these semantics._

## 1. Order Status (`ORDER`)

**Source of Truth:** [ORDER_STATUS_CONTRACT_v1.md](ORDER_STATUS_CONTRACT_v1.md) (contrato canónico).

O contrato completo (enum, ACTIVE vs TERMINAL, UNKNOWN, normalização, KDS) está em **ORDER_STATUS_CONTRACT_v1.md**. Este documento mantém apenas Payment, Session e Tenant abaixo.

## 2. Payment Status (`PAYMENT`)

**Source of Truth:** `PaymentGateway` / `StripeAdapter`

| Status      | Meaning                             | Terminal? | Next Allowed                       |
| ----------- | ----------------------------------- | --------- | ---------------------------------- |
| `PENDING`   | Created, user interaction required. | No        | `CONFIRMED`, `FAILED`, `CANCELED`  |
| `CONFIRMED` | Money captured.                     | **YES**   | None (Refund is a separate entity) |
| `FAILED`    | Gateway rejected or timeout.        | **YES**   | None (Must create new payment)     |
| `CANCELED`  | User aborted before pay.            | **YES**   | None                               |

## 3. Session Status (`SESSION`)

**Source of Truth:** `SessionManager`

| Status     | Meaning                        | Terminal? | Next Allowed           |
| ---------- | ------------------------------ | --------- | ---------------------- |
| `INACTIVE` | Initial state.                 | No        | `ACTIVE`               |
| `ACTIVE`   | Open for business.             | No        | `CLOSED`               |
| `CLOSED`   | End of Day. Reports generated. | **YES**   | `ACTIVE` (New Session) |

## 4. Operation Status (`Tenant`)

**Source of Truth:** `gm_restaurants.operation_status`

| Status      | Meaning                              | Effect                        |
| ----------- | ------------------------------------ | ----------------------------- |
| `active`    | Normal business.                     | Full Access                   |
| `paused`    | Temporarily stopped (e.g. Holidays). | Blocked Orders. Admin OK.     |
| `suspended` | Billing issue or ban.                | Blocked All (except Billing). |

## 5. Casing Law

- **Typescript/JSON:** ALWAYS `UPPERCASE` (e.g., `ORDER.status === 'PAID'`).
- **Database (Postgres):** `text` columns. Recommendation: Use `UPPERCASE` stored values to match code.
- **Legacy:** If DB has lowercase, `CoreRepo` MUST normalize to Uppercase on read.
