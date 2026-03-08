/**
 * VPC Tokens — Visual Patch Commercial
 *
 * Single source of truth for all operational-view color, spacing,
 * and typography tokens. Every operational page/component that uses
 * dark-mode styling MUST import from here instead of hard-coding values.
 *
 * Spec: docs/Commercial/VISUAL_PATCH_COMMERCIAL.md
 */

export const VPC_TOKENS = {
  /** Page / root background */
  bg: "#0a0a0a",
  /** Card / panel surface */
  surface: "#141414",
  /** Alternate surface (slightly brighter) */
  surfaceAlt: "#1e1e1e",
  /** Border (solid) */
  border: "#262626",
  /** Border (translucent) */
  borderAlpha: "rgba(255,255,255,0.06)",
  /** Primary text */
  text: "#fafafa",
  /** Muted text */
  textMuted: "#a3a3a3",
  /** Dimmed text / tertiary */
  textDim: "#737373",
  /** Green accent (default) */
  accent: "#22c55e",
  /** Orange accent (KDS / alerts) */
  accentOrange: "#f97316",
  /** Orange accent soft background */
  accentOrangeSoft: "rgba(249,115,22,0.15)",
  /** Base font stack */
  font: "Inter, system-ui, sans-serif",
  /** Base font size */
  fontSizeBase: 16,
  /** Large font size */
  fontSizeLarge: 20,
  /** Border radius */
  radius: 8,
  /** Spacing unit (24-32px) */
  space: 24,
  /** Minimum button height */
  btnMinHeight: 48,
  /** Line height for readability */
  lineHeight: 1.6,
} as const;

/** Type for VPC token keys */
export type VPCTokenKey = keyof typeof VPC_TOKENS;
