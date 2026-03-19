/**
 * DSKpiCard — Design System KPI Card
 *
 * Used across admin dashboards for key metrics.
 *
 * Usage:
 *   <DSKpiCard label="Revenue Today" value="€1,234.00" trend={12} />
 *   <DSKpiCard label="Orders" value="47" icon="📦" />
 */
import type { CSSProperties, ReactNode } from "react";

interface DSKpiCardProps {
  label: string;
  value: string | number;
  trend?: number; // percentage change, positive = up
  icon?: ReactNode;
  style?: CSSProperties;
}

export function DSKpiCard({ label, value, trend, icon, style }: DSKpiCardProps) {
  return (
    <div
      style={{
        background: "#171717",
        borderRadius: 12,
        padding: 20,
        border: "1px solid #262626",
        textAlign: "center",
        ...style,
      }}
    >
      {icon && <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>}
      <div style={{ color: "#a3a3a3", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ color: "#fafafa", fontSize: 28, fontWeight: 700 }}>{value}</div>
      {trend !== undefined && (
        <div
          style={{
            color: trend >= 0 ? "#22c55e" : "#ef4444",
            fontSize: 12,
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
