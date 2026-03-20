# ChefIApp OS -- Architecture

> Canonical architecture document for the ChefIApp merchant-portal.
> Last updated: 2026-03-20

## System Overview

ChefIApp OS is a multi-surface restaurant operating system built as a single
React 19 SPA that serves six distinct user interfaces from one codebase.
The system is designed offline-first, multi-tenant, and multi-locale.

**Stack:** React 19 + Vite + TypeScript 5.9 + Tailwind CSS 4 + Supabase + Capacitor 8

---

## Architecture Layers

### 1. Interface Layer (6 Surfaces)

| Surface | Path | Purpose |
|---------|------|---------|
| **TPV/POS** | `pages/TPVMinimal/` | Point-of-sale terminal for cashiers |
| **KDS** | `pages/KDSMinimal/`, `features/kds-desktop/`, `features/kds-mobile/` | Kitchen display system (desktop + mobile) |
| **Admin** | `features/admin/` | Restaurant management dashboard (lazy-loaded) |
| **AppStaff** | `pages/AppStaff/` | Mobile staff app (Capacitor) |
| **QR Ordering** | `pages/CustomerMenu/` | Customer self-ordering via QR code |
| **Reservation Portal** | `features/reservations/` | Public booking interface |

Each surface is route-isolated and code-split. The router configuration lives in
`routes/` with `OperationalRoutes.tsx`, `MarketingRoutes.tsx`, and
`modules/AdminRoutes.tsx`.

### 2. Application Layer

Services that orchestrate use-cases across the domain. These live in `core/`
and are consumed by pages and features through hooks and contexts.

| Service | Location | Responsibility |
|---------|----------|----------------|
| OrderLifecycle | `core/orders/` | Order creation, status transitions, QuickOrderService |
| PaymentBroker | `core/payment/` | Orchestrates payment flow, tip, webhook reconciliation |
| SyncEngine | `core/sync/SyncEngine.ts` | Offline queue, conflict resolution, flush on reconnect |
| ShiftService | `core/shift/` | Clock in/out, breaks, shift closures |
| ReservationEngine | `core/reservations/ReservationEngine.ts` | Booking lifecycle |
| DiscountService | `core/discounts/` | Discount rules, coupons, promotions |
| EmailService | `infra/docker-core/` | Email via Docker Core RPC |
| PushNotifications | `core/notifications/` | Browser Notification API, channels |
| PrintService | `core/printing/PrintService.ts` | ESC/POS thermal printing |
| LoyaltyPointsService | `core/loyalty/` | Points accrual, redemption |
| CampaignService | `core/marketing/` | Campaign templates, scheduler |

### 3. Domain Layer (Bounded Contexts)

Pure TypeScript -- no React, no I/O. Lives in `domain/` with invariants as
pure functions in `domain/invariants/`.

| Bounded Context | Invariants File | Key Concepts |
|-----------------|-----------------|--------------|
| **Order Management** | `OrderInvariants.ts` | Order lifecycle, line items, status machine |
| **Payments** | `PaymentInvariants.ts` | Payment validation, split payments, refunds |
| **Floor & Service** | -- | Tables, zones, floor plan editor |
| **Kitchen Operations** | `domain/kitchen/` | Stations, routing, prep timers |
| **Staff & Shifts** | `StaffInvariants.ts` | Roles, clock events, break rules |
| **Catalog & Pricing** | `domain/menu/` | Products, categories, modifiers, VAT |
| **Inventory** | `InventoryInvariants.ts` | Stock levels, waste tracking, alerts |
| **Reservations & Guests** | `ReservationInvariants.ts` | Booking slots, capacity, no-shows |
| **CRM & Loyalty** | `core/customers/`, `core/loyalty/` | Segments, campaigns, points |
| **Fiscal & Compliance** | `core/fiscal/` | SAF-T PT, ATCUD, GDPR, receipts |

**Dependency rule:** `domain/` never imports from React, `core/`, `infra/`, or
any UI code. Features import from domain, never the reverse.

### 4. Data Layer

