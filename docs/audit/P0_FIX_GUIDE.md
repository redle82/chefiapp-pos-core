# P0 FIX GUIDE - TPV Optimistic Updates

## Problem Statement

**File:** `/merchant-portal/src/pages/TPV/TPV.tsx`
**Lines:** 326-354
**Severity:** CRITICAL (P0)
**Doctrine Violation:** "UI NEVER anticipates the Core"

### Current Behavior (WRONG)

```typescript
const handleOrderAction = async (orderId: string, action: 'send' | 'ready' | 'close') => {
    // 1. IMMEDIATE UI UPDATE (WRONG!)
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order
        switch (action) {
          case 'send':
            return { ...order, status: 'preparing', updatedAt: new Date() } // LIES!
          case 'ready':
            return { ...order, status: 'ready', updatedAt: new Date() } // LIES!
          case 'close':
            return { ...order, status: 'paid', updatedAt: new Date() } // LIES!
        }
      })
    )

    // 2. Queue the actual action
    await enqueue({
      id: crypto.randomUUID(),
      type: 'ORDER_UPDATE',
      payload: { orderId, action },
      createdAt: Date.now(),
      attempts: 0,
      status: 'queued',
    })
}
```

**Problem:** UI shows order as "preparing" when it's only QUEUED, not confirmed by Core.

**Impact:**
- User believes action is complete
- If queue fails to sync, reality diverges from UI
- No rollback mechanism
- Kitchen might miss the order
- Customer could be served incorrectly

---

## Correct Implementation (FIX)

### Option 1: Queue-Driven UI (RECOMMENDED)

```typescript
const handleOrderAction = async (orderId: string, action: 'send' | 'ready' | 'close') => {
    // Only action: enqueue the intent
    await enqueue({
      id: crypto.randomUUID(),
      type: 'ORDER_UPDATE',
      payload: { orderId, action },
      createdAt: Date.now(),
      attempts: 0,
      status: 'queued',
    })

    // UI updates automatically when:
    // 1. Queue item transitions to 'applied'
    // 2. Reconciler confirms backend success
    // 3. OrderCard shows queue badge during sync
}
```

### Option 2: Pending State Pattern

```typescript
interface Order {
  id: string
  tableNumber?: number
  status: 'new' | 'preparing' | 'ready' | 'served' | 'paid'
  items: OrderItem[]
  total: number
  createdAt: Date
  updatedAt: Date
  pendingAction?: 'send' | 'ready' | 'close' // NEW FIELD
}

const handleOrderAction = async (orderId: string, action: 'send' | 'ready' | 'close') => {
    // 1. Show pending state
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order
        return { ...order, pendingAction: action }
      })
    )

    // 2. Enqueue
    await enqueue({
      id: crypto.randomUUID(),
      type: 'ORDER_UPDATE',
      payload: { orderId, action },
      createdAt: Date.now(),
      attempts: 0,
      status: 'queued',
    })

    // 3. Clear pending state when queue becomes 'applied'
    // (handled by queue state sync)
}
```

### Option 3: Hybrid with Loading State

```typescript
const handleOrderAction = async (orderId: string, action: 'send' | 'ready' | 'close') => {
    // 1. Show loading/pending badge on card
    const queueItemId = crypto.randomUUID()

    // 2. Enqueue
    await enqueue({
      id: queueItemId,
      type: 'ORDER_UPDATE',
      payload: { orderId, action },
      createdAt: Date.now(),
      attempts: 0,
      status: 'queued',
    })

    // 3. UI shows:
    // - Queue badge: "Syncing..." (while status = 'queued' | 'syncing')
    // - Queue badge: "Failed" + retry button (while status = 'failed')
    // - Status update ONLY when status = 'applied'
}
```

---

## Implementation Steps

### Step 1: Remove Optimistic Updates

**File:** `/merchant-portal/src/pages/TPV/TPV.tsx`

