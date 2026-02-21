// @ts-nocheck
import {
  space as coreSpace,
  spacing as coreSpacing,
  tapTargetPx,
} from "@chefiapp/core-design-system";

const px = (value: number) => `${value}px`;
const spacing20 = coreSpacing[16] + coreSpacing[4];

export const spacing = {
  // Grid System (4px Baseline)
  0: "0px",
  1: px(coreSpacing[1]),
  2: px(coreSpacing[2]),
  3: px(coreSpacing[3]),
  4: px(coreSpacing[4]),
  5: px(coreSpacing[5]),
  6: px(coreSpacing[6]),
  8: px(coreSpacing[8]),
  10: px(coreSpacing[10]),
  12: px(coreSpacing[12]),
  16: px(coreSpacing[16]),
  20: px(spacing20),

  // Semantic Spacing
  layout: {
    page: px(coreSpace.lg),
    card: px(coreSpace.md),
    section: px(coreSpace.xl),
  },

  // Semantic Aliases
  xs: px(coreSpace.xs),
  sm: px(coreSpace.sm),
  md: px(coreSpace.md),
  lg: px(coreSpace.lg),
  xl: px(coreSpace.xl),

  // Touch Targets (Critical for TPV)
  touch: {
    min: px(tapTargetPx.min),
    comfortable: px(tapTargetPx.comfortable),
  },
} as const;
