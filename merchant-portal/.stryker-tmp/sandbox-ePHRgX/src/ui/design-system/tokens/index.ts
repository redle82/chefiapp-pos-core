// @ts-nocheck
import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const tokens = {
    colors,
    spacing,
    typography,
    radius,
    shadows,
};

// Aliases for easier import
export type TokenColors = typeof colors;
export type TokenSpacing = typeof spacing;
export type TokenTypography = typeof typography;
export type TokenRadius = typeof radius;
export type TokenShadows = typeof shadows;

export { cn } from './cn';
export { spacing } from './spacing';
