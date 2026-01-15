# Tenancy Kernel Contract
>
> **Strict Enforcement of Tenant Sovereignty in Core Engine**

This document establishes the "Kernel Laws" regarding multi-tenancy.
Violation of these laws defaults to `BLOCK_RELEASE`.

## 1. The Golden Rule of Tenancy

**"No Core Operation shall exist without a defined Tenant Context."**

- **Identity**: Usage of `string` for `tenantId` is prohibited in Kernel interfaces. Use `TenantId` (Branded Type) where possible.
- **Scope**: Every persistence operation, event stream, and repository access is partitioned by `TenantId`.

## 2. Stream Identity (`StreamId`)

The `StreamId` is the definitive address of an entity. It SHALL NOT rely on unique `entityId` to prevent collisions.

**Format:**

```typescript
type StreamId = `${TenantId}:${Entity}:${EntityId}`;
```

**Example:** `bfea-1234:ORDER:uuid-5678`

**Migration Rule:**
Existing streams WITHOUT `TenantId` prefix are considered "Legacy/Global" and must be migrated or treated as `LegacyTenant` (null) for backward compatibility, but strictly monitored.

## 3. Execution Context (The Envelope)

**"No Core Operation shall exist without a verified Execution Context."**

- **Contract:** Defined in `contracts/EXECUTION_CONTEXT_CONTRACT.md`.
- **Enforcement:** `EventExecutor` throws FATAL error if `ctx.tenantId` mismatches or `ctx.lifecycle` is not `ACTIVE`.
- **Binding:** Every Event stores `executionId` in metadata for forensic tracking.

## 4. Executor & Repository Scope

One Executor instance SHALL NOT serve multiple tenants unless it explicitly switches context (reset).

- **Best Practice:** `ExecutorRegistry.get(tenantId)` returns a fresh or cached executor solely for that tenant.
- **Repository:** `InMemoryRepo` must be wiped or effectively isolated when switching tenants. "Global Repo" is forbidden.

## 5. Bootstrapping (Genesis Lock)

The domain cannot initialize (hydrate state, subscribe to events) until `TenantId` is **resolved** and **stable**.

- **App Loading:** `AppDomainWrapper` waits for `TenantProvider` to signal `resolved`.
- **Race Conditions:** Any event received *before* resolution is dropped or buffered, never applied to "null" tenant.

## 5. Security & Isolation

- **Row Level Security (RLS):** DB policies are the final guard. The application code must behave *as if* RLS didn't exist (fail-closed logic), but relying on RLS is mandatory for defense-in-depth.
- **Leaked Subscriptions:** `supabase.channel` MUST include `filter: 'restaurant_id=eq.' + tenantId`. Subscriptions without filters are banned.

---
*Signed: Engineering Audit, Jan 2026*
