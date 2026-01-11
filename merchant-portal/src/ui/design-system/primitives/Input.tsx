import { type InputHTMLAttributes, forwardRef } from 'react';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { Text } from './Text';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, fullWidth = false, style, ...props }, ref) => {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                width: fullWidth ? '100%' : 'auto',
                marginBottom: 16
            }}>
                {label && (
                    <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                    </Text>
                )}
                <input
                    ref={ref}
                    style={{
                        backgroundColor: colors.surface.layer1,
                        color: colors.text.primary,
                        border: `1px solid ${error ? colors.destructive.base : colors.border.subtle}`,
                        borderRadius: radius.md,
                        padding: '10px 12px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        width: '100%',
                        transition: 'border-color 0.2s',
                        ...style
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.palette.amber[500];
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = error ? colors.destructive.base : colors.border.subtle;
                        props.onBlur?.(e);
                    }}
                    {...props}
                />
                {error && (
                    <Text size="xs" color="destructive" weight="medium">
                        {error}
                    </Text>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
