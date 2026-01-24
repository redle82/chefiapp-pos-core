import React from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { typography } from '../tokens/typography';

type ButtonTone = 'action' | 'warning' | 'destructive' | 'neutral' | 'info' | 'success';
type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'primary'; // primary = alias for solid
type ButtonSize = 'sm' | 'default' | 'lg' | 'xl'; // xl for TPV main actions

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    // Semantic Props
    tone?: ButtonTone;
    variant?: ButtonVariant;
    size?: ButtonSize;

    // Content
    children: React.ReactNode;
    icon?: React.ReactNode;

    // State
    isLoading?: boolean;
    /**
     * Back-compat alias: many callsites use `loading={...}`.
     * We consume it here so it doesn't leak to the DOM (React warning: non-boolean attribute).
     */
    loading?: boolean;

    // Layout
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    tone = 'action',
    variant = 'solid',
    size = 'default',
    children,
    icon,
    isLoading,
    loading,
    disabled,
    fullWidth,
    style, // Intercepted and blocked mostly
    ...props
}) => {
    const resolvedIsLoading = Boolean(isLoading ?? loading);

    // --- COLOR RESOLUTION ---
    const getColors = () => {
        // 1. Define Tone Map
        const map = {
            action: colors.action,
            warning: colors.warning,
            destructive: colors.destructive,
            info: colors.info,
            success: colors.success,
            neutral: { base: colors.surface.highlight, hover: colors.surface.layer3, text: colors.text.primary }
        };

        const target = map[tone] || map.action; // Fallback to action if invalid tone
        const isSolid = variant === 'solid' || variant === 'primary';
        const isOutline = variant === 'outline';

        if (isSolid) {
            return {
                bg: target.base,
                text: target.text,
                border: 'transparent',
                hoverBg: target.hover
            };
        }

        if (isOutline) {
            return {
                bg: 'transparent',
                text: target.base,
                border: target.base,
                hoverBg: `${target.base}1A` // 10% opacity
            };
        }

        // Ghost
        return {
            bg: 'transparent',
            text: target.base,
            border: 'transparent',
            hoverBg: `${target.base}1A` // 10% opacity
        };
    };

    const c = getColors();

    // --- SIZE RESOLUTION ---
    const getSizeStyles = () => {
        switch (size) {
            case 'sm': return { height: '32px', padding: `0 ${spacing[3]}`, fontSize: typography.size.xs };
            case 'lg': return { height: spacing[12], padding: `0 ${spacing[6]}`, fontSize: typography.size.lg }; // 48px
            case 'xl': return { height: spacing[16], padding: `0 ${spacing[8]}`, fontSize: typography.size.xl }; // 64px (TPV)
            default: return { height: spacing.touch.min, padding: `0 ${spacing[4]}`, fontSize: typography.size.sm }; // 48px Default
        }
    };

    const s = getSizeStyles();

    const [isHovered, setIsHovered] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);

    // --- BASE STYLES ---
    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        borderRadius: radius.lg,
        fontWeight: typography.weight.bold,
        fontFamily: typography.family.sans,
        cursor: disabled || resolvedIsLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',

        // Dynamic
        backgroundColor: isPressed ? c.hoverBg : (isHovered && !disabled && !resolvedIsLoading ? c.hoverBg : c.bg),
        color: c.text,
        border: `1px solid ${c.border}`,
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        width: fullWidth ? '100%' : 'auto',

        // Shadows for Solids
        boxShadow: variant === 'solid' && tone !== 'neutral' ? shadows.action : 'none',
    };

    return (
        <button
            style={baseStyles}
            disabled={disabled || resolvedIsLoading}
            onMouseEnter={() => !disabled && !resolvedIsLoading && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={() => !disabled && !resolvedIsLoading && setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onTouchStart={() => !disabled && !resolvedIsLoading && setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            {...props}
        >
            {resolvedIsLoading ? <span>Loading...</span> : icon}
            {children}
        </button>
    );
};
