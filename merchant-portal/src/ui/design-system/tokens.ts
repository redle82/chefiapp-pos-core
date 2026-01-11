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

// ============================================================================
// BRAND COLORS
// ============================================================================

export const Brand = {
  // ChefIApp Gold — Primary brand color
  gold: {
    DEFAULT: '#C9A227',
    light: '#E8C547',
    dark: '#B8922A',
    gradient: 'linear-gradient(135deg, #C9A227 0%, #B8922A 100%)',
    glow: '0 4px 20px rgba(201, 162, 39, 0.3)',
  },

  // Stripe Purple — Payment integration
  stripe: {
    DEFAULT: '#635BFF',
    light: '#A259FF',
    gradient: 'linear-gradient(135deg, #635BFF 0%, #A259FF 100%)',
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
  secondary: '#1A4D7A', // Blue - Administrative

  // Legacy green (for backward compat, prefer primary gold)
  legacyGreen: '#2A9D3E',

  // Semantic colors
  success: '#22C55E', // Green - confirmed states
  warning: '#FBBF24', // Amber - pending/caution
  error: '#EF4444', // Red - errors, failures
  info: '#3B82F6', // Blue - informational

  // Truth States (Product Signature)
  ghost: '#EF4444', // Red - unpublished state
  live: '#22C55E', // Green - published/active state

  // Neutral colors (Dark theme optimized)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#1A1A1A',
    950: '#0A0A0A',
  },

  // Dark theme surface colors
  surface: {
    base: '#1A1A1A', // Background
    elevated: 'rgba(255, 255, 255, 0.03)', // Cards, panels
    overlay: 'rgba(255, 255, 255, 0.04)', // Hover states
    border: 'rgba(255, 255, 255, 0.08)', // Subtle borders
    borderHover: 'rgba(255, 255, 255, 0.12)', // Hover borders
    borderActive: 'rgba(255, 255, 255, 0.15)', // Active borders
  },

  // Text colors (Dark theme)
  text: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.60)',
    tertiary: 'rgba(255, 255, 255, 0.40)',
    disabled: 'rgba(255, 255, 255, 0.25)',
    inverse: '#1A1A1A',
  },

  // Risk levels (AppStaff)
  risk: {
    low: '#22C55E',
    medium: '#FBBF24',
    high: '#EF4444',
  },

  // Status colors with opacity variants
  status: {
    success: {
      bg: 'rgba(34, 197, 94, 0.12)',
      border: 'rgba(34, 197, 94, 0.25)',
      text: '#22C55E',
    },
    warning: {
      bg: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.25)',
      text: '#FBBF24',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.25)',
      text: '#EF4444',
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.25)',
      text: '#3B82F6',
    },
    primary: {
      bg: 'rgba(201, 162, 39, 0.12)',
      border: 'rgba(201, 162, 39, 0.25)',
      text: '#C9A227',
    },
  },

  // Kitchen Display System (High Contrast / Operational)
  kds: {
    background: '#050505', // Pure black for OLED/Dark environments
    surface: '#121212',
    border: '#262626',
    text: {
      primary: '#FFFFFF',
      secondary: '#A3A3A3',
      dim: '#525252',
    },
    ticket: {
      new: '#102816', // Dark Green bg
      late: '#2D1212', // Dark Red bg
      standard: '#121212',
      borderNew: '#22C55E',
      borderLate: '#EF4444',
      borderStandard: '#404040',
    }
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
  primary: (opacity: number) => `rgba(201, 162, 39, ${opacity})`,

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
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: '1.2',
    letterSpacing: '-0.01em',
  },
  displayMedium: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '1.3',
    letterSpacing: '-0.005em',
  },
  displaySmall: {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: '1.4',
    letterSpacing: '0',
  },

  // Heading scale
  h1: { fontSize: '28px', fontWeight: 800, lineHeight: '1.15' },
  h2: { fontSize: '22px', fontWeight: 700, lineHeight: '1.2' },
  h3: { fontSize: '16px', fontWeight: 700, lineHeight: '1.3' },
  h4: { fontSize: '14px', fontWeight: 600, lineHeight: '1.4' },

  // UI/Body scale
  uiLarge: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '1.5',
    letterSpacing: '0.3px',
  },
  uiMedium: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '1.5',
    letterSpacing: '0.2px',
  },
  uiSmall: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '1.4',
    letterSpacing: '0.1px',
  },
  uiTiny: {
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: '1.3',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },

  // Font family fallback
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
} as const;

// ============================================================================
// SPACING (4px base scale - touch-friendly)
// ============================================================================

export const Spacing = {
  0: '0px',
  xs: '4px', // 4px - Micro gaps, icon padding
  sm: '8px', // 8px - Tight padding, inline gaps
  '10': '10px', // 10px - Button padding
  md: '12px', // 12px - Standard padding (inputs, buttons)
  lg: '16px', // 16px - Card padding, section gaps
  '18': '18px', // 18px - Card inner padding
  xl: '24px', // 24px - Major sections
  '28': '28px', // 28px - Hero padding
  '2xl': '32px', // 32px - Page margins
  '3xl': '48px', // 48px - Hero spacing
  '4xl': '64px', // 64px - Full-width gaps
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  none: '0px',
  xs: '4px', // Inputs, chips
  sm: '8px', // Cards, buttons
  '10': '10px', // Button radius
  md: '12px', // Modals, panels
  lg: '16px', // Large containers
  full: '9999px', // Pills, avatars
} as const;

