# State Machines

Formal state machine definitions for the POS core system.

## Structure

- **JSON files** (`*.state-machine.json`) - Source of truth, version-controlled
- **TypeScript types** (`types.ts`) - Type-safe definitions
- **Executor** (`index.ts`) - Runtime state machine execution

## State Machines

### SESSION
- **States**: `INACTIVE` → `ACTIVE` → `CLOSED`
- **Events**: `START`, `CLOSE`, `RESET`
- **Terminal**: `CLOSED`

### ORDER
- **States**: `OPEN` → `LOCKED` → `PAID` → `CLOSED`
- **Alternative**: `OPEN` → `CANCELED` (terminal)
- **Events**: `FINALIZE`, `PAY`, `CLOSE`, `CANCEL`
- **Terminal**: `CLOSED`, `CANCELED`

### PAYMENT
- **States**: `PENDING` → `CONFIRMED` (terminal)
- **Alternative**: `PENDING` → `FAILED` → `PENDING` (retry)
- **Alternative**: `PENDING` → `CANCELED` → `PENDING` (retry)
- **Events**: `CONFIRM`, `FAIL`, `CANCEL`, `RETRY`
- **Terminal**: `CONFIRMED`

## Usage

```typescript
import StateMachineExecutor from "./state-machines";

// Execute transition
const result = await StateMachineExecutor.transition({
  entity: "ORDER",
  entityId: "order-123",
  event: "FINALIZE",
  context: {
    currentState: "OPEN",
  },
});

if (result.success) {
  console.log(`Transitioned from ${result.previousState} to ${result.newState}`);
} else {
  console.error(`Transition failed: ${result.error}`);
}
```

## Guards & Effects

Guards and effects are defined in JSON but implemented in the executor:

- **Guards**: Business rule validations (e.g., "noOpenOrders")
- **Effects**: Side effects of transitions (e.g., "calculateTotal")

See `03_CORE_CONSTRAINTS.md` for guard implementations.

## Next Steps

1. Implement guard logic based on constraints
2. Implement effect logic for data mutations
3. Add database persistence layer
4. Add tests for invalid transitions

