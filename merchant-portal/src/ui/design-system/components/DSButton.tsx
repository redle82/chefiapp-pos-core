/**
 * DSButton — Design System Button
 *
 * Unified button component using design tokens.
 * Replaces hardcoded inline-style buttons across the app.
 *
 * Usage:
 *   <DSButton variant="primary" onClick={...}>Save</DSButton>
 *   <DSButton variant="ghost" size="sm">Cancel</DSButton>
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type DSButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type DSButtonSize = "sm" | "md" | "lg";

interface DSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DSButtonVariant;
  size?: DSButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<DSButtonVariant, { bg: string; color: string; border: string; hoverBg: string }> = {
  primary: { bg: "#f59e0b", color: "#0a0a0a", border: "none", hoverBg: "#d97706" },
  secondary: { bg: "transparent", color: "#d4d4d4", border: "1px solid #262626", hoverBg: "#1a1a1a" },
  ghost: { bg: "transparent", color: "#a3a3a3", border: "none", hoverBg: "rgba(255,255,255,0.05)" },
  danger: { bg: "#ef4444", color: "#fff", border: "none", hoverBg: "#dc2626" },
  success: { bg: "#22c55e", color: "#fff", border: "none", hoverBg: "#16a34a" },
};

const SIZE_STYLES: Record<DSButtonSize, { height: number; padding: string; fontSize: number; borderRadius: number }> = {
  sm: { height: 32, padding: "0 12px", fontSize: 12, borderRadius: 6 },
  md: { height: 40, padding: "0 16px", fontSize: 13, borderRadius: 8 },
  lg: { height: 48, padding: "0 24px", fontSize: 14, borderRadius: 10 },
};

export function DSButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: DSButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: s.borderRadius,
        background: disabled ? "#262626" : v.bg,
        color: disabled ? "#525252" : v.color,
        border: v.border,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "background 0.15s ease, opacity 0.15s ease",
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = v.hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = v.bg;
      }}
      {...props}
    >
      {loading && <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  );
}
