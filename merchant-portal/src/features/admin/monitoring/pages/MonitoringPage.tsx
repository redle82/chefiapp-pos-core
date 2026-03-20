/**
 * MonitoringPage — Admin page for system health and operational monitoring
 *
 * Aggregates SystemHealthWidget, metrics overview, and alert history.
 */

import { useEffect, useState } from "react";
import { AlertRulesEngine, type TriggeredAlert } from "../../../../core/monitoring/AlertRules";
import { MetricsCollector } from "../../../../core/monitoring/MetricsCollector";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { SystemHealthWidget } from "../components/SystemHealthWidget";
import styles from "./MonitoringPage.module.css";

export function MonitoringPage() {
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [metricsSnapshot, setMetricsSnapshot] = useState<ReturnType<typeof MetricsCollector.getMetrics> | null>(null);

  useEffect(() => {
    // Start alert evaluation
    AlertRulesEngine.start();

    const refresh = () => {
      setAlerts(AlertRulesEngine.getHistory(20));
      setMetricsSnapshot(MetricsCollector.getMetrics());
    };

    refresh();
    const interval = setInterval(refresh, 10_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const counterEntries = metricsSnapshot ? Object.entries(metricsSnapshot.counters) : [];
  const gaugeEntries = metricsSnapshot ? Object.entries(metricsSnapshot.gauges) : [];
  const timingEntries = metricsSnapshot ? Object.entries(metricsSnapshot.timings) : [];

  return (
    <section className={`${styles.page} page-enter admin-content-page`}>
      <AdminPageHeader
        title="System Monitoring"
        subtitle="Real-time system health, metrics, and alert history."
      />

      <div className={styles.widgetRow}>
        <SystemHealthWidget />
      </div>

      {/* Metrics Overview */}
      <div className={styles.metricsSection}>
        <h2 className={styles.sectionTitle}>Metrics (this session)</h2>

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

      {/* Alert History */}
      <div className={styles.alertsSection}>
        <h2 className={styles.sectionTitle}>Alert History</h2>
        {alerts.length === 0 ? (
          <p className={styles.emptyState}>No alerts triggered this session.</p>
        ) : (
          <div className={styles.alertList}>
            {alerts.map((alert, i) => (
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
    </section>
  );
}
