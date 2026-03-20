# ADR-001: Offline-First with SyncEngine

## Status

Accepted

## Context

A POS system must continue operating when internet connectivity drops. In
restaurant environments, network outages are common -- Wi-Fi routers fail,
ISPs have downtime, and buildings have dead zones. If the POS stops working,
the restaurant cannot take orders or process payments, directly impacting
revenue.

We needed a strategy that allows all critical operations (order creation,
payment recording, receipt generation) to function without any network
connectivity, with reliable synchronization once the connection is restored.

## Decision

We adopted an offline-first architecture with the following components:

- **IndexedDBQueue** (`core/sync/IndexedDBQueue.ts`) -- a durable queue that
  persists write operations in the browser's IndexedDB. Operations survive
  page refreshes and browser restarts.
- **SyncEngine** (`core/sync/SyncEngine.ts`) -- the central coordinator that
  monitors connectivity, dequeues operations when online, and manages the
  flush lifecycle.
- **ConflictResolver** (`core/sync/ConflictResolver.ts`) -- applies a
  server-wins strategy using server timestamps. When a local write conflicts
  with a server-side change, the server version takes precedence.
- **ConnectivityService** (`core/sync/ConnectivityService.ts`) -- detects
  online/offline state and emits events.
- **RetryStrategy** (`core/sync/RetryStrategy.ts`) -- exponential backoff
  for failed sync attempts.
- **OfflineOrderStore** (`core/sync/OfflineOrderStore.ts`) -- specialized
  store for orders created while offline.

The strategy is network-first for API calls (try server, fall back to cache)
and cache-first for static assets.

## Consequences

**Positive:**
- Zero downtime for order-taking and payment recording during outages
- Staff do not need to know or care whether they are online or offline
- Audit trail is preserved locally even if the server is unreachable
- Graceful degradation -- the system works in varying connectivity conditions

**Negative:**
- Significant complexity in sync logic, conflict resolution, and queue management
- Server-wins resolution can silently discard local changes in rare edge cases
- IndexedDB has browser-specific storage limits and quirks
- Testing offline scenarios requires dedicated tooling (OfflineStressTest)
- Eventual consistency means dashboards may show stale data briefly after reconnect
