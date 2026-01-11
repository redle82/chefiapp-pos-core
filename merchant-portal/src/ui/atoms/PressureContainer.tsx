import React from 'react';


export type PressureLevel = 'low' | 'normal' | 'high';

interface PressureContainerProps {
    pressure?: PressureLevel;
    children: React.ReactNode;
    className?: string; // For Tailwind classes if needed
}

/**
 * PressureContainer Atom
 * 
 * Adapts UI density based on cognitive load/system pressure.
 * - 'low': Relaxed spacing, larger tap targets. (Default)
 * - 'normal': Standard flow.
 * - 'high': Combat mode. high information density, reduced padding.
 */
export const PressureContainer: React.FC<PressureContainerProps> = ({
    pressure = 'low',
    children,
    className = ''
}) => {
    // Map pressure to spacing multipliers


    // We simulated these classes for now as we might not have full Tailwind setup yet,
    // so we'll use inline styles for the prototype to guarantee behavior.

    const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: pressure === 'high' ? 8 : pressure === 'normal' ? 16 : 24,
        padding: pressure === 'high' ? 8 : pressure === 'normal' ? 16 : 24,
        transition: 'all 500ms ease-in-out' // Morphing effect
    };

    return (
        <div style={style} className={className}>
            {children}
        </div>
    );
};
