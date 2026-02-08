/**
 * @chefiapp/core-design-system — Motion
 *
 * Regra Restaurant OS: silêncio visual é feature. Animações mínimas;
 * apenas feedback essencial (transições de estado, confirmação de toque).
 *
 * Contrato: docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md
 * Princípios: docs/architecture/RESTAURANT_OS_DESIGN_PRINCIPLES.md
 */

export const duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const easing = {
  default: 'ease-out',
  in: 'ease-in',
  out: 'ease-out',
  inOut: 'ease-in-out',
} as const;

/** Apenas feedback: hover, focus, confirmação de ação. Sem animações decorativas. */
export const motion = {
  feedback: `${duration.fast}ms ${easing.out}`,
  transition: `${duration.normal}ms ${easing.out}`,
  focusRing: `${duration.instant}ms`,
} as const;

export type Duration = typeof duration;
export type Easing = typeof easing;
export type Motion = typeof motion;