```diff
const handleOrderAction = async (orderId: string, action: 'send' | 'ready' | 'close') => {
-    // 1. Optimistic Update (Immediate UI feedback)
-    setOrders((prev) =>
-      prev.map((order) => {
-        if (order.id !== orderId) return order
-        switch (action) {
-          case 'send':
-            return { ...order, status: 'preparing', updatedAt: new Date() }
-          case 'ready':
-            return { ...order, status: 'ready', updatedAt: new Date() }
-          case 'close':
-            return { ...order, status: 'paid', updatedAt: new Date() }
-          default:
-            return order
-        }
-      })
-    )

-    // 2. Truth Persistence (Queue)
+    // Queue the action (UI updates when applied)
    await enqueue({
      id: crypto.randomUUID(),
      type: 'ORDER_UPDATE',
      payload: { orderId, action },
      createdAt: Date.now(),
      attempts: 0,
      status: 'queued',
    })
}
```

### Step 2: Add Queue-Driven Status Updates

**Create new hook:** `/merchant-portal/src/core/queue/useQueueStatus.ts`

```typescript
import { useOfflineQueue } from './useOfflineQueue'

export function useQueueStatus(orderId: string) {
  const { items } = useOfflineQueue()

  // Find latest queue item for this order
  const queueItem = items
    .filter(item => {
      const payload = item.payload as any
      return payload?.orderId === orderId
    })
    .sort((a, b) => b.createdAt - a.createdAt)[0]

  return {
    isQueued: queueItem?.status === 'queued',
    isSyncing: queueItem?.status === 'syncing',
    isFailed: queueItem?.status === 'failed',
    isApplied: queueItem?.status === 'applied',
    error: queueItem?.lastError,
    attempts: queueItem?.attempts || 0,
    queueItem,
  }
}
```

### Step 3: Update OrderCard to Show Queue Status

**File:** `/merchant-portal/src/ui/design-system/OrderCard.tsx`

```typescript
import { useQueueStatus } from '../../core/queue/useQueueStatus'

export const OrderCard = ({ orderId, ...props }) => {
  const queueStatus = useQueueStatus(orderId)

  return (
    <div className="order-card">
      {/* Existing order content */}

      {/* Queue status overlay */}
      {queueStatus.isQueued && (
        <div className="order-card__queue-badge order-card__queue-badge--queued">
          Enfileirado...
        </div>
      )}

      {queueStatus.isSyncing && (
        <div className="order-card__queue-badge order-card__queue-badge--syncing">
          Sincronizando...
        </div>
      )}

      {queueStatus.isFailed && (
        <div className="order-card__queue-badge order-card__queue-badge--failed">
          Falha ({queueStatus.attempts}/3)
          <button onClick={onRetry}>Repetir</button>
        </div>
      )}

      {queueStatus.isApplied && (
        <div className="order-card__queue-badge order-card__queue-badge--success">
          Confirmado
        </div>
      )}
    </div>
  )
}
```

### Step 4: Listen to Queue Changes for Status Updates

**File:** `/merchant-portal/src/pages/TPV/TPV.tsx`

```typescript
// When queue item becomes 'applied', update order status
useEffect(() => {
  const appliedItems = queueItems.filter(item => item.status === 'applied')

  appliedItems.forEach(item => {
    if (item.type === 'ORDER_UPDATE') {
      const payload = item.payload as any
      const { orderId, action } = payload

      // NOW we can update the order status
      setOrders(prev => prev.map(order => {
        if (order.id !== orderId) return order

        switch (action) {
          case 'send':
            return { ...order, status: 'preparing', updatedAt: new Date() }
          case 'ready':
            return { ...order, status: 'ready', updatedAt: new Date() }
          case 'close':
            return { ...order, status: 'paid', updatedAt: new Date() }
          default:
            return order
        }
      }))
    }
  })
}, [queueItems])
```

---

## Visual Design

### Queue Badge States

