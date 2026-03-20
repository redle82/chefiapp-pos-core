/**
 * MonitoringPage — Admin page for system health and operational monitoring
 *
 * Sections:
 *   1. System Health (existing widget)
 *   2. Business Metrics (orders, payments, tables)
 *   3. Infrastructure Metrics (circuit breakers, sync queue, API timings)
 *   4. Alerts (active alerts, history, configuration link)
 *   5. Raw Metrics (counters, gauges, timings)
 *
 * Supports auto-refresh with configurable interval (30s, 60s, off).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertRulesEngine, type AlertRule, type TriggeredAlert } from "../../../../core/monitoring/AlertRules";
import {
  checkAll,
  type CircuitBreakerHealthEntry,
  type SystemHealthSummary,
} from "../../../../core/monitoring/HealthCheckService";
import { MetricsCollector } from "../../../../core/monitoring/MetricsCollector";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { SystemHealthWidget } from "../components/SystemHealthWidget";
import styles from "./MonitoringPage.module.css";

type AutoRefreshInterval = 0 | 30 | 60;

function formatUptime(startMs: number): string {
  const elapsed = Date.now() - startMs;
  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function computePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, idx)];
}

/** Session start timestamp for uptime display. */
const SESSION_START = Date.now();

export function MonitoringPage() {
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [metricsSnapshot, setMetricsSnapshot] = useState<ReturnType<typeof MetricsCollector.getMetrics> | null>(null);
  const [healthSummary, setHealthSummary] = useState<SystemHealthSummary | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<AutoRefreshInterval>(60);
  const [lastRefreshAt, setLastRefreshAt] = useState<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setAlerts(AlertRulesEngine.getHistory(50));
    setMetricsSnapshot(MetricsCollector.getMetrics());
    try {
      const summary = await checkAll();
      setHealthSummary(summary);
    } catch {
      // Health check itself failed -- keep previous state
    }
    setLastRefreshAt(Date.now());
  }, []);

  useEffect(() => {
    AlertRulesEngine.start();
    refresh();
  }, [refresh]);

  // Auto-refresh management
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoRefresh > 0) {
      intervalRef.current = setInterval(refresh, autoRefresh * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refresh]);

  // -- Derived data --
  const counters = metricsSnapshot?.counters ?? {};
  const gauges = metricsSnapshot?.gauges ?? {};
  const timings = metricsSnapshot?.timings ?? {};

  // Business metrics
  const ordersCreated = counters["order.created"] ?? 0;
  const ordersPaid = counters["order.paid"] ?? 0;
  const ordersCancelled = counters["order.cancelled"] ?? 0;
  const paymentSuccess = counters["payment.success"] ?? 0;
  const paymentFailed = counters["payment.failed"] ?? 0;
  const paymentTotal = paymentSuccess + paymentFailed;
  const paymentSuccessRate = paymentTotal > 0 ? Math.round((paymentSuccess / paymentTotal) * 100) : 100;
  const activeTables = gauges["tables.active"] ?? 0;

  // Infrastructure metrics
  const circuitBreakers: CircuitBreakerHealthEntry[] = healthSummary?.circuitBreakers ?? [];
  const syncQueueDepth = gauges["sync.queue_length"] ?? 0;
  const syncPushCount = counters["sync.push"] ?? 0;
  const syncConflicts = counters["sync.conflict"] ?? 0;
  const apiLatency = timings["api.latency"];
  const apiErrors = counters["api.error"] ?? 0;

  // Active alerts (last 24h equivalent -- since these are session-scoped, show all)
  const activeAlerts = alerts.filter((a) => {
    const age = Date.now() - new Date(a.timestamp).getTime();
    return age < 24 * 60 * 60 * 1000;
  });
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");
  const warningAlerts = activeAlerts.filter((a) => a.severity === "warning");

  // Alert rules for configuration display
  const allRules: AlertRule[] = AlertRulesEngine.getRules();

  // Raw metrics for the expandable section
  const counterEntries = metricsSnapshot ? Object.entries(metricsSnapshot.counters) : [];
  const gaugeEntries = metricsSnapshot ? Object.entries(metricsSnapshot.gauges) : [];
  const timingEntries = metricsSnapshot ? Object.entries(metricsSnapshot.timings) : [];

  return (
    <section className={`${styles.page} page-enter admin-content-page`}>
      <AdminPageHeader
        title="System Monitoring"
        subtitle="Real-time system health, metrics, and alert history."
        actions={
          <div className={styles.refreshControls}>
            <span className={styles.uptimeLabel}>
              Session: {formatUptime(SESSION_START)}
            </span>
            <span className={styles.lastRefreshLabel}>
              Updated: {new Date(lastRefreshAt).toLocaleTimeString()}
            </span>
            <select
              className={styles.refreshSelect}
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(Number(e.target.value) as AutoRefreshInterval)}
              aria-label="Auto-refresh interval"
            >
              <option value={30}>Auto: 30s</option>
              <option value={60}>Auto: 60s</option>
              <option value={0}>Off</option>
            </select>
            <button type="button" className={styles.refreshBtn} onClick={refresh}>
              Refresh Now
            </button>
          </div>
        }
      />

      {/* System Health Widget */}
      <div className={styles.widgetRow}>
        <SystemHealthWidget />
      </div>

      {/* Business Metrics */}
      <div className={styles.metricsSection}>
        <h2 className={styles.sectionTitle}>Business Metrics</h2>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Orders Created</span>
            <span className={styles.metricValue}>{ordersCreated}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Orders Paid</span>
            <span className={styles.metricValue}>{ordersPaid}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Orders Cancelled</span>
            <span className={`${styles.metricValue} ${ordersCancelled > 0 ? styles.metricWarn : ""}`}>
              {ordersCancelled}
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Payment Success Rate</span>
            <span className={`${styles.metricValue} ${paymentSuccessRate < 90 ? styles.metricDanger : ""}`}>
              {paymentSuccessRate}%
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Payments (OK / Fail)</span>
            <span className={styles.metricValue}>
              {paymentSuccess} / <span className={paymentFailed > 0 ? styles.metricDanger : ""}>{paymentFailed}</span>
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Active Tables</span>
            <span className={styles.metricValue}>{activeTables}</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Metrics */}
      <div className={styles.metricsSection}>
        <h2 className={styles.sectionTitle}>Infrastructure Metrics</h2>
        <div className={styles.metricsGrid}>
          {/* Circuit Breakers */}
          {circuitBreakers.length > 0 ? (
            circuitBreakers.map((cb) => (
              <div key={cb.name} className={styles.metricCard}>
                <span className={styles.metricName}>CB: {cb.name}</span>
                <span
                  className={`${styles.metricValue} ${
                    cb.state === "OPEN"
                      ? styles.metricDanger
                      : cb.state === "HALF_OPEN"
                        ? styles.metricWarn
                        : ""
                  }`}
                >
                  {cb.state}
                </span>
              </div>
            ))
          ) : (
            <div className={styles.metricCard}>
              <span className={styles.metricName}>Circuit Breakers</span>
              <span className={styles.metricValue}>None registered</span>
            </div>
          )}

          {/* Sync Queue */}
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Sync Queue Depth</span>
            <span className={`${styles.metricValue} ${syncQueueDepth > 50 ? styles.metricDanger : syncQueueDepth > 20 ? styles.metricWarn : ""}`}>
              {syncQueueDepth}
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Sync Pushes</span>
            <span className={styles.metricValue}>{syncPushCount}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Sync Conflicts</span>
            <span className={`${styles.metricValue} ${syncConflicts > 0 ? styles.metricWarn : ""}`}>
              {syncConflicts}
            </span>
          </div>

          {/* API Latency */}
          {apiLatency ? (
            <>
              <div className={styles.metricCard}>
                <span className={styles.metricName}>API p50</span>
                <span className={styles.metricValue}>{apiLatency.avg}ms</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricName}>API p95</span>
                <span className={styles.metricValue}>
                  {computePercentile(
                    Array.from({ length: apiLatency.count }, (_, i) =>
                      apiLatency.min + ((apiLatency.max - apiLatency.min) * i) / Math.max(apiLatency.count - 1, 1)
                    ).sort((a, b) => a - b),
                    95,
                  ).toFixed(0)}ms
                </span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricName}>API p99</span>
                <span className={styles.metricValue}>
                  {computePercentile(
                    Array.from({ length: apiLatency.count }, (_, i) =>
                      apiLatency.min + ((apiLatency.max - apiLatency.min) * i) / Math.max(apiLatency.count - 1, 1)
                    ).sort((a, b) => a - b),
                    99,
                  ).toFixed(0)}ms
                </span>
              </div>
            </>
          ) : (
            <div className={styles.metricCard}>
              <span className={styles.metricName}>API Latency</span>
              <span className={styles.metricValue}>No data</span>
            </div>
          )}

          {/* Error Rate */}
          <div className={styles.metricCard}>
            <span className={styles.metricName}>API Errors</span>
            <span className={`${styles.metricValue} ${apiErrors > 0 ? styles.metricDanger : ""}`}>
              {apiErrors}
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricName}>Error Rate</span>
            <span
              className={`${styles.metricValue} ${
                apiLatency && apiLatency.count > 0 && apiErrors / apiLatency.count > 0.05
                  ? styles.metricDanger
                  : ""
              }`}
            >
              {apiLatency && apiLatency.count > 0
                ? `${((apiErrors / apiLatency.count) * 100).toFixed(1)}%`
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className={styles.alertsSection}>
        <h2 className={styles.sectionTitle}>Alerts</h2>

        {/* Alert Summary Bar */}
        <div className={styles.alertSummaryBar}>
          <div className={`${styles.alertSummaryItem} ${criticalAlerts.length > 0 ? styles.alertSummaryCritical : ""}`}>
            <span className={styles.alertSummaryCount}>{criticalAlerts.length}</span>
            <span className={styles.alertSummaryLabel}>Critical</span>
          </div>
          <div className={`${styles.alertSummaryItem} ${warningAlerts.length > 0 ? styles.alertSummaryWarning : ""}`}>
            <span className={styles.alertSummaryCount}>{warningAlerts.length}</span>
            <span className={styles.alertSummaryLabel}>Warning</span>
          </div>
          <div className={styles.alertSummaryItem}>
            <span className={styles.alertSummaryCount}>{allRules.length}</span>
            <span className={styles.alertSummaryLabel}>Rules Active</span>
          </div>
        </div>

        {/* Alert Rules Config */}
        <details className={styles.alertRulesDetails}>
          <summary className={styles.alertRulesSummary}>
            Alert Rules Configuration ({allRules.length} rules)
          </summary>
          <div className={styles.alertRulesGrid}>
            {allRules.map((rule) => (
              <div key={rule.id} className={styles.alertRuleCard}>
                <div className={styles.alertRuleHeader}>
                  <span className={`${styles.alertRuleSeverity} ${
                    rule.severity === "critical" ? styles.severityCritical : styles.severityWarning
                  }`}>
                    {rule.severity.toUpperCase()}
                  </span>
                  <span className={styles.alertRuleId}>{rule.id}</span>
                </div>
                <div className={styles.alertRuleName}>{rule.name}</div>
                <div className={styles.alertRuleDesc}>{rule.description}</div>
              </div>
            ))}
          </div>
        </details>

        {/* Alert History */}
        <h3 className={styles.groupTitle}>Alert History (this session)</h3>
        {activeAlerts.length === 0 ? (
          <p className={styles.emptyState}>No alerts triggered this session.</p>
        ) : (
          <div className={styles.alertList}>
            {activeAlerts.map((alert, i) => (
              <div
                key={`${alert.ruleId}-${alert.timestamp}-${i}`}
                className={`${styles.alertItem} ${
                  alert.severity === "critical" ? styles.alertCritical : styles.alertWarning
                }`}
              >
                <div className={styles.alertHeader}>
                  <span className={styles.alertSeverity}>{alert.severity.toUpperCase()}</span>
                  <span className={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={styles.alertName}>{alert.ruleName}</div>
                <div className={styles.alertMessage}>{alert.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Metrics (Expandable) */}
      <details className={styles.rawMetricsDetails}>
        <summary className={styles.sectionTitle}>
          Raw Metrics (this session)
        </summary>
        <div className={styles.rawMetricsContent}>
          {counterEntries.length > 0 && (
            <div className={styles.metricsGroup}>
              <h3 className={styles.groupTitle}>Counters</h3>
              <div className={styles.metricsGrid}>
                {counterEntries.map(([name, value]) => (
                  <div key={name} className={styles.metricCard}>
                    <span className={styles.metricName}>{name}</span>
                    <span className={styles.metricValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gaugeEntries.length > 0 && (
            <div className={styles.metricsGroup}>
              <h3 className={styles.groupTitle}>Gauges</h3>
              <div className={styles.metricsGrid}>
                {gaugeEntries.map(([name, value]) => (
                  <div key={name} className={styles.metricCard}>
                    <span className={styles.metricName}>{name}</span>
                    <span className={styles.metricValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {timingEntries.length > 0 && (
            <div className={styles.metricsGroup}>
              <h3 className={styles.groupTitle}>Timings</h3>
              <div className={styles.metricsGrid}>
                {timingEntries.map(([name, summary]) => (
                  <div key={name} className={styles.metricCard}>
                    <span className={styles.metricName}>{name}</span>
                    <span className={styles.metricValue}>
                      avg {summary.avg}ms (n={summary.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {counterEntries.length === 0 && gaugeEntries.length === 0 && timingEntries.length === 0 && (
            <p className={styles.emptyState}>No metrics collected yet this session.</p>
          )}
        </div>
      </details>
    </section>
  );
}
