/**
 * DSPageHeader — Design System Page Header
 *
 * Consistent header for admin pages with title and actions.
 *
 * Usage:
 *   <DSPageHeader title="Orders" actions={<DSButton>Export</DSButton>} />
 */
import type { CSSProperties, ReactNode } from "react";

interface DSPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  style?: CSSProperties;
}

export function DSPageHeader({ title, subtitle, actions, style }: DSPageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        ...style,
      }}
    >
      <div>
        <h1 style={{ color: "#fafafa", fontSize: 24, fontWeight: 700, margin: 0 }}>{title}</h1>
        {subtitle && (
          <p style={{ color: "#a3a3a3", fontSize: 13, margin: "4px 0 0", lineHeight: 1.4 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}