// ============================================================================
// ELEVATION (PWA-friendly, subtle shadows)
// ============================================================================

export const Elevation = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.08)',
  md: '0 4px 8px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.18)',
  primary: Brand.gold.glow,
} as const;

// ============================================================================
// BREAKPOINTS (Mobile-first)
// ============================================================================

export const Breakpoints = {
  mobile: '0px',
  sm: '640px',
  tablet: '768px',
  md: '860px', // Legacy breakpoint
  desktop: '1024px',
  lg: '1100px', // Max-width
  wide: '1440px',
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
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  standard: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
    height: '44px',
    paddingY: Spacing.sm,
    paddingX: Spacing.md,
    borderWidth: '1px',
    borderColor: Colors.surface.border,
    borderColorFocus: Colors.primary,
    borderRadius: BorderRadius.sm,
    background: 'rgba(0, 0, 0, 0.2)',
  },

  // Button
  button: {
    height: '44px',
    heightSm: '36px',
    heightLg: '52px',
    paddingY: Spacing['10'],
    paddingX: Spacing.md,
    borderRadius: BorderRadius['10'],
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
    paddingY: '6px',
    paddingX: Spacing['10'],
    borderRadius: BorderRadius.full,
    fontSize: '12px',
  },

  // Modal/Dialog
  modal: {
    maxWidth: '600px',
    borderRadius: BorderRadius.md,
    elevation: Elevation.xl,
  },

  // TopBar
  topBar: {
    height: '56px',
    backgroundColor: Colors.secondary,
    color: Colors.neutral[0],
  },

  // BottomNav
  bottomNav: {
    height: '72px', // With safe area
    heightBase: '56px',
    backgroundColor: Colors.neutral[900],
    borderTop: `1px solid ${Colors.surface.border}`,
  },

  // Step indicator
  step: {
    size: '40px',
    fontSize: '12px',
    borderRadius: BorderRadius.full,
  },
} as const;

// ============================================================================
// UTILITY: CSS VARIABLES (for CSS-in-JS)
// ============================================================================

