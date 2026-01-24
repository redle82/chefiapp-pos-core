# PRODUCTION READINESS CONTRACT

> **Status:** ACTIVE  
> **Version:** 1.0  
> **Last Updated:** 2026-01-18

---

## 🎯 Purpose

This contract defines the requirements for transitioning ChefIApp POS from **demo mode** to **production mode**. It establishes:

1. What is **FORBIDDEN** in production
2. Which services **CANNOT** use mocks
3. The **GO-LIVE** checklist

---

## 🔐 RUNTIME MODE

The system operates in one of two modes:

| Mode | Value | Description |
|------|-------|-------------|
| **Demo** | `demo` | Mocks allowed, data is ephemeral, fiscal is simulated |
| **Production** | `production` | Mocks FORBIDDEN, all operations are real |

### Detection

```typescript
// kernel/RuntimeContext.ts
export type RuntimeMode = 'demo' | 'production';

export const RUNTIME_MODE: RuntimeMode = 
  process.env.VITE_RUNTIME_MODE === 'production' ? 'production' : 'demo';
```

### Enforcement

```typescript
export function assertProduction(serviceName: string): void {
  if (RUNTIME_MODE === 'production') return;
  throw new Error(`[PRODUCTION_VIOLATION] ${serviceName} cannot run in demo mode`);
}

export function assertNoMock(serviceName: string, isMock: boolean): void {
  if (!isMock) return;
  if (RUNTIME_MODE === 'demo') return; // Allowed in demo
  
  // CRITICAL: Crash in production
  console.error(`[FATAL] Mock detected in production: ${serviceName}`);
  throw new Error(`[PRODUCTION_VIOLATION] Mock usage forbidden: ${serviceName}`);
}
```

---

## 🚫 FORBIDDEN IN PRODUCTION

The following patterns are **ILLEGAL** when `runtime.mode === 'production'`:

### 1. Mock Services

| Service | Forbidden Pattern | Required Pattern |
|---------|-------------------|------------------|
| OrderService | `MockOrderService` | `SupabaseOrderService` |
| FiscalService | `ConsoleFiscalAdapter` | `InvoiceXpressAdapter` / `SAFTAdapter` |
| StockService | In-memory arrays | `SupabaseInventoryService` |
| CashRegister | Fake shifts | `gm_shifts` table |

### 2. Fake Data Sources

| Pattern | Replacement |
|---------|-------------|
| `localStorage` orders | Supabase `gm_orders` |
| Hardcoded menu items | Supabase `gm_products` |
| Mock payment intents | Stripe real intents |

### 3. Demo Flags

| Flag | Must Be |
|------|---------|
| `DEV_STABLE_MODE` | `true` (airbag only) |
| `DEMO_PREVIEW` | `false` |
| `MOCK_FISCAL` | `false` |

---

## ✅ SERVICE READINESS CHECKLIST

### TPV (Point of Sale)

| Requirement | Status | Validation |
|-------------|--------|------------|
| Creates orders in `gm_orders` | ⬜ | Query DB after sale |
| Deducts stock from `inventory_items` | ⬜ | Check stock levels |
| Emits fiscal document (InvoiceXpress) | ⬜ | Verify `fiscal_event_store` |
| Prints receipt (real or PDF) | ⬜ | Browser print API |
| Sends event to KDS | ⬜ | Realtime subscription |
| Requires open shift | ⬜ | Block if `active_shift_id` null |

### KDS (Kitchen Display)

| Requirement | Status | Validation |
|-------------|--------|------------|
| Consumes real orders only | ⬜ | No mock order sources |
| Updates order status in DB | ⬜ | Status → `IN_PREP` → `READY` |
| Requires active restaurant | ⬜ | Block if no `restaurant_id` |

### Cash Register (Shifts)

| Requirement | Status | Validation |
|-------------|--------|------------|
| Opens shift in `gm_shifts` | ⬜ | Row created |
| Closes shift with balance | ⬜ | `closed_at` + `closing_balance` |
| Prints shift report | ⬜ | ShiftReceiptGenerator |
| Blocks TPV if closed | ⬜ | TPV shows "Caixa Fechado" |

### Fiscal (InvoiceXpress)

| Requirement | Status | Validation |
|-------------|--------|------------|
| Real API credentials | ⬜ | `gm_restaurants.fiscal_config` |
| Invoice created in InvoiceXpress | ⬜ | Response contains `invoice.id` |
| `fiscal_event_store` updated | ⬜ | Row with `status = REPORTED` |
| QR code / ATCUD generated | ⬜ | Present in receipt |

### Staff App

| Requirement | Status | Validation |
|-------------|--------|------------|
| Real check-in/check-out | ⬜ | `staff_presence` table |
| Tasks linked to real orders | ⬜ | `origin_event_id` → order |
| No demo mode banner | ⬜ | Remove "MODO PREVIEW" |

### Menu (Source of Truth)

| Requirement | Status | Validation |
|-------------|--------|------------|
| Menu created in Painel only | ⬜ | No TPV menu creation |
| TPV consumes `gm_products` | ⬜ | Query from useMenuItems |
| KDS consumes same source | ⬜ | Same product IDs |
| Import (CSV/Excel) functional | ⬜ | Bulk creation works |

---

## 🚀 GO-LIVE CHECKLIST

Before switching to `production` mode:

### Infrastructure

- [ ] Supabase project is on paid tier (or adequate free tier)
- [ ] Environment variables set:
  - [ ] `VITE_RUNTIME_MODE=production`
  - [ ] `VITE_SUPABASE_URL` (production)
  - [ ] `VITE_SUPABASE_ANON_KEY` (production)
- [ ] RLS policies reviewed and enabled

### Fiscal

- [ ] InvoiceXpress account active
- [ ] API credentials in `gm_restaurants.fiscal_config`
- [ ] Test invoice emitted successfully

### Business

- [ ] Restaurant data seeded (name, address, VAT)
- [ ] Menu imported or created
- [ ] At least one operator created
- [ ] Initial stock levels set

### Validation

- [ ] Complete one full cycle:
  1. Open shift
  2. Create order
  3. Pay order
  4. See in KDS
  5. Complete order
  6. Close shift
  7. Print report

---

## 🛡️ DEV_STABLE_MODE (The Airbag)

Even in production, `DEV_STABLE_MODE` remains active as a safety net:

```typescript
// DEV_STABLE_MODE is ALWAYS true
// It doesn't enable mocks — it blocks side-effects during recovery
export const DEV_STABLE_MODE = true;
```

**What it does:**

- Prevents duplicate event emission during replay
- Blocks accidental double-charges
- Logs critical operations

**What it does NOT do:**

- Enable mocks
- Skip validation
- Allow demo data

---

## 📋 AUDIT TRAIL

| Date | Action | By |
|------|--------|-----|
| 2026-01-18 | Contract created | System |

---

> **Next Step:** Implement `RuntimeContext` and add `assertNoMock()` guards to all critical services.
