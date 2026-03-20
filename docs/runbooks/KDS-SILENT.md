# Runbook: KDS Silent (No Orders Appearing)

**Alert Rule**: `kds_no_events`
**Severity**: WARNING
**Threshold**: Orders being created (`order.created` > 5) but KDS received none (`kds.order_received` = 0)
**Cooldown**: 30 minutes

---

## Symptoms

- Kitchen Display System shows no new orders for 15+ minutes during operating hours
- Alert "KDS No Events" triggered on the Monitoring dashboard
- Staff reports that orders placed at the POS are not appearing on the kitchen screen
- `kds.order_received` counter stays at 0 while `order.created` is incrementing

## Impact

- **Kitchen stalled**: kitchen staff do not know what to prepare
- **Customer wait times**: orders are not being worked on
- **Revenue impact**: during peak hours, this can cascade into significant delays

## Investigation Steps

### 1. Confirm orders are being created (1 min)

- Check the Monitoring page Counters section
- `order.created` should be > 0 if the POS has been used
- If `order.created` is also 0, the problem is on the POS side, not the KDS

### 2. Check Supabase Realtime subscription (2 min)

The KDS relies on Supabase Realtime to receive order events:

- Open the KDS browser tab DevTools > Console
- Look for `[Realtime]` log messages
- Check for:
  - `SUBSCRIBED` -- healthy, subscription is active
  - `CLOSED` or `CHANNEL_ERROR` -- subscription dropped
  - `TIMED_OUT` -- connection timeout

### 3. Check Supabase connection (1 min)

- In the Monitoring page System Health widget, check "Database" status
- If Supabase is down or degraded, Realtime will not work
- Check [Supabase Status](https://status.supabase.com/) for incidents

### 4. Check order creation flow (2 min)

Verify orders are being written to the database:

- Open the merchant portal back-office
- Navigate to the orders list
- If orders appear there but not on KDS:
  - The problem is the Realtime subscription or the KDS filter
- If orders do NOT appear there either:
  - The problem is in order creation or sync (see SYNC-QUEUE-OVERFLOW runbook)

### 5. Check KDS filter configuration (1 min)

The KDS may be filtering by station, order type, or status:
- Verify the KDS is configured to show the correct station (e.g., "kitchen" vs "bar")
- Verify the KDS is not filtered to a specific order type that is not being used
- Check if the KDS has an active date/time filter that may have expired

## Resolution

### If Realtime subscription dropped

1. **Refresh the KDS browser tab** -- this reconnects the Realtime subscription
2. Verify the subscription reconnects (check console for `SUBSCRIBED` message)
3. New orders should start appearing within seconds

### If Supabase Realtime is down

1. Check [Supabase Status](https://status.supabase.com/)
2. As a workaround, the KDS can poll for orders manually:
   - Refresh the KDS page every 30-60 seconds
   - This is not ideal but keeps the kitchen operational
3. Once Realtime is restored, the live subscription will resume

### If orders are not reaching Supabase at all

1. This is a sync issue -- follow the [SYNC-QUEUE-OVERFLOW](./SYNC-QUEUE-OVERFLOW.md) runbook
2. The KDS cannot show orders that have not been synced to the database

### If the KDS browser is unresponsive

1. Close and reopen the KDS browser tab
2. Navigate back to the KDS URL
3. Verify the Realtime subscription connects
4. If the browser itself is frozen, restart the browser entirely

### If the service worker is interfering

1. Check System Health widget for "Service Worker" status
2. If the SW is stuck in a bad state:
   - Open DevTools > Application > Service Workers
   - Click "Unregister" on the active service worker
   - Refresh the page
   - The SW will re-register on load

## Escalation

| Condition | Action |
|---|---|
| KDS silent for > 15 min during service | Notify restaurant manager, use verbal order relay |
| KDS silent + Realtime confirmed down | Page on-call engineer |
| Cannot restore KDS after 30 min | Switch to paper ticket backup |

## Workaround: Paper Ticket Backup

If KDS cannot be restored during service:
1. Enable receipt printing for kitchen tickets (if not already)
2. Staff hand-carries tickets to the kitchen
3. Kitchen works from paper tickets until KDS is restored
4. After restoration, verify no orders were missed

## Post-Incident

- [ ] Verify all orders created during the outage were eventually displayed on KDS
- [ ] Check if any orders were prepared late or missed
- [ ] Review Realtime connection logs for the root cause
- [ ] Consider adding a local polling fallback for KDS resilience
