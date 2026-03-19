<p align="center">
  <img src="merchant-portal/public/chefiapp-icon-512.png" alt="ChefIApp" width="120" />
</p>

<h1 align="center">ChefIApp OS</h1>

<p align="center">
  <strong>The restaurant operating system that thinks before you do.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#comparison">vs Competition</a> ·
  <a href="#tech-stack">Tech Stack</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-f59e0b?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/status-production--ready-22c55e?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/tests-26%20passing-22c55e?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/i18n-4%20locales-3b82f6?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/countries-8-8b5cf6?style=flat-square" alt="Countries" />
  <img src="https://img.shields.io/badge/TypeScript-73.5%25-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## What is ChefIApp OS?

ChefIApp is not just a POS. It's a complete **Operational Nervous System** for restaurants — from the first customer reservation to the last receipt of the night, from the kitchen timer to the monthly P&L report.

One system. Three surfaces. Zero compromise.

| Surface | Purpose | Key Features |
|---------|---------|-------------|
| **TPV** (Point of Sale) | Take orders, process payments | 7 payment methods, split bill, tips, discounts, fiscal receipt, ESC/POS printing |
| **KDS** (Kitchen Display) | Manage kitchen flow | Realtime queue, prep timers, station routing (Kitchen/Bar), urgency colors |
| **Admin** | Run the business | 50+ pages, analytics, CRM, inventory, shifts, GDPR, reports |

Plus: **AppStaff** (mobile for waiters), **QR Ordering** (customers scan & order), **Reservation Portal** (public booking).

---

## Features

### Point of Sale (TPV)
- 30+ components, 4 order modes (Dine-in, Counter, Takeaway, Delivery)
- **7 payment providers**: Stripe, MB Way, SumUp, PIX, Cash, Manual, Stripe Terminal
- Split bill (equal / by items / custom), tips, discounts & coupons
- Fiscal receipt with logo, NIF, itemized VAT, ATCUD
- ESC/POS thermal printing (tested with Approx appPOS80 WiFi)
- Email digital receipt
- Customer quick-add with dietary allergy alerts

### Kitchen Display (KDS)
- Realtime order queue via Supabase subscriptions
- Filters by origin: POS, Web, Waiter, QR, App, Delivery
- Dedicated stations: Kitchen, Bar
- Prep timers with countdown and overdue alerts
- Kitchen load indicator (OK / Busy / Overloaded)

### Admin Dashboard
- **50+ routes** across 31 feature domains
- **Analytics**: Boston Matrix for menu, Revenue Heatmap 7x24, Business Dashboard
- **CRM**: Customer segments (New/Regular/VIP/At-risk/Lost), dietary preferences
- **Inventory**: Stock ledger, waste tracking with cost analysis and trends
- **Shifts**: Clock in/out, breaks, timesheet, overtime detection, labor cost
- **Reservations**: Weekly calendar, public portal, waitlist
- **Discounts**: 6 types (%, fixed, BOGO, bundle, employee, loyalty)
- **Reports**: PDF, Excel, CSV export with restaurant branding
- **Privacy**: GDPR consent, data export (Art 15), erasure (Art 17)

### Payments & Finance
| Provider | Refunds | Status Polling | Cached |
|----------|---------|----------------|--------|
| Stripe (Card) | Full + Partial | Yes | 5s/60s TTL |
| Stripe Terminal | Yes | Yes | Yes |
| MB Way | Full + Partial | Yes | 5s/60s TTL |
| SumUp | Full + Partial | Yes | 5s/60s TTL |
| PIX | Full + Partial | Yes | 5s/60s TTL |
| Cash | N/A | N/A | N/A |
| Manual | N/A | N/A | N/A |

- Webhook reconciliation (idempotent, auto-fix mismatches)
- Stripe Connect marketplace model (platform fees, payouts)

### Multi-Location
- Location switcher in header
- Consolidated dashboard (revenue, orders across locations)
- Stock transfer between locations
- Menu copy/clone

### Customer Engagement
- **QR Ordering**: Public menu at `/order/:restaurantId`, mobile-first, no auth
- **Reservation Portal**: Public at `/reserve/:restaurantId`
- **Loyalty Points**: Earn/redeem, configurable ratios, public loyalty card
- **Marketing Campaigns**: Welcome, win-back, birthday, promotions, feedback
- **Email**: Receipt, order confirmation, reservation confirmation, staff alerts

### Compliance & Security
- **GDPR**: Consent service, cookie banner with DNT, data export/erasure
- **Fiscal**: SAF-T (PT), TicketBAI (ES) preparation, ATCUD on receipts
- **Security**: Rate limiting, security headers (CSP, HSTS, X-Frame-Options)
- **Audit**: Immutable audit trail for orders, payments, refunds, reopens
- **Privacy Policy**: Public page with 13 sections

