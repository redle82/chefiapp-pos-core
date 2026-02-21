/**
 * Design System Tokens — Phase 1 Hardening
 *
 * ChefIApp unified design tokens for consistent styling across the application.
 * All hardcoded values should be replaced with these tokens.
 *
 * Migration Guide:
 * - Replace hardcoded hex colors with Colors.*
 * - Replace hardcoded px values with Spacing.*
 * - Replace rgba() patterns with Opacity.* helpers
 * - Use CSS variables via tokens.css for pure CSS files
 */

import {
  colors as coreColors,
  elevation as coreElevation,
  fontFamily as coreFontFamily,
  fontSize as coreFontSize,
  fontWeight as coreFontWeight,
  lineHeight as coreLineHeight,
  radius as coreRadius,
  space as coreSpace,
  spacing as coreSpacing,
} from "@chefiapp/core-design-system";

const px = (value: number) => `${value}px`;

// ============================================================================
// BRAND COLORS
// ============================================================================

/** Canonical ChefIApp Gold — NOT the green accent. */
const BRAND_GOLD = "#c9a227";
const BRAND_GOLD_LIGHT = "#e8c547";
const BRAND_GOLD_DARK = "#b8922a";

export const Brand = {
  // ChefIApp Gold — Primary brand color
  gold: {
    DEFAULT: BRAND_GOLD,
    light: BRAND_GOLD_LIGHT,
    dark: BRAND_GOLD_DARK,
    gradient: `linear-gradient(135deg, ${BRAND_GOLD} 0%, ${BRAND_GOLD_DARK} 100%)`,
    glow: `0 4px 20px ${BRAND_GOLD}4D`,
  },

  // Stripe Purple — Payment integration
  stripe: {
    DEFAULT: "#635BFF",
    light: "#A259FF",
    gradient: "linear-gradient(135deg, #635BFF 0%, #A259FF 100%)",
  },
} as const;

// ============================================================================
// COLORS
// ============================================================================

export const Colors = {
  // Primary brand colors
  primary: Brand.gold.DEFAULT,
  primaryLight: Brand.gold.light,
  primaryDark: Brand.gold.dark,
  secondary: coreColors.info,

  // Legacy green (for backward compat, prefer primary gold)
  legacyGreen: coreColors.success,

  // Semantic colors
  success: coreColors.success,
  warning: coreColors.warning,
  error: coreColors.error,
  info: coreColors.info,

  // Truth States (Product Signature)
  ghost: coreColors.error,
  live: coreColors.success,

  // Neutral colors (Dark theme optimized)
  neutral: {
    0: "#FFFFFF",
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#1A1A1A",
    950: "#0A0A0A",
  },

  // Dark theme surface colors
  surface: {
    base: coreColors.background,
    elevated: coreColors.surfaceElevated,
    overlay: coreColors.surfaceOverlay,
    border: coreColors.border,
    borderHover: coreColors.borderHover,
    borderActive: coreColors.borderActive,
  },

  // Text colors (Dark theme)
  text: {
    primary: coreColors.textPrimary,
    secondary: coreColors.textSecondary,
    tertiary: coreColors.textMuted,
    disabled: coreColors.textDisabled,
    inverse: coreColors.textInverse,
  },

  // Risk levels (AppStaff)
  risk: {
    low: coreColors.success,
    medium: coreColors.warning,
    high: coreColors.error,
  },

  // Status colors with opacity variants
  status: {
    success: {
      bg: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.25)",
      text: coreColors.success,
    },
    warning: {
      bg: "rgba(251, 191, 36, 0.12)",
      border: "rgba(251, 191, 36, 0.25)",
      text: coreColors.warning,
    },
    error: {
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.25)",
      text: coreColors.error,
    },
    info: {
      bg: "rgba(59, 130, 246, 0.12)",
      border: "rgba(59, 130, 246, 0.25)",
      text: coreColors.info,
    },
    primary: {
      bg: "rgba(201, 162, 39, 0.12)",
      border: "rgba(201, 162, 39, 0.25)",
      text: Brand.gold.DEFAULT,
    },
  },

  // Kitchen Display System (High Contrast / Operational)
  kds: {
    background: coreColors.background,
    surface: coreColors.surface,
    border: coreColors.border,
    text: {
      primary: coreColors.textPrimary,
      secondary: coreColors.textSecondary,
      dim: coreColors.textMuted,
    },
    ticket: {
      new: coreColors.surface,
      late: coreColors.surface,
      standard: coreColors.surface,
      borderNew: coreColors.success,
      borderLate: coreColors.error,
      borderStandard: coreColors.border,
    },
  },
} as const;

