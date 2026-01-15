# Delivery Integration (Air-Gap)
>
> **Secure External Connectivity Protocol**

This document defines how ChefIApp connects to external delivery platforms (Glovo, UberEats) without leaking secrets to the client.

## 1. The Architecture

**Goal:** Zero Trust in Client.

- **Client (Browser/App):** NEVER holds API Keys.
- **Edge Function (`delivery-proxy`):** The **Only** entity allowed to talk to external APIs.
- **Vault (`gm_integration_secrets`):** Encrypted table holding credentials.

## 2. Secrets Vault

**Table:** `gm_integration_secrets`

- **RLS:** `SELECT` = NONE (No public access).
- **Access:** Only via `service_role` key (used by Edge Function).
- **Structure:**
  - `restaurant_id`: Tenant
  - `provider`: 'glovo', 'ubereats'
  - `encrypted_credentials`: AES-256 (handled by backend helper)

## 3. The Proxy Flow

1. **Client** wants to poll orders.
2. **Client** calls `supabase.functions.invoke('delivery-proxy', { action: 'poll' })`.
3. **Edge Function**:
    - Verifies User Auth (JWT).
    - Checks Membership/Owner of `restaurant_id`.
    - Fetches Secrets from Vault.
    - Calls Provider API (e.g. Glovo).
    - Upserts results to `integration_orders` table.
4. **Client** listens to `integration_orders` via Realtime (filtered by Tenant).

## 4. Integration Orders Buffer

**Table:** `integration_orders`

- Acts as a buffer/queue.
- **Status:** `PENDING` -> `ACCEPTED` -> `INJECTED` (into POS).
- **Adapter Logic:** The Frontend Adapter watches this table and injects into `EventExecutor` when approved.

## 5. Security Rules

- **Permissive RLS:** `integration_orders` is readable by Tenant Members.
- **Strict RLS:** `gm_integration_secrets` is **NOT** readable by anyone.
- **Webhook Verify:** Webhooks must strictly verify signatures (HMAC) before trusting data.
