# Execution Fence Contract (Life-Binding)
>
> **The Lock Against "Zombie" Execution**

This contract defines the mechanism that prevents "Ghost Operations" (operations continuing to execute after their parent Kernel has been disposed).

## 1. The Fence Concept

An `EventExecutor` is not a stateless function. It is a **Stateful Organ** bound to a specific `TenantKernel` instance.

**The Law:**
> "An Executor created by Kernel Instance `K1` SHALL NEVER accept an execution request from Kernel Instance `K2`, nor from a stale context of `K1` after disposal."

## 2. Structural Binding (Constructor)

When an `EventExecutor` is born, it is branded with:

1. **BoundTenantId:** The Tenant it serves.
2. **BoundExecutionId:** The Unique Boot Session ID of its parent Kernel.

```typescript
constructor(..., boundTenantId, boundExecutionId)
```

## 3. The Runtime Check (The Fence)

Before any operation (especially async writes):

1. The Executor receives an `ExecutionContext` (The Envelope).
2. It strictly compares:
    - `Envelope.tenantId === BoundTenantId`
    - `Envelope.executionId === BoundExecutionId`

**If Mismatch:**

- Throw `FENCE BREACH ERROR`.
- The operation is aborted immediately.
- No side effects occur.

## 4. Why This Solves "The Loop"

In a "Quantum State" scenario (async race condition):

1. User switches Tenant (Kernel A disposes, Kernel B boots).
2. A pending Promise from Kernel A wakes up.
3. It calls `executorA.execute(contextA)`.
    - *Scenario 1:* It tries to call `executorB`. Fails (Instance mismatch).
    - *Scenario 2:* It calls `executorA` (which is technically dead but reachable).
    - *Check:* `executorA` checks `contextA.lifecycle`.
        - If `Kernel A` marked it as `TERMINATED`, it fails.
    - *Check:* If `request` somehow got a mix of IDs.
        - The `BoundID` check ensures the Envelope matches the Machinery.

## 5. Implementation Reference

- `core-engine/kernel/TenantKernel.ts` (The Binder)
- `event-log/EventExecutor.ts` (The Enforcer)