// ============================================================================
// OPACITY HELPERS
// ============================================================================

export const Opacity = {
  // White with opacity (for dark theme)
  white: (opacity: number) => `rgba(255, 255, 255, ${opacity})`,

  // Black with opacity (for light theme)
  black: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,

  // Primary with opacity
  primary: (opacity: number) => `rgba(34, 197, 94, ${opacity})`,

  // Success with opacity
  success: (opacity: number) => `rgba(34, 197, 94, ${opacity})`,

  // Warning with opacity
  warning: (opacity: number) => `rgba(251, 191, 36, ${opacity})`,

  // Error with opacity
  error: (opacity: number) => `rgba(239, 68, 68, ${opacity})`,

  // Info with opacity
  info: (opacity: number) => `rgba(59, 130, 246, ${opacity})`,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  // Display/Heading scale
  displayLarge: {
    fontSize: px(coreFontSize.display),
    fontWeight: coreFontWeight.bold,
    lineHeight: `${coreLineHeight.tight}`,
    letterSpacing: "-0.01em",
  },
  displayMedium: {
    fontSize: px(coreFontSize["2xl"]),
    fontWeight: coreFontWeight.bold,
    lineHeight: `${coreLineHeight.normal}`,
    letterSpacing: "-0.005em",
  },
  displaySmall: {
    fontSize: px(coreFontSize.xl),
    fontWeight: coreFontWeight.semibold,
    lineHeight: `${coreLineHeight.normal}`,
    letterSpacing: "0",
  },

  // Heading scale
  h1: {
    fontSize: px(coreFontSize["2xl"]),
    fontWeight: coreFontWeight.bold,
    lineHeight: `${coreLineHeight.tight}`,
  },
  h2: {
    fontSize: px(coreFontSize.xl),
    fontWeight: coreFontWeight.bold,
    lineHeight: `${coreLineHeight.normal}`,
  },
  h3: {
    fontSize: px(coreFontSize.base),
    fontWeight: coreFontWeight.bold,
    lineHeight: `${coreLineHeight.normal}`,
  },
  h4: {
    fontSize: px(coreFontSize.sm),
    fontWeight: coreFontWeight.semibold,
    lineHeight: `${coreLineHeight.normal}`,
  },

  // UI/Body scale
  uiLarge: {
    fontSize: px(coreFontSize.base),
    fontWeight: coreFontWeight.medium,
    lineHeight: `${coreLineHeight.normal}`,
    letterSpacing: "0.3px",
  },
  uiMedium: {
    fontSize: px(coreFontSize.sm),
    fontWeight: coreFontWeight.medium,
    lineHeight: `${coreLineHeight.normal}`,
    letterSpacing: "0.2px",
  },
  uiSmall: {
    fontSize: px(coreFontSize.xs),
    fontWeight: coreFontWeight.normal,
    lineHeight: `${coreLineHeight.normal}`,
    letterSpacing: "0.1px",
  },
  uiTiny: {
    fontSize: px(coreFontSize.xs),
    fontWeight: coreFontWeight.semibold,
    lineHeight: `${coreLineHeight.tight}`,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  },

  // Font family fallback
  fontFamily: coreFontFamily.sans,
} as const;

