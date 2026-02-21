// @ts-nocheck
import { elevation } from "@chefiapp/core-design-system";

export const shadows = {
  sm: elevation.low,
  md: elevation.medium,
  lg: elevation.high,
  xl: elevation.high,
  "2xl": elevation.high,
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.2)",

  // Semantic Shadows
  card: elevation.medium,
  floating: elevation.high,
  action: elevation.medium,
} as const;
