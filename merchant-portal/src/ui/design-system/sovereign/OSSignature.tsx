import React from 'react';
import { FireSystem, type FireState } from './FireSystem';

interface OSSignatureProps {
    /**
     * The Thermal State of the parent layout.
     * The signature will automatically adapt its tone.
     */
    state?: FireState;

    /**
     * Override tone if absolutely necessary (e.g. specialized card).
     * Prefer using `state` to maintain system coherence.
     */
    forcedTone?: 'gold' | 'ember' | 'black' | 'light';

    /**
     * Size of the signature.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg' | 'xl';

    className?: string;
}

export const OSSignature: React.FC<OSSignatureProps> = ({
    state = 'ember',
    forcedTone,
    size = 'md',
    className = ''
}) => {
    // 1. Derive logic from System
    const thermalRules = FireSystem[state];
    const tone = forcedTone || thermalRules.logoTone;

    // 2. Resolve Colors
    const getTextColor = () => {
        switch (tone) {
            case 'gold': return '#C9A227'; // Ouro Técnico
            case 'ember': return '#D9381E'; // Brasa (Monochrome Red)
            case 'black': return '#000000'; // For Alert state
            case 'light': return '#FFFFFF';
            default: return '#C9A227';
        }
    };

    const getOSColor = () => {
        if (state === 'alert') return '#000000';
        return thermalRules.osBadgeColor;
    };

    // 3. Resolve Size
    const getTextSize = () => {
        switch (size) {
            case 'sm': return '14px';
            case 'md': return '18px';
            case 'lg': return '24px';
            case 'xl': return '32px';
        }
    };

    return (
        <div
            className={className}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-heading, sans-serif)', // Fallback if var not loaded
                userSelect: 'none'
            }}
        >
            {/* ICON (Abstract Flame/Kernel) */}
            <svg
                width={size === 'xl' ? 32 : size === 'lg' ? 24 : 18}
                height={size === 'xl' ? 32 : size === 'lg' ? 24 : 18}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill={getTextColor()}
                    fillOpacity={tone === 'ember' ? 0.8 : 1}
                />
            </svg>

            {/* WORDMARK */}
            <span style={{
                color: getTextColor(),
                fontSize: getTextSize(),
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
            }}>
                ChefIApp™
                <span style={{
                    color: getOSColor(),
                    marginLeft: '4px',
                    fontWeight: 900
                }}>
                    OS
                </span>
            </span>
        </div>
    );
};
