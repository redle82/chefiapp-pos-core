import React, { useEffect, useState, useRef } from 'react';
import { MetabolicTheme } from '../theme/MetabolicTheme';

interface MetabolicValueProps {
    value: number | string;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    highlightChange?: boolean;
}

/**
 * MetabolicValue Atom
 * 
 * Displays a number that is "alive".
 * Flashes color when the value updates significantly.
 */
export const MetabolicValue: React.FC<MetabolicValueProps> = ({
    value,
    unit,
    highlightChange = true
}) => {
    const [flash, setFlash] = useState<'neutral' | 'up' | 'down'>('neutral');
    const prevValue = useRef(value);

    useEffect(() => {
        if (!highlightChange) return;

        if (value !== prevValue.current) {
            setFlash('up'); // Simplified flash for now
            const t = setTimeout(() => setFlash('neutral'), 500);
            prevValue.current = value;
            return () => clearTimeout(t);
        }
    }, [value, highlightChange]);

    const color = flash !== 'neutral' ? MetabolicTheme.colors.alive : 'inherit';
    const transition = 'color 300ms ease-out';

    return (
        <span style={{
            fontFamily: 'monospace', // Data font
            fontWeight: 'bold',
            color: color,
            transition: transition,
            display: 'inline-flex',
            alignItems: 'baseline'
        }}>
            {value}
            {unit && (
                <span style={{
                    fontSize: '0.8em',
                    opacity: 0.6,
                    marginLeft: '4px',
                    fontWeight: 'normal'
                }}>
                    {unit}
                </span>
            )}
        </span>
    );
};
