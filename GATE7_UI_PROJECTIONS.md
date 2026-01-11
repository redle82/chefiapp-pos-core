# GATE 7: UI PROJECTIONS
**Status**: DRAFT
**Pattern**: CQRS (Command Query Responsibility Segregation)

---

## 1. THE PROBLEM
The Event Store is excellent for **Writing** (Audit, Replay, Truth).
The Event Store is terrible for **Reading** (Dashboards, Lists, Search).

**Example**: To show "Open Orders", the system would have to read *every stream* and replay *every event*. This O(N) complexity kills performance.

---

## 2. THE SOLUTION: PROJECTIONS

We create specialized **Read Models** that are:
*   **Derivatives**: Computed 100% from the Event Log.
*   **Disposable**: Can be deleted and rebuilt from scratch.
*   **Optimized**: Structured exactly how the UI needs them (e.g., JSON fields, pre-calculated totals).

---

## 3. ARCHITECTURE

### 3.1 The Flow
1.  **Core**: Seals an Event (`ORDER_ITEM_ADDED`).
2.  **Propagator**: `ProjectionManager` notices the new event.
3.  **Projector**: `OrderSummaryProjector` updates a distinct table `read_order_summaries`.
4.  **UI**: Queries `SELECT * FROM read_order_summaries` (O(1) complexity).

### 3.2 The Contract (`Projection`)

```typescript
export interface Projection {
    projectionName: string; // e.g. "order-summary"
    version: string;        // "1.0.0"

    handle(event: CoreEvent): Promise<void>;
    
    // Tools for rebuilding
    reset(): Promise<void>;
}
```

### 3.3 Storage Strategy
*   **Transactional Projections**: logic runs *inside* the Core Transaction. Guaranteed consistency (Strict).
*   **Async Projections**: Logic runs *after* commit. Eventual consistency (Fast).

**Gate 7 Verdict**: We will use **Async Projections** by default for things like BI/Reports, but **Transactional Projections** might be needed for critical "Order Status" views to prevent "flicker" (UI says Paid, DB says Open).

*Recommendation for Gate 7*: Start with **Async** (Eventual) driven by a reliable cursor, as this scales better and decouples the Core write lock.

---

## 4. STANDARD PROJECTIONS (V1)

| Name | Source Events | Target Schema | Purpose |
| :--- | :--- | :--- | :--- |
| **Order Summary** | `ORDER_CREATED`, `ORDER_PAID`, `ORDER_CLOSED` | `read_order_summaries` | List View (Active Tables) |
| **Daily Sales** | `PAYMENT_CONFIRMED` | `read_daily_sales` | Manager Dashboard |
| **Inventory View** | `STOCK_MOVED` | `read_inventory_levels` | MenuItem Availability |

---

## 5. REPLAYABILITY
Since these are derived data:
1.  TRUNCATE `read_*` tables.
2.  Read `event_store` from 0.
3.  Feed every event to `ProjectionManager`.
4.  Result: Identical state.

---
**Signed:** ChefIApp POS Architecture Team
