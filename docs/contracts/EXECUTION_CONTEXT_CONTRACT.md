# Execution Context Contract (ECC)
>
> **The Law of Existence**

This contract defines the "Envelope" that prevents Ghost Operations.

## 1. The Rule

**"No Operation can execute without a verified Execution Context."**

An `ExecutionContext` proves that:

1. The Tenant is verified (`tenantId`).
2. The Kernel is Alive (`lifecycle === 'ACTIVE'`).
3. The Operation is tracked (`executionId`, `correlationRoot`).

## 2. The Context Structure

```typescript
interface ExecutionContext {
  tenantId: string;       // The Owner
  executionId: UUID;      // The Boot Session
  lifecycle: 'ACTIVE';    // The State
  source: 'UI' | 'API';   // The Origin
  correlationRoot: UUID;  // The Cause
}
```

## 3. Lifecycle Binding

- **Boot:** Kernel generates `executionId`.
- **Run:** Every `execute()` call receives `ctx`.
- **Verify:** Executor asserts `ctx.executionId` matches its bound Kernel (implicitly via instance) and `lifecycle` is Valid.
- **Dispose:** Kernel sets `lifecycle = 'TERMINATED'`. Any further calls Throw Fatal Error.

## 4. Event Metadata

Every Event is stamped with the Context:

```json
{
  "meta": {
    "actor_ref": "kernel:uuid-execution-id",
    "correlation_id": "uuid-trace-id"
  }
}
```

This allows forensic audit: "Which Kernel Boot Session created this event?"

## 5. Anti-Zombie Mechanism

If a `TenantProvider` unmounts in React:

1. It calls `Kernel.dispose()`.
2. `Kernel.lifecycle` becomes `TERMINATED`.
3. Pending Promises/Executions attempting to write will **FAIL** immediately via Assertion.
4. Realtime Subscriptions linked to that `executionId` are ignored/unsubscribed.
