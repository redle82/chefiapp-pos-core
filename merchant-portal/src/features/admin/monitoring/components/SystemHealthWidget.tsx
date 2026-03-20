/**
 * SystemHealthWidget — Admin dashboard widget showing system health status
 *
 * Traffic light per service: green/amber/red.
 * Auto-refreshes every 60 seconds. Click to expand detailed results.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkAll,
  type HealthCheckResult,
  type HealthStatus,
  type SystemHealthSummary,
} from "../../../../core/monitoring/HealthCheckService";
import styles from "./SystemHealthWidget.module.css";

const REFRESH_INTERVAL_MS = 60_000;

const SERVICE_LABELS: Record<string, string> = {
  supabase: "Database",
  sync_engine: "Sync Engine",
  payment_providers: "Payments",
  printer: "Printer",
  service_worker: "Service Worker",
};

function statusBadgeClass(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return styles.badgeHealthy;
    case "degraded":
      return styles.badgeDegraded;
    case "down":
      return styles.badgeDown;
  }
}

function indicatorClass(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return `${styles.indicator} ${styles.indicatorHealthy}`;
    case "degraded":
      return `${styles.indicator} ${styles.indicatorDegraded}`;
    case "down":
      return `${styles.indicator} ${styles.indicatorDown}`;
  }
}

function statusPillClass(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return `${styles.statusPill} ${styles.statusHealthy}`;
    case "degraded":
      return `${styles.statusPill} ${styles.statusDegraded}`;
    case "down":
      return `${styles.statusPill} ${styles.statusDown}`;
  }
}

export function SystemHealthWidget() {
  const [summary, setSummary] = useState<SystemHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    try {
      const result = await checkAll();
      setSummary(result);
    } catch {
      // Health check itself failed — show error state
      setSummary({
        overall: "down",
        timestamp: new Date().toISOString(),
        checks: [],
        durationMs: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runCheck();
    intervalRef.current = setInterval(runCheck, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runCheck]);

  const toggleExpand = (name: string) => {
    setExpandedService((prev) => (prev === name ? null : name));
  };

  if (loading && !summary) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>Checking system health...</div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3 className={styles.title}>System Health</h3>
        <span className={`${styles.overallBadge} ${statusBadgeClass(summary.overall)}`}>
          <span className={indicatorClass(summary.overall)} />
          {summary.overall}
        </span>
      </div>

      <div className={styles.serviceList}>
        {summary.checks.map((check: HealthCheckResult) => (
          <div key={check.name}>
            <div
              className={styles.serviceRow}
              onClick={() => toggleExpand(check.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleExpand(check.name);
              }}
            >
              <div className={styles.serviceLeft}>
                <span className={indicatorClass(check.status)} />
                <span className={styles.serviceName}>
                  {SERVICE_LABELS[check.name] ?? check.name}
                </span>
              </div>
              <div className={styles.serviceRight}>
                <span className={styles.latency}>{check.latencyMs}ms</span>
                <span className={statusPillClass(check.status)}>{check.status}</span>
              </div>
            </div>
            {expandedService === check.name && check.details && (
              <div className={styles.detailsPanel}>
                {JSON.stringify(check.details, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.lastCheck}>
          Last check: {new Date(summary.timestamp).toLocaleTimeString()} ({summary.durationMs}ms)
        </span>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={runCheck}
          disabled={loading}
        >
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}
