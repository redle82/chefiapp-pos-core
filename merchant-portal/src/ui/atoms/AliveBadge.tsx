import React from 'react';
import { MetabolicTheme, resolveMetabolicColor, type MetabolicState } from '../theme/MetabolicTheme';

interface AliveBadgeProps {
    status: MetabolicState;
    label: string;
    pulse?: boolean;
}

/**
 * AliveBadge Atom
 * 
 * A status badge that feels biological.
 * - 'alive': Pulses gently (Emerald)
 * - 'stress': Static warning (Amber)
 * - 'critical': Fast throb (Rose)
 */
export const AliveBadge: React.FC<AliveBadgeProps> = ({ status, label, pulse = true }) => {
    const color = resolveMetabolicColor(status);
    const bgColor = status === 'alive' ? MetabolicTheme.colors.aliveBg :
        status === 'stress' ? MetabolicTheme.colors.stressBg :
            status === 'critical' ? MetabolicTheme.colors.criticalBg :
                MetabolicTheme.colors.voidBg;

    // Critical states throb faster
    const animationClass = pulse
        ? (status === 'critical' ? 'animate-ping' : 'animate-pulse')
        : '';

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: bgColor,
            color: color,
            border: `1px solid ${color}30`,
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            gap: '8px'
        }}>
            {pulse && (
                <span style={{
                    display: 'block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    // Note: We are using inline styles for simplicity, but in a real setup
                    // these would map to the Tailwind classes defined in MetabolicTheme
                    opacity: 0.8
                }} className={animationClass} />
            )}
            {label}
        </span>
    );
};
