/**
 * KpiCard — Reusable KPI display card for the TPV Dashboard.
 *
 * Shows a metric label, formatted value, optional delta (% change),
 * and an optional icon. Dark theme (#18181b background).
 */

import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number | null;
  icon?: ReactNode;
}

export function KpiCard({ label, value, delta, icon }: KpiCardProps) {
  const deltaColor =
    delta != null && delta > 0
      ? "#22c55e"
      : delta != null && delta < 0
        ? "#ef4444"
        : "var(--text-tertiary, #666)";

  const deltaLabel =
    delta != null
      ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`
      : null;

  return (
    <div
      style={{
        background: "#18181b",
        borderRadius: 16,
        padding: "20px 24px",
        border: "1px solid #27272a",
        flex: 1,
        minWidth: 180,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            color: "var(--text-tertiary, #a1a1aa)",
            fontSize: 13,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
        {icon && (
          <span style={{ color: "#f97316", fontSize: 20 }}>{icon}</span>
        )}
      </div>
      <div
        style={{
          color: "var(--text-primary, #fafafa)",
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: deltaLabel ? 8 : 0,
        }}
      >
        {value}
      </div>
      {deltaLabel && (
        <div style={{ color: deltaColor, fontSize: 13, fontWeight: 500 }}>
          {deltaLabel} vs {new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
            new Date(Date.now() - 86400000),
          )}
        </div>
      )}
    </div>
  );
}
