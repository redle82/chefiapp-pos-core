import React from 'react';
import { Colors, Radius, Spacing, Typography } from '../tokens';

type ButtonVariant = 'primary' | 'secondary' | 'critical' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    fullWidth = false,
    style,
    disabled,
    ...props
}) => {

    // Map Variant to Colors
    // Map Variant to Colors
    let bg: string = Colors.brand.accent;
    const color: string = '#FFFFFF';
    let border: string = 'none';

    if (variant === 'primary') {
        bg = Colors.brand.accent;
    } else if (variant === 'critical') {
        bg = Colors.state.critical;
    } else if (variant === 'secondary') {
        bg = Colors.void.surface;
        border = `1px solid ${Colors.border.subtle}`;
    } else if (variant === 'ghost') {
        bg = 'transparent';
    }

    if (disabled) {
        bg = Colors.state.neutral;
        // opacity handled below
    }

    // Map Size to Padding/Font
    // Map Size to Padding/Font
    let padding: string = `${Spacing.sm} ${Spacing.md}`;
    let fontSize: string = Typography.size.base;

    if (size === 'sm') {
        padding = `${Spacing.xs} ${Spacing.sm}`;
        fontSize = Typography.size.sm;
    } else if (size === 'lg') {
        padding = `${Spacing.md} ${Spacing.lg}`;
        fontSize = Typography.size.lg;
    }

    return (
        <button
            {...props}
            disabled={disabled}
            style={{
                backgroundColor: bg,
                color: color,
                border: border,
                padding: padding,
                fontSize: fontSize,
                borderRadius: Radius.sm,
                fontWeight: Typography.weight.medium,
                width: fullWidth ? '100%' : 'auto',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                ...style
            }}
        >
            {children}
        </button>
    );
};
