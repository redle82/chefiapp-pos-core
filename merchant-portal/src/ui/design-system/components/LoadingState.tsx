/**
 * LoadingState - Componente Unificado de Loading
 * 
 * OBJETIVO: Unificar todos os estados de loading do sistema.
 * 
 * Roadmap: FASE 2 - Pagar Dívida Técnica
 */

import React from 'react';
import { Skeleton } from '../primitives/Skeleton';
import { Text } from '../primitives/Text';
import { spacing } from '../tokens/spacing';

// Map semantic names to numeric spacing values
const spacingMap = {
    xs: spacing[1],  // 0.25rem (4px)
    sm: spacing[2],  // 0.5rem (8px)
    md: spacing[4],  // 1rem (16px)
    lg: spacing[6],  // 1.5rem (24px)
};

export type LoadingStateVariant = 'skeleton' | 'spinner' | 'minimal';

export interface LoadingStateProps {
    /** Variante do loading */
    variant?: LoadingStateVariant;
    
    /** Mensagem opcional */
    message?: string;
    
    /** Tamanho do skeleton (se variant='skeleton') */
    skeletonLines?: number;
    
    /** Tamanho do spinner (se variant='spinner') */
    spinnerSize?: 'sm' | 'md' | 'lg';
    
    /** Estilo customizado */
    style?: React.CSSProperties;
    
    /** Classe CSS customizada */
    className?: string;
}

/**
 * LoadingState - Componente unificado para estados de loading
 * 
 * Uso:
 * ```tsx
 * {loading && <LoadingState variant="skeleton" message="Carregando pedidos..." />}
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
    variant = 'skeleton',
    message,
    skeletonLines = 3,
    spinnerSize = 'md',
    style,
    className,
}) => {
    if (variant === 'skeleton') {
        return (
            <div style={{ padding: spacingMap.md, ...style }} className={className}>
                {message && (
                    <Text size="sm" color="secondary" style={{ marginBottom: spacingMap.sm }}>
                        {message}
                    </Text>
                )}
                {Array.from({ length: skeletonLines }).map((_, i) => (
                    <Skeleton key={i} style={{ marginBottom: spacingMap.xs, height: 20 }} />
                ))}
            </div>
        );
    }

    if (variant === 'spinner') {
        const sizeMap = {
            sm: 16,
            md: 24,
            lg: 32,
        };

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: spacingMap.lg,
                    ...style,
                }}
                className={className}
            >
                <div
                    style={{
                        width: sizeMap[spinnerSize],
                        height: sizeMap[spinnerSize],
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
                {message && (
                    <Text size="sm" color="secondary" style={{ marginTop: spacingMap.sm }}>
                        {message}
                    </Text>
                )}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Minimal variant (apenas texto)
    return (
        <div style={{ padding: spacingMap.md, ...style }} className={className}>
            <Text size="sm" color="secondary">
                {message || 'Carregando...'}
            </Text>
        </div>
    );
};

/**
 * Hook para gerenciar estado de loading de forma consistente
 */
export function useLoadingState(initialState = false) {
    const [loading, setLoading] = React.useState(initialState);
    
    const startLoading = React.useCallback(() => setLoading(true), []);
    const stopLoading = React.useCallback(() => setLoading(false), []);
    
    return {
        loading,
        setLoading,
        startLoading,
        stopLoading,
    };
}
