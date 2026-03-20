# Structured Logging Guide

This guide defines logging conventions for ChefIApp POS. All application logs use the `StructuredLogger` singleton from `core/monitoring/structuredLogger.ts`, which outputs JSON-formatted entries suitable for log aggregation.

---

## Log Levels

| Level | When to Use | Production | Example |
|---|---|---|---|
| `debug` | Detailed flow tracing, variable dumps during development | Suppressed | "Resolving menu item price for item_id=abc" |
| `info` | Normal operational events, milestones | Suppressed | "Order created successfully" |
| `warn` | Unexpected but recoverable situations | Emitted | "Retry attempt 2/3 for sync push" |
| `error` | Failures that affect a single operation | Emitted | "Payment failed: card_declined" |
| `critical` | System-wide failures requiring immediate attention | Emitted + Alert | "Supabase connection lost, entering offline mode" |

In production, only `warn`, `error`, and `critical` are emitted to reduce noise. Debug and info are suppressed automatically.

---

## Required Fields per Log Level

Every structured log entry automatically includes:

| Field | Source | Description |
|---|---|---|
| `timestamp` | Auto | ISO 8601 timestamp |
| `level` | Caller | Log level |
| `message` | Caller | Human-readable description |
| `traceId` | Auto/Caller | Correlation ID for request tracing |
| `sessionId` | Auto | Browser session identifier |
| `version` | Auto | Application version |

### Additional context by level

**debug/info**: Include domain-specific identifiers.
```typescript
StructuredLogger.info("Order created", {
  orderId: "ord_123",
  restaurantId: "rest_456",
  orderType: "dine_in",
  itemCount: 3,
});
```

**warn**: Include the condition that triggered the warning and any retry state.
```typescript
StructuredLogger.warn("Sync push retry", {
  attempt: 2,
  maxAttempts: 3,
  queueDepth: 12,
  lastError: "NetworkError: Failed to fetch",
});
```

**error**: Include the error message, code, and enough context to reproduce.
```typescript
StructuredLogger.error("Payment processing failed", {
  orderId: "ord_123",
  paymentMethod: "card",
  errorCode: "card_declined",
  stripeDeclineCode: "insufficient_funds",
  amount: 2450, // cents
});
```

**critical**: Include system state and impact assessment.
```typescript
StructuredLogger.fatal("Database connection lost", {
  lastSuccessfulQuery: "2026-03-20T14:30:00Z",
  pendingSyncItems: 47,
  circuitBreakerState: "OPEN",
  offlineMode: true,
});
```

---

## Domain-Specific Log Examples

### Order Domain

```typescript
// Order created
StructuredLogger.info("Order created", {
  orderId: order.id,
  restaurantId: order.restaurant_id,
  tableId: order.table_id,
  orderType: order.type, // dine_in, takeaway, delivery
  itemCount: order.items.length,
  totalCents: order.total,
});

// Order modified (items added/removed)
StructuredLogger.info("Order modified", {
  orderId: order.id,
  action: "item_added", // item_added, item_removed, quantity_changed
  itemId: item.id,
  previousTotal: previousTotal,
  newTotal: order.total,
  operatorId: currentOperator.id,
});

// Order cancelled
StructuredLogger.warn("Order cancelled", {
  orderId: order.id,
  reason: cancelReason,
  operatorId: currentOperator.id,
  hadPayment: order.payment_status !== "unpaid",
  itemCount: order.items.length,
  totalCents: order.total,
});

// Order reopened
StructuredLogger.warn("Order reopened", {
  orderId: order.id,
  previousStatus: "completed",
  operatorId: currentOperator.id,
  reason: "customer_complaint",
});
```

### Payment Domain

```typescript
// Payment initiated
StructuredLogger.info("Payment initiated", {
  orderId: order.id,
  paymentMethod: "card", // card, cash, pix
  amountCents: amount,
  currency: "EUR",
  provider: "stripe",
});

// Payment completed
StructuredLogger.info("Payment completed", {
  orderId: order.id,
  paymentId: payment.id,
  paymentMethod: "card",
  amountCents: amount,
  currency: "EUR",
  provider: "stripe",
  processingTimeMs: duration,
});

// Payment failed
StructuredLogger.error("Payment failed", {
  orderId: order.id,
  paymentMethod: "card",
  errorCode: error.code,
  errorMessage: error.message,
  provider: "stripe",
  amountCents: amount,
});

// Refund processed
StructuredLogger.warn("Refund processed", {
  orderId: order.id,
  refundId: refund.id,
  amountCents: refund.amount,
  reason: refund.reason,
  operatorId: currentOperator.id,
});
```

### Sync Domain

