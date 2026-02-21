import React from "react";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";

// Types derived from tokens
type TextSize = keyof typeof typography.size;
type TextWeight = keyof typeof typography.weight;
export type TextColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "quaternary"
  | "inverse" // Text keys
  | "action"
  | "warning"
  | "success"
  | "destructive"
  | "info"
  | "error"; // Semantic keys (mapped)

interface TextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "div" | "span" | "p";
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  align?: "left" | "center" | "right";
  truncate?: boolean;
  style?: React.CSSProperties;
  className?: string; // Unlocked
}

export const Text: React.FC<TextProps> = ({
  children,
  as: Component = "span",
  size = "base",
  weight = "regular",
  color = "primary",
  align = "left",
  truncate = false,
  style: customStyle,
  className,
}) => {
  // Resolve Color from Tokens
  const resolveColor = (c: TextColor): string => {
    // 1. Check if it's a direct text color
    if (c in colors.text) return colors.text[c as keyof typeof colors.text];

    // 2. Check if it's action/semantic
    if (c === "action") return colors.action.base;
    if (c === "warning") return colors.warning.base;
    if (c === "success") return colors.success.base;
    if (c === "destructive") return colors.destructive.base;
    if (c === "error") return colors.destructive.base;
    if (c === "info") return colors.info.base;

    return colors.text.primary; // Fallback
  };

  const baseStyle: React.CSSProperties = {
    fontFamily: typography.family.sans,
    fontSize: typography.size[size],
    fontWeight: typography.weight[weight],
    color: resolveColor(color),
    textAlign: align,
    lineHeight:
      size === "2xl" || size === "3xl" || size === "4xl"
        ? typography.leading.none
        : typography.leading.normal,
    // Truncation
    ...(truncate && {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "block",
    }),
    ...customStyle,
  };

  return (
    <Component style={baseStyle} className={className}>
      {children}
    </Component>
  );
};