### Technical Excellence
- **PWA**: Offline-first with service worker, install prompt, offline indicator
- **Accessibility**: WCAG 2.1 — skip links, focus trap, keyboard navigation, ARIA
- **i18n**: 23 namespaces x 4 locales (PT-PT, PT-BR, EN, ES)
- **Multi-country**: 8 countries (PT, ES, BR, IT, FR, DE, GB, US) with VAT, timezone, currency
- **Push Notifications**: 12 channels by role, browser Notification API, Web Audio sound

---

## Architecture

```
chefiapp-pos-core/
├── merchant-portal/        # React SPA — TPV, KDS, Admin, AppStaff
│   ├── src/
│   │   ├── core/           # Business logic (100+ services & engines)
│   │   ├── features/       # Admin feature modules (31 domains)
│   │   ├── pages/          # Page components (TPV, KDS, AppStaff, etc.)
│   │   ├── infra/          # Supabase, payments, printing, logging
│   │   └── locales/        # i18n (23 namespaces × 4 locales)
│   └── public/             # Static assets, manifest, service worker
├── docker-core/            # Backend — Supabase + PostgREST
│   ├── schema/             # 130+ migrations
│   └── src/middleware/     # Rate limiting, health checks, security
├── core-engine/            # Shared business rules
├── billing-core/           # Stripe subscriptions
├── fiscal-modules/         # SAF-T, TicketBAI
└── docs/                   # Strategy, audits, guides
```

### Key Patterns
- **Offline-first**: SyncEngine with IndexedDB queue, automatic sync
- **Event sourcing**: `orders_event_store` for audit trail
- **Multi-tenant**: RLS on every table via `restaurant_id`
- **Role-based**: Operator → Manager → Owner hierarchy
- **Provider abstraction**: Payment, notification, printing via adapter pattern

---

## Quick Start

```bash
# Clone
git clone https://github.com/redle82/chefiapp-pos-core.git
cd chefiapp-pos-core

# Install
pnpm install

# Start Docker Core (Supabase)
cd docker-core && docker-compose up -d && cd ..

# Start Merchant Portal
pnpm --filter merchant-portal run dev

# Open
open http://localhost:5177/op/tpv
```

### Demo Mode
```
http://localhost:5177/op/tpv?mode=trial
```
No Docker Core needed — uses mock data.

### Run Tests
```bash
cd merchant-portal && npx vitest run
```

---

## Comparison

| Feature | Last.app | SumUp POS | Square | Lightspeed | **ChefIApp** |
|---------|----------|-----------|--------|------------|-------------|
| **Price/month** | €59-149 | 0+1.69% | $0+2.6% | €69-299 | **€39-99** |
| KDS included | Yes | No | +$20 | Yes | **Yes** |
| CRM included | Basic | Basic | +$45 | Yes | **Yes** |
| Waste tracking | No | No | No | No | **Yes** |
| MB Way + PIX | No | No | No | No | **Yes** |
| GDPR compliance UI | No | No | No | No | **Yes** |
| QR + Reservations | Yes/No | No/No | Yes/Partner | Yes/Partner | **Yes/Yes** |
| Multi-country | ES only | EU | Global | Global | **8 countries** |
| Offline PWA | Partial | Partial | iPad | iPad | **Full** |
| Open source | No | No | No | No | **Yes** |

**ChefIApp is the only system that includes everything without paid add-ons.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State | React Context, IndexedDB (offline), Supabase Realtime |
| Backend | Supabase (PostgreSQL + PostgREST + Realtime) |
| Payments | Stripe, MB Way, SumUp, PIX |
| Printing | ESC/POS via WebUSB |
| PWA | Vanilla Service Worker, Web App Manifest |
| i18n | i18next (23 namespaces, 4 locales) |
| Testing | Vitest (26 E2E tests) |
| CI/CD | GitHub Actions, Vercel |
| Monitoring | Sentry |

---

## Project Stats

```
481 files · 87,000+ lines of code
130+ database tables with RLS
100+ services and engines
50+ admin routes across 31 domains
23 i18n namespaces × 4 locales
7 payment providers
26 E2E tests passing
8 countries supported
```

---

## Documentation

| Document | Audience | Time |
|----------|----------|------|
| [ONE_PAGER.md](docs/audit/ONE_PAGER.md) | Owner/Manager | 30s |
| [ONBOARDING.md](ONBOARDING.md) | Developer | 15min |
| [CORE_MANIFESTO.md](CORE_MANIFESTO.md) | Core Developer | 30min |
| [SYSTEM_MAP.html](docs/CHEFIAPP_SYSTEM_MAP.html) | Anyone | Visual |
| [PRODUCT_DOCTRINE.md](docs/CHEFIAPP_PRODUCT_DOCTRINE.md) | Product Team | 10min |

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Follow [conventional commits](https://www.conventionalcommits.org/)
4. Run tests (`npx vitest run`)
5. Create a PR

---

## License

Proprietary. All rights reserved by Goldmonkey Studio.

---

<p align="center">
  Built with care by <a href="https://goldmonkey.studio">Goldmonkey Studio</a>
</p>
