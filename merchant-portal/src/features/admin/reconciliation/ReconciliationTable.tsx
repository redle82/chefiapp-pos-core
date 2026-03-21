import React from "react";
import { Badge } from "../../../ui/design-system/Badge";
import type { ReconciliationDiscrepancy } from "../../../core/reconciliation/coreReconciliationApi";

interface ReconciliationTableProps {
  discrepancies: ReconciliationDiscrepancy[];
  formatCents: (cents: number) => string;
}

function StatusBadge({ diff }: { diff: number }) {
  if (diff === 0) return <Badge label="OK" variant="success" />;
  if (Math.abs(diff) < 100) return <Badge label="Minor" variant="warning" />;
  return <Badge label="Critical" variant="error" />;
}

export function ReconciliationTable({
  discrepancies,
  formatCents,
}: ReconciliationTableProps) {
  if (discrepancies.length === 0) {
    return null;
  }
  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: 8,
        border: "1px solid var(--border-default, #e5e7eb)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "var(--surface-subtle, #f9fafb)" }}>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>
              Order ID
            </th>
            <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>
              Expected
            </th>
            <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>
              Received
            </th>
            <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>
              Difference
            </th>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>
              Provider
            </th>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {discrepancies.map((d) => (
            <tr
              key={d.order_id}
              style={{
                borderTop: "1px solid var(--border-default, #e5e7eb)",
              }}
            >
              <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>
                {d.order_id.slice(0, 8)}…
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                {formatCents(d.expected)}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                {formatCents(d.received)}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  color: d.difference !== 0 ? "var(--text-error, #dc2626)" : undefined,
                }}
              >
                {formatCents(d.difference)}
              </td>
              <td style={{ padding: "12px 16px" }}>{d.provider ?? "—"}</td>
              <td style={{ padding: "12px 16px" }}>
                <StatusBadge diff={d.difference} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
