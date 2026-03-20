# ChefIApp POS Core -- Security Checklist

> Canonical security checklist for the ChefIApp POS platform.
> Review quarterly or before any major release.
>
> Last audited: 2026-03-20

---

## Authentication & Sessions

- [x] JWT validation on all protected API routes (`merchant-portal/api/_lib/auth.ts` -- `verifyAuth()`)
- [x] Token verified via `supabase.auth.getUser(token)` (not just decoded -- avoids expired/revoked tokens)
- [x] Token expiry handled by Supabase Auth SDK (auto-refresh on client)
- [ ] **GAP**: No explicit refresh-token rotation policy enforced on the server side
- [x] Session invalidation on logout (Supabase `signOut()` revokes refresh token)
- [x] Mock auth tokens in dev are clearly distinguishable from real JWTs (tested in `tests/security/auth-security.test.ts`)
- [ ] **GAP**: No bcrypt/argon2 PIN hashing for POS operator PINs -- PINs are plain strings matched in-memory
- [ ] **GAP**: No rate limiting on auth endpoints (Supabase GoTrue handles basic rate limiting, but no custom layer)
- [x] Stolen device incident playbook documented (`docs/ops/INCIDENT_PLAYBOOK_STOLEN_DEVICE.md`)
- [x] Staff member disable/re-enable flow with audit logging (`core/incident/StaffIncidentService.ts`)

## Authorization (RBAC)

- [x] RBAC permission matrix defined (`merchant-portal/src/core/security/RBACService.ts`)
- [x] 5 roles supported: owner, manager, cashier, waiter, kitchen
- [x] O(1) permission lookups via pre-populated cache
- [x] `ProtectedAction` component for UI gating (`components/common/ProtectedAction.tsx`)
- [x] `useRBAC` hook for programmatic checks (`hooks/useRBAC.ts`)
- [x] `requirePermission()` throws `PermissionDeniedError` for imperative guards

### Sensitive Action Matrix

| Action | Required Role | Enforced? | Where |
|---|---|---|---|
| Reopen order | manager/owner | YES | `OrderInvariants.canReopenOrder()`, `OrderUseCases.reopenOrder()` |
| Refund payment | manager/owner | YES | `PaymentInvariants.canRefund()`, `PaymentUseCases.refundPayment()` |
| Cancel PAID order | manager/owner | YES | `OrderInvariants.canCancelOrder()` |
| Edit shift | manager/owner | YES | `ShiftService.updateShift()` (callerRole check) |
| Delete customer data | owner | YES | RBAC matrix: only owner has `delete` on `customers` |
| Export reports | manager/owner | YES | RBAC matrix: `export` on `reports` |
| Apply discount (> 50%) | any (with OPEN order) | **PARTIAL** | `canApplyDiscount` checks amount vs subtotal, but no role-based threshold for large discounts |
| Access admin panel | owner (settings admin) | YES | RBAC matrix: only owner has `admin` on `settings` |
| Manage staff | manager/owner | YES | RBAC matrix: `create/update/delete` on `staff` |
| Configure billing | owner only | YES | RBAC matrix: only owner has billing permissions |

### Gaps Found

- [ ] **GAP**: Discount > 50% does NOT require elevated role -- `canApplyDiscount` only checks amount vs subtotal, not role. Any operator with order modify access can apply large discounts.
- [ ] **GAP**: `ProtectedAction` is only used in `TPVPOSView.tsx` -- most admin pages do not wrap sensitive buttons with it.
- [ ] **GAP**: RBAC is UI-only -- there is no server-side middleware enforcing roles on API routes. RLS handles tenant isolation but not role-based action gating.
- [ ] **GAP**: `ShiftService.updateShift()` accepts `callerRole` as optional -- if omitted, the RBAC check is skipped entirely.

## Data Protection

- [x] RLS enabled on ALL multi-tenant tables (`20260320_rls_hardening.sql` -- comprehensive migration)
- [x] `has_restaurant_access()` function enforces tenant isolation via owner check + member check
- [x] Idempotent migration pattern (drops policies before creating)
- [x] Supabase handles PII encryption at rest
- [x] GDPR consent tracked in `gm_profiles.consent_given_at`
- [x] Customer data deletion via `delete_customer_data` RPC
- [x] Customer data export via `export_customer_data` RPC
- [ ] **GAP**: No PII masking in application logs -- `Logger.error()` may log operator IDs, order details, and error messages that could contain PII
- [ ] **GAP**: No explicit data retention policy enforced (audit logs in IndexedDB grow unbounded)

