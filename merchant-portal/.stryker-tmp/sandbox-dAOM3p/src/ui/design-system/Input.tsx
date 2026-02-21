// @ts-nocheck
import React from 'react';
import { cn } from './tokens';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

/**
 * Input: Standard form input field.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            fullWidth = false,
            className,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || React.useId();

        return (
            <div
                className={cn(
                    'input-component',
                    {
                        'input-component--full-width': fullWidth,
                        'input-component--error': error,
                    },
                    className
                )}
            >
                {label && (
                    <label htmlFor={inputId} className="input-component__label">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className="input-component__field"
                    {...props}
                />
                {error && <span className="input-component__error">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
