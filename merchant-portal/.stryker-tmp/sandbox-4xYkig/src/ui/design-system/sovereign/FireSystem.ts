/**
 * 🔥 CHEFIAPP™ OS — FIRE SYSTEM (SOVEREIGN LOGIC)
 * 
 * This file governs the "Thermal State" of the entire application.
 * Layouts do not choose their style. They request a state from the System.
 * 
 * STATES:
 * - IGNITION: Landing Page (High heat, dynamic, attracting)
 * - RITUAL: Onboarding (Controlled fire, solmn, linear)
 * - EMBER: Dashboard (Deep heat, low fatigue, operational)
 * - ALERT: Critical (Kernel Panic, data loss risk)
 * - VOID: Auth/Loading (Absolute zero, waiting for spark)
 */

export type FireState = 'ignition' | 'ritual' | 'ember' | 'alert' | 'void';

export interface ThermalState {
    background: string;
    logoTone: 'gold' | 'ember' | 'black' | 'light';
    osBadgeColor: string; // The "OS" part
}

// THE LAW
export const FireSystem: Record<FireState, ThermalState> = {
    ignition: {
        background: 'var(--gradient-fire-ignition)',
        logoTone: 'gold',
        osBadgeColor: 'var(--color-os-red)'
    },
    ritual: {
        background: 'var(--gradient-fire-ritual)',
        logoTone: 'gold',
        osBadgeColor: 'var(--color-os-red)'
    },
    ember: {
        background: 'var(--gradient-fire-ember)',
        logoTone: 'ember', // Subtler
        osBadgeColor: 'var(--color-os-red-dark)' // Slightly darker for low fatigue
    },
    alert: {
        // Critical System State only
        background: 'var(--color-os-red)',
        logoTone: 'black',
        osBadgeColor: 'black'
    },
    void: {
        background: '#050505', // Absolute Black
        logoTone: 'gold',
        osBadgeColor: 'var(--color-os-red)'
    }
};

// Helper to get logic by component name (optional enforcement)
export const getFireStateForContext = (context: 'landing' | 'onboarding' | 'dashboard' | 'auth'): FireState => {
    switch (context) {
        case 'landing': return 'ignition';
        case 'onboarding': return 'ritual';
        case 'dashboard': return 'ember';
        case 'auth': return 'void';
        default: return 'ember';
    }
};
