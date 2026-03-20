# Merchant Portal — Architecture Guide (LEGACY)

> **Superseded by `merchant-portal/ARCHITECTURE.md`.**
> This file is kept for reference. The canonical version is at the root of merchant-portal.

## Directory Structure

```
src/
├── core/               # Business logic & domain services (~25 domains)
│   ├── auth/           # Authentication, session, permissions
│   ├── identity/       # Restaurant identity (name, logo, NIF)
│   ├── runtime/        # App runtime context, dev/stable mode
│   ├── shift/          # Shift management (clock in/out, breaks, ShiftService)
│   ├── orders/         # Order creation, lifecycle, QuickOrderService
│   ├── payment/        # Payment broker, tip, webhook reconciliation
│   ├── catalog/        # Product catalog, translations
│   ├── inventory/      # Stock management, waste tracking
│   ├── fiscal/         # SAF-T, ATCUD, tax calculation
│   ├── printing/       # ESC/POS, templates, PrintService
│   ├── receipt/        # Receipt history, persistence
│   ├── sync/           # Offline-first queue, SyncEngine
│   ├── notifications/  # Email, push notifications, channels
│   ├── privacy/        # GDPR consent, data export/erasure
│   ├── export/         # PDF/Excel/CSV generation
│   ├── loyalty/        # Loyalty points (LoyaltyPointsService)
│   ├── marketing/      # Campaign service, templates, scheduler
│   ├── customers/      # Customer service (CRM)
│   ├── discounts/      # Discount rules, coupons
│   ├── analytics/      # Advanced analytics service
│   ├── health/         # Restaurant health scoring
│   ├── kitchen/        # Prep timers, kitchen load
│   ├── multi-location/ # Multi-restaurant management
│   ├── stripe-connect/ # Marketplace model
│   ├── a11y/           # Accessibility utilities
│   ├── pwa/            # Service worker, install prompt
│   ├── config/         # Country config, multi-currency
│   └── ...             # Other domains (see below)
│
├── features/           # Admin feature modules (lazy-loaded)
│   └── admin/
│       ├── analytics/  # Boston Matrix, Heatmap, Dashboard
│       ├── catalog/    # Menu management, translations
│       ├── closures/   # Shift closures
│       ├── customers/  # CRM admin UI
│       ├── dashboard/  # Admin sidebar, layout
│       ├── discounts/  # Discount management
│       ├── inventory/  # Waste reports
│       ├── loyalty/    # Loyalty program config
│       ├── marketing/  # Campaign dashboard
│       ├── multi-location/ # Consolidated dashboard
│       ├── orders/     # Order history
│       ├── payments/   # Transactions, payouts, reconciliation
│       ├── privacy/    # GDPR settings
│       ├── promotions/ # Marketing promotions
│       ├── receipts/   # Receipt history
│       ├── reports/    # Sales, operational reports
│       ├── reservas/   # Reservation management
│       ├── shifts/     # Shift dashboard, timesheet
│       ├── tables/     # Floor plan editor
│       └── tips/       # Tip tracking
│
├── pages/              # Page-level components (route targets)
│   ├── TPVMinimal/     # Point of Sale (main operational surface)
│   ├── KDSMinimal/     # Kitchen Display System
│   ├── AppStaff/       # Mobile staff app
│   ├── CustomerMenu/   # QR ordering, loyalty card
│   ├── LandingV2/      # Marketing landing page
│   ├── Blog/           # SEO blog articles
│   ├── Onboarding/     # Restaurant setup wizard
│   └── Reports/        # Report pages
│
├── ui/                 # Design system
│   ├── design-system/
│   │   ├── components/ # DSButton, DSCard, DSBadge, DSInput, DSModal
│   │   ├── tokens.ts   # Colors, spacing, typography
│   │   └── tokens.css  # CSS variables
│   └── RestaurantLogo.tsx
│
├── infra/              # Infrastructure adapters
│   ├── docker-core/    # PostgREST client
│   ├── payments/       # Stripe, MBWay, SumUp, PIX providers
│   ├── readers/        # DB read adapters
│   ├── writers/        # DB write adapters
│   └── schemas/        # Zod validation schemas
│
├── routes/             # Router configuration
│   ├── MarketingRoutes.tsx
│   ├── OperationalRoutes.tsx
│   └── modules/
│       ├── AdminRoutes.tsx
│       └── PublicBootstrapRoutes.tsx
│
├── locales/            # i18n (23 namespaces × 4 locales)
│   ├── en/
│   ├── es/
│   ├── pt-PT/
│   └── pt-BR/
│
├── hooks/              # Shared React hooks
├── components/         # Shared UI components (non-DS)
├── context/            # React contexts
├── domain/             # Domain types
└── integrations/       # Third-party adapters (GloriaFood, Deliveroo)
```

## Data Flow

```
User Action
  → Page Component (pages/)
    → Hook / Context (hooks/, context/)
      → Service (core/)
        → Infrastructure (infra/)
          → Docker Core (PostgREST)
            → PostgreSQL
```

## Key Patterns

- **Offline-first**: SyncEngine queues writes in IndexedDB, flushes when online
- **Multi-tenant**: Every table has `restaurant_id` with RLS
- **Provider pattern**: Payments, notifications, printing use adapter interfaces
- **Event sourcing**: Orders use `orders_event_store` for audit trail
- **Lazy loading**: Admin features are code-split into separate chunks

## Known Legacy

Some `core/` subdirectories contain domain-specific code from early development
phases with abstract names (sovereignty, ritual, pulse, kernel, guardian).
These are functional but could benefit from consolidation into clearer domains
in a future refactoring pass.
