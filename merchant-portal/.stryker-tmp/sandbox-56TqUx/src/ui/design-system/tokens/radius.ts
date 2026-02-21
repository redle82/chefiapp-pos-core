// @ts-nocheck
import { radius as coreRadius } from "@chefiapp/core-design-system";

const px = (value: number) => `${value}px`;

export const radius = {
  none: "0px",
  sm: px(coreRadius.sm),
  md: px(coreRadius.md),
  lg: px(coreRadius.lg),
  xl: px(coreRadius.lg),
  "2xl": px(coreRadius.lg),
  "3xl": px(coreRadius.lg),
  full: px(coreRadius.full),
} as const;
