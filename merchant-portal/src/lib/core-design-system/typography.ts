/**
 * @chefiapp/core-design-system — Tipografia
 *
 * Família, pesos, escalas. Nenhum terminal define font-size arbitrário fora destes tokens.
 *
 * Contrato: docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md
 */

export const fontFamily = {
  sans: 'Inter, system-ui, -apple-system, sans-serif',
  mono: 'ui-monospace, monospace',
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  /** Leitura à distância (KDS, TPV, painéis operacionais). Restaurant OS. */
  display: 32,
  displayLg: 40,
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export type FontFamily = typeof fontFamily;
export type FontWeight = typeof fontWeight;
export type FontSize = typeof fontSize;
export type LineHeight = typeof lineHeight;