## API Security

### Webhook Verification

- [x] Stripe webhook: HMAC-SHA256 signature verification with timing-safe comparison (`api/webhooks/stripe.ts`)
- [x] Stripe webhook: 5-minute timestamp staleness check (anti-replay)
- [x] Stripe webhook: Idempotency via `webhook_events` table
- [x] Stripe webhook: Raw body parsing (no body parser interference)
- [x] Delivery webhook: API key validation via headers (`api/webhooks/delivery.ts`)
- [ ] **GAP**: Delivery webhook UberEats uses simple string comparison (`===`) instead of HMAC signature verification
- [ ] **GAP**: Delivery webhook responds 200 before DB insert completes -- if insert fails, platform thinks order was received

### Headers & CORS

- [x] Content-Security-Policy with restrictive defaults (`docker-core/src/middleware/securityHeaders.ts`)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Strict-Transport-Security with preload
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy restricts camera, microphone
- [ ] **GAP**: CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts even in production (comment says "Needed for Vite HMR in dev" but it's the default, not dev-only)
- [ ] **GAP**: Security headers middleware exists in `docker-core` but is not applied in the Vercel API routes (each route must set headers manually)

### Secrets Protection

- [x] Vite only exposes `VITE_*` prefixed env vars to the client bundle
- [x] Smoke test scans build output for leaked `service_role`, `sk_live_`, `sk_test_`, JWT patterns
- [x] `.env.local` and `.env.production` are gitignored
- [ ] **GAP**: `.env.production` file exists in the repo (should verify it contains only template/non-secret values)
- [ ] **GAP**: No CI gate that runs the secrets scan automatically on every build

### Rate Limiting

- [x] In-memory rate limiter exists (`api/_lib/rateLimit.ts`)
- [ ] **GAP**: Rate limiter is in-memory only -- resets on each serverless cold start. Not effective for real abuse prevention.
- [ ] **GAP**: Rate limiter is defined but not confirmed to be applied to any API route

## Public Surfaces

- [ ] **GAP**: QR ordering surface access control not audited (needs verification that menu endpoint is truly read-only)
- [ ] **GAP**: Reservation portal rate limiting not confirmed
- [x] Privacy policy page accessible (`pages/Legal/PrivacyPolicyPage.tsx`)
- [x] Public routes clearly separated from protected routes (tested in `tests/security/auth-security.test.ts`)
- [x] Route protection logic: unauthenticated users redirected to `/auth` for protected routes

## Fiscal & Compliance

- [x] Audit trail for order reopen (mandatory, with reason) -- `OrderUseCases.reopenOrder()` awaits audit before returning
- [x] Audit trail for order cancellation -- `OrderUseCases.cancelOrder()` logs audit event
- [x] Audit trail for payment refund -- `PaymentUseCases.refundPayment()` logs audit event
- [x] Audit trail for discount application -- `OrderUseCases.applyDiscount()` logs audit event
- [x] Audit trail for receipt reprint -- `AuditService` supports `RECEIPT_REPRINTED` action
- [ ] **GAP**: Audit log stored in client-side IndexedDB only -- can be cleared by the user. No server-side immutable audit log.
- [ ] **GAP**: No receipt log immutability enforcement (no DB constraint preventing UPDATE/DELETE on receipt records)
- [ ] **GAP**: Refund not verified to be linked to original payment at the DB level (linked at application level only)
- [ ] **GAP**: SAF-T export completeness not verified against required field spec

## Summary of Critical Gaps

| Priority | Gap | Risk |
|---|---|---|
| **P0** | Audit log in IndexedDB only (client-side, deletable) | Fiscal compliance failure -- audit trail can be erased |
| **P0** | CSP allows unsafe-inline/unsafe-eval in production | XSS attack surface |
| **P0** | RBAC is UI-only, no server-side enforcement | Operator could bypass role checks via API calls |
| **P1** | No role check for large discounts (> 50%) | Staff fraud: waiter applies 99% discount |
| **P1** | ProtectedAction used in only 1 page | Sensitive actions exposed in admin pages |
| **P1** | ShiftService.updateShift callerRole is optional | Shift editing bypasses RBAC if role not passed |
| **P1** | In-memory rate limiter resets on cold start | Brute force possible |
| **P2** | No PII masking in logs | GDPR exposure risk |
| **P2** | Delivery webhook responds 200 before DB write | Lost delivery orders |
| **P2** | No CI gate for secrets scan | Regression risk |

---

**Next review due**: 2026-06-20