| Store | Purpose | Location |
|-------|---------|----------|
| **Supabase (PostgreSQL)** | Cloud persistence, realtime subscriptions | `core/supabase/` |
| **Docker Core (PostgREST)** | Dev/local API, email RPC | `infra/docker-core/` |
| **IndexedDB** | Offline cache, audit trail, consent log | `core/sync/IndexedDBQueue.ts` |
| **Zustand** | Client state (operational KPIs, catalog) | `core/` stores |
| **Context API** | Auth, tenant, shift, runtime | `context/` |

Database types are generated in `types/database.types.ts`.
Zod validation schemas live in `infra/schemas/`.
Read/write adapters are separated in `infra/readers/` and `infra/writers/`.

### 5. Infrastructure Layer

| Integration | Mechanism | Location |
|-------------|-----------|----------|
| **Stripe** | Payment provider adapter | `infra/payments/providers/stripe.ts` |
| **Stripe Terminal** | In-person card reader | `infra/payments/providers/stripeTerminal.ts` |
| **MBWay** | Portuguese mobile payment | `infra/payments/providers/mbway.ts` |
| **SumUp** | Card terminal + reader | `infra/payments/providers/sumup.ts`, `sumupReader.ts` |
| **PIX** | Brazilian instant payment | `infra/payments/providers/pix.ts` |
| **Cash/Manual** | Manual settlement | `infra/payments/providers/manual.ts` |
| **ESC/POS Printing** | WebUSB thermal printer | `core/printing/EscPosDriver.ts`, `WebUSBTransport.ts` |
| **Desktop Print Agent** | Native print bridge | `core/print/DesktopPrintAgentApi.ts` |
| **Label Engine** | Label printing | `core/print/LabelEngineApi.ts` |
| **Delivery** | GloriaFood, Deliveroo adapters | `integrations/adapters/`, `modules/delivery/` |
| **Capacitor** | Native mobile shell | Root capacitor config |

All payment providers implement a common `PaymentProvider` interface defined in
`infra/payments/interface.ts` and are resolved through `infra/payments/registry.ts`.

### 6. Sync & Offline Layer

Located in `core/sync/`.

- **SyncEngine** (`SyncEngine.ts`) -- central coordinator for offline operations
- **IndexedDBQueue** (`IndexedDBQueue.ts`) -- durable write queue
- **ConflictResolver** (`ConflictResolver.ts`) -- server-wins resolution strategy
- **ConnectivityService** (`ConnectivityService.ts`) -- online/offline detection
- **RetryStrategy** (`RetryStrategy.ts`) -- exponential backoff for failed syncs
- **OfflineOrderStore** (`OfflineOrderStore.ts`) -- orders created while offline
- **OfflineSyncBridge** (`OfflineSyncBridge.ts`) -- bridge between queue and API

Hooks: `useConnectivity`, `useOfflineOrders`, `useOfflineQueue`,
`useOfflineReconciler`, `useNetworkStatus`.

**Strategy:** Network-first for API calls, cache-first for assets.
Conflict resolution: server wins (last-write-wins with server timestamp).

### 7. Security Layer

| Mechanism | Location | Details |
|-----------|----------|---------|
| **Authentication** | `core/auth/` | Supabase Auth (JWT), session management |
| **RLS** | Supabase policies | `restaurant_id` scoping on all tables |
| **RBAC** | `core/security/RBACService.ts` | 5 roles x 8 actions x 11 resources |
| **Advanced Security** | `core/security/AdvancedSecurityService.ts` | Threat detection, audit |
| **Capability Matrix** | `core/auth/CapabilityMatrix.ts` | Plan-based feature gating |
| **Device Permissions** | `core/permissions/DeviceMatrix.ts` | Per-device access control |
| **Guard UI** | `core/permissions/GuardTool.tsx` | ProtectedAction component |
| **GDPR/Privacy** | `core/privacy/` | Consent log, data export, erasure |

### 8. Observability

Located in `core/monitoring/` and `core/health/`.

| Component | File | Purpose |
|-----------|------|---------|
| **HealthCheckService** | `HealthCheckService.ts` | 5 health checks (DB, auth, sync, API, ws) |
| **HealthEngine** | `core/health/HealthEngine.ts` | Restaurant health scoring |
| **MetricsCollector** | `MetricsCollector.ts` | Counters, gauges, timing histograms |
| **AlertRules** | `AlertRules.ts` | 5 alert conditions with cooldown |
| **AlertService** | `AlertService.ts` | Alert dispatch and notification |
| **StructuredLogger** | `structuredLogger.ts` | JSON logs with traceId |
| **ErrorBoundaryMonitor** | `ErrorBoundaryMonitor.ts` | React error boundary tracking |
| **PerformanceMonitor** | `performanceMonitor.ts` | Core Web Vitals, LCP, FID, CLS |
| **Sentry** | Integration | Error tracking in production |

