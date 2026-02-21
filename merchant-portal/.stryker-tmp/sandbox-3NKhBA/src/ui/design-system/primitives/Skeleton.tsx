// @ts-nocheck
import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'rectangular' | 'circular';
    style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    variant = 'rectangular',
    style
}) => {
    const borderRadius = variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px';

    return (
        <div
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                ...style
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)',
                    animation: 'skeleton-shimmer 1.5s infinite linear',
                    transform: 'translateX(-100%)'
                }}
            />
            <style>
                {`
                    @keyframes skeleton-shimmer {
                        100% {
                            transform: translateX(100%);
                        }
                    }
                `}
            </style>
        </div>
    );
};
