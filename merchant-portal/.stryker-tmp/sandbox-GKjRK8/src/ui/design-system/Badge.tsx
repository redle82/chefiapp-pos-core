import React from 'react';
import { cn } from './tokens';
import './Badge.css';

export interface BadgeProps {
    label: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'neutral' | 'secondary';
    icon?: React.ReactNode;
    className?: string;
}

/**
 * Badge: Visual indicator for status and labels.
 * Replaces ad-hoc .badge classes.
 */
export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'neutral',
    icon,
    className,
}) => {
    return (
        <div
            className={cn(
                'badge-component',
                `badge-component--${variant}`,
                className
            )}
        >
            {icon && <span className="badge-component__icon">{icon}</span>}
            <span className="badge-component__label">{label}</span>
        </div>
    );
};

export default Badge;
