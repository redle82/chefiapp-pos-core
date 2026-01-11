import React from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';

type CardSurface = 'base' | 'layer1' | 'layer2' | 'layer3';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    surface?: CardSurface;
    padding?: CardPadding;
    hoverable?: boolean;
    onClick?: () => void;
    className?: string; // Only for layout positioning (e.g. flex-1), not internal style
    style?: React.CSSProperties; // Escape hatch for specific overrides (opacity, cursor)
}

export const Card: React.FC<CardProps> = ({
    children,
    surface = 'layer2',
    padding = 'md',
    hoverable = false,
    onClick,
    className,
    style: styleOverride,
    ...rest
}) => {
    // Resolve Surface Color
    const getBg = () => {
        switch (surface) {
            case 'base': return colors.surface.base;
            case 'layer1': return colors.surface.layer1;
            case 'layer2': return colors.surface.layer2;
            case 'layer3': return colors.surface.layer3;
            default: return colors.surface.layer2;
        }
    };

    // Resolve Padding
    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'sm': return spacing[3];
            case 'md': return spacing[5]; // 20px
            case 'lg': return spacing[6]; // 24px
            case 'xl': return spacing[8];
            default: return spacing[5];
        }
    };

    const style: React.CSSProperties = {
        backgroundColor: getBg(),
        borderRadius: radius.xl, // Modern Look
        padding: getPadding(),
        border: `1px solid ${colors.surface.highlight}33`, // 20% opacity border
        boxShadow: shadows.card,
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        position: 'relative',
        ...styleOverride
    };

    return (
        <div
            style={style}
            className={`${className || ''} ${hoverable || onClick ? 'hover:translate-y-[-2px] hover:shadow-xl hover:border-zinc-700' : ''}`}
            onClick={(e) => {
                if (onClick) {
                    console.log('[Card] Clicked!');
                    onClick();
                }
            }}
            {...rest}
        >
            {children}
        </div>
    );
};
