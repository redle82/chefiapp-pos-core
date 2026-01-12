import React, { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { Text } from './Text';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    options?: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, fullWidth = false, style, options, children, ...props }, ref) => {
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
                <select
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
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717a' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '32px',
                        ...style
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.action.base;
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = error ? colors.destructive.base : colors.border.subtle;
                        props.onBlur?.(e);
                    }}
                    {...props}
                >
                    {options
                        ? options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                        : children
                    }
                </select>
                {error && (
                    <Text size="xs" color="destructive" weight="medium">
                        {error}
                    </Text>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
