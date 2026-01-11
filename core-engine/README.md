# CORE ENGINE

Real implementation of the POS CORE with:
- **Guards**: Business rule validation
- **Effects**: Data mutations
- **Transactions**: Atomic operations
- **Locks**: Concurrency control

## Structure

```
core-engine/
├── repo/
│   ├── types.ts           # Entity types
│   └── InMemoryRepo.ts    # In-memory repository with transactions
├── guards/
│   └── index.ts           # Guard implementations
├── effects/
│   └── index.ts           # Effect implementations
├── executor/
│   └── CoreExecutor.ts   # State machine executor
└── index.ts               # Public API
```

## Usage

```typescript
import { CoreExecutor, InMemoryRepo } from "./core-engine";

// Create repository and executor
const repo = new InMemoryRepo();
const executor = new CoreExecutor(repo);

// Create session
const session = {
  id: "session-1",
  state: "INACTIVE",
  version: 1,
};
repo.saveSession(session);

// Start session
await executor.transition({
  entity: "SESSION",
  entityId: session.id,
  event: "START",
});

// Create order
const order = {
  id: "order-1",
  session_id: session.id,
  state: "OPEN",
  version: 1,
};
repo.saveOrder(order);

// Add item
const item = {
  id: "item-1",
  order_id: order.id,
  product_id: "product-1",
  quantity: 2,
  price_snapshot: 10.0,
  subtotal: 20.0,
};
repo.saveOrderItem(item);

// Finalize order
await executor.transition({
  entity: "ORDER",
  entityId: order.id,
  event: "FINALIZE",
});
```

## Guards

Guards validate business rules before state transitions:

- `noOpenOrders` - Session cannot close with OPEN orders
- `noLockedOrders` - Session cannot close with LOCKED orders
- `sessionIsActive` - Operations require ACTIVE session
- `orderIsOpen` - Order must be OPEN for certain operations
- `orderIsLocked` - Order must be LOCKED for payments
- `orderHasItems` - Order must have items to finalize
- `hasConfirmedPayment` - Order must have CONFIRMED payment to be PAID
- `paymentOrderIsLocked` - Payment requires LOCKED order
- `paymentNotConfirmed` - Payment cannot be modified if CONFIRMED

## Effects

Effects perform data mutations after guard validation:

- `calculateTotal` - Calculate order total from items
- `lockItems` - Lock order items (prevent modifications)
- `applyPaymentToOrder` - Apply payment to order (transition to PAID)
- `markIrreversible` - Mark payment as irreversible

## Transactions

All state transitions are atomic:

```typescript
// Transaction is automatically managed
const result = await executor.transition({
  entity: "ORDER",
  entityId: order.id,
  event: "FINALIZE",
});

// If guard fails, transaction is rolled back
// If effect fails, transaction is rolled back
// Only commits if everything succeeds
```

## Concurrency

Locks prevent concurrent modifications:

```typescript
// Lock is automatically acquired per entity
await executor.transition({
  entity: "ORDER",
  entityId: order.id,
  event: "FINALIZE",
});

// Concurrent attempts on same entity are serialized
```

## Next Steps

- [ ] Add database persistence (PostgreSQL/Supabase)
- [ ] Add event sourcing / audit log
- [ ] Add offline-first support
- [ ] Add fiscal compliance

