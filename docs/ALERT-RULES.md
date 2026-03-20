# Alert Rules Reference

This document describes all alert rules configured in the ChefIApp POS monitoring system. Alert rules are defined in `merchant-portal/src/core/monitoring/AlertRules.ts` and evaluated every 60 seconds by the `AlertRulesEngine`.

---

## How Alerts Work

1. The `AlertRulesEngine` evaluates all registered rules every 60 seconds
2. Each rule reads from `MetricsCollector` (in-memory counters, gauges, timings)
3. If a rule condition is met, a `TriggeredAlert` is created
4. Cooldown prevents the same rule from re-triggering within 30 minutes
5. Alerts are displayed on the Monitoring page and sent as browser notifications (if permitted)
6. Critical alerts are also routed to Discord via the `AlertService` webhook (if configured)

---

## Alert Rules

### 1. High Payment Failure Rate

| Property | Value |
|---|---|
| **Rule ID** | `payment_failure_rate` |
| **Severity** | CRITICAL |
| **Condition** | `payment.failed / (payment.success + payment.failed) > 0.10` |
| **Minimum Data** | At least 5 total payment attempts |
| **Cooldown** | 30 minutes |
| **Notification** | Browser notification + Discord webhook |
| **Runbook** | [PAYMENT-FAILURE.md](./runbooks/PAYMENT-FAILURE.md) |

**What it checks**: The ratio of failed payments to total payment attempts this session. Only evaluates when there are at least 5 attempts to avoid false positives during low-volume periods.

**Common triggers**:
- Stripe API outage
- Misconfigured Stripe keys (test vs production)
- Network connectivity issues at the POS

---

### 2. Sync Queue Backlog

| Property | Value |
|---|---|
| **Rule ID** | `sync_queue_stuck` |
| **Severity** | CRITICAL |
| **Condition** | `sync.queue_length > 50` |
| **Minimum Data** | None |
| **Cooldown** | 30 minutes |
| **Notification** | Browser notification + Discord webhook |
| **Runbook** | [SYNC-QUEUE-OVERFLOW.md](./runbooks/SYNC-QUEUE-OVERFLOW.md) |

**What it checks**: The current sync queue depth as reported by the `sync.queue_length` gauge. A growing queue means local changes are not reaching Supabase.

**Common triggers**:
- Network outage (expected in offline-first mode)
- Supabase downtime
- A blocking item in the sync queue (validation error, conflict)

---

### 3. Printer Consecutive Failures

| Property | Value |
|---|---|
| **Rule ID** | `printer_consecutive_failures` |
| **Severity** | WARNING |
| **Condition** | `printer.failed > 3 AND printer.failed > printer.success` |
| **Minimum Data** | At least 4 print attempts |
| **Cooldown** | 30 minutes |
| **Notification** | Browser notification |
| **Runbook** | [PRINTER-FAILURE.md](./runbooks/PRINTER-FAILURE.md) |

**What it checks**: Whether print failures outnumber successes and exceed a minimum threshold. This heuristic detects persistent printer issues rather than transient glitches.

**Common triggers**:
- Printer disconnected (USB cable)
- Printer out of paper
- WebUSB permission revoked
- Printer hardware failure

---

### 4. High API Error Rate

| Property | Value |
|---|---|
| **Rule ID** | `api_error_rate` |
| **Severity** | CRITICAL |
| **Condition** | `api.error / api.latency.count > 0.05` |
| **Minimum Data** | At least 10 total API calls |
| **Cooldown** | 30 minutes |
| **Notification** | Browser notification + Discord webhook |
| **Runbook** | [HIGH-ERROR-RATE.md](./runbooks/HIGH-ERROR-RATE.md) |

**What it checks**: The ratio of API errors to total API calls. Uses the `api.latency` timing count as the denominator since every API call records latency. Only evaluates when there are at least 10 calls.

**Common triggers**:
- Bad deployment (code regression)
- Supabase outage
- RLS policy changes blocking queries
- Rate limiting (429 responses)

---

### 5. KDS No Events