// ============================================================================
// SPACING (4px base scale - touch-friendly)
// ============================================================================

export const Spacing = {
  0: "0px",
  xs: px(coreSpace.xs),
  sm: px(coreSpace.sm),
  "10": px(coreSpacing[3]),
  md: px(coreSpacing[3]),
  lg: px(coreSpacing[4]),
  "18": px(coreSpacing[5]),
  xl: px(coreSpacing[6]),
  "28": px(coreSpacing[6]),
  "2xl": px(coreSpacing[8]),
  "3xl": px(coreSpacing[12]),
  "4xl": px(coreSpacing[16]),
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  none: "0px",
  xs: px(coreRadius.sm),
  sm: px(coreRadius.md),
  "10": px(coreRadius.md),
  md: px(coreRadius.lg),
  lg: px(coreRadius.lg),
  full: px(coreRadius.full),
} as const;

// ============================================================================
// ELEVATION (PWA-friendly, subtle shadows)
// ============================================================================

export const Elevation = {
  none: coreElevation.none,
  xs: coreElevation.low,
  sm: coreElevation.low,
  md: coreElevation.medium,
  lg: coreElevation.high,
  xl: coreElevation.high,
  primary: Brand.gold.glow,
} as const;

// ============================================================================
// BREAKPOINTS (Mobile-first)
// ============================================================================

export const Breakpoints = {
  mobile: "0px",
  sm: "640px",
  tablet: "768px",
  md: "860px", // Legacy breakpoint
  desktop: "1024px",
  lg: "1100px", // Max-width
  wide: "1440px",
} as const;

// Media query helpers
export const MediaQueries = {
  sm: `@media (min-width: ${Breakpoints.sm})`,
  tablet: `@media (min-width: ${Breakpoints.tablet})`,
  md: `@media (min-width: ${Breakpoints.md})`,
  desktop: `@media (min-width: ${Breakpoints.desktop})`,
  wide: `@media (min-width: ${Breakpoints.wide})`,
  mobile: `@media (max-width: 767px)`,
  mobileOnly: `@media (max-width: ${Breakpoints.md})`,
} as const;

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const Transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  standard: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
} as const;

// ============================================================================
// COMPONENT SPECIFIC TOKENS
// ============================================================================

export const ComponentTokens = {
  // Input/Form
  input: {
    height: "44px",
    paddingY: Spacing.sm,
    paddingX: Spacing.md,
    borderWidth: "1px",
    borderColor: Colors.surface.border,
    borderColorFocus: Colors.primary,
    borderRadius: BorderRadius.sm,
    background: "rgba(0, 0, 0, 0.2)",
  },

  // Button
  button: {
    height: "44px",
    heightSm: "36px",
    heightLg: "52px",
    paddingY: Spacing["10"],
    paddingX: Spacing.md,
    borderRadius: BorderRadius["10"],
    transition: Transitions.fast,
  },

  // Card
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    background: Colors.surface.elevated,
    border: `1px solid ${Colors.surface.border}`,
  },

  // Badge/Chip
  badge: {
    paddingY: "6px",
    paddingX: Spacing["10"],
    borderRadius: BorderRadius.full,
    fontSize: "12px",
  },

  // Modal/Dialog
  modal: {
    maxWidth: "600px",
    borderRadius: BorderRadius.md,
    elevation: Elevation.xl,
  },

  // TopBar
  topBar: {
    height: "56px",
    backgroundColor: Colors.secondary,
    color: Colors.neutral[0],
  },

  // BottomNav
  bottomNav: {
    height: "72px", // With safe area
    heightBase: "56px",
    backgroundColor: Colors.neutral[900],
    borderTop: `1px solid ${Colors.surface.border}`,
  },

  // Step indicator
  step: {
    size: "40px",
    fontSize: "12px",
    borderRadius: BorderRadius.full,
  },
} as const;

// ============================================================================
// UTILITY: CSS VARIABLES (for CSS-in-JS)
// ============================================================================