```css
.order-card__queue-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.order-card__queue-badge--queued {
  background: rgba(255, 152, 0, 0.1);
  color: #FF9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.order-card__queue-badge--syncing {
  background: rgba(33, 150, 243, 0.1);
  color: #2196F3;
  border: 1px solid rgba(33, 150, 243, 0.3);
  animation: pulse 1.5s infinite;
}

.order-card__queue-badge--failed {
  background: rgba(244, 67, 54, 0.1);
  color: #F44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.order-card__queue-badge--success {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
  animation: fadeOut 2s forwards;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fadeOut {
  0% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
```

---

## Testing Checklist

### Scenario 1: Online Action (Happy Path)
- [ ] Click "Enviar para Cozinha"
- [ ] Badge shows "Enfileirado..." (instant)
- [ ] Badge changes to "Sincronizando..." (~100ms)
- [ ] Badge shows "Confirmado" (~500ms)
- [ ] Order moves to "Em Preparo" column
- [ ] Badge fades out after 2s

### Scenario 2: Offline Action (Queue)
- [ ] Kill backend
- [ ] Click "Enviar para Cozinha"
- [ ] Badge shows "Enfileirado..."
- [ ] Order stays in "Novo" column
- [ ] Badge persists with queue status

### Scenario 3: Failed Sync (Retry)
- [ ] Backend returns 500
- [ ] Badge shows "Falha (1/3)" with retry button
- [ ] Click retry
- [ ] Badge shows "Enfileirado..." again
- [ ] Reconciler retries automatically

### Scenario 4: Permanent Failure
- [ ] Backend fails 3 times
- [ ] Badge shows "Falha (3/3)"
- [ ] Order stays in original column
- [ ] Manual retry button available
- [ ] User sees error message

---

## Expected Behavior After Fix

### What User Sees
1. Click action button
2. Immediate feedback: "Enfileirado..." badge
3. Brief sync indicator: "Sincronizando..."
4. Success confirmation: "Confirmado" (fades out)
5. Order moves to new column

### What Actually Happens
1. Action intent queued to IndexedDB
2. Reconciler picks up queue item (if online)
3. API call to backend
4. Backend confirms success (200)
5. Queue item marked 'applied'
6. UI updates based on 'applied' state
7. Order status changes

### Truth Guarantee
- User never sees false state
- Queue status always reflects reality
- Failed syncs are visible
- Retry is possible
- No data loss

---

## Rollout Strategy

### Phase 1: Fix in Dev (Day 1)
- Implement queue-driven updates
- Add queue badges
- Test all scenarios
- Review with team

### Phase 2: Test in Staging (Day 2-3)
- Deploy to staging
- Run full testing checklist
- Simulate network failures
- Verify queue persistence

### Phase 3: Production Deploy (Day 4)
- Deploy during low-traffic window
- Monitor error logs
- Watch queue metrics
- Be ready to rollback

### Phase 4: Validation (Day 5-7)
- Monitor production usage
- Collect user feedback
- Track queue success rate
- Verify no UI state bugs

---

## Success Metrics

After fix is deployed, verify:

- [ ] Queue success rate >95%
- [ ] No reports of "ghost orders"
- [ ] Failed syncs visible to users
- [ ] Retry mechanism works
- [ ] No UI state inconsistencies
- [ ] Users understand queue badges
- [ ] Performance is acceptable

---

## Risk Mitigation

### Potential Issues

1. **Performance:** More UI updates from queue changes
   - **Mitigation:** Debounce queue listener, only update changed orders

2. **UX Confusion:** Users don't understand badges
   - **Mitigation:** Add tooltip, onboarding guide

3. **Regression:** Something breaks
   - **Mitigation:** Feature flag, easy rollback, comprehensive tests

4. **Queue Overflow:** Too many pending items
   - **Mitigation:** Add queue size limit, oldest-first processing

---

## Estimated Effort

- **Implementation:** 4-6 hours
- **Testing:** 2-3 hours
- **Review & Deploy:** 1-2 hours
- **Total:** ~1 working day

---

**Priority:** P0 - CRITICAL
**Blocking:** Production deployment
**Assignee:** Senior frontend engineer
**Reviewer:** Tech lead + code review agent

---

*"Show what exists. Do what's queued. Save what's confirmed."*
