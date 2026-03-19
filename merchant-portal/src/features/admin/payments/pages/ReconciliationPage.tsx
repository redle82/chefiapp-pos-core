/**
 * ReconciliationPage - Stripe payment reconciliation UI.
 *
 * Allows managers to trigger a manual reconciliation between Stripe payment
 * intents and local order statuses. Shows a summary report with mismatches
 * and auto-fixes.
 */

import { useCallback, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  reconcilePayments,
  saveReconciliationReport,
  type ReconciliationReport,
} from "../../../../core/payment/PaymentReconciler";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

type ReconcileTimeframe = "1h" | "6h" | "24h" | "7d";

const TIMEFRAME_MS: Record<ReconcileTimeframe, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

const TIMEFRAME_LABELS: Record<ReconcileTimeframe, string> = {
  "1h": "Last hour",
  "6h": "Last 6 hours",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
};

export function ReconciliationPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [timeframe, setTimeframe] = useState<ReconcileTimeframe>("24h");
  const [error, setError] = useState<string | null>(null);

  const handleReconcile = useCallback(async () => {
    if (!restaurantId) {
      setError("No restaurant selected.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const since = new Date(Date.now() - TIMEFRAME_MS[timeframe]);
      const result = await reconcilePayments(restaurantId, since);
      setReport(result);

      // Persist the report for audit
      await saveReconciliationReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reconciliation failed.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, timeframe]);

  return (
    <div className="page-enter admin-content-page space-y-6">
      <AdminPageHeader
        title="Payment Reconciliation"
        subtitle="Compare Stripe payment intents with local order statuses and auto-fix mismatches."
      />

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "var(--card-bg-on-dark)",
            borderRadius: 10,
            padding: 4,
            border: "1px solid var(--surface-border)",
          }}
        >
          {(Object.keys(TIMEFRAME_LABELS) as ReconcileTimeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                background:
                  timeframe === tf ? "var(--color-primary)" : "transparent",
                color:
                  timeframe === tf
                    ? "var(--text-inverse)"
                    : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleReconcile}
          disabled={loading || !restaurantId}
          style={{
            padding: "8px 20px",
            background: loading
              ? "var(--surface-border)"
              : "var(--color-primary)",
            color: "var(--text-inverse)",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {loading ? "Reconciling..." : "Reconcile Payments"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--status-error-bg)",
            color: "var(--color-error)",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Report */}
      {report && <ReconciliationReportView report={report} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report sub-component
// ---------------------------------------------------------------------------

function ReconciliationReportView({
  report,
}: {
  report: ReconciliationReport;
}) {
  const hasIssues = report.mismatches.length > 0 || report.errors.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        <KPICard label="Checked" value={report.totalChecked} />
        <KPICard label="Matched" value={report.matched} variant="success" />
        <KPICard
          label="Auto-fixed"
          value={report.autoFixed}
          variant={report.autoFixed > 0 ? "warning" : "neutral"}
        />
        <KPICard
          label="Needs review"
          value={report.needsReview}
          variant={report.needsReview > 0 ? "error" : "neutral"}
        />
      </div>

      {/* Timestamp */}
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        Reconciled at {new Date(report.timestamp).toLocaleString()} | Period
        since {new Date(report.since).toLocaleString()}
      </p>

      {/* No issues */}
      {!hasIssues && (
        <div
          style={{
            padding: "16px 20px",
            background: "var(--status-success-bg)",
            color: "var(--color-success)",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          All payments are in sync. No mismatches found.
        </div>
      )}

      {/* Mismatches table */}
      {report.mismatches.length > 0 && (
        <div
          style={{
            border: "1px solid var(--surface-border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "var(--card-bg-on-dark)",
              borderBottom: "1px solid var(--surface-border)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--text-primary)",
            }}
          >
            Mismatches ({report.mismatches.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--card-bg-on-dark)",
                    borderBottom: "1px solid var(--surface-border)",
                  }}
                >
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>PI</th>
                  <th style={thStyle}>Stripe</th>
                  <th style={thStyle}>Local</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {report.mismatches.map((m, i) => (
                  <tr
                    key={`${m.orderId}-${i}`}
                    style={{
                      borderBottom: "1px solid var(--surface-border)",
                    }}
                  >
                    <td style={tdStyle}>
                      <code style={codeStyle}>{m.orderId.slice(-8)}</code>
                    </td>
                    <td style={tdStyle}>
                      <code style={codeStyle}>
                        {m.paymentIntentId.slice(-8)}
                      </code>
                    </td>
                    <td style={tdStyle}>{m.stripeStatus}</td>
                    <td style={tdStyle}>{m.localOrderStatus}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          background:
                            m.action === "auto_fixed"
                              ? "var(--status-success-bg)"
                              : "var(--status-warning-bg)",
                          color:
                            m.action === "auto_fixed"
                              ? "var(--color-success)"
                              : "var(--color-warning)",
                        }}
                      >
                        {m.action === "auto_fixed" ? "Fixed" : "Review"}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        maxWidth: 300,
                        whiteSpace: "normal",
                      }}
                    >
                      {m.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Errors */}
      {report.errors.length > 0 && (
        <div
          style={{
            border: "1px solid var(--color-error)",
            borderRadius: 10,
            padding: 16,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--color-error)",
            }}
          >
            Errors ({report.errors.length})
          </p>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 20px",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            {report.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KPICard({
  label,
  value,
  variant = "neutral",
}: {
  label: string;
  value: number;
  variant?: "neutral" | "success" | "warning" | "error";
}) {
  const colorMap = {
    neutral: "var(--text-primary)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        background: "var(--card-bg-on-dark)",
        border: "1px solid var(--surface-border)",
        borderRadius: 10,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: colorMap[variant],
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table styles
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "var(--text-secondary)",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: "var(--text-primary)",
  whiteSpace: "nowrap",
};

const codeStyle: React.CSSProperties = {
  background: "var(--surface-overlay)",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "monospace",
};