export const getCSSVariables = () => ({
  // Brand
  '--color-brand-gold': Brand.gold.DEFAULT,
  '--color-brand-gold-light': Brand.gold.light,
  '--color-brand-gold-dark': Brand.gold.dark,
  '--gradient-brand': Brand.gold.gradient,
  '--shadow-brand': Brand.gold.glow,

  // Primary/Secondary
  '--color-primary': Colors.primary,
  '--color-primary-light': Colors.primaryLight,
  '--color-primary-dark': Colors.primaryDark,
  '--color-secondary': Colors.secondary,

  // TPV Specific (Speed Mode)
  tpv: {
    buttonHeight: '64px',
    productCard: {
      height: '140px',
      background: Colors.surface.elevated,
    },
    gridGap: Spacing.md,
  },

  // Semantic
  '--color-success': Colors.success,
  '--color-warning': Colors.warning,
  '--color-error': Colors.error,
  '--color-info': Colors.info,
  '--color-ghost': Colors.ghost,
  '--color-live': Colors.live,

  // Neutrals
  '--color-neutral-0': Colors.neutral[0],
  '--color-neutral-50': Colors.neutral[50],
  '--color-neutral-100': Colors.neutral[100],
  '--color-neutral-200': Colors.neutral[200],
  '--color-neutral-300': Colors.neutral[300],
  '--color-neutral-400': Colors.neutral[400],
  '--color-neutral-500': Colors.neutral[500],
  '--color-neutral-600': Colors.neutral[600],
  '--color-neutral-700': Colors.neutral[700],
  '--color-neutral-800': Colors.neutral[800],
  '--color-neutral-900': Colors.neutral[900],
  '--color-neutral-950': Colors.neutral[950],

  // Surfaces
  '--surface-base': Colors.surface.base,
  '--surface-elevated': Colors.surface.elevated,
  '--surface-overlay': Colors.surface.overlay,
  '--surface-border': Colors.surface.border,
  '--surface-border-hover': Colors.surface.borderHover,
  '--surface-border-active': Colors.surface.borderActive,

  // Text
  '--text-primary': Colors.text.primary,
  '--text-secondary': Colors.text.secondary,
  '--text-tertiary': Colors.text.tertiary,
  '--text-disabled': Colors.text.disabled,

  // Status backgrounds
  '--status-success-bg': Colors.status.success.bg,
  '--status-success-border': Colors.status.success.border,
  '--status-success-text': Colors.status.success.text,
  '--status-warning-bg': Colors.status.warning.bg,
  '--status-warning-border': Colors.status.warning.border,
  '--status-warning-text': Colors.status.warning.text,
  '--status-error-bg': Colors.status.error.bg,
  '--status-error-border': Colors.status.error.border,
  '--status-error-text': Colors.status.error.text,
  '--status-info-bg': Colors.status.info.bg,
  '--status-info-border': Colors.status.info.border,
  '--status-info-text': Colors.status.info.text,

  // Risk levels
  '--color-risk-low': Colors.risk.low,
  '--color-risk-medium': Colors.risk.medium,
  '--color-risk-high': Colors.risk.high,

  // Spacing
  '--spacing-0': Spacing[0],
  '--spacing-xs': Spacing.xs,
  '--spacing-sm': Spacing.sm,
  '--spacing-10': Spacing['10'],
  '--spacing-md': Spacing.md,
  '--spacing-lg': Spacing.lg,
  '--spacing-18': Spacing['18'],
  '--spacing-xl': Spacing.xl,
  '--spacing-28': Spacing['28'],
  '--spacing-2xl': Spacing['2xl'],
  '--spacing-3xl': Spacing['3xl'],
  '--spacing-4xl': Spacing['4xl'],

  // Border radius
  '--radius-none': BorderRadius.none,
  '--radius-xs': BorderRadius.xs,
  '--radius-sm': BorderRadius.sm,
  '--radius-10': BorderRadius['10'],
  '--radius-md': BorderRadius.md,
  '--radius-lg': BorderRadius.lg,
  '--radius-full': BorderRadius.full,

  // Transitions
  '--transition-fast': Transitions.fast,
  '--transition-standard': Transitions.standard,
  '--transition-slow': Transitions.slow,
  '--transition-spring': Transitions.spring,

  // Elevation
  '--elevation-none': Elevation.none,
  '--elevation-xs': Elevation.xs,
  '--elevation-sm': Elevation.sm,
  '--elevation-md': Elevation.md,
  '--elevation-lg': Elevation.lg,
  '--elevation-xl': Elevation.xl,
  '--elevation-primary': Elevation.primary,

  // Typography
  '--font-family': Typography.fontFamily,

  // Z-index
  '--z-base': ZIndex.base,
  '--z-dropdown': ZIndex.dropdown,
  '--z-sticky': ZIndex.sticky,
  '--z-fixed': ZIndex.fixed,
  '--z-modal': ZIndex.modal,
  '--z-popover': ZIndex.popover,
  '--z-toast': ZIndex.toast,

  // Breakpoints
  '--breakpoint-sm': Breakpoints.sm,
  '--breakpoint-tablet': Breakpoints.tablet,
  '--breakpoint-md': Breakpoints.md,
  '--breakpoint-desktop': Breakpoints.desktop,
  '--breakpoint-wide': Breakpoints.wide,
});

// ============================================================================
// UTILITY: CLASS NAME HELPERS
// ============================================================================

type ClassValue = string | number | boolean | undefined | null | Record<string, unknown>;

export const cn = (...inputs: ClassValue[]): string => {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (!input) return;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (typeof input === 'object') {
      Object.keys(input).forEach((key) => {
        if (input[key]) {
          classes.push(key);
        }
      });
    }
  });

  return classes.join(' ');
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
  'rgba(100, 108, 255, 0.7)': Colors.primary, // Focus state
  'rgba(100, 108, 255, 0.55)': 'var(--surface-border-active)',
  'rgba(100, 108, 255, 0.18)': 'var(--status-info-bg)',
  'rgba(100, 108, 255, 0.16)': 'var(--status-info-bg)',
  '#646cff': Colors.primary,
  '#535bf2': Colors.primaryDark,

  // Success colors
  'rgba(80, 200, 120, 0.35)': 'var(--status-success-border)',
  'rgba(80, 200, 120, 0.12)': 'var(--status-success-bg)',
  'rgba(80, 200, 120, 0.1)': 'var(--status-success-bg)',

  // Warning colors
  'rgba(255, 180, 80, 0.35)': 'var(--status-warning-border)',
  'rgba(255, 180, 80, 0.12)': 'var(--status-warning-bg)',

  // Error colors
  'rgba(255, 80, 80, 0.35)': 'var(--status-error-border)',
  'rgba(255, 80, 80, 0.1)': 'var(--status-error-bg)',

  // Surface colors
  'rgba(255, 255, 255, 0.87)': 'var(--text-primary)',
  'rgba(255, 255, 255, 0.15)': 'var(--surface-border-active)',
  'rgba(255, 255, 255, 0.14)': 'var(--surface-border-hover)',
  'rgba(255, 255, 255, 0.12)': 'var(--surface-border)',
  'rgba(255, 255, 255, 0.08)': 'var(--surface-border)',
  'rgba(255, 255, 255, 0.06)': 'var(--surface-elevated)',
  'rgba(255, 255, 255, 0.04)': 'var(--surface-elevated)',
  'rgba(0, 0, 0, 0.2)': 'var(--surface-base)',
  'rgba(0, 0, 0, 0.35)': 'var(--surface-base)',
} as const;
