# Route Manifest
>
> **Canonical Registry of Application Routes**

Reflects the structure defined in `App.tsx`.

## 1. Public Routes

*Accessible without authentication.*

| Path | Component | Context | Tenant Required | Note |
|------|-----------|---------|-----------------|------|
| `/` | `LandingPage` | Public | No | Marketing Home |
| `/public/*` | `PublicPages` | SovereignBoundary | No | External Menu/Links |
| `/health` | `HealthCheckPage` | None | No | Uptime Monitoring |

## 2. Identity & Onboarding

*Requires Auth (or specifically handles Auth).*

| Path | Component | Gates | Notes |
|------|-----------|-------|-------|
| `/auth` | `AuthPage` | None | Login/Signup entry |
| `/join` | `ScreenInviteCode` | None | Staff Invite Entry |
| `/onboarding/*` | `OnboardingWizard` | Auth | Creation of Restaurant/Profile |
| `/migration/*` | `MigrationWizard` | Auth | Data Import Flow |
| `/activation` | `ActivationPage` | Auth | Subscription/Payment Flow |

## 3. Dedicated/Standalone

*Specialized views running outside the main App Layout.*

| Path | Component | Gates | Notes |
|------|-----------|-------|-------|
| `/kds/:restaurantId` | `KDSStandalone` | None (Token/Auth) | **Kitchen Display**. Optimized for TV. No UI Chrome. |
| `/read/*` | `ReaderLayout` | None | Content Hub / Help Center |

## 4. The Sovereign Runtime (`/app`)

*The Main Application. ALL routes here are protected by the Kernel Chain.*

**Boot Chain:** `FlowGate` → `TenantProvider` → `AppDomainWrapper` → `RequireActivation`.

| Path | Component | Tool Permission | Description |
|------|-----------|-----------------|-------------|
| `/app/dashboard` | `DashboardZero` | None | Main Command Center |
| `/app/select-tenant` | `SelectTenantPage` | None | Switcher (if multi-tenant) |
| `/app/tpv` | `TPV` | `tpv` | Point of Sale Terminal |
| `/app/kds` | `KDS` | `kds` | Kitchen Management (Manager View) |
| `/app/menu` | `MenuManager` | `menu` | Product & Catalog Management |
| `/app/orders` | `PulseList` | `orders` | Live Order Stream |
| `/app/staff` | `StaffModule` | `staff` | Team Management |
| `/app/settings` | `Settings` | `settings` | System Configuration |
| `/app/reports/*` | `Reports` | `reports` | Financial & Operational Data |
| `/app/audit` | `SystemStatusPage` | `admin` | Internal System Health |

## 5. Operation Status Routes

*Validation screens for blocked states.*

| Path | Component | Trigger |
|------|-----------|---------|
| `/app/paused` | `SystemPausedPage` | OperationStatus = 'paused' (Operational Hours) |
| `/app/suspended` | `SystemSuspendedPage` | OperationStatus = 'suspended' (Billing/Risk) |

---
**Verification Rule:**
Any new route added to `App.tsx` MUST be registered here.
Routes inside `/app` MUST NOT be accessible if Tenant is not resolved.

## Related Documentation

- **[Surfaces Architecture](../architecture/SURFACES_ARCHITECTURE.md)** - Complete mapping of surfaces and their responsibilities. Each route belongs to a specific surface (Backoffice, TPV, KDS, Public, etc.).
- **[Architecture Overview](../architecture/ARCHITECTURE_OVERVIEW.md)** - Technical architecture and the 6 Sovereign Blocks.
