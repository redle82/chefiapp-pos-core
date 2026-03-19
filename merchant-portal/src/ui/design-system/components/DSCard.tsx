/**
 * DSCard — Design System Card
 *
 * Consistent card/panel component with dark theme styling.
 *
 * Usage:
 *   <DSCard>Content</DSCard>
 *   <DSCard padding="lg" hover>Clickable card</DSCard>
 */
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type DSCardPadding = "none" | "sm" | "md" | "lg" | "xl";

interface DSCardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: DSCardPadding;
  hover?: boolean;
  selected?: boolean;
  noBorder?: boolean;
  children: ReactNode;
}

const PADDING_MAP: Record<DSCardPadding, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export function DSCard({
  padding = "lg",
  hover = false,
  selected = false,
  noBorder = false,
  children,
  style,
  ...props
}: DSCardProps) {
  const baseStyle: CSSProperties = {
    background: "#171717",
    borderRadius: 12,
    padding: PADDING_MAP[padding],
    border: noBorder ? "none" : `1px solid ${selected ? "#f59e0b" : "#262626"}`,
    transition: "border-color 0.15s ease, background 0.15s ease",
    cursor: hover ? "pointer" : undefined,
    ...style,
  };

  return (
    <div
      style={baseStyle}
      onMouseEnter={(e) => {
        if (hover) (e.currentTarget as HTMLDivElement).style.background = "#1a1a1a";
      }}
      onMouseLeave={(e) => {
        if (hover) (e.currentTarget as HTMLDivElement).style.background = "#171717";
      }}
      {...props}
    >
      {children}
    </div>
  );
}