export const getCSSVariables = () => ({
  // Brand
  "--color-brand-gold": Brand.gold.DEFAULT,
  "--color-brand-gold-light": Brand.gold.light,
  "--color-brand-gold-dark": Brand.gold.dark,
  "--gradient-brand": Brand.gold.gradient,
  "--shadow-brand": Brand.gold.glow,

  // Primary/Secondary
  "--color-primary": Colors.primary,
  "--color-primary-light": Colors.primaryLight,
  "--color-primary-dark": Colors.primaryDark,
  "--color-secondary": Colors.secondary,

  // TPV Specific (Speed Mode)
  tpv: {
    buttonHeight: "64px",
    productCard: {
      height: "140px",
      background: Colors.surface.elevated,
    },
    gridGap: Spacing.md,
  },

  // Semantic
  "--color-success": Colors.success,
  "--color-warning": Colors.warning,
  "--color-error": Colors.error,
  "--color-info": Colors.info,
  "--color-ghost": Colors.ghost,
  "--color-live": Colors.live,

  // Neutrals
  "--color-neutral-0": Colors.neutral[0],
  "--color-neutral-50": Colors.neutral[50],
  "--color-neutral-100": Colors.neutral[100],
  "--color-neutral-200": Colors.neutral[200],
  "--color-neutral-300": Colors.neutral[300],
  "--color-neutral-400": Colors.neutral[400],
  "--color-neutral-500": Colors.neutral[500],
  "--color-neutral-600": Colors.neutral[600],
  "--color-neutral-700": Colors.neutral[700],
  "--color-neutral-800": Colors.neutral[800],
  "--color-neutral-900": Colors.neutral[900],
  "--color-neutral-950": Colors.neutral[950],

  // Surfaces
  "--surface-base": Colors.surface.base,
  "--surface-elevated": Colors.surface.elevated,
  "--surface-overlay": Colors.surface.overlay,
  "--surface-border": Colors.surface.border,
  "--surface-border-hover": Colors.surface.borderHover,
  "--surface-border-active": Colors.surface.borderActive,

  // Text
  "--text-primary": Colors.text.primary,
  "--text-secondary": Colors.text.secondary,
  "--text-tertiary": Colors.text.tertiary,
  "--text-disabled": Colors.text.disabled,

  // Status backgrounds
  "--status-success-bg": Colors.status.success.bg,
  "--status-success-border": Colors.status.success.border,
  "--status-success-text": Colors.status.success.text,
  "--status-warning-bg": Colors.status.warning.bg,
  "--status-warning-border": Colors.status.warning.border,
  "--status-warning-text": Colors.status.warning.text,
  "--status-error-bg": Colors.status.error.bg,
  "--status-error-border": Colors.status.error.border,
  "--status-error-text": Colors.status.error.text,
  "--status-info-bg": Colors.status.info.bg,
  "--status-info-border": Colors.status.info.border,
  "--status-info-text": Colors.status.info.text,

  // Risk levels
  "--color-risk-low": Colors.risk.low,
  "--color-risk-medium": Colors.risk.medium,
  "--color-risk-high": Colors.risk.high,

  // Spacing
  "--spacing-0": Spacing[0],
  "--spacing-xs": Spacing.xs,
  "--spacing-sm": Spacing.sm,
  "--spacing-10": Spacing["10"],
  "--spacing-md": Spacing.md,
  "--spacing-lg": Spacing.lg,
  "--spacing-18": Spacing["18"],
  "--spacing-xl": Spacing.xl,
  "--spacing-28": Spacing["28"],
  "--spacing-2xl": Spacing["2xl"],
  "--spacing-3xl": Spacing["3xl"],
  "--spacing-4xl": Spacing["4xl"],

  // Border radius
  "--radius-none": BorderRadius.none,
  "--radius-xs": BorderRadius.xs,
  "--radius-sm": BorderRadius.sm,
  "--radius-10": BorderRadius["10"],
  "--radius-md": BorderRadius.md,
  "--radius-lg": BorderRadius.lg,
  "--radius-full": BorderRadius.full,

  // Transitions
  "--transition-fast": Transitions.fast,
  "--transition-standard": Transitions.standard,
  "--transition-slow": Transitions.slow,
  "--transition-spring": Transitions.spring,

  // Elevation
  "--elevation-none": Elevation.none,
  "--elevation-xs": Elevation.xs,
  "--elevation-sm": Elevation.sm,
  "--elevation-md": Elevation.md,
  "--elevation-lg": Elevation.lg,
  "--elevation-xl": Elevation.xl,
  "--elevation-primary": Elevation.primary,

  // Typography
  "--font-family": Typography.fontFamily,

  // Z-index
  "--z-base": ZIndex.base,
  "--z-dropdown": ZIndex.dropdown,
  "--z-sticky": ZIndex.sticky,
  "--z-fixed": ZIndex.fixed,
  "--z-modal": ZIndex.modal,
  "--z-popover": ZIndex.popover,
  "--z-toast": ZIndex.toast,

  // Breakpoints
  "--breakpoint-sm": Breakpoints.sm,
  "--breakpoint-tablet": Breakpoints.tablet,
  "--breakpoint-md": Breakpoints.md,
  "--breakpoint-desktop": Breakpoints.desktop,
  "--breakpoint-wide": Breakpoints.wide,
});

