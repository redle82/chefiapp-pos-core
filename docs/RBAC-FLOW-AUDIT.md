# RBAC Flow Audit -- ChefIApp POS Core

> Documents every sensitive action, its required role, enforcement location,
> audit logging status, and test coverage.
>
> Audited: 2026-03-20

---

## Permission Matrix Reference

Source: `merchant-portal/src/core/security/RBACService.ts`

Roles: `owner`, `manager`, `cashier`, `waiter`, `kitchen`

---

## Sensitive Actions Audit

### 1. Create Order

| Field | Value |
|---|---|
| **Required role** | waiter, cashier, manager, owner (kitchen cannot) |
| **Where checked** | `RBACService.ts` -- `create` on `orders` (kitchen excluded from matrix) |
| **Use case** | `OrderUseCases.createOrder()` (`merchant-portal/src/application/OrderUseCases.ts:126`) |
| **RBAC enforced in use case?** | NO -- no `requirePermission()` call; relies on UI gating only |
| **Audit logged?** | No (domain event emitted, metrics tracked, but no audit log entry) |
| **Test covered?** | Partial -- `tpv-order-flow.test.ts` tests creation flow, no RBAC denial test |
| **Verdict** | **GAP**: No server/use-case level RBAC check. Kitchen role could create orders if calling the use case directly. |

### 2. Cancel Order

| Field | Value |
|---|---|
| **Required role** | Any role for OPEN/PREPARING; manager/owner for PAID orders |
| **Where checked** | `OrderInvariants.canCancelOrder()` (`merchant-portal/src/domain/invariants/OrderInvariants.ts:77`) |
| **Use case** | `OrderUseCases.cancelOrder()` (`merchant-portal/src/application/OrderUseCases.ts:375`) |
| **RBAC enforced in use case?** | YES -- `canCancelOrder(order, params.role)` checks role for PAID orders |
| **Audit logged?** | YES -- `logAuditEvent({ action: "ORDER_CANCELLED", ... })` |
| **Test covered?** | Partial -- invariant tests exist, no integration test for role denial |
| **Verdict** | OK for PAID orders. Non-PAID orders can be cancelled by any role (acceptable business rule). |

### 3. Reopen Order

| Field | Value |
|---|---|
| **Required role** | manager, owner |
| **Where checked** | `OrderInvariants.canReopenOrder()` (`merchant-portal/src/domain/invariants/OrderInvariants.ts:100`) |
| **Use case** | `OrderUseCases.reopenOrder()` (`merchant-portal/src/application/OrderUseCases.ts:450`) |
| **Additional enforcement** | `reopenOrder()` in `core/orders/reopenOrder.ts:55` -- standalone function with role guard |
| **UI gating** | `TPVPOSView.tsx:1084` -- `hasPermission(operator.role, "reopen", "orders")` |
| **RBAC enforced in use case?** | YES -- `canReopenOrder(order, params.role, params.reason)` |
| **Reason required?** | YES -- empty reason rejected |
| **Audit logged?** | YES -- mandatory `await logAuditEvent()` (not fire-and-forget) |
| **Test covered?** | Invariant tests exist for role check and reason requirement |
| **Verdict** | SOLID -- best-protected action in the codebase. Dual enforcement (invariant + UI), mandatory audit. |

### 4. Process Payment

| Field | Value |
|---|---|
| **Required role** | waiter, cashier, manager, owner |
| **Where checked** | `RBACService.ts` -- `create` on `payments` (kitchen excluded) |
| **Use case** | `PaymentUseCases.processPayment()` (`merchant-portal/src/application/PaymentUseCases.ts:118`) |
| **RBAC enforced in use case?** | NO -- `canProcessPayment()` checks order state only, not operator role |
| **Audit logged?** | No explicit audit log (domain event + metrics only) |
| **Test covered?** | Invariant tests for order state validation |
| **Verdict** | **GAP**: No role check in use case. Kitchen role could process payment if calling the function directly. Audit log missing for financial operations. |

### 5. Refund Payment

