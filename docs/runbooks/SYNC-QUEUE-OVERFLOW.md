# Runbook: Sync Queue Overflow

**Alert Rule**: `sync_queue_stuck`
**Severity**: CRITICAL
**Threshold**: Sync queue length > 50 items
**Cooldown**: 30 minutes

---

## Symptoms

- Alert "Sync Queue Backlog" triggered on the Monitoring dashboard
- `sync.queue_length` gauge rising in Metrics section
- Orders created on the POS are not appearing in the back-office
- KDS may stop receiving new orders
- "Sync Engine" shows "degraded" status in System Health widget

## Impact

- **Data lag**: local changes (orders, payments, stock adjustments) are not reaching Supabase
- **Multi-device desync**: other terminals and the KDS see stale data
- **Risk of data loss**: if queue exceeds memory limits or the browser is closed before sync completes, pending operations are lost (IndexedDB persistence mitigates but does not eliminate risk)

## Severity Thresholds

| Queue Depth | Risk Level | Action |
|---|---|---|
| 50-200 | Warning | Monitor, investigate root cause |
| 200-500 | High | Force sync, check network |
| 500-1000 | Critical | Immediate intervention required |
| > 1000 | Emergency | Risk of data loss, escalate immediately |

## Investigation Steps

### 1. Check network state (1 min)

- Is the POS device connected to the internet?
- Open browser DevTools > Network tab, check for failed requests
- Try loading any external URL to confirm connectivity
- Check if the restaurant Wi-Fi is down or degraded

### 2. Check Supabase connectivity (2 min)

- In System Health widget, check "Database" (Supabase) status
- If "degraded" or "down":
  - Check [Supabase Status](https://status.supabase.com/)
  - Verify the Supabase project URL and anon key are correct
  - Check if RLS policies are blocking writes

### 3. Check SyncEngine state (1 min)

- In System Health widget, expand "Sync Engine" details
- Look for:
  - `connectivity`: should be "online"
  - `pendingCount`: the current queue depth
  - `isProcessing`: whether the engine is actively trying to flush

### 4. Check for dead letter items (2 min)

Items that failed to sync multiple times are moved to a dead letter queue:
- Check browser console for `[SyncEngine]` error logs
- Look for conflict errors (409) or validation errors (422)
- These items will not retry automatically and need manual resolution

### 5. Check for stuck processing (1 min)

If `isProcessing` is true but the queue is not draining:
- A single item may be blocking the queue (e.g., a malformed order)
- Check console for the specific error on that item
- The item may need to be manually removed or corrected

## Resolution

### If network is down

1. The SyncEngine operates in offline-first mode -- this is expected behavior
2. Inform staff that the system is operating offline
3. All operations continue to work locally
4. Once network is restored, the queue will drain automatically
5. Monitor the queue depth to confirm it is decreasing

### If Supabase is down

1. Check [Supabase Status](https://status.supabase.com/)
2. The POS continues to work offline
3. Do NOT restart the browser -- this preserves the in-memory queue
4. Once Supabase is back, the queue will drain
5. If queue exceeds 500 items, consider pausing new orders until it drains

### If queue is stuck (not draining despite connectivity)

1. **Force sync**: trigger a manual sync from the application
2. **Retry dead letter items**: check for items that exhausted retries
3. **Clear applied items**: items already confirmed synced can be pruned from the queue
4. If a specific item is blocking:
   - Identify the item from console logs
   - If it is a duplicate or invalid record, remove it from the local queue
   - If it is a legitimate record with a server-side issue, fix the server-side cause first

### If queue exceeds 1000 items

1. **Stop creating new orders** until the queue drains below 500
2. Switch to a paper-based backup for order tracking
3. Do NOT close the browser tab -- this would lose the in-memory queue
4. Contact engineering to investigate the root cause
5. Once the root cause is fixed, monitor the queue until fully drained

## Escalation

| Condition | Action |
|---|---|
| Queue > 200, not draining for 10 min | Notify restaurant manager |
| Queue > 500 | Page on-call engineer |
| Queue > 1000 | Risk of data loss, escalate to engineering lead |
| Network down > 1 hour | Plan for manual reconciliation |

## Post-Incident

- [ ] Verify all queued items were eventually synced (compare local vs remote counts)
- [ ] Check for any data inconsistencies between local state and Supabase
- [ ] Review dead letter queue for unresolved items
- [ ] Document the root cause and duration of the incident
- [ ] Consider whether offline queue persistence (IndexedDB) needs enhancement