Stores for observability data: `core/observability/errorsStore.ts`,
`core/observability/latencyStore.ts`.

### 9. Release & Quality

CI workflows in `.github/workflows/`:

| Gate | Workflow | Purpose |
|------|----------|---------|
| **Typecheck** | `ci.yml` | `tsc --noEmit` |
| **Lint** | `ci.yml` | ESLint |
| **Build** | `ci.yml` | Vite production build |
| **Test** | `ci.yml` | Vitest suite |
| **Contract** | `contract-gate.yml` | Domain contract validation |
| **Architecture** | `architecture-guardian.yml` | Dependency rule enforcement |
| **UI Guardrails** | `ui-guardrails.yml` | Design system compliance |
| **Canon** | `canon-enforcement.yml` | Canonical structure checks |
| **Truth** | `truth-gate.yml` | Source-of-truth validation |
| **Deploy** | `deploy.yml` | Production deployment |

Pre-commit: typecheck hook.

### 10. i18n

- **20 namespaces**: analytics, common, config, customer-menu, customers,
  dashboard, kds, labels, onboarding, operational, privacy, pwa, receipt,
  reservations, shift, sidebar, tables, tips, tpv, waiter
- **4 locales**: `pt-PT`, `pt-BR`, `en`, `es`
- **Country configs**: `core/config/CountryConfig.ts` (PT, ES, BR, IT, FR, DE, GB, US)
- **Framework**: react-i18next with namespace lazy loading

---

## Directory Structure