```typescript
// Item queued for sync
StructuredLogger.debug("Sync item queued", {
  tableName: "orders",
  operation: "INSERT",
  recordId: record.id,
  queueDepth: currentQueueDepth,
});

// Sync push completed
StructuredLogger.info("Sync batch pushed", {
  itemCount: batch.length,
  durationMs: duration,
  remainingQueue: remainingCount,
});

// Sync conflict detected
StructuredLogger.warn("Sync conflict detected", {
  tableName: "orders",
  recordId: record.id,
  localVersion: localRecord.updated_at,
  remoteVersion: remoteRecord.updated_at,
  resolution: "server_wins", // server_wins, client_wins, merged
});

// Sync reconciliation
StructuredLogger.info("Sync reconciliation complete", {
  totalChecked: total,
  conflictsResolved: conflicts,
  itemsResynced: resynced,
  durationMs: duration,
});
```

### Auth Domain

```typescript
// Login
StructuredLogger.info("User logged in", {
  operatorId: operator.id,
  role: operator.role,
  method: "pin", // pin, email, google
});

// Logout
StructuredLogger.info("User logged out", {
  operatorId: operator.id,
  sessionDurationMs: Date.now() - sessionStartTime,
});

// Permission denied
StructuredLogger.warn("Permission denied", {
  operatorId: operator.id,
  role: operator.role,
  requiredPermission: "manage_menu",
  route: "/admin/menu-builder",
});
```

### Print Domain

```typescript
// Print job sent
StructuredLogger.debug("Print job sent", {
  jobId: job.id,
  type: "receipt", // receipt, kitchen_ticket, report
  orderId: job.orderId,
  printerModel: printer.model,
});

// Print success
StructuredLogger.info("Print completed", {
  jobId: job.id,
  type: "receipt",
  durationMs: duration,
});

// Print failure
StructuredLogger.error("Print failed", {
  jobId: job.id,
  type: "receipt",
  error: error.message,
  consecutiveFailures: failureCount,
  printerModel: printer.model,
});
```

---

## Correlation ID (traceId) Usage

Use `traceId` to correlate all log entries belonging to the same user action or request flow.

### How to use

```typescript
// Generate a traceId at the start of a user action
const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Pass it through all log calls in the same flow
StructuredLogger.info("Order creation started", { traceId, orderId });
// ... later in the flow ...
StructuredLogger.info("Payment initiated for order", { traceId, orderId, paymentId });
// ... even later ...
StructuredLogger.info("Receipt printed", { traceId, orderId, jobId });
```

### When to create a new traceId

- New order creation
- Payment flow start
- Sync batch start
- User action that spans multiple service calls

### When to propagate an existing traceId

- Across function calls within the same user action
- From parent component to child service calls
- From the main thread to background sync operations

---

## What NOT to Log

### Never log these (security/privacy risk)

- **PII**: customer names, emails, phone numbers, addresses
- **Secrets**: API keys, tokens, passwords, webhook secrets
- **Full card numbers**: use masked format only (e.g., `****4242`)
- **Full request/response payloads**: log only relevant fields
- **Session tokens or JWTs**: log only the session ID

### Avoid logging these (noise/performance)

- Every keystroke or UI interaction
- Successful health check results (only log failures)
- Full database query results (log counts and IDs only)
- Timer ticks or polling intervals

### Safe to log (masked/partial)

```typescript
// Card number: NEVER the full number
cardLast4: "4242"        // OK
cardNumber: "4242..."    // NEVER

// Customer reference: use ID, not name
customerId: "cust_123"  // OK
customerName: "John"     // NEVER

// Amounts: log in cents to avoid floating-point confusion
amountCents: 2450        // OK ($24.50)
amount: 24.50            // Avoid (floating-point)
```

---

## Setting Global Context

Set persistent context once at login so it is automatically attached to every log entry:

```typescript
// After operator login
StructuredLogger.setContext({
  restaurantId: restaurant.id,
  operatorId: operator.id,
});

// After logout
StructuredLogger.clearContext();
```

This ensures every log entry includes the restaurant and operator without repeating it manually.

---

## MetricsCollector vs StructuredLogger

| Use Case | Tool |
|---|---|
| Counting events (orders, payments, errors) | `MetricsCollector.increment()` |
| Tracking current state (queue depth, active tables) | `MetricsCollector.gauge()` |
| Measuring durations (API latency, print time) | `MetricsCollector.timing()` |
| Describing what happened and why | `StructuredLogger.info/warn/error()` |

Use both together for full observability:

```typescript
// Log the event with context
StructuredLogger.info("Payment completed", { orderId, paymentId, durationMs });

// Also increment the metric counter
MetricsCollector.increment("payment.success", { method: "card" });
MetricsCollector.timing("payment.processing", durationMs, { provider: "stripe" });
```
