# Contract Implementation Status

> **Status Reference**: 2026-02-03
> **System State**: SOVEREIGN (Docker Core Primary)

## Core Sovereignty

- [x] **Orders**: `gm_orders` writes restricted to Docker Core (PostgREST). No direct Supabase `insert` from UI. (Verified by `check-supabase-violations.cjs`)
- [x] **Inventory**: Deductions happen via DB triggers (`apply_inventory_deduction`). UI is read-only.
- [x] **Fiscal**: `fiscal_event_store` writes via Core only.
- [x] **Authentication**: Hybrid. Core relies on Supabase Auth (GoTrue) but effectively "Quarantined" in `useSupabaseAuth.ts`. Docker Core connects via `backendAdapter.ts`.

## Interfaces

- [x] **TPV**: Uses `useOperationalReadiness` hook to block access if Core is down.
- [x] **KDS**: Polls/Subscribes to `gm_orders` via Core.
- [x] **Customer Portal**: Reads public menu, submits order to Core RPC (`create_order_atomic`).

## Known Gaps (P2)

- **Auth Page (Docker Mode)**: Currently relies on "Pilot Mode" bypass in tests because Supabase Login UI is hidden/broken without cloud connection.
- **Web Sockets**: Real-time updates in Docker mode rely on polling or local websocket stub (noopChannel).