// ============================================================================
// UTILITY: CLASS NAME HELPERS
// ============================================================================

type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Record<string, unknown>;

export const cn = (...inputs: ClassValue[]): string => {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (!input) return;

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
    } else if (typeof input === "object") {
      Object.keys(input).forEach((key) => {
        if (input[key]) {
          classes.push(key);
        }
      });
    }
  });

  return classes.join(" ");
};

// ============================================================================
// LEGACY MAPPINGS (for gradual migration)
// ============================================================================

/**
 * Maps legacy hardcoded colors to new tokens
 * Use this to find what token to use when migrating
 */
export const LegacyColorMap = {
  // Old accent colors -> new primary
  "rgba(100, 108, 255, 0.7)": Colors.primary, // Focus state
  "rgba(100, 108, 255, 0.55)": "var(--surface-border-active)",
  "rgba(100, 108, 255, 0.18)": "var(--status-info-bg)",
  "rgba(100, 108, 255, 0.16)": "var(--status-info-bg)",
  "#646cff": Colors.primary,
  "#535bf2": Colors.primaryDark,

  // Success colors
  "rgba(80, 200, 120, 0.35)": "var(--status-success-border)",
  "rgba(80, 200, 120, 0.12)": "var(--status-success-bg)",
  "rgba(80, 200, 120, 0.1)": "var(--status-success-bg)",

  // Warning colors
  "rgba(255, 180, 80, 0.35)": "var(--status-warning-border)",
  "rgba(255, 180, 80, 0.12)": "var(--status-warning-bg)",

  // Error colors
  "rgba(255, 80, 80, 0.35)": "var(--status-error-border)",
  "rgba(255, 80, 80, 0.1)": "var(--status-error-bg)",

  // Surface colors
  "rgba(255, 255, 255, 0.87)": "var(--text-primary)",
  "rgba(255, 255, 255, 0.15)": "var(--surface-border-active)",
  "rgba(255, 255, 255, 0.14)": "var(--surface-border-hover)",
  "rgba(255, 255, 255, 0.12)": "var(--surface-border)",
  "rgba(255, 255, 255, 0.08)": "var(--surface-border)",
  "rgba(255, 255, 255, 0.06)": "var(--surface-elevated)",
  "rgba(255, 255, 255, 0.04)": "var(--surface-elevated)",
  "rgba(0, 0, 0, 0.2)": "var(--surface-base)",
  "rgba(0, 0, 0, 0.35)": "var(--surface-base)",
} as const;