```
merchant-portal/
├── src/
│   ├── app/                 # Bootstrap, global providers, app shell
│   ├── domain/              # Pure domain logic (no React, no I/O)
│   │   ├── invariants/      # OrderInvariants, PaymentInvariants, etc.
│   │   ├── order/           # Order calculations, status helpers
│   │   ├── payment/         # Payment calculations, validation
│   │   ├── kitchen/         # Prep time, timer states
│   │   ├── menu/            # Catalog pricing, modifiers
│   │   ├── restaurant/      # Identity, location validation
│   │   ├── shift/           # Shift rules
│   │   ├── reports/         # Aggregation, formatting
│   │   ├── tenant/          # Multi-tenant helpers
│   │   └── events/          # Domain events
│   │
│   ├── core/                # Application services (~60 subdomains)
│   │   ├── auth/            # Authentication, session, capabilities
│   │   ├── orders/          # Order lifecycle, QuickOrderService
│   │   ├── payment/         # PaymentBroker, tips, webhooks
│   │   ├── shift/           # ShiftService, clock events
│   │   ├── sync/            # SyncEngine, IndexedDB, offline
│   │   ├── printing/        # ESC/POS, PrintService, templates
│   │   ├── print/           # Print queue, desktop agent, labels
│   │   ├── fiscal/          # SAF-T, ATCUD, tax
│   │   ├── monitoring/      # Health checks, metrics, alerts, logger
│   │   ├── health/          # Health engine, scoring, gating
│   │   ├── security/        # RBAC, advanced security
│   │   ├── permissions/     # Device matrix, guard UI
│   │   ├── privacy/         # GDPR, consent, erasure
│   │   ├── notifications/   # Push, email channels
│   │   ├── reservations/    # ReservationEngine
│   │   ├── catalog/         # Product catalog service
│   │   ├── inventory/       # Stock management
│   │   ├── discounts/       # Discount rules, coupons
│   │   ├── loyalty/         # Loyalty points
│   │   ├── marketing/       # Campaigns, templates
│   │   ├── customers/       # CRM service
│   │   ├── analytics/       # Advanced analytics
│   │   ├── config/          # Country config, currency
│   │   ├── i18n/            # i18n utilities
│   │   ├── supabase/        # Supabase client, realtime
│   │   ├── kitchen/         # Kitchen load, prep timers
│   │   ├── receipt/         # Receipt history, persistence
│   │   ├── export/          # PDF/Excel/CSV generation
│   │   ├── stripe-connect/  # Marketplace model
│   │   ├── multi-location/  # Multi-restaurant management
│   │   ├── pwa/             # Service worker, install prompt
│   │   └── a11y/            # Accessibility utilities
│   │
│   ├── features/            # Feature modules (lazy-loaded)
│   │   ├── admin/           # Admin dashboard (analytics, catalog, CRM, etc.)
│   │   ├── tpv/             # TPV feature module
│   │   ├── kds-desktop/     # KDS desktop variant
│   │   ├── kds-mobile/      # KDS mobile variant
│   │   ├── onboarding/      # Restaurant setup wizard
│   │   ├── reservations/    # Reservation portal
│   │   ├── operation/       # Operational views
│   │   ├── schedule/        # Staff scheduling
│   │   ├── pv-mobile/       # Mobile POS variant
│   │   └── auth/            # Auth flows (login, register)
│   │
│   ├── pages/               # Page-level components (route targets)
│   │   ├── TPVMinimal/      # Point of Sale
│   │   ├── KDSMinimal/      # Kitchen Display
│   │   ├── AppStaff/        # Staff mobile app
│   │   ├── CustomerMenu/    # QR ordering
│   │   ├── LandingV2/       # Marketing landing
│   │   ├── Onboarding/      # Setup wizard
│   │   └── Reports/         # Report pages
│   │
│   ├── infra/               # Infrastructure adapters
│   │   ├── docker-core/     # PostgREST client, email RPC
│   │   ├── payments/        # Provider interface, registry, 7 providers
│   │   ├── readers/         # DB read adapters
│   │   ├── writers/         # DB write adapters
│   │   └── schemas/         # Zod validation schemas
│   │
│   ├── ui/                  # Design system
│   │   └── design-system/   # DSButton, DSCard, DSBadge, DSInput, DSModal
│   │
│   ├── integrations/        # Third-party adapters (GloriaFood, Deliveroo)
│   ├── modules/             # Feature modules (delivery)
│   ├── routes/              # Router configuration
│   ├── locales/             # i18n JSON files (20 namespaces x 4 locales)
│   ├── hooks/               # Shared React hooks
│   ├── components/          # Shared UI components (legacy, migrating)
│   ├── context/             # React context providers
│   ├── types/               # Global TypeScript types
│   ├── shared/              # Shared utilities and UI primitives
│   └── runtime/             # Runtime context, dev/stable mode
│
├── docs/                    # Architecture docs, ADRs, strategy
│   ├── adr/                 # Architecture Decision Records
│   ├── ARCHITECTURE.md      # This file (legacy location)
│   └── ...
│
└── .github/workflows/       # CI/CD pipelines
```

---

## Key Contracts

```typescript
// Payment provider interface (infra/payments/interface.ts)
interface PaymentProvider {
  id: string;
  name: string;
  processPayment(amount: number, options: PaymentOptions): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
  isAvailable(): boolean;
}

// Domain invariants (domain/invariants/)
function validateOrderTransition(from: OrderStatus, to: OrderStatus): boolean;
function calculateOrderTotal(items: OrderItem[], discounts: Discount[]): Money;
function canCloseShift(shift: Shift): ValidationResult;
function validateReservation(booking: Booking, capacity: FloorPlan): ValidationResult;

// Sync contract (core/sync/types.ts)
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}
```

---

## Data Flow

```
User Action (tap/click)
  -> Page Component (pages/ or features/)
    -> React Hook (hooks/ or context/)
      -> Application Service (core/)
        -> Domain Validation (domain/invariants/)
        -> Infrastructure Adapter (infra/)
          -> Supabase / Docker Core (PostgreSQL)
            -> RLS filters by restaurant_id
              -> Response bubbles back up

Offline path:
  User Action -> Service -> SyncEngine -> IndexedDB Queue
    ... network restored ...
  SyncEngine -> ConflictResolver -> Infrastructure -> PostgreSQL
```

---

## Known Legacy

Some `core/` subdirectories carry abstract names from early development
(sovereignty, ritual, pulse, kernel, guardian, blueprint, gate, governance).
These are functional but are being gradually consolidated into clearer domain
boundaries. See `docs/MIGRATION.md` for the ongoing plan.