| Property | Value |
|---|---|
| **Rule ID** | `kds_no_events` |
| **Severity** | WARNING |
| **Condition** | `order.created > 5 AND kds.order_received == 0` |
| **Minimum Data** | At least 5 orders created |
| **Cooldown** | 30 minutes |
| **Notification** | Browser notification |
| **Runbook** | [KDS-SILENT.md](./runbooks/KDS-SILENT.md) |

**What it checks**: Whether orders are being created but the KDS is not receiving any of them. This indicates a broken Realtime subscription or a misconfigured KDS.

**Common triggers**:
- Supabase Realtime subscription dropped
- KDS browser tab closed or frozen
- KDS filtered to wrong station/order type
- Network issue between KDS device and Supabase

---

## Alert Notification Channels

| Channel | Scope | Configuration |
|---|---|---|
| **Monitoring Page** | All alerts | Always active, displayed in Alert History section |
| **Browser Notification** | All alerts | Requires `Notification.permission === "granted"` |
| **Discord Webhook** | Critical only | Requires `VITE_DISCORD_WEBHOOK_URL` env var |
| **Console Log** | All alerts | Always active via `Logger.warn` / `Logger.error` |

### Enabling browser notifications

The merchant portal requests notification permission on first visit to the Monitoring page. Staff can grant permission when prompted by the browser.

### Configuring Discord webhook

1. Create a Discord channel for alerts (e.g., `#chefiapp-alerts`)
2. Create a webhook in the channel settings
3. Set the `VITE_DISCORD_WEBHOOK_URL` environment variable to the webhook URL
4. Critical alerts will be posted to the channel with context details

---

## Adding New Alert Rules

To add a custom alert rule, use the `AlertRulesEngine.addRule()` method:

```typescript
import { AlertRulesEngine } from "./core/monitoring/AlertRules";
import { MetricsCollector } from "./core/monitoring/MetricsCollector";

AlertRulesEngine.addRule({
  id: "custom_table_utilization",
  name: "High Table Utilization",
  description: "More than 90% of tables occupied for 30+ minutes",
  severity: "warning",
  evaluate: () => {
    const metrics = MetricsCollector.getMetrics();
    const activeTables = metrics.gauges["tables.active"] ?? 0;
    const totalTables = metrics.gauges["tables.total"] ?? 1;
    return activeTables / totalTables > 0.9;
  },
});
```

### Rule design guidelines

1. **Use minimum data thresholds**: avoid false positives during low-volume periods
2. **Choose severity carefully**: only use `critical` for issues that require immediate human action
3. **Respect cooldown**: the default 30-minute cooldown prevents alert fatigue; do not bypass it
4. **Keep evaluation fast**: rules run every 60 seconds, do not perform I/O in the evaluate function
5. **Document the runbook**: every new rule should have a corresponding runbook in `docs/runbooks/`

---

## Tuning Thresholds

If an alert is firing too often (false positives) or not often enough (missed incidents), adjust the thresholds:

| Rule | Current Threshold | Consider Increasing If | Consider Decreasing If |
|---|---|---|---|
| Payment failure rate | > 10% | Low-volume restaurant with occasional declines | High-volume restaurant where 5% is already significant |
| Sync queue backlog | > 50 items | Restaurant regularly operates offline | Restaurant always has connectivity |
| Printer failures | > 3 failures | Printer is old and occasionally glitches | Printer is critical for kitchen tickets |
| API error rate | > 5% | External APIs have occasional transient errors | System must be highly reliable |
| KDS no events | > 5 orders with 0 KDS events | Kitchen uses paper tickets primarily | KDS is the only kitchen communication |

To change a threshold, modify the `evaluate` function in `AlertRules.ts`. There is no runtime configuration UI yet; threshold changes require a code deployment.

---

## Alert History

The `AlertRulesEngine` maintains an in-memory history of the last 200 triggered alerts. This history is displayed on the Monitoring page and is reset when the browser tab is refreshed.

For persistent alert history, alerts are routed through the `Logger` which can be configured to persist to Supabase `app_logs` table or Sentry.
