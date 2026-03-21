import React from "react";
import type { OrgLocationRow } from "../../../core/enterprise/coreOrgConsolidationApi";

interface OrgReconciliationTableProps {
  locations: OrgLocationRow[];
  formatCents: (cents: number) => string;
}

function statusLabel(s: "green" | "yellow" | "red"): string {
  if (s === "green") return "✓ OK";
  if (s === "yellow") return "⚠ Atenção";
  return "✗ Crítico";
}

export function OrgReconciliationTable({
  locations,
  formatCents,
}: OrgReconciliationTableProps) {
  if (!locations.length) return null;

  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid var(--border-default, #e5e7eb)",
        borderRadius: 8,
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
          <tr
            style={{
              backgroundColor: "var(--surface-subtle, #f9fafb)",
              borderBottom: "1px solid var(--border-default, #e5e7eb)",
            }}
          >
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: 600,
              }}
            >
              Restaurante
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              Receita
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              Discrepância
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {locations.map((row) => (
            <tr
              key={row.restaurant_id}
              style={{
                borderBottom: "1px solid var(--border-default, #e5e7eb)",
              }}
            >
              <td style={{ padding: "12px 16px" }}>{row.restaurant_name}</td>
              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                {formatCents(row.revenue_cents)}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                {formatCents(row.discrepancy_cents)}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor:
                      row.status === "green"
                        ? "rgba(76, 175, 80, 0.15)"
                        : row.status === "yellow"
                          ? "rgba(255, 152, 0, 0.15)"
                          : "rgba(239, 83, 80, 0.15)",
                    color:
                      row.status === "green"
                        ? "#2e7d32"
                        : row.status === "yellow"
                          ? "#e65100"
                          : "#c62828",
                  }}
                >
                  {statusLabel(row.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
