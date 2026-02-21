/**
 * Cytoplasm Design System - Metabolic Tokens
 * 
 * We define the system state colors here to ensure semantic consistency across the app.
 * These should represent the "Physiological State" of the business.
 */
// @ts-nocheck


export const MetabolicTheme = {
    colors: {
        // 🟢 Healthy / Alive / Flow
        alive: '#10b981', // Emerald-500
        aliveBg: '#ecfdf5', // Emerald-50

        // 🟡 Stress / Warning / Pressure
        stress: '#f59e0b', // Amber-500
        stressBg: '#fffbeb', // Amber-50

        // 🔴 Critical / Panic / Debt
        critical: '#f43f5e', // Rose-500
        criticalBg: '#4c0519', // Rose-950 (Darker for dark mode bg)

        // ⚫ Void / Empty / Static (Dark Mode Base)
        void: '#94a3b8', // Slate-400 (Text/Icon)
        voidBg: '#020617', // Slate-950 (The Void - Deep Dark)

        // ⚪ Text on Void
        textPrimary: '#f8fafc', // Slate-50
        textSecondary: '#cbd5e1', // Slate-300
    },

    // Usage: "The system is breathing"
    animations: {
        pulse: 'animate-pulse',
        throb: 'transition-all duration-1000 ease-in-out'
    }
};

export type MetabolicState = 'alive' | 'stress' | 'critical' | 'void';

export const resolveMetabolicColor = (state: MetabolicState) => {
    return MetabolicTheme.colors[state];
};
