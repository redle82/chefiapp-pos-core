# Architecture Overview
> **ChefIApp POS Core — Sovereign System Map**

This document encompasses the official high-level architecture of the system.
It defines the 6 Sovereign Blocks that compose the entire application.

## The 6 Sovereign Blocks

### A. Public Surface
**Scope:** Everything accessible without authentication.
- **Components:** `LandingPage.tsx`, `PublicPages.tsx`, `/health`.
- **Constraint:** ZERO dependency on Operational Domain. Cannot touch `gm_orders` or sensitive data.
- **State:** Stateless (or ephemeral cart in `localStorage`).

### B. Identity & Genesis
**Scope:** Creation of existence and biological links (User → Tenant).
- **Components:** `/auth`, `/onboarding/*`, `/migration/*`, `/join`.
- **Responsibility:**
    1. Authenticate User (Supabase Auth).
    2. Resolve or Create Tenant (Restaurant).
    3. Establish Membership (Owner/Staff).
- **Critical Event:** `TENANT_GENESIS` — The moment a tenant is locked and ready.

### C. Sovereign Runtime (Kernel)
**Scope:** The "Living System" post-login. The container for all operations.
- **Route:** `/app/*`
- **Boot Chain:** `FlowGate` → `TenantProvider` → `AppDomainWrapper` → `RequireActivation`.
- **Responsibility:**
    1. Enforce Tenancy Context (Sovereignty).
    2. Enforce Operation State (Active/Paused/Suspended).
    3. Provide Global Contexts (Theme, FeatureFlags).

### D. Operational Tools (Satellites)
**Scope:** Specific business tools running *inside* the Kernel.
- **Components:** `Dashboard`, `TPV`, `KDS`, `Menu`, `Orders`, `Staff`.
- **Constraint:** Tools are consumers. they DO NOT define tenancy. They must verify permissions via `GuardTool`.
- **Isolation:** Operations should ideally run in isolated tabs/windows for stability (e.g., KDS on a dedicated screen).

### E. Core Domain Engine
**Scope:** The agnostic "Brain" of the system. Pure logic and state transitions.
- **Location:** `core-engine/`, `event-log/`.
- **Components:**
    - `EventExecutor`: State Machine orchestrator.
    - `EventStore`: Append-only log of truth.
    - `Projections`: Read-models (e.g., `InMemoryRepo`).
- **Tenancy Law:** Must strictly adhere to `TENANCY_KERNEL_CONTRACT.md`.
- **Pattern:** Event Sourcing (ES) + CQRS.

### F. Infrastructure & Integrations
**Scope:** The bridge to the physical/external world.
- **Components:**
    - `Supabase`: Database, Auth, Realtime, Edge Functions.
    - `Integrations`: Glovo/UberEats Adapters (`delivery-proxy`).
    - `Security`: `gm_integration_secrets` (Vault).
- **Constraint:** Fail-closed security. Air-gapped secrets.

## System Topology

```mermaid
graph TD
    User --> Public(A. Public Surface)
    User --> Auth(B. Identity & Genesis)
    Auth --> Kernel(C. Sovereign Runtime)
    
    subgraph Kernel [/app]
        TenantProvider --> AppDomainWrapper
        AppDomainWrapper --> Tools(D. Operational Tools)
    end
    
    Tools --> Domain(E. Core Domain Engine)
    Domain --> Infra(F. Infrastructure)
    
    Infra -- Events --> Tools
```

## Dependency Rules
1. **Public** cannot import **Domain**.
2. **Tools** cannot bypass **Kernel** (must run inside `/app`).
3. **Domain** cannot import **UI/React**.
4. **Infra** is the only one allowed to touch external APIs (Stripe/Glovo).

## Related Documentation

- **[Surfaces Architecture](./SURFACES_ARCHITECTURE.md)** - Complete mapping of all user-facing surfaces (Backoffice, TPV, KDS, Public, Staff, etc.) and their responsibilities. This document provides the product/UX perspective, while this document focuses on technical architecture.
- **[Route Manifest](../canon/ROUTE_MANIFEST.md)** - Complete registry of all application routes.
