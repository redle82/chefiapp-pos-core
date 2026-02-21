// @ts-nocheck
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from "@chefiapp/core-design-system";

const px = (value: number) => `${value}px`;

export const typography = {
  family: {
    sans: fontFamily.sans,
    mono: fontFamily.mono,
  },

  // Font Sizes (Operational Scale)
  size: {
    xs: px(fontSize.xs),
    sm: px(fontSize.sm),
    base: px(fontSize.base),
    md: px(fontSize.base),
    lg: px(fontSize.lg),
    xl: px(fontSize.xl),
    "2xl": px(fontSize["2xl"]),
    "3xl": px(fontSize.display),
    "4xl": px(fontSize.displayLg),
  },

  // Font Weights (Heavy Scanning)
  weight: {
    regular: fontWeight.normal,
    medium: fontWeight.medium,
    bold: fontWeight.bold,
    black: fontWeight.bold,
  },

  // Line Heights (Tight for density)
  leading: {
    none: lineHeight.tight,
    tight: lineHeight.tight,
    snug: lineHeight.normal,
    normal: lineHeight.normal,
  },
} as const;
