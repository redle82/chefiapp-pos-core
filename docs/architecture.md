# ChefIApp POS Core — Architecture

## Overview

ChefIApp is a modern POS (Point of Sale) system built for restaurants, featuring:

- **TPV Central**: Main terminal for cashiers/managers
- **Waiter App**: Mobile-optimized interface for servers
- **KDS**: Kitchen Display System
- **Owner Dashboard**: Analytics and management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| State | React Context + Custom Hooks |
| Sync | IndexedDB + Offline Queue |
| Payments | Stripe Connect |
| Fiscal | AT Portugal (SAF-T) |

## Core Modules

```
merchant-portal/src/
├── core/
│   ├── context/        # Context Engine (role-based UI)
│   ├── sync/           # SyncEngine (offline-first)
│   ├── fiscal/         # AT Portugal integration
│   ├── tpv/            # TPV Central Events
│   ├── kernel/         # State Machine
│   └── governance/     # DbWriteGate, permissions
├── pages/
│   ├── TPV/            # Point of Sale (52 components)
│   ├── Waiter/         # Mobile waiter interface
│   ├── Dashboard/      # Owner analytics
│   └── ...
└── ui/
    └── design-system/  # Cytoplasm tokens & components
```

## Data Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │───▶│   Supabase   │───▶│   Postgres   │
│  (React+TS)  │◀───│  (Auth+RPC)  │◀───│   (RLS)      │
└──────────────┘    └──────────────┘    └──────────────┘
       │                                        │
       ▼                                        ▼
┌──────────────┐                        ┌──────────────┐
│  IndexedDB   │                        │ Edge Funcs   │
│ (Offline Q)  │                        │ (Stripe/AT)  │
└──────────────┘                        └──────────────┘
```

## Key Concepts

### Context Engine

Role-based UI that adapts to `owner | manager | waiter | kitchen`:

- Filters sidebar modules
- Guards sensitive actions (cash drawer, cancellations)
- "View As" mode for owners

### SyncEngine

Offline-first architecture:

- Queue persisted in IndexedDB
- Exponential retry with jitter
- Last-Write-Wins conflict resolution

### Turn Sessions

Operational modes for TPV:

- **Tower**: Full command mode
- **Rush**: Speed-optimized UI
- **Training**: Safe simulation mode

## Database Schema

Key tables:

- `gm_restaurants` - Tenant data
- `gm_orders` + `gm_order_items` - Orders
- `gm_payments` - Payment records
- `gm_fiscal_queue` - AT Portugal invoices
- `turn_sessions` - Operational contexts
- `daily_closings` - Z-Reports

See migrations in `supabase/migrations/`.
