import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../core/supabase";

/**
 * Conflict Metrics Dashboard Component
 *
 * Displays real-time conflict metrics for operational sovereignty monitoring.
 * Tracks sync conflicts, RBAC violations, and system health.
 */

// Types
interface ConflictEvent {
  id: string;
  type:
    | "sync_conflict"
    | "rbac_violation"
    | "idempotency_duplicate"
    | "offline_rejected";
  severity: "critical" | "warning" | "info";
  description: string;
  aggregate_id?: string;
  aggregate_type?: string;
  resolution?: string;
  occurred_at: string;
  actor_id?: string;
  device_id?: string;
}

interface ConflictMetrics {
  total_conflicts_24h: number;
  sync_conflicts: number;
  rbac_violations: number;
  idempotency_hits: number;
  offline_rejections: number;
  conflict_rate_percent: number;
  last_conflict_at: string | null;
  resolution_rate_percent: number;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "critical";
  message: string;
}

// Severity colors
const SEVERITY_COLORS = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
} as const;

const STATUS_COLORS = {
  healthy: "#22c55e",
  degraded: "#f59e0b",
  critical: "#ef4444",
} as const;

// Component
export function ConflictMetricsDashboard() {
  const [metrics, setMetrics] = useState<ConflictMetrics | null>(null);
  const [recentConflicts, setRecentConflicts] = useState<ConflictEvent[]>([]);
  const [health, setHealth] = useState<HealthStatus>({
    status: "healthy",
    message: "Sistema operando normalmente",
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Calculate health from metrics
  const calculateHealth = useCallback((m: ConflictMetrics): HealthStatus => {
    if (m.rbac_violations > 0) {
      return {
        status: "critical",
        message: `${m.rbac_violations} violações de RBAC detectadas!`,
      };
    }
    if (m.conflict_rate_percent > 5) {
      return {
        status: "degraded",
        message: `Taxa de conflitos alta: ${m.conflict_rate_percent.toFixed(
          1,
        )}%`,
      };
    }
    if (m.sync_conflicts > 10) {
      return {
        status: "degraded",
        message: `${m.sync_conflicts} conflitos de sync nas últimas 24h`,
      };
    }
    return { status: "healthy", message: "Sistema operando normalmente" };
  }, []);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Query app_logs for conflict events
      const { data: logs, error } = await supabase
        .from("app_logs")
        .select("*")
        .gte("created_at", yesterday.toISOString())
        .or("level.eq.warn,level.eq.error")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("[ConflictDashboard] Fetch error:", error);
        return;
      }

      // Parse logs into conflict events
      const conflicts: ConflictEvent[] = [];
      let syncConflicts = 0;
      let rbacViolations = 0;
      let idempotencyHits = 0;
      let offlineRejections = 0;

      for (const log of (logs || []) as Array<{
        id: string;
        message?: string;
        context?: Record<string, unknown>;
        created_at: string;
      }>) {
        const message = log.message?.toLowerCase() || "";
        const context = log.context || {};

        // Detect conflict types from log messages
        if (message.includes("conflict") || message.includes("conflito")) {
          syncConflicts++;
          conflicts.push({
            id: log.id,
            type: "sync_conflict",
            severity: "warning",
            description: log.message || "",
            aggregate_id: String(
              context.order_id || context.aggregate_id || "",
            ),
            aggregate_type: String(context.aggregate_type || "order"),
            occurred_at: log.created_at,
            actor_id: String(context.user_id || ""),
            resolution: String(context.resolution || ""),
          });
        }

        if (
          message.includes("unauthorized") ||
          message.includes("permission") ||
          message.includes("rbac") ||
          message.includes("rls")
        ) {
          rbacViolations++;
          conflicts.push({
            id: log.id,
            type: "rbac_violation",
            severity: "critical",
            description: log.message || "",
            occurred_at: log.created_at,
            actor_id: String(context.user_id || ""),
          });
        }

        if (
          message.includes("idempotency") ||
          message.includes("duplicate") ||
          message.includes("409")
        ) {
          idempotencyHits++;
          conflicts.push({
            id: log.id,
            type: "idempotency_duplicate",
            severity: "info",
            description: log.message || "",
            aggregate_id: String(context.idempotency_key || ""),
            occurred_at: log.created_at,
          });
        }

        if (
          message.includes("offline") &&
          (message.includes("reject") || message.includes("failed"))
        ) {
          offlineRejections++;
          conflicts.push({
            id: log.id,
            type: "offline_rejected",
            severity: "warning",
            description: log.message || "",
            occurred_at: log.created_at,
          });
        }
      }

      // Calculate total events (approximation from logs)
      const totalEvents = logs?.length || 1;
      const totalConflicts = syncConflicts + rbacViolations + offlineRejections;
      const conflictRate = (totalConflicts / Math.max(totalEvents, 1)) * 100;

      // Calculate resolution rate
      const resolvedConflicts = conflicts.filter((c) => c.resolution).length;
      const resolutionRate =
        totalConflicts > 0 ? (resolvedConflicts / totalConflicts) * 100 : 100;

      const newMetrics: ConflictMetrics = {
        total_conflicts_24h: totalConflicts,
        sync_conflicts: syncConflicts,
        rbac_violations: rbacViolations,
        idempotency_hits: idempotencyHits,
        offline_rejections: offlineRejections,
        conflict_rate_percent: conflictRate,
        last_conflict_at: conflicts[0]?.occurred_at || null,
        resolution_rate_percent: resolutionRate,
      };

      setMetrics(newMetrics);
      setRecentConflicts(conflicts.slice(0, 10));
      setHealth(calculateHealth(newMetrics));
      setLastRefresh(new Date());
    } catch (err) {
      console.error("[ConflictDashboard] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [calculateHealth]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchMetrics();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Carregando métricas de conflito...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>⚔️ Conflict Metrics Dashboard</h2>
        <div style={styles.timestamp}>
          Última atualização: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Health Banner */}
      <div
        style={{
          ...styles.healthBanner,
          backgroundColor: STATUS_COLORS[health.status],
        }}
      >
        <span style={styles.healthIcon}>
          {health.status === "healthy"
            ? "✅"
            : health.status === "degraded"
            ? "⚠️"
            : "🚨"}
        </span>
        <span style={styles.healthText}>{health.message}</span>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div style={styles.metricsGrid}>
          <MetricCard
            title="Conflitos (24h)"
            value={metrics.total_conflicts_24h}
            color={metrics.total_conflicts_24h > 10 ? "#f59e0b" : "#22c55e"}
            icon="🔄"
          />
          <MetricCard
            title="Sync Conflicts"
            value={metrics.sync_conflicts}
            color={metrics.sync_conflicts > 5 ? "#f59e0b" : "#3b82f6"}
            icon="🔗"
          />
          <MetricCard
            title="RBAC Violations"
            value={metrics.rbac_violations}
            color={metrics.rbac_violations > 0 ? "#ef4444" : "#22c55e"}
            icon="🛡️"
          />
          <MetricCard
            title="Idempotency Hits"
            value={metrics.idempotency_hits}
            color="#3b82f6"
            icon="🔂"
            subtitle="(dedup funcionando)"
          />
          <MetricCard
            title="Offline Rejections"
            value={metrics.offline_rejections}
            color={metrics.offline_rejections > 3 ? "#f59e0b" : "#22c55e"}
            icon="📴"
          />
          <MetricCard
            title="Taxa de Resolução"
            value={`${metrics.resolution_rate_percent.toFixed(0)}%`}
            color={metrics.resolution_rate_percent > 80 ? "#22c55e" : "#f59e0b"}
            icon="✅"
          />
        </div>
      )}

      {/* Recent Conflicts Table */}
      <div style={styles.tableContainer}>
        <h3 style={styles.tableTitle}>Conflitos Recentes</h3>
        {recentConflicts.length === 0 ? (
          <div style={styles.emptyState}>
            ✅ Nenhum conflito nas últimas 24 horas
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Severidade</th>
                <th style={styles.th}>Descrição</th>
                <th style={styles.th}>Hora</th>
                <th style={styles.th}>Resolução</th>
              </tr>
            </thead>
            <tbody>
              {recentConflicts.map((conflict) => (
                <tr key={conflict.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.typeTag}>{conflict.type}</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.severityBadge,
                        backgroundColor: SEVERITY_COLORS[conflict.severity],
                      }}
                    >
                      {conflict.severity}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {conflict.description.substring(0, 80)}...
                  </td>
                  <td style={styles.td}>
                    {new Date(conflict.occurred_at).toLocaleTimeString()}
                  </td>
                  <td style={styles.td}>{conflict.resolution || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Refresh Button */}
      <button style={styles.refreshButton} onClick={fetchMetrics}>
        🔄 Atualizar Agora
      </button>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  color,
  icon,
  subtitle,
}: {
  title: string;
  value: number | string;
  color: string;
  icon: string;
  subtitle?: string;
}) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricIcon}>{icon}</div>
      <div style={{ ...styles.metricValue, color }}>{value}</div>
      <div style={styles.metricTitle}>{title}</div>
      {subtitle && <div style={styles.metricSubtitle}>{subtitle}</div>}
    </div>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "24px",
    backgroundColor: "#0f172a",
    borderRadius: "12px",
    color: "#e2e8f0",
    fontFamily: "system-ui, -apple-system, sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    margin: 0,
    color: "#f8fafc",
  },
  timestamp: {
    fontSize: "12px",
    color: "#64748b",
  },
  healthBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 20px",
    borderRadius: "8px",
    marginBottom: "24px",
  },
  healthIcon: {
    fontSize: "24px",
  },
  healthText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  metricCard: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  metricIcon: {
    fontSize: "28px",
    marginBottom: "8px",
  },
  metricValue: {
    fontSize: "36px",
    fontWeight: "700",
    lineHeight: 1.2,
  },
  metricTitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  metricSubtitle: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
  },
  tableContainer: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    overflowX: "auto",
  },
  tableTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#f8fafc",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#22c55e",
    fontSize: "18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "1px solid #334155",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  tr: {
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: "12px 16px",
    fontSize: "14px",
    color: "#e2e8f0",
  },
  typeTag: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#334155",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  severityBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  refreshButton: {
    display: "block",
    width: "100%",
    padding: "14px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

export default ConflictMetricsDashboard;
