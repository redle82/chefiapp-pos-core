/**
 * Tokens de design — AppStaff iOS (não legacy)
 *
 * Alinhado a docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md e
 * core-design-system (tokens.ts, spacing.ts, typography.ts).
 * Fonte única de cores, radius e espaçamento no mobile-app.
 * CORE_APPSTAFF_IOS_UIUX_CONTRACT: UI canónica usa apenas estes tokens.
 */

export const colors = {
  background: '#0a0a0a',
  surface: '#141414',
  surfaceElevated: 'rgba(255, 255, 255, 0.03)',
  surfaceOverlay: 'rgba(255, 255, 255, 0.04)',

  textPrimary: 'rgba(255, 255, 255, 0.87)',
  textSecondary: 'rgba(255, 255, 255, 0.60)',
  textMuted: 'rgba(255, 255, 255, 0.40)',
  textDisabled: 'rgba(255, 255, 255, 0.25)',
  textInverse: '#0a0a0a',

  accent: '#22c55e',
  warning: '#fbbf24',
  error: '#ef4444',
  success: '#22c55e',
  info: '#3b82f6',

  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
  borderActive: 'rgba(255, 255, 255, 0.15)',
  /** Overlay escuro para modais (Restaurant OS). */
  overlayDark: 'rgba(0, 0, 0, 0.85)',
  /** Modo claro (exceção; Restaurant OS é dark-first). */
  backgroundLight: '#ffffff',
  borderLight: '#e5e5e5',
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const space = {
  xs: spacing[1],
  sm: spacing[2],
  md: spacing[4],
  lg: spacing[6],
  xl: spacing[8],
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  display: 32,
  displayLg: 40,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/** Tap target mínimo (Restaurant OS). */
export const tapTarget = { min: 44, comfortable: 48 } as const;
