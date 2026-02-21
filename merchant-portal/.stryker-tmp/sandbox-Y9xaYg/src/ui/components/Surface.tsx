import React from 'react';
import { Colors, Radius, Spacing } from '../tokens';

interface SurfaceProps {
    children: React.ReactNode;
    padding?: keyof typeof Spacing;
    radius?: keyof typeof Radius;
    border?: boolean;
    className?: string; // Escape hatch
    style?: React.CSSProperties;
    onClick?: () => void;
}

export const Surface: React.FC<SurfaceProps> = ({
    children,
    padding = 'md',
    radius = 'md',
    border = true,
    className = '',
    style,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: Colors.void.surface,
                padding: Spacing[padding],
                borderRadius: Radius[radius],
                border: border ? `1px solid ${Colors.border.subtle}` : 'none',
                cursor: onClick ? 'pointer' : 'default',
                ...style
            }}
            className={className}
        >
            {children}
        </div>
    );
};
