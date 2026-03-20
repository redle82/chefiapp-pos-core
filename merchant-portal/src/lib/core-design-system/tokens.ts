/**
 * @chefiapp/core-design-system — Tokens globais (imutáveis)
 *
 * Fonte única de cores, radius, elevação e estados visuais.
 * Nenhum terminal define cores globais fora destes tokens.
 *
 * Contrato: docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md
 */

export const colors = {
  // Backgrounds
  background: '#0a0a0a',
  surface: '#141414',
  surfaceElevated: 'rgba(255, 255, 255, 0.03)',
  surfaceOverlay: 'rgba(255, 255, 255, 0.04)',

  // Text
  textPrimary: 'rgba(255, 255, 255, 0.87)',
  textSecondary: 'rgba(255, 255, 255, 0.60)',
  textMuted: 'rgba(255, 255, 255, 0.40)',
  textDisabled: 'rgba(255, 255, 255, 0.25)',
  textInverse: '#0a0a0a',

  // Semantic
  accent: '#22c55e',
  warning: '#fbbf24',
  error: '#ef4444',
  success: '#22c55e',
  info: '#3b82f6',

  // Border
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
  borderActive: 'rgba(255, 255, 255, 0.15)',
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const elevation = {
  none: 'none',
  low: '0 1px 2px rgba(0, 0, 0, 0.2)',
  medium: '0 4px 6px rgba(0, 0, 0, 0.25)',
  high: '0 10px 15px rgba(0, 0, 0, 0.3)',
} as const;

/** Estados operacionais (apenas visuais; Core decide o valor). Restaurant OS: idênticos em todos os terminais. */
export const stateVisual = {
  normal: colors.textPrimary,
  loading: colors.textMuted,
  blocked: '#525252',
  warning: colors.warning,
  critical: colors.error,
  offline: colors.info,
  success: colors.success,
} as const;

/** Alvos de toque mínimos (Restaurant OS: 44–48px). Ergonomia dedo/pressa. */
export const tapTarget = {
  min: 44,
  comfortable: 48,
} as const;

/** Restaurant OS: dark-first palette. Default para todos os terminais operacionais. */
export const darkFirst = {
  background: colors.background,
  surface: colors.surface,
  text: colors.textPrimary,
  textMuted: colors.textSecondary,
  accent: colors.accent,
} as const;

/** Restaurant OS: time-first visuals. Cores/ênfase para elapsed, SLA, delay. */
export const timeVisual = {
  elapsed: colors.textSecondary,
  slaOk: colors.success,
  slaWarning: colors.warning,
  delay: colors.error,
} as const;

export type Colors = typeof colors;
export type Radius = typeof radius;
export type Elevation = typeof elevation;
export type StateVisual = typeof stateVisual;
export type TapTarget = typeof tapTarget;
export type DarkFirst = typeof darkFirst;
export type TimeVisual = typeof timeVisual;
