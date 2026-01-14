# Route Manifest
>
> **Status:** LIVING | **Last Audit:** 2026-01-14

This document defines all routes in ChefIApp and their guard requirements.

---

## Route Hierarchy

```
App.tsx
├── L0: Public Routes (no auth)
├── L1: Auth Routes (auth only)
├── L2: Satellite Routes (special gate)
└── L3: Sovereign /app/* (full gate chain)
```

---

## 🟢 PUBLIC ROUTES (No Gate Required)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `LandingPage` | Marketing |
| `/health` | `HealthCheckPage` | System health |
| `/auth` | `AuthPage` | Login/Signup |
| `/public/*` | `PublicPages` | Public menus |
| `/read/*` | `ReaderLayout` | Content hub |
| `/join` | `ScreenInviteCode` | Staff invite |

**Status:** ✅ Correct - No gate needed

---

## 🟡 ONBOARDING ROUTES (Auth, No Tenant)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/onboarding/*` | `OnboardingWizard` | New user setup |
| `/activation` | `ActivationPage` | Tenant activation |
| `/bootstrap` | `BootstrapPage` | System init |
| `/migration/wizard` | `MigrationWizard` | Data migration |

**Status:** ✅ Correct - Auth required, tenant optional

---

## 🔴 SOVEREIGN /app/* ROUTES (Full Gate Chain)

**Required Guard Chain:**

```
FlowGate → TenantProvider → AppDomainWrapper → OperationGate
```

| Route | Component | Guard | Status |
|-------|-----------|-------|--------|
| `/app/dashboard` | `DashboardZero` | GuardTool:- | ✅ |
| `/app/tpv` | `TPV` | GuardTool:tpv | ✅ |
| `/app/kds` | `KDS` | GuardTool:kds | ✅ |
| `/app/menu` | `MenuManager` | GuardTool:menu | ✅ |
| `/app/orders` | `PulseList` | GuardTool:orders | ✅ |
| `/app/staff` | `StaffModule` | GuardTool:staff | ✅ |
| `/app/settings` | `Settings` | - | ✅ |
| `/app/team` | `StaffPage` | - | ✅ |
| `/app/reports/*` | Various | - | ✅ |
| `/app/select-tenant` | `SelectTenantPage` | Before OperationGate | ✅ |
| `/app/access-denied` | `AccessDeniedPage` | Before OperationGate | ✅ |

**Status:** ✅ All /app/* routes properly guarded

---

## ⚠️ SATELLITE ROUTES (Special Handling)

### `/kds/:restaurantId` (KDS Standalone)

```tsx
<Route path="/kds/:restaurantId" element={<KDSStandalone />} />
```

| Guard | Status | Reason |
|-------|--------|--------|
| FlowGate | ❌ Bypassed | By design - kiosk mode |
| TenantProvider | ❌ N/A | Uses URL param |
| Auth | ⚠️ None | **RISK: Public access** |

**Verdict:** ⚠️ INTENTIONAL BYPASS - KDS is designed for unauthenticated kiosk use.
Tenant comes from URL param, not session.

**Recommendation:** Document this as intentional. Consider adding shared secret validation.

---

### `/staff/*` (Root Level Staff)

```tsx
<Route path="staff/*" element={<StaffModule />} />
```

| Guard | Status |
|-------|--------|
| FlowGate | ❌ Missing |
| TenantProvider | ❌ Missing |
| AppDomainWrapper | ❌ Missing |

**Verdict:** ⚠️ POTENTIAL ISSUE - Staff module at root bypasses all gates.

**Recommendation:** Remove or protect. Staff is already at `/app/staff` with full guards.

---

## 🔧 DEV ROUTES

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dev/wizard` | `WizardPage` | Internal dev tool |
| `/wizard` | Redirect → `/dev/wizard` | Legacy |

**Status:** ✅ Internal only

---

## 🔀 LEGACY REDIRECTS

| Old Route | New Route |
|-----------|-----------|
| `/login` | `/auth` |
| `/signup` | `/auth` |
| `/start` | `/onboarding/start` |
| `/dashboard` | `/app/dashboard` |
| `/tpv` | `/app/tpv` |
| `/kds` | `/app/kds` |
| `/menu` | `/app/menu` |
| `/pulses` | `/app/orders` |

**Status:** ✅ Correct - Maintains backward compatibility

---

## 🛑 ISSUES DETECTED

### Issue 1: Orphan Route `/staff/*` (Root Level)

**Location:** `App.tsx:154-160`
**Problem:** Staff module accessible without any gates
**Solution:** Remove route (duplicate of `/app/staff`)

```diff
- <Route path="staff/*" element={...} />
```

### Issue 2: KDS Standalone Unauthenticated

**Location:** `App.tsx:131-142`
**Problem:** Anyone with URL can access KDS
**Status:** INTENTIONAL (kiosk mode)
**Mitigation:** Consider adding shared secret param

---

## ✅ ROUTE AUDIT VERDICT

| Check | Status |
|-------|--------|
| /app/* has FlowGate | ✅ |
| /app/* has TenantProvider | ✅ |
| /app/* has AppDomainWrapper | ✅ |
| /app/* has OperationGate | ✅ |
| No phantom routes | ✅ |
| No orphan routes | ⚠️ 1 (staff/*) |
| No illegitimate access | ⚠️ 1 (KDS intentional) |

**Overall:** ✅ READY (with 1 minor cleanup)
