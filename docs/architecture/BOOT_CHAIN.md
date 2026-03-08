# Boot Chain Architecture
>
> **The Deterministic Sequence of Life**

This document describes the exact sequence of events that occurs when a user enters the `/app` runtime.
This sequence is **immutable** and protects the domain from "Quantum State" (undefined tenant/user).

## The Pipeline

User hits `/app/*` -> `Routes` (App.tsx) executes the following nesting:

### 1. FlowGate (`core/flow/FlowGate`)

**Responsibility:** Authentication & Onboarding Router.

- **Check 1:** Is `supabase.auth.session()` valid?
  - If NO -> Redirect `/auth`.
- **Check 2:** Is `profile` complete?
  - If NO -> Redirect `/onboarding`.
- **Side Effects:** Fetches User Profile.

### 2. TenantProvider (`core/tenant/TenantContext`)

**Responsibility:** Tenancy Resolution.

- **Action:** Reads `gm_restaurant_members` for the user.
- **Resolution:**
  - If LastTenant (localStorage) is valid -> Use it.
  - Else if 1 membership -> Auto-select.
  - Else if >1 membership -> Resolve to null (Redirect to `/app/select-tenant`).
- **Output:** `tenantId` is Locked.
- **Blocking:** Renders `Loading...` until resolution is complete.

### 3. AppDomainWrapper (`app/AppDomainWrapper`)

**Responsibility:** Domain Initialization (The "Big Bang").

- **Prerequisite:** `tenantId` MUST be non-null.
- **Actions:**
    1. **Hydrate Stores:** Calls `useStore.hydrate(tenantId)`.
    2. **Connect Realtime:** Establishes `supabase.channel` with `restaurant_id=eq.{tenantId}`.
    3. **Preload Satellites:** Initializes critical caching layers.
- **Contract:** If this component mounts, the **Domain is Live** for that specific Tenant.

### 4. RequireActivation (`core/activation`)

**Responsibility:** Commerce & Billing Gate.

- **Check:** Does `restaurant.subscription` allow access?
- **Action:** If Trial Expired / Payment Failed -> Redirect `/activation`.

### 5. OperationGate (`core/flow/OperationGate`)

**Responsibility:** Operational State Enforcement.

- **Check:** Is `restaurant.operation_status` OK?
  - `PAUSED` -> Redirect `/app/paused`.
  - `SUSPENDED` -> Redirect `/app/suspended`.
- **Override:** Allows access to `Settings` / `Audit` even if suspended (logic dependent).

### 6. The UI (`AppLayout` + Page)

**State:** At this point, the UI renders.

- `useTenant()` is safe.
- `useStore()` is hydrated.
- `useAuth()` is valid.

## Allowable Side Effects

| Gate | Allowed fetch? | Allowed Subscription? | Rebuild State? |
|------|----------------|-----------------------|----------------|
| **FlowGate** | Profile Only | No | No |
| **TenantProvider** | Memberships | No | No |
| **AppDomainWrapper** | **YES** (Domain) | **YES** (Global) | **YES** |
| **Leaf Page** | **YES** (Local) | **YES** (Specific) | No (Consumer) |

## The "Genesis Lock"

The Domain (`AppDomainWrapper`) **NEVER** mounts if `TenantProvider` is loading or failed.
This prevents the "Looping" bug where streams are subscribed with stale/null IDs.
