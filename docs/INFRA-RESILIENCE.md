# Infrastructure Resilience Patterns

> How chefiapp-pos-core protects itself against external service failures.

## Overview

Every external integration is wrapped in a combination of three resilience primitives:

| Primitive | Purpose |
|---|---|
| **CircuitBreaker** | Stops calling a service that is consistently failing, preventing cascading failures and giving the service time to recover. |
| **RetryPolicy** | Automatically retries transient failures (network errors, 5xx, timeouts) with exponential backoff and jitter. |
| **TimeoutWrapper** | Enforces a maximum execution time per call, preventing slow services from blocking the system. |

Source files:
- `merchant-portal/src/core/infra/CircuitBreaker.ts`
- `merchant-portal/src/core/infra/RetryPolicy.ts`
- `merchant-portal/src/core/infra/TimeoutWrapper.ts`
- `merchant-portal/src/core/infra/ResilientProvider.ts`

---

## Per-Service Configuration

### Stripe (Card Payments)

| Pattern | Config |
|---|---|
| Circuit Breaker | 5 consecutive failures → OPEN, 30s reset timeout |
| Retry | 3 attempts, exponential backoff (1s base, 2x multiplier) |
| Timeout | 15s |

**`createPayment`**: Full stack (CB + Retry + Timeout).
**`getPaymentStatus`**: Retry + Timeout only (read-only, no circuit breaker).

**Failure mode**: If the circuit opens, payment creation fails immediately with `CircuitBreakerError`. The UI shows an error and the operator can retry manually or switch to another payment method. After 30s the circuit enters HALF_OPEN and allows one test call.

### Supabase (Database)

| Pattern | Config |
|---|---|
| Circuit Breaker | None (database is critical, always attempt) |
| Retry | 3 attempts, linear backoff (1s base, 1x multiplier) |
| Timeout | 5s |

**Failure mode**: Failed writes are queued in IndexedDB by the SyncEngine and retried when connectivity is restored. Read failures surface as degraded state in the health check.

### MB Way (Portugal Payments)

| Pattern | Config |
|---|---|
| Circuit Breaker | 3 consecutive failures → OPEN, 60s reset timeout |
| Retry | None (SIBS has its own retry logic) |
| Timeout | 10s |

**Failure mode**: Circuit opens faster (3 failures) with a longer recovery window (60s) because MB Way failures tend to be service-wide outages. The operator sees an error and can switch to card payment.

### Email Service

| Pattern | Config |
|---|---|
| Circuit Breaker | None |
| Retry | 2 attempts, exponential backoff |
| Timeout | 10s |

**Failure mode**: If email delivery fails after retries, the operation should queue the email for later delivery. Email failure never blocks the order flow.

### ESC/POS Printing

| Pattern | Config |
|---|---|
| Circuit Breaker | None |
| Retry | None (printer errors are usually physical) |
| Timeout | 8s |

**Failure mode**: If the printer times out, the UI shows a print error notification but the order proceeds normally. The operator can retry printing manually from the order detail screen.

### Push Notifications

| Pattern | Config |
|---|---|
| Circuit Breaker | None |
| Retry | None (fire-and-forget) |
| Timeout | 5s |

**Failure mode**: Push failures are silently ignored. They are non-critical notifications that supplement in-app state.

---

## How It Works

### Circuit Breaker States

```
CLOSED ──(failure threshold reached)──> OPEN
  ^                                       |
  |                                       v
  └──(test call succeeds)── HALF_OPEN <──(reset timeout elapsed)
       |
       └──(test call fails)──> OPEN
```

- **CLOSED**: All calls pass through normally.
- **OPEN**: All calls are rejected immediately with `CircuitBreakerError`. No network requests are made.
- **HALF_OPEN**: After `resetTimeoutMs`, the circuit allows `halfOpenRequests` test calls. If they succeed, the circuit closes. If any fail, it reopens.

### Retry Policy

- Only retries on **retriable** errors: network failures, timeouts, 5xx, 429 (rate limit).
- Never retries on **non-retriable** errors: 4xx (bad request, unauthorized, not found), validation errors.
- Uses **exponential backoff with jitter** to prevent thundering herd:
  - Delay = `baseDelay * backoffMultiplier^attempt + random(0, delay * 0.25)`
- Supports **AbortSignal** for cancellation.

### Timeout

- Each service type has a default timeout (see table above).
- Timeout creates a race between the actual call and a timer.
- On timeout, throws `TimeoutError` with service name and duration.
- Optional **fallback value** can be returned instead of throwing.

### Execution Order

When all three are combined, the execution order is:

```
CircuitBreaker → RetryPolicy → Timeout → actual call
```

This means:
1. Circuit breaker rejects immediately if the service is known to be down.
2. If the circuit is closed, the retry policy manages the attempt loop.
3. Each individual attempt within the retry loop is time-bounded.

---

## Monitoring Points

### Health Check Integration

The `HealthCheckService` includes circuit breaker state in its output:

```typescript
const health = await checkAll();
// health.circuitBreakers → array of { name, state, consecutiveFailures, ... }
// health.checks includes a "circuit_breakers" check that is "degraded" if any are OPEN
```

### Key Metrics to Watch

| Metric | Source | Alert Threshold |
|---|---|---|
| Circuit breaker state | `CircuitBreaker.getMetrics()` | Any service in OPEN state |
| Consecutive failures | `CircuitBreaker.getMetrics()` | > 3 for any service |
| Total failure rate | `totalFailures / totalCalls` | > 10% over 5 minutes |
| Service latency | `HealthCheckResult.latencyMs` | > 2x the configured timeout |
| SyncEngine queue depth | `checkSyncEngine()` | > 50 pending items |

### Event Callbacks

Circuit breakers support event callbacks for logging/alerting:

```typescript
const cb = getCircuitBreaker({
  name: "stripe",
  onOpen: (name) => alertOps(`${name} circuit opened`),
  onClose: (name) => logger.info(`${name} recovered`),
  onHalfOpen: (name) => logger.info(`${name} testing recovery`),
});
```

---

## Usage Examples

### Using Pre-configured Providers

```typescript
import { stripeResilient } from "@core/infra/ResilientProvider";

const result = await stripeResilient.execute(() =>
  PaymentBroker.createPaymentIntent(params)
);
```

### Creating a Custom Resilient Provider

```typescript
import { createResilientProvider } from "@core/infra/ResilientProvider";

const myServiceResilient = createResilientProvider("my-service", {
  circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 60_000 },
  retry: { maxRetries: 2, baseDelayMs: 500 },
  timeoutMs: 10_000,
});
```

### Using Primitives Individually

```typescript
import { withRetry } from "@core/infra/RetryPolicy";
import { withTimeout } from "@core/infra/TimeoutWrapper";

// Retry only
const data = await withRetry(() => fetchData(), { maxRetries: 2, label: "fetchData" });

// Timeout only
const result = await withTimeout(() => slowOperation(), 5_000, { serviceName: "slow-op" });
```
