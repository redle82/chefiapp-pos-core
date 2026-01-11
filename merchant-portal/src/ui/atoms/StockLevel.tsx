import React from 'react';
import { MetabolicTheme, resolveMetabolicColor, type MetabolicState } from '../theme/MetabolicTheme';

interface StockLevelProps {
    percentage: number; // 0 to 100
    label?: string;
}

/**
 * StockLevel Atom ("Water Level")
 * 
 * Visualizes inventory as a liquid level.
 * - < 20%: Critical (Red)
 * - < 50%: Warning (Amber)
 * - > 50%: Healthy (Emerald)
 */
export const StockLevel: React.FC<StockLevelProps> = ({ percentage, label }) => {
    // Clamp
    const p = Math.max(0, Math.min(100, percentage));

    let state: MetabolicState = 'alive';
    if (p < 20) state = 'critical';
    else if (p < 50) state = 'stress';

    const color = resolveMetabolicColor(state);

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {label && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span>{label}</span>
                    <span style={{ color }}>{p.toFixed(0)}%</span>
                </div>
            )}
            <div style={{ width: '100%', height: '8px', background: MetabolicTheme.colors.voidBg, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                    width: `${p}%`,
                    height: '100%',
                    backgroundColor: color,
                    transition: 'width 0.5s ease-in-out, background-color 0.5s ease'
                }} />
            </div>
        </div>
    );
};
