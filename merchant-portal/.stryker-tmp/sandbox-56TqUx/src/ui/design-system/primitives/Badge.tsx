// @ts-nocheck
import React from 'react';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';

// Extended status to support common usage across codebase
export type BadgeStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'error' | 'warning' | 'success' | 'info' | 'neutral';
export type BadgeVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'error' | 'warning' | 'success' | 'destructive' | 'secondary'; // added semantic variants
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
    status?: BadgeStatus; // Made optional - can derive from variant if semantic
    variant?: BadgeVariant;
    label?: string; // Optional override
    size?: BadgeSize; // Optional size (sm/md/lg)
}

export const Badge: React.FC<BadgeProps> = ({
    status,
    variant = 'outline',
    label,
    size = 'md'
}) => {
    // Semantic variant mapping: if variant is semantic, derive status from it
    const semanticVariants: Record<string, BadgeStatus> = {
        error: 'error',
        warning: 'warning',
        success: 'success',
        destructive: 'error',
        secondary: 'neutral'
    };
    
    const isSemanticVariant = variant in semanticVariants;
    const effectiveStatus: BadgeStatus = status || (isSemanticVariant ? semanticVariants[variant] : 'neutral');
    const effectiveVariant = isSemanticVariant ? 'outline' : variant;

    // Resolve Color Config
    const getColor = () => {
        switch (effectiveStatus) {
            case 'new': return colors.warning.base;
            case 'preparing': return colors.info.base;
            case 'ready': return colors.success.base;
            case 'delivered': return colors.border.strong;
            case 'error': return colors.destructive.base;
            case 'warning': return colors.warning.base;
            case 'success': return colors.success.base;
            case 'info': return colors.info.base;
            case 'neutral': return colors.border.strong;
            default: return colors.border.strong;
        }
    };

    const c = getColor();

    // Variant Styles
    const getVariantStyle = (): React.CSSProperties => {
        if (effectiveVariant === 'solid') {
            return {
                backgroundColor: c,
                color: colors.palette.black,
                border: '1px solid transparent'
            };
        }
        if (effectiveVariant === 'outline') {
            return {
                backgroundColor: `${c}1A`, // 10% opacity
                color: c,
                border: `1px solid ${c}4D` // 30% opacity border
            };
        }
        if (effectiveVariant === 'soft') {
            return {
                backgroundColor: `${c}1A`, // 10% opacity
                color: c,
                border: '1px solid transparent'
            };
        }
        // Ghost
        return {
            backgroundColor: 'transparent',
            color: c,
            border: '0px',
            padding: 0
        };
    };

    const s = getVariantStyle();

    const containerStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[1], // 4px
        padding: effectiveVariant !== 'ghost' ? `2px ${spacing[2]}` : 0,
        borderRadius: radius.md,
        fontSize: size === 'sm' ? typography.size.xs : size === 'lg' ? typography.size.sm : typography.size.xs,
        fontWeight: typography.weight.bold,
        fontFamily: typography.family.sans,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...s
    };

    const defaultLabels: Record<BadgeStatus, string> = {
        new: 'Novo',
        preparing: 'Preparo',
        ready: 'Pronto',
        delivered: 'Entregue',
        error: 'Erro',
        warning: 'Atenção',
        success: 'Sucesso',
        info: 'Info',
        neutral: 'Neutro'
    };

    return (
        <span style={containerStyle}>
            {/* Dot for ghost/outline */}
            {effectiveVariant !== 'solid' && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c }} />
            )}
            {label || defaultLabels[effectiveStatus]}
        </span>
    );
};
