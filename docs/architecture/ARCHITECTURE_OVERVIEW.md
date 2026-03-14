# Architecture Overview
> **ChefIApp POS Core — Sovereign System Map**

**Versão:** 1.2.0  
**Atualizado:** 2026-01-24

This document encompasses the official high-level architecture of the system.
It defines the 8 Sovereign Blocks that compose the entire application.

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

### G. Observability Layer (v1.2.0)
**Scope:** Error tracking, performance monitoring, and operational metrics.
- **Components:**
    - `Sentry`: Error tracking across all 3 apps (merchant, customer, mobile).
    - `ErrorBoundary`: React error boundaries with Sentry integration.
    - `Logger`: Centralized logging service with Sentry capture.
    - `useRealtimeMetrics`: Real-time operational dashboard.
- **Features:**
    - Session replay (web portals).
    - Performance tracing.
    - Sourcemap uploads (production builds).
- **Docs:** [`docs/ops/OBSERVABILITY_SETUP.md`](../ops/OBSERVABILITY_SETUP.md)

### H. Growth & Marketing Layer (v1.2.0)
**Scope:** SEO, analytics, and conversion tracking for customer acquisition.
- **Components:**
    - `SEO`: Dynamic meta tags (title, description, Open Graph, Twitter Cards).
    - `Schema.org`: JSON-LD structured data (Restaurant, Menu, Breadcrumbs).
    - `Pixel`: Meta Pixel + Google Analytics/Ads integration.
- **Events Tracked:**
    - Page views, content views, add to cart, initiate checkout, purchases.
- **Constraint:** Only active in customer-facing portal (public-facing). *Nota: o workspace `customer-portal` foi removido em F5.1; esta restrição aplica-se quando/onde o portal do cliente for implementado (ver C42).*
- **Docs:** [`docs/ops/GROWTH_MARKETING_SETUP.md`](../ops/GROWTH_MARKETING_SETUP.md)

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
    
    %% Observability Layer
    Tools -.-> Obs(G. Observability)
    Domain -.-> Obs
    Obs -.-> Sentry[(Sentry)]
    
    %% Growth Layer (Customer Portal only)
    Public -.-> Growth(H. Growth)
    Growth -.-> GA[(Google Analytics)]
    Growth -.-> Meta[(Meta Pixel)]
```

## Layer Summary

| Block | Scope | Key Files |
|-------|-------|-----------|
| A. Public | Unauthenticated pages | `LandingPage`, `PublicPages` |
| B. Identity | Auth + Tenant creation | `/auth`, `/onboarding` |
| C. Kernel | Runtime container | `FlowGate`, `TenantProvider` |
| D. Tools | Business features | `Dashboard`, `TPV`, `KDS` |
| E. Domain | Pure business logic | `EventExecutor`, `EventStore` |
| F. Infra | External services | Supabase, Stripe, Glovo |
| G. Observability | Monitoring | Sentry, Logger, Metrics |
| H. Growth | Marketing | SEO, Schema.org, Pixel |

## Dependency Rules
1. **Public** cannot import **Domain**.
2. **Tools** cannot bypass **Kernel** (must run inside `/app`).
3. **Domain** cannot import **UI/React**.
4. **Infra** is the only one allowed to touch external APIs (Stripe/Glovo).
5. **Observability** can be imported anywhere (cross-cutting concern).
6. **Growth** is restricted to **Public** surface only.

## Related Documentation

### Architecture
- **[Surfaces Architecture](./SURFACES_ARCHITECTURE.md)** - User-facing surfaces mapping
- **[Database Authority](./DATABASE_AUTHORITY.md)** - Database hierarchy and truth
- **[Billing Flow](./BILLING_FLOW.md)** - Stripe integration architecture

### Operations
- **[Observability Setup](../ops/OBSERVABILITY_SETUP.md)** - Sentry + Metrics configuration
- **[Growth Marketing Setup](../ops/GROWTH_MARKETING_SETUP.md)** - SEO + Pixel setup

### Reference
- **[Known Issues](../KNOWN_ISSUES.md)** - Current issues and status
- **[Engineering Constitution](../../ENGINEERING_CONSTITUTION.md)** - Development rules
