import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { radius } from './radius';
import { shadows } from './shadows';

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
