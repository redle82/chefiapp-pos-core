# OPERATIONAL_PULSE_CONTRACT (Operation Heartbeat)

This contract defines the architectural and operational behavior for real-time terminal liveness tracking in ChefIApp.

## 1. Identity Contract (Client-Side)

- **Persistence**: Every terminal MUST generate a unique `terminalId` (UUID v4) on its first run.
- **Durable Identity**: This ID MUST be stored in `localStorage` under the key `chefiapp_terminal_id`.
- **Statelessness**: The terminal identity is independent of the user session but coupled to the browser/device instance.

## 2. Heartbeat Contract (Signal)

- **Interval**: A pulse MUST be sent every **30 seconds** (`30000ms`).
- **Classification**: Terminals MUST be classified into types:
  - `TPV`: Sale point / Cashier.
  - `KDS`: Kitchen Display.
  - `WAITER`: Staff mobile app.
  - `BACKOFFICE`: Merchant portal management.
  - `ADMIN`: Global administration.
- **Inference**: Terminal type MUST be inferred from the URL context when possible.

## 3. Liveness Thresholds (Server-Side/UI)

- **ONLINE**: `now() - last_heartbeat_at < 60s` (Tolerance of 2 pulse cycles).
- **IDLE/DELAYED**: `60s <= last_heartbeat_at < 5m`.
- **OFFLINE**: `last_heartbeat_at >= 5m` (Or absence of pulse for > 2 cycles in real-time UI).
- **Visualization**:
  - 🟢 **Active**: Liveness verified within the last minute.
  - 🔴 **Offline**: Connectivity lost or app closed.

## 4. Data Contract (Postgres/Supabase)

- **Table**: `gm_terminals`
- **Primary Key**: `id` (UUID) - Enforced client-side to allow idempotent upserts.
- **Audit**: `created_at` and `updated_at` (managed by trigger).
- **Security**: Row Level Security (RLS) MUST be enabled to isolate heartbeat data by `restaurant_id`.

## 5. Integration Contract

- **Global Guard**: The system MUST be injected at the top-level Domain Wrapper.
- **Non-Blocking**: Heartbeat failures SHOULD NOT crash the main application flow (use `try/catch` and silent warnings).

---

_Signed: ChefIApp Engineering Constitution_ 🐒
