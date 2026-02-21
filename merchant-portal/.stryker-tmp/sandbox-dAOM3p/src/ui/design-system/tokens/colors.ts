// @ts-nocheck
import { colors as coreColors } from "@chefiapp/core-design-system";
import { palette } from "./palette";

// Adapter: preserve existing API shape while sourcing values from core tokens.
type ColorTheme = {
  surface: {
    base: string;
    layer1: string;
    layer2: string;
    layer3: string;
    highlight: string;
    border: string;
    borderHover: string;
    borderActive: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    inverse: string;
  };
  action: {
    base: string;
    hover: string;
    text: string;
    contrastText: string;
  };
  warning: {
    base: string;
    hover: string;
    text: string;
    contrastText: string;
  };
  success: {
    base: string;
    hover: string;
    text: string;
    contrastText: string;
  };
  destructive: {
    base: string;
    hover: string;
    text: string;
    contrastText: string;
  };
  info: {
    base: string;
    hover: string;
    text: string;
    contrastText: string;
  };
  border: {
    subtle: string;
    strong: string;
  };
  feedback: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
};

const baseTheme: ColorTheme = {
  surface: {
    base: coreColors.background,
    layer1: coreColors.surface,
    layer2: coreColors.surfaceElevated,
    layer3: coreColors.surfaceOverlay,
    highlight: coreColors.surfaceOverlay,
    border: coreColors.border,
    borderHover: coreColors.borderHover,
    borderActive: coreColors.borderActive,
  },
  text: {
    primary: coreColors.textPrimary,
    secondary: coreColors.textSecondary,
    tertiary: coreColors.textMuted,
    quaternary: coreColors.textDisabled,
    inverse: coreColors.textInverse,
  },
  action: {
    base: coreColors.accent,
    hover: coreColors.accent,
    text: coreColors.textInverse,
    contrastText: coreColors.textInverse,
  },
  warning: {
    base: coreColors.warning,
    hover: coreColors.warning,
    text: coreColors.textInverse,
    contrastText: coreColors.textInverse,
  },
  success: {
    base: coreColors.success,
    hover: coreColors.success,
    text: coreColors.textInverse,
    contrastText: coreColors.textInverse,
  },
  destructive: {
    base: coreColors.error,
    hover: coreColors.error,
    text: coreColors.textInverse,
    contrastText: coreColors.textInverse,
  },
  info: {
    base: coreColors.info,
    hover: coreColors.info,
    text: coreColors.textInverse,
    contrastText: coreColors.textInverse,
  },
  border: {
    subtle: coreColors.border,
    strong: coreColors.borderActive,
  },
  feedback: {
    success: coreColors.success,
    warning: coreColors.warning,
    error: coreColors.error,
    info: coreColors.info,
  },
};

export const colors = {
  // Legacy palette retained for compatibility; avoid new usage.
  palette,
  modes: {
    tpv: baseTheme,
    dashboard: baseTheme,
  },
  ...baseTheme,
} as const;