| Field | Value |
|---|---|
| **Required role** | manager, owner |
| **Where checked** | `PaymentInvariants.canRefund()` (`merchant-portal/src/domain/invariants/PaymentInvariants.ts:57`) |
| **Use case** | `PaymentUseCases.refundPayment()` (`merchant-portal/src/application/PaymentUseCases.ts:213`) |
| **RBAC enforced in use case?** | YES -- `canRefund(payment, params.role, params.amount)` |
| **Audit logged?** | YES -- `logAuditEvent({ action: "PAYMENT_REFUNDED", ... })` |
| **Test covered?** | Invariant tests for role check and amount validation |
| **Verdict** | SOLID -- role enforced at domain invariant level, audit logged. |

### 6. Apply Discount (> 50%)

| Field | Value |
|---|---|
| **Required role** | SHOULD be manager/owner for large discounts; currently any role with order modify access |
| **Where checked** | `OrderInvariants.canApplyDiscount()` (`merchant-portal/src/domain/invariants/OrderInvariants.ts:139`) |
| **Use case** | `OrderUseCases.applyDiscount()` (`merchant-portal/src/application/OrderUseCases.ts:305`) |
| **RBAC enforced in use case?** | PARTIAL -- role is passed in params but NOT checked against discount amount threshold |
| **Audit logged?** | YES -- `logAuditEvent({ action: "DISCOUNT_APPLIED", ... })` |
| **Test covered?** | Tests exist for amount validation, no test for role-based threshold |
| **Verdict** | **GAP**: No role-based threshold. A waiter can apply a 99% discount. The `canApplyDiscount` function only validates amount <= subtotal, expiry, and max uses. |

### 7. Edit Shift

| Field | Value |
|---|---|
| **Required role** | manager, owner |
| **Where checked** | `ShiftService.updateShift()` (`merchant-portal/src/core/shift/ShiftService.ts:480`) |
| **RBAC enforced?** | CONDITIONAL -- `if (callerRole && !hasPermission(...))` skips check when callerRole is undefined |
| **Audit logged?** | No |
| **Test covered?** | No RBAC test found |
| **Verdict** | **GAP**: `callerRole` parameter is optional. If caller omits it, RBAC check is bypassed entirely. No audit trail for shift edits. |

### 8. Delete Customer

| Field | Value |
|---|---|
| **Required role** | owner |
| **Where checked** | `RBACService.ts` -- only owner has `delete` on `customers` |
| **RBAC enforced in backend?** | Via RLS (tenant isolation) + GDPR `delete_customer_data` RPC |
| **UI gating** | Not confirmed -- no `ProtectedAction` wrapper found for customer deletion |
| **Audit logged?** | Not confirmed at application level |
| **Test covered?** | No |
| **Verdict** | **GAP**: RBAC defined in matrix but no evidence of UI enforcement via `ProtectedAction` or use-case level check. RLS provides tenant isolation but not role-based gating. |

### 9. Export Data (GDPR)

| Field | Value |
|---|---|
| **Required role** | manager, owner (via `export` on `reports`) |
| **Where checked** | `RBACService.ts` -- `export` on `reports` |
| **RBAC enforced?** | UI-level only (no use case found for data export) |
| **Audit logged?** | No |
| **Test covered?** | No |
| **Verdict** | **GAP**: Export permission exists in RBAC matrix but no enforcement found in code. GDPR export is via Supabase RPC (`export_customer_data`) with no role check. |

### 10. Access Admin Settings

| Field | Value |
|---|---|
| **Required role** | owner (admin on settings); manager can read/update settings |
| **Where checked** | `RBACService.ts` -- only owner has `admin` on `settings` |
| **UI gating** | Not confirmed in admin pages |
| **Audit logged?** | No |
| **Test covered?** | No |
| **Verdict** | **GAP**: Permission defined but no `ProtectedAction` wrapper found on admin settings pages. |

### 11. Clock In/Out (Own)

