/**
 * DSBadge — Design System Badge/Chip
 *
 * Status badges, labels, and category tags.
 *
 * Usage:
 *   <DSBadge variant="success">Active</DSBadge>
 *   <DSBadge variant="warning" size="sm">Pending</DSBadge>
 */
import type { CSSProperties, ReactNode } from "react";

export type DSBadgeVariant = "primary" | "success" | "warning" | "error" | "info" | "neutral";
export type DSBadgeSize = "sm" | "md";

interface DSBadgeProps {
  variant?: DSBadgeVariant;
  size?: DSBadgeSize;
  children: ReactNode;
  style?: CSSProperties;
}

const VARIANT_STYLES: Record<DSBadgeVariant, { bg: string; color: string }> = {
  primary: { bg: "rgba(245,158,11,0.13)", color: "#f59e0b" },
  success: { bg: "rgba(34,197,94,0.13)", color: "#22c55e" },
  warning: { bg: "rgba(245,158,11,0.13)", color: "#f59e0b" },
  error: { bg: "rgba(239,68,68,0.13)", color: "#ef4444" },
  info: { bg: "rgba(59,130,246,0.13)", color: "#3b82f6" },
  neutral: { bg: "rgba(82,82,82,0.2)", color: "#a3a3a3" },
};

const SIZE_STYLES: Record<DSBadgeSize, { padding: string; fontSize: number }> = {
  sm: { padding: "1px 6px", fontSize: 10 },
  md: { padding: "2px 10px", fontSize: 11 },
};

export function DSBadge({ variant = "neutral", size = "md", children, style }: DSBadgeProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        borderRadius: 9999,
        background: v.bg,
        color: v.color,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
