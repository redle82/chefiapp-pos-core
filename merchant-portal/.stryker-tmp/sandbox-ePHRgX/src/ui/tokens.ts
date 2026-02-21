/**
 * Legacy token adapter — sourced from @chefiapp/core-design-system.
 *
 * Keep API shape for existing callsites while converging to the core tokens.
 */
// @ts-nocheck

import {
  colors as coreColors,
  fontFamily as coreFontFamily,
  fontSize as coreFontSize,
  fontWeight as coreFontWeight,
  lineHeight as coreLineHeight,
  radius as coreRadius,
  space as coreSpace,
  spacing as coreSpacing,
  elevation,
} from "@chefiapp/core-design-system";

const px = (value: number) => `${value}px`;

export const Colors = {
  // BACKGROUNDS (VOID)
  void: {
    deep: coreColors.background,
    base: coreColors.background,
    surface: coreColors.surface,
    overlay: coreColors.surfaceOverlay,
  },

  // NERVOUS SYSTEM STATES (FUNCTIONAL)
  state: {
    flow: coreColors.success,
    tension: coreColors.warning,
    critical: coreColors.error,
    neutral: coreColors.textMuted,
    intelligence: coreColors.info,
  },

  // BRAND — Gold is the canonical brand color (#c9a227), NOT the green accent.
  brand: {
    gold: "#c9a227",
    accent: coreColors.accent,
  },

  // TEXT
  text: {
    primary: coreColors.textPrimary,
    secondary: coreColors.textSecondary,
    tertiary: coreColors.textMuted,
  },

  // BORDERS
  border: {
    subtle: coreColors.border,
    focused: coreColors.borderActive,
  },
} as const;

export const Typography = {
  family: {
    sans: coreFontFamily.sans,
    mono: coreFontFamily.mono,
  },
  size: {
    xs: px(coreFontSize.xs),
    sm: px(coreFontSize.sm),
    base: px(coreFontSize.base),
    lg: px(coreFontSize.lg),
    xl: px(coreFontSize.xl),
    xxl: px(coreFontSize.display),
    giant: px(coreFontSize.displayLg),
  },
  weight: {
    regular: coreFontWeight.normal,
    medium: coreFontWeight.medium,
    semibold: coreFontWeight.semibold,
    bold: coreFontWeight.bold,
  },
  leading: {
    tight: coreLineHeight.tight,
    normal: coreLineHeight.normal,
    relaxed: coreLineHeight.relaxed,
  },
} as const;

export const Spacing = {
  xs: px(coreSpace.xs),
  sm: px(coreSpace.sm),
  md: px(coreSpace.md),
  lg: px(coreSpace.lg),
  xl: px(coreSpace.xl),
  xxl: px(coreSpacing[12]),
} as const;

export const Radius = {
  sm: px(coreRadius.sm),
  md: px(coreRadius.md),
  lg: px(coreRadius.lg),
  full: px(coreRadius.full),
} as const;

export const Effects = {
  blur: {
    sm: "backdrop-filter: blur(10px)",
    md: "backdrop-filter: blur(20px)",
  },
  shadow: {
    glow: (color: string) => `0 0 20px ${color}40`,
    low: elevation.low,
    medium: elevation.medium,
    high: elevation.high,
  },
} as const;
