/**
 * @chefiapp/core-design-system — Espaçamento (base grid)
 *
 * Base 4px. Nenhum terminal inventa espaçamento fora desta escala.
 *
 * Contrato: docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md
 */

const base = 4;

export const spacing = {
  0: 0,
  1: base * 1,      // 4
  2: base * 2,      // 8
  3: base * 3,      // 12
  4: base * 4,      // 16
  5: base * 5,      // 20
  6: base * 6,      // 24
  8: base * 8,      // 32
  10: base * 10,    // 40
  12: base * 12,    // 48
  16: base * 16,    // 64
} as const;

/** Aliases semânticos */
export const space = {
  xs: spacing[1],
  sm: spacing[2],
  md: spacing[4],
  lg: spacing[6],
  xl: spacing[8],
} as const;

/** Restaurant OS: alvo de toque mínimo 44–48px. Espaçamento para touch/stress. */
export const tapTargetPx = {
  min: 44,
  comfortable: 48,
} as const;

/** Restaurant OS: stress-safe spacing. Maior que space.* para dedo/pressa/luz ruim. */
export const stressSafe = {
  /** Padding mínimo em cards/botões sob stress */
  padding: spacing[5],
  /** Gap entre elementos interativos */
  gap: spacing[4],
  /** Margem mínima entre blocos */
  blockMargin: spacing[6],
} as const;

export type Spacing = typeof spacing;
export type Space = typeof space;
export type StressSafe = typeof stressSafe;