| Field | Value |
|---|---|
| **Required role** | All roles (create on shifts) |
| **Where checked** | `RBACService.ts` -- all roles have `create` on `shifts` |
| **Audit logged?** | No (regular operational action) |
| **Test covered?** | Shift flow tests exist |
| **Verdict** | OK -- all operators can clock in/out for themselves. |

### 12. Clock In/Out (Others)

| Field | Value |
|---|---|
| **Required role** | manager, owner |
| **Where checked** | Not explicitly enforced -- `ShiftService` does not distinguish own vs others |
| **Audit logged?** | No |
| **Test covered?** | No |
| **Verdict** | **GAP**: No distinction between clocking in for yourself vs. another operator. Any role with `create` on `shifts` could potentially clock in for someone else. |

### 13. View Reports

| Field | Value |
|---|---|
| **Required role** | manager, owner |
| **Where checked** | `RBACService.ts` -- `read` on `reports` (only manager/owner) |
| **UI gating** | Not confirmed via `ProtectedAction` |
| **Audit logged?** | No (read-only action) |
| **Test covered?** | No |
| **Verdict** | OK at RBAC matrix level. UI enforcement not confirmed. |

### 14. Manage Staff

| Field | Value |
|---|---|
| **Required role** | manager, owner |
| **Where checked** | `RBACService.ts` -- `create/update/delete` on `staff` |
| **UI gating** | Not confirmed via `ProtectedAction` |
| **Audit logged?** | No (staff disable/enable has audit via incident service) |
| **Test covered?** | No RBAC test |
| **Verdict** | OK at RBAC matrix level. Staff disable/enable has audit trail. Regular staff management lacks audit. |

### 15. Configure Billing

| Field | Value |
|---|---|
| **Required role** | owner |
| **Where checked** | `RBACService.ts` -- only owner has `read/update/admin` on `billing` |
| **UI gating** | Not confirmed via `ProtectedAction` |
| **Audit logged?** | No |
| **Test covered?** | No |
| **Verdict** | OK at RBAC matrix level. Most sensitive financial config is owner-only. UI enforcement not confirmed. |

---

## Summary Matrix

| # | Action | Role Check | Audit Log | Test |
|---|---|---|---|---|
| 1 | Create order | UI only | No | Partial |
| 2 | Cancel order | YES (invariant) | YES | Partial |
| 3 | Reopen order | YES (invariant + UI) | YES (mandatory) | YES |
| 4 | Process payment | NO (state only) | No | Partial |
| 5 | Refund payment | YES (invariant) | YES | Partial |
| 6 | Discount > 50% | NO (no threshold) | YES | No |
| 7 | Edit shift | CONDITIONAL (optional param) | No | No |
| 8 | Delete customer | Matrix only | No | No |
| 9 | Export data (GDPR) | Matrix only | No | No |
| 10 | Admin settings | Matrix only | No | No |
| 11 | Clock in/out (own) | YES | No | Partial |
| 12 | Clock in/out (others) | NO (no distinction) | No | No |
| 13 | View reports | Matrix only | N/A | No |
| 14 | Manage staff | Matrix only | Partial | No |
| 15 | Configure billing | Matrix only | No | No |

**Actions fully protected (role + audit + test)**: 2 of 15 (reopen order, refund payment)
**Actions with role check but missing audit/test**: 2 of 15 (cancel order, clock in own)
**Actions with critical gaps**: 11 of 15

---

## Recommendations

1. **P0**: Add `requirePermission()` calls in ALL use case functions, not just invariants that accept optional role params.
2. **P0**: Make `callerRole` mandatory (not optional) in `ShiftService.updateShift()`.
3. **P1**: Add role-based discount threshold: discounts > 50% require manager/owner.
4. **P1**: Wrap all admin page sensitive buttons with `ProtectedAction`.
5. **P1**: Add server-side RBAC middleware for API routes.
6. **P2**: Add audit logging for payment processing, staff management, and billing changes.
7. **P2**: Add RBAC denial tests for every sensitive action.
8. **P2**: Distinguish own vs. others clock-in in ShiftService.
